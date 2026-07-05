import { Fragment } from "react";
import { MapPin } from "lucide-react";
import { FilterBar, ScopeToggle } from "@/components/filter-bar";
import { PostCard, type PostCardData } from "@/components/post-card";
import { InFeedAdCard } from "@/components/in-feed-ad-card";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth";

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
  const scope = params.scope === "online" ? "online" : "local";
  const category = params.category === "goods" || params.category === "services" ? params.category : "";
  const kind = params.kind === "offering" || params.kind === "seeking" ? params.kind : "";
  const distance = [2, 5, 10, 25].includes(Number(params.distance)) ? Number(params.distance) : 10;
  const query = (params.q ?? "").slice(0, 200);

  const { supabase, user } = await getSessionUser();

  const [{ data: posts, error }, savedResult, profileResult] = await Promise.all([
    supabase.rpc("discover_posts", {
      p_scope: scope,
      p_kind: kind || undefined,
      p_category: category || undefined,
      p_search: query || undefined,
      p_radius_miles: distance
    }),
    user ? supabase.from("saved_posts").select("post_id").eq("profile_id", user.id) : Promise.resolve({ data: null }),
    user
      ? supabase.from("profiles").select("public_location_label").eq("id", user.id).single()
      : Promise.resolve({ data: null })
  ]);

  const savedIds = new Set((savedResult.data ?? []).map((row: { post_id: string }) => row.post_id));
  const locationLabel = profileResult.data?.public_location_label;
  const results = (posts ?? []) as PostCardData[];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold leading-none tracking-[-0.04em] sm:text-[40px]">
            {scope === "local" ? "Discover nearby" : "Discover online"}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <MapPin size={15} className="text-ink" aria-hidden />
            <span className="font-medium text-ink">
              {scope === "online" ? "Remote-friendly exchanges" : locationLabel ?? "All local posts"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {results.length} {results.length === 1 ? "offer" : "offers"}
              {scope === "local" && locationLabel ? ` within ${distance} mi` : ""}
              {query ? ` for “${query}”` : ""}
            </span>
          </p>
        </div>
        <ScopeToggle scope={scope} />
      </div>

      <FilterBar scope={scope} category={category} kind={kind} distance={distance} />

      {error ? (
        <EmptyState title="Something went wrong loading posts" hint={error.message} />
      ) : results.length === 0 ? (
        <EmptyState
          title="No offers match your filters."
          hint="Try widening the distance, clearing the search, or switching between Local and Online."
        />
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((post, index) => (
            <Fragment key={post.id}>
              <PostCard post={post} saved={savedIds.has(post.id)} showSave={Boolean(user)} />
              {results.length >= 6 && index >= 5 && (index - 5) % 9 === 0 && (
                <InFeedAdCard key={`ad-${index}`} />
              )}
            </Fragment>
          ))}
        </div>
      )}
    </main>
  );
}
