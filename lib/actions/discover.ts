"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchDiscoverPage, type DiscoverFilters, type DiscoverPage } from "@/lib/discover";

/** Fetches an additional page of discovery results for the infinite-scroll feed. */
export async function loadMoreDiscoverPosts(filters: DiscoverFilters, page: number): Promise<DiscoverPage> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return fetchDiscoverPage(supabase, user?.id ?? null, filters, page);
}
