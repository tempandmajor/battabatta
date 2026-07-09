import { MapPin } from "lucide-react";
import { FilterBar, ScopeToggle } from "@/components/filter-bar";
import { DiscoverFeed } from "@/components/discover-feed";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth";
import { fetchDiscoverPage, type DiscoverFilters } from "@/lib/discover";

export const dynamic = "force-dynamic";

type DiscoverSearchParams = {
  scope?: string;
  category?: string;
  kind?: string;
  distance?: string;
  q?: string;
};

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const params = await searchParams;
  const scope: DiscoverFilters["scope"] =
    params.scope === "local" || params.scope === "online" ? params.scope : "all";
  const category: DiscoverFilters["category"] =
    params.category === "goods" || params.category === "services" ? params.category : "";
  const kind: DiscoverFilters["kind"] =
    params.kind === "offering" || params.kind === "seeking" ? params.kind : "";
  const distance = [2, 5, 10, 25].includes(Number(params.distance)) ? Number(params.distance) : 10;
  const query = (params.q ?? "").slice(0, 200);

  const filters: DiscoverFilters = { scope, category, kind, q: query, distance };

  const { supabase, user } = await getSessionUser();

  let page: Awaited<ReturnType<typeof fetchDiscoverPage>> | null = null;
  let loadError: string | null = null;

  const [pageResult, profileResult] = await Promise.all([
    fetchDiscoverPage(supabase, user?.id ?? null, filters, 0)
      .then((result) => ({ result, error: null as string | null }))
      .catch((error: Error) => ({ result: null, error: error.message })),
    user
      ? supabase.from("profiles").select("public_location_label").eq("id", user.id).single()
      : Promise.resolve({ data: null })
  ]);

  page = pageResult.result;
  loadError = pageResult.error;

  const locationLabel = profileResult.data?.public_location_label;
  const posts = page?.posts ?? [];
  const shownCount = `${posts.length}${page?.hasMore ? "+" : ""}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold leading-none tracking-[-0.04em] sm:text-[40px]">
            {scope === "local" ? "Discover nearby" : scope === "online" ? "Discover online" : "Discover all"}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <MapPin size={15} className="text-ink" aria-hidden />
            <span className="font-medium text-ink">
              {scope === "online"
                ? "Remote-friendly exchanges"
                : scope === "local"
                  ? locationLabel ?? "All local posts"
                  : "Local and online exchanges"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {shownCount} {posts.length === 1 && !page?.hasMore ? "offer" : "offers"}
              {scope === "local" && locationLabel ? ` within ${distance} mi` : ""}
              {query ? ` for “${query}”` : ""}
            </span>
          </p>
        </div>
        <ScopeToggle scope={scope} />
      </div>

      <FilterBar scope={scope} category={category} kind={kind} distance={distance} />

      {loadError ? (
        <EmptyState title="Something went wrong loading posts" hint={loadError} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No offers match your filters."
          hint="Try widening the distance, clearing the search, or switching between All, Local, and Online."
        />
      ) : (
        <DiscoverFeed
          initialPosts={posts}
          initialSavedIds={page?.savedIds ?? []}
          initialAdPostIds={page?.adPostIds ?? []}
          initialHasMore={page?.hasMore ?? false}
          filters={filters}
          showSave={Boolean(user)}
          currentUserId={user?.id ?? null}
        />
      )}
    </main>
  );
}
