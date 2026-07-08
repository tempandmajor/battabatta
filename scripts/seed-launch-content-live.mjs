import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readLaunchContentPayload, upsertLaunchContentRecords, slug } from "./lib/launch-content.mjs";

const EXPECTED_PROJECT_REF = "bjmjpwvstlaccflabwjv";
const input = process.argv[2];
const flags = new Set(process.argv.slice(3));

if (!input) {
  console.error("Usage: npm run launch:seed-live -- /path/to/Battarbox_10_Accounts_40_Posts.docx [--dry-run] [--all-batches] [--skip-preflight]");
  process.exit(1);
}

const dryRun = flags.has("--dry-run");
const allBatches = flags.has("--all-batches");
const skipPreflight = flags.has("--skip-preflight");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function projectRefFromUrl(value) {
  try {
    const { hostname } = new URL(value);
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

const projectRef = projectRefFromUrl(url);
if (projectRef !== EXPECTED_PROJECT_REF) {
  console.error(
    `Refusing to seed live content: NEXT_PUBLIC_SUPABASE_URL resolves to ${projectRef ?? "an invalid or non-hosted project"}; expected ${EXPECTED_PROJECT_REF}.`
  );
  process.exit(1);
}

const payload = readLaunchContentPayload(input);
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function sanitizePublicLocationLabel(value) {
  return value || "Online";
}

function randomPassword() {
  return `Btbx-${randomBytes(12).toString("base64url")}`;
}

async function chooseHandle(preferredHandle, profileId) {
  const base = slug(preferredHandle).slice(0, 24);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base.slice(0, Math.max(3, 24 - attempt.toString().length - 1))}_${attempt}`;
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", candidate)
      .maybeSingle();
    if (error) throw new Error(`Handle check failed for ${candidate}: ${error.message}`);
    if (!data || data.id === profileId) return candidate;
  }
  return `member_${profileId.replace(/-/g, "").slice(0, 12)}`;
}

// Sporadic, human-looking timestamps: posts land at unpredictable hours across the
// last few weeks (never in the future) so the feed reads like real activity rather
// than a bulk import. postIndex === 0 marks a profile "joined" time, which is placed
// earlier than any of that account's posts.
function seededTimestamp(accountIndex, postIndex) {
  const now = Date.now();
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const isProfile = postIndex === 0;
  const minDaysBack = isProfile ? 23 : 0;
  const maxDaysBack = isProfile ? 30 : 21;
  const daysAgo = minDaysBack + Math.floor(Math.random() * (maxDaysBack - minDaysBack + 1));
  const timeOfDay = (7 + Math.random() * 16) * 60 * 60 * 1000; // 07:00–23:00, daytime-biased
  const candidate = midnight.getTime() - daysAgo * 86400000 + timeOfDay;
  // Keep even the most recent posts off the clock's exact "now" and out of the future.
  const recentBound = now - (15 * 60 * 1000 + Math.random() * 9 * 60 * 60 * 1000);
  return new Date(Math.min(candidate, recentBound)).toISOString();
}

async function findExistingProfileByEmail(email) {
  const { data, error } = await supabase.from("profile_private").select("profile_id").eq("email", email).maybeSingle();
  if (error) throw new Error(`Profile lookup failed for ${email}: ${error.message}`);
  return data?.profile_id ?? null;
}

async function readExistingProfile(profileId) {
  const { data, error } = await supabase.from("profiles").select("id, created_at").eq("id", profileId).maybeSingle();
  if (error) throw new Error(`Profile read failed for ${profileId}: ${error.message}`);
  return data;
}

async function ensureLaunchProfile(account, launchProfileRow, accountIndex, report) {
  let profileId = launchProfileRow.published_profile_id ?? null;
  const temporaryPassword = randomPassword();
  let isNewProfile = false;

  if (!profileId) {
    profileId = await findExistingProfileByEmail(account.setupEmail);
  }

  if (!profileId && !dryRun) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.setupEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: account.displayName }
    });
    if (error || !data.user) throw new Error(`Could not create auth user for ${account.displayName}: ${error?.message ?? "Unknown error"}`);
    profileId = data.user.id;
    isNewProfile = true;
    report.createdAccounts.push({
      displayName: account.displayName,
      email: account.setupEmail,
      temporaryPassword
    });
  }

  if (!profileId && dryRun) {
    profileId = `dry-run-profile-${account.sourceIndex}`;
    isNewProfile = true;
    report.createdAccounts.push({
      displayName: account.displayName,
      email: account.setupEmail,
      temporaryPassword: "<generated at execution>"
    });
  }

  if (!profileId) throw new Error(`Could not resolve profile for ${account.displayName}`);

  const existingProfile = !dryRun ? await readExistingProfile(profileId) : null;
  const handle = await chooseHandle(account.suggestedHandle, profileId);
  const profilePatch = {
    id: profileId,
    display_name: account.displayName,
    handle,
    bio: account.bio,
    public_location_label: sanitizePublicLocationLabel(account.publicLocationLabel),
    location_mode: "online",
    is_adult_confirmed: true,
    is_paused: false,
    created_at: dryRun ? undefined : existingProfile?.created_at ?? (isNewProfile ? seededTimestamp(accountIndex, 0) : undefined),
    updated_at: dryRun ? undefined : seededTimestamp(accountIndex, 0)
  };

  if (!dryRun) {
    const { error: profileError } = await supabase.from("profiles").upsert(profilePatch, { onConflict: "id" });
    if (profileError) throw new Error(`Could not upsert profile ${account.displayName}: ${profileError.message}`);

    const { error: privateError } = await supabase.from("profile_private").upsert(
      {
        profile_id: profileId,
        email: account.setupEmail,
        locality: "Online",
        region: null,
        country_code: null
      },
      { onConflict: "profile_id" }
    );
    if (privateError) throw new Error(`Could not upsert private profile for ${account.displayName}: ${privateError.message}`);

    const { error: interestsDeleteError } = await supabase.from("profile_interests").delete().eq("profile_id", profileId);
    if (interestsDeleteError) throw new Error(`Could not clear interests for ${account.displayName}: ${interestsDeleteError.message}`);

    if ((account.interests ?? []).length > 0) {
      const { error: interestsError } = await supabase
        .from("profile_interests")
        .insert(Array.from(new Set(account.interests)).map((label) => ({ profile_id: profileId, label })));
      if (interestsError) throw new Error(`Could not set interests for ${account.displayName}: ${interestsError.message}`);
    }

    const { error: launchProfileError } = await supabase
      .from("launch_content_profiles")
      .update({
        published_profile_id: profileId,
        published_at: new Date().toISOString(),
        status: "approved_first_batch",
        notes: "Live-seeded with temporary password account and first-batch posts."
      })
      .eq("id", launchProfileRow.id);
    if (launchProfileError) throw new Error(`Could not update launch profile ${account.displayName}: ${launchProfileError.message}`);
  }

  report.liveProfiles.push({
    sourceIndex: account.sourceIndex,
    displayName: account.displayName,
    email: account.setupEmail,
    profileId,
    handle
  });

  return profileId;
}

async function ensureLivePost(account, profileId, launchPostRow, post, accountIndex, postIndex, report) {
  const createdAt = seededTimestamp(accountIndex, postIndex + 1);
  const shouldPublish = post.batch === 1 || allBatches;

  if (dryRun) {
    report[shouldPublish ? "activePosts" : "stagedPosts"].push({
      sourceIndex: account.sourceIndex,
      sourcePostNumber: post.sourcePostNumber,
      title: post.title,
      profileId
    });
    return;
  }

  if (!shouldPublish) {
    const { error } = await supabase
      .from("launch_content_posts")
      .update({
        status: "approved_later_batch",
        notes: "Held for later batch publication.",
        published_post_id: null,
        published_at: null
      })
      .eq("id", launchPostRow.id);
    if (error) throw new Error(`Could not stage later-batch post ${post.title}: ${error.message}`);
    report.stagedPosts.push({
      sourceIndex: account.sourceIndex,
      sourcePostNumber: post.sourcePostNumber,
      title: post.title,
      profileId
    });
    return;
  }

  let postId = launchPostRow.published_post_id ?? null;
  if (!postId) postId = randomUUID();
  const { data: existingPost, error: existingPostError } = await supabase
    .from("posts")
    .select("id, created_at")
    .eq("id", postId)
    .maybeSingle();
  if (existingPostError) throw new Error(`Could not read existing post ${postId}: ${existingPostError.message}`);

  const expiresAt = new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const payload = {
    id: postId,
    owner_id: profileId,
    kind: post.kind,
    category: post.category,
    title: post.title,
    body: post.body,
    what_i_can_give: post.whatICanGive || null,
    looking_for: post.lookingFor || null,
    location_mode: "online",
    approximate_location_label: "Online",
    approval_policy: post.approvalPolicy,
    availability_total: post.availabilityTotal,
    availability_remaining: post.availabilityTotal,
    availability_unit: post.availabilityUnit,
    status: "active",
    created_at: existingPost?.created_at ?? createdAt,
    updated_at: createdAt,
    expires_at: expiresAt
  };
  const { error: postError } = await supabase.from("posts").upsert(payload, { onConflict: "id" });
  if (postError) throw new Error(`Could not upsert live post ${post.title}: ${postError.message}`);

  const { error: launchPostError } = await supabase
    .from("launch_content_posts")
    .update({
      status: post.batch === 1 ? "approved_first_batch" : "approved_later_batch",
      published_post_id: postId,
      published_at: new Date().toISOString(),
      notes: `Published in live seed (batch ${post.batch}).`
    })
    .eq("id", launchPostRow.id);
  if (launchPostError) throw new Error(`Could not link launch post ${post.title}: ${launchPostError.message}`);

  report.activePosts.push({
    sourceIndex: account.sourceIndex,
    sourcePostNumber: post.sourcePostNumber,
    title: post.title,
    postId,
    profileId
  });
}

async function checkForSuspiciousExistingPosts() {
  const suspiciousTerms = ["mvp", "roadmap", "adsense", "launch sequence", "product requirements"];
  const orFilter = suspiciousTerms
    .flatMap((term) => [`title.ilike.%${term}%`, `body.ilike.%${term}%`, `what_i_can_give.ilike.%${term}%`])
    .join(",");
  const { data, error } = await supabase.from("posts").select("id, title").eq("status", "active").or(orFilter);
  if (error) throw new Error(`Existing post preflight failed: ${error.message}`);
  return data ?? [];
}

const report = {
  dryRun,
  projectRef,
  createdAccounts: [],
  liveProfiles: [],
  activePosts: [],
  stagedPosts: [],
  warnings: []
};

const suspiciousPosts = await checkForSuspiciousExistingPosts();
if (suspiciousPosts.length > 0) {
  report.warnings.push({
    message: "Suspicious existing active posts found. Review or hide them before publishing seeded friend content.",
    posts: suspiciousPosts
  });
  if (!dryRun && !skipPreflight) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

const { importedProfiles, importedPosts } = await upsertLaunchContentRecords(supabase, payload);
const importedPostsByKey = new Map(importedPosts.map((row) => [`${row.launch_profile_id}:${row.source_post_number}`, row]));
const importedProfilesBySourceIndex = new Map(
  importedProfiles.map((row) => [payload.accounts.find((account) => account.sourceIndex === row.source_index)?.sourceIndex, row])
);

for (const [accountIndex, account] of (payload.accounts ?? []).entries()) {
  const launchProfileRow = importedProfilesBySourceIndex.get(account.sourceIndex);
  if (!launchProfileRow) throw new Error(`Missing staging profile for source index ${account.sourceIndex}`);
  const profileId = await ensureLaunchProfile(account, launchProfileRow, accountIndex, report);

  for (const [postIndex, post] of (account.posts ?? []).entries()) {
    const key = `${launchProfileRow.id}:${post.sourcePostNumber}`;
    const launchPostRow = importedPostsByKey.get(key);
    if (!launchPostRow) throw new Error(`Missing staging post for ${account.displayName} post ${post.sourcePostNumber}`);
    await ensureLivePost(account, profileId, launchPostRow, post, accountIndex, postIndex, report);
  }
}

console.log(JSON.stringify(report, null, 2));
