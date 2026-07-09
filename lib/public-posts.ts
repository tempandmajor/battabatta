import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PublicPostDetail = {
  id: string;
  owner_id: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  what_i_can_give: string | null;
  looking_for: string | null;
  location_mode: string;
  approximate_location_label: string | null;
  approval_policy: string;
  availability_total: number | null;
  availability_remaining: number | null;
  availability_unit: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  owner: {
    id: string;
    display_name: string;
    handle: string | null;
    bio: string | null;
    public_location_label: string | null;
    is_paused: boolean;
    avatar_url: string | null;
  };
  photos: Array<{ id: string; path: string }>;
  related: Array<{
    id: string;
    owner_id: string;
    kind: string;
    category: string;
    title: string;
    body: string;
    what_i_can_give: string | null;
    looking_for: string | null;
    approximate_location_label: string | null;
    availability_total: number | null;
    availability_remaining: number | null;
    availability_unit: string | null;
    approval_policy: string;
    created_at: string;
    owner_display_name: string;
    owner_handle: string | null;
    owner_avatar_url: string | null;
    owner_supporter_since: string | null;
  }>;
};

type RelatedPostRow = {
  id: string;
  owner_id: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  what_i_can_give: string | null;
  looking_for: string | null;
  approximate_location_label: string | null;
  availability_total: number | null;
  availability_remaining: number | null;
  availability_unit: string | null;
  approval_policy: string;
  created_at: string;
  profiles:
    | Array<{
        display_name: string | null;
        handle: string | null;
        avatar_url: string | null;
        supporter_since: string | null;
      }>
    | null;
};

async function fetchPublicPostDetail(id: string): Promise<PublicPostDetail | null> {
  const admin = createSupabaseAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select(
      "id, owner_id, kind, category, title, body, what_i_can_give, looking_for, location_mode, approximate_location_label, approval_policy, availability_total, availability_remaining, availability_unit, status, created_at, updated_at"
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (!post) return null;

  const [{ data: owner }, { data: photos }, { data: relatedRows }, { data: moderation }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, handle, bio, public_location_label, is_paused, avatar_url")
      .eq("id", post.owner_id)
      .maybeSingle(),
    admin.from("post_photos").select("id, path").eq("post_id", id).order("position"),
    admin
      .from("posts")
      .select(
        "id, owner_id, kind, category, title, body, what_i_can_give, looking_for, approximate_location_label, availability_total, availability_remaining, availability_unit, approval_policy, created_at, profiles!posts_owner_id_fkey(display_name, handle, avatar_url, supporter_since)"
      )
      .eq("status", "active")
      .eq("category", post.category)
      .neq("id", id)
      .limit(3)
      .order("created_at", { ascending: false }),
    admin.from("account_moderation").select("status").eq("profile_id", post.owner_id).maybeSingle()
  ]);

  if (!owner || owner.is_paused || (moderation && moderation.status !== "active")) return null;

  return {
    ...(post as Omit<PublicPostDetail, "owner" | "photos" | "related">),
    owner,
    photos: (photos ?? []) as Array<{ id: string; path: string }>,
    related: ((relatedRows ?? []) as RelatedPostRow[]).map((row) => ({
      id: row.id,
      owner_id: row.owner_id,
      kind: row.kind,
      category: row.category,
      title: row.title,
      body: row.body,
      what_i_can_give: row.what_i_can_give,
      looking_for: row.looking_for,
      approximate_location_label: row.approximate_location_label,
      availability_total: row.availability_total,
      availability_remaining: row.availability_remaining,
      availability_unit: row.availability_unit,
      approval_policy: row.approval_policy,
      created_at: row.created_at,
      owner_display_name: row.profiles?.[0]?.display_name ?? "Member",
      owner_handle: row.profiles?.[0]?.handle ?? null,
      owner_avatar_url: row.profiles?.[0]?.avatar_url ?? null,
      owner_supporter_since: row.profiles?.[0]?.supporter_since ?? null
    }))
  };
}

export async function getPublicPostDetail(id: string) {
  return fetchPublicPostDetail(id);
}
