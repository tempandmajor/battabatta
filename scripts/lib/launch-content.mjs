import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32)
    .padEnd(3, "0");
}

function readAfter(block, label) {
  const index = block.findIndex((line) => line === label);
  return index >= 0 ? block[index + 1] ?? "" : "";
}

function readSection(block, startLabel, stopLabels) {
  const start = block.findIndex((line) => line === startLabel);
  if (start < 0) return "";
  const values = [];
  for (let index = start + 1; index < block.length; index += 1) {
    if (stopLabels.some((label) => block[index] === label || block[index]?.startsWith(label))) break;
    values.push(block[index]);
  }
  return values.join(" ").trim();
}

function readPrefixedSection(block, startPrefix, stopPrefixes) {
  const start = block.findIndex((line) => line.startsWith(startPrefix));
  if (start < 0) return "";
  const values = [block[start].slice(startPrefix.length).trim()].filter(Boolean);
  for (let index = start + 1; index < block.length; index += 1) {
    if (stopPrefixes.some((prefix) => block[index]?.startsWith(prefix))) break;
    values.push(block[index]);
  }
  return values.join(" ").trim();
}

export function normalizeAvailability(value) {
  const total = Number(value.match(/\b(\d+)\s+of\s+\d+\b/i)?.[1] ?? value.match(/\b(\d+)\b/)?.[1] ?? "");
  const unit = value
    .replace(/\b\d+\s+of\s+\d+\b/i, "")
    .replace(/\bslot[s]?\b/i, "slots")
    .replace(/\bavailable\b/gi, "")
    .replace(/\bthis month\b/gi, "this month")
    .replace(/\s+/g, " ")
    .trim();
  return {
    total: Number.isFinite(total) && total > 0 ? total : null,
    unit: unit || null
  };
}

function splitDescription(raw) {
  const lookingMarker = "What I am looking for in exchange:";
  const scopeMarker = "Scope and safety note:";
  const lookingStart = raw.indexOf(lookingMarker);
  const scopeStart = raw.indexOf(scopeMarker);
  const descriptionEnd = [lookingStart, scopeStart].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? raw.length;
  const description = raw.slice(0, descriptionEnd).replace(/^Description:\s*/i, "").trim();
  const looking =
    lookingStart >= 0
      ? raw.slice(lookingStart + lookingMarker.length, scopeStart >= 0 ? scopeStart : raw.length).trim()
      : "";
  const scope = scopeStart >= 0 ? raw.slice(scopeStart + scopeMarker.length).trim() : "";
  return {
    body: [description, scope ? `Scope note: ${scope}` : ""].filter(Boolean).join("\n\n"),
    lookingFor: looking
  };
}

