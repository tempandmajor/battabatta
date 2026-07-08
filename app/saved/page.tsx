import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PostCard, type PostCardData } from "@/components/post-card";
import { secondaryButtonClass } from "@/components/ui";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Saved posts · Battarbox" };

export default async function SavedPostsPage() {
  const { supabase, user } = await requireOnboardedUser("/saved");

  const { data: saved } = await supabase
    .from("saved_posts")
    .select(
      "post_id, posts (id, owner_id, kind, category, title, body, what_i_can_give, looking_for, approximate_location_label, approval_policy, availability_total, availability_remaining, availability_unit, created_at, profiles:owner_id (display_name, handle, avatar_url, supporter_since), post_photos (path, position))"
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const posts: PostCardData[] = (saved ?? []).flatMap((row) => {
    const post = row.posts as unknown as
      | (Omit<PostCardData, "owner_display_name" | "owner_handle" | "owner_avatar_url" | "cover_photo_path"> & {
          profiles: { display_name: string; handle: string | null; avatar_url: string | null; supporter_since: string | null } | null;
          post_photos: Array<{ path: string; position: number }> | null;
        })
      | null;
    if (!post) return [];
    const { profiles, post_photos, ...rest } = post;
    const cover = [...(post_photos ?? [])].sort((a, b) => a.position - b.position)[0];
    return [
      {
        ...rest,
        owner_display_name: profiles?.display_name ?? "Member",
        owner_handle: profiles?.handle ?? null,
        owner_avatar_url: profiles?.avatar_url ?? null,
        owner_supporter_since: profiles?.supporter_since ?? null,
        cover_photo_path: cover?.path ?? null
      }
    ];
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Saved posts</h1>
      {posts.length === 0 ? (
        <EmptyState
          title="Nothing saved yet."
          hint="Tap the bookmark on any post to keep it here. Posts disappear from Saved if their owner removes them."
          action={
            <Link href="/" className={secondaryButtonClass}>
              Browse Discover
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} saved showSave />
          ))}
        </div>
      )}
    </main>
  );
}
