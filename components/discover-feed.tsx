"use client";

import { Fragment, useState, useTransition } from "react";
import { PostCard, type PostCardData } from "@/components/post-card";
import { InFeedAdCard } from "@/components/in-feed-ad-card";
import { secondaryButtonClass } from "@/components/ui";
import { loadMoreDiscoverPosts } from "@/lib/actions/discover";
import type { DiscoverFilters } from "@/lib/discover";

export function DiscoverFeed({
  initialPosts,
  initialSavedIds,
  initialAdPostIds,
  initialHasMore,
  filters,
  showSave,
  currentUserId
}: {
  initialPosts: PostCardData[];
  initialSavedIds: string[];
  initialAdPostIds: string[];
  initialHasMore: boolean;
  filters: DiscoverFilters;
  showSave: boolean;
  currentUserId: string | null;
}) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(initialSavedIds));
  const [adPostIds, setAdPostIds] = useState<Set<string>>(() => new Set(initialAdPostIds));
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const next = page + 1;
      const result = await loadMoreDiscoverPosts(filters, next);
      setPosts((prev) => {
        const seen = new Set(prev.map((post) => post.id));
        return [...prev, ...result.posts.filter((post) => !seen.has(post.id))];
      });
      setSavedIds((prev) => new Set([...prev, ...result.savedIds]));
      setAdPostIds((prev) => new Set([...prev, ...result.adPostIds]));
      setPage(next);
      setHasMore(result.hasMore);
    });
  }

  return (
    <>
      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post, index) => (
          <Fragment key={post.id}>
            <PostCard post={post} saved={savedIds.has(post.id)} showSave={showSave} currentUserId={currentUserId} />
            {posts.length >= 6 && adPostIds.has(post.id) && index >= 5 && (index - 5) % 9 === 0 && (
              <InFeedAdCard key={`ad-${index}`} />
            )}
          </Fragment>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button type="button" onClick={loadMore} disabled={isPending} className={secondaryButtonClass}>
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