export function parseLaunchContentText(text) {
  const lines = text
    .replace(/\f/g, "\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const accountStarts = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^\d+\.\s+.+\s+—\s+.+$/.test(line));

  const accounts = accountStarts.map(({ line, index }, accountIndex) => {
    const next = accountStarts[accountIndex + 1]?.index ?? lines.length;
    const block = lines.slice(index, next);
    const match = line.match(/^(\d+)\.\s+(.+)\s+—\s+(.+)$/);
    const sourceIndex = Number(match?.[1]);
    const displayName = match?.[2]?.trim() ?? "";
    const publicRole = readAfter(block, "Suggested public role") || match?.[3]?.trim() || "";
    const setupEmail = readAfter(block, "Private setup email").toLowerCase();
    const bio = readAfter(block, "Suggested profile bio");
    const postStarts = block
      .map((entry, blockIndex) => ({ entry, blockIndex }))
      .filter(({ entry }) => /^Post \d+:/.test(entry));
    const posts = postStarts.map(({ entry, blockIndex }, postIndex) => {
      const postNumber = Number(entry.match(/^Post (\d+):/)?.[1] ?? postIndex + 1);
      const nextPost = postStarts[postIndex + 1]?.blockIndex ?? block.length;
      const postBlock = block.slice(blockIndex, nextPost);
      const availability = normalizeAvailability(readAfter(postBlock, "Availability"));
      const { body, lookingFor } = splitDescription(readPrefixedSection(postBlock, "Description:", ["Suggested images:", "Post "]));
      return {
        sourcePostNumber: postNumber,
        title: entry.replace(/^Post \d+:\s*/, ""),
        kind: (readAfter(postBlock, "Post type") || "Offering").toLowerCase() === "seeking" ? "seeking" : "offering",
        category: (readAfter(postBlock, "Category") || "Services").toLowerCase() === "goods" ? "goods" : "services",
        locationMode: "online",
        availabilityTotal: availability.total,
        availabilityUnit: availability.unit,
        approvalPolicy: "manual_approval",
        whatICanGive: readSection(postBlock, "What I can give", ["Description:"]),
        lookingFor,
        body,
        suggestedImages: readPrefixedSection(postBlock, "Suggested images:", ["Post "]),
        batch: postNumber <= 2 ? 1 : 2,
        status: "staged"
      };
    });
    return {
      sourceIndex,
      displayName,
      suggestedHandle: slug(displayName),
      setupEmail,
      publicRole,
      bio,
      publicLocationLabel: null,
      locationMode: "online",
      interests: [publicRole],
      status: "staged",
      posts
    };
  });

  return { accounts };
}

export function extractDocxText(inputPath) {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error("Usage: provide a path to Battarbox_10_Accounts_40_Posts.docx");
  }
  return execFileSync("textutil", ["-convert", "txt", "-stdout", inputPath], { encoding: "utf8" });
}

export function readLaunchContentPayload(inputPath) {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error("Launch content input file not found");
  }
  if (inputPath.endsWith(".json")) {
    return JSON.parse(readFileSync(inputPath, "utf8"));
  }
  return parseLaunchContentText(extractDocxText(inputPath));
}

export async function upsertLaunchContentRecords(supabase, payload) {
  const profileIdsBySourceIndex = new Map();
  const importedProfiles = [];
  const importedPosts = [];

  for (const account of payload.accounts ?? []) {
    const { data: profile, error: profileError } = await supabase
      .from("launch_content_profiles")
      .upsert(
        {
          source_index: account.sourceIndex,
          display_name: account.displayName,
          suggested_handle: account.suggestedHandle,
          setup_email: account.setupEmail,
          public_role: account.publicRole,
          bio: account.bio,
          public_location_label: account.publicLocationLabel,
          location_mode: account.locationMode,
          interests: account.interests,
          status: account.status ?? "staged"
        },
        { onConflict: "setup_email" }
      )
      .select("id, source_index, published_profile_id")
      .single();
    if (profileError || !profile) throw new Error(profileError?.message ?? `Could not import ${account.displayName}`);

    profileIdsBySourceIndex.set(account.sourceIndex, profile.id);
    importedProfiles.push(profile);

    for (const post of account.posts ?? []) {
      const { data: importedPost, error: postError } = await supabase
        .from("launch_content_posts")
        .upsert(
          {
            launch_profile_id: profile.id,
            source_post_number: post.sourcePostNumber,
            title: post.title,
            kind: post.kind,
            category: post.category,
            location_mode: post.locationMode,
            body: post.body,
            what_i_can_give: post.whatICanGive || null,
            looking_for: post.lookingFor || null,
            availability_total: post.availabilityTotal,
            availability_unit: post.availabilityUnit,
            approval_policy: post.approvalPolicy,
            suggested_images: post.suggestedImages || null,
            batch: post.batch,
            status: post.status ?? "staged"
          },
          { onConflict: "launch_profile_id,source_post_number" }
        )
        .select("id, launch_profile_id, source_post_number, published_post_id, batch")
        .single();
      if (postError || !importedPost) {
        throw new Error(`${account.displayName} post ${post.sourcePostNumber}: ${postError?.message ?? "Import failed"}`);
      }
      importedPosts.push(importedPost);
    }
  }

  return { profileIdsBySourceIndex, importedProfiles, importedPosts };
}
