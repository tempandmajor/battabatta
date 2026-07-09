import { AD_MODERATION_STATUS, getPostAdModerationMap } from "@/lib/post-ad-moderation";
import type { PostCardData } from "@/components/post-card";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Posts rendered per feed page. Keeps server render + payload bounded so the
 *  first paint is fast; the rest stream in via "Load more" infinite scroll. */
export const DISCOVER_PAGE_SIZE = 12;

/** Feed cards clamp the body to a couple of lines, so shipping the full
 *  (up to 2000 char) body is wasted payload and render time. */
const CARD_BODY_MAX = 220;

export type DiscoverFilters = {
  scope: "all" | "local" | "online";
  kind: "offering" | "seeking" | "";
  category: "goods" | "services" | "";
  q: string;
  distance: number;
};

export type DiscoverPage = {
  posts: PostCardData[];
  savedIds: string[];
  adPostIds: string[];
  hasMore: boolean;
};

function excerpt(text: string | null, max: number): string | null {
  if (!text) return text;
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/**
 * Fetches a single page of discovery results plus the viewer's saved state and
 * ad-moderation status for exactly those posts. Shared by the initial SSR
 * render (app/page.tsx) and the "load more" server action so both stay in sync.
 */
export async function fetchDiscoverPage(
  supabase: ServerClient,
  userId: string | null,
  filters: DiscoverFilters,
  page: number
): Promise<DiscoverPage> {
  const { data, error } = await supabase.rpc("discover_posts", {
    p_scope: filters.scope,
    p_kind: filters.kind || undefined,
    p_category: filters.category || undefined,
    p_search: filters.q || undefined,
    p_radius_miles: filters.distance,
    p_limit: DISCOVER_PAGE_SIZE,
    p_offset: Math.max(page, 0) * DISCOVER_PAGE_SIZE
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PostCardData[];
  const posts = rows.map((post) => ({ ...post, body: excerpt(post.body, CARD_BODY_MAX) ?? "" }));
  const ids = posts.map((post) => post.id);

  const [savedResult, moderationMap] = await Promise.all([
    userId && ids.length > 0
      ? supabase.from("saved_posts").select("post_id").eq("profile_id", userId).in("post_id", ids)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
    getPostAdModerationMap(ids)
  ]);

  const savedIds = (savedResult.data ?? []).map((row: { post_id: string }) => row.post_id);
  const adPostIds = ids.filter((id) => moderationMap.get(id) === AD_MODERATION_STATUS.approved);

  return {
    posts,
    savedIds,
    adPostIds,
    hasMore: rows.length === DISCOVER_PAGE_SIZE
  };
}
