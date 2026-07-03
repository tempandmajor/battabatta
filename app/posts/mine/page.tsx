import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Badge, secondaryButtonClass } from "@/components/ui";
import { requireOnboardedUser } from "@/lib/auth";
import { CATEGORY_LABEL, POST_KIND_LABEL, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "My posts · Battarbox" };

export default async function MyPostsPage() {
  const { supabase, user } = await requireOnboardedUser("/posts/mine");

  const { data: posts } = await supabase
    .from("posts")
    .select("id, kind, category, title, status, availability_total, availability_remaining, availability_unit, created_at")
    .eq("owner_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-[-0.03em]">My posts</h1>
        <Link href="/posts/new" className={secondaryButtonClass}>
          New post
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <EmptyState
          title="You have not published any posts yet."
          hint="Posts tell neighbors what you are offering or seeking."
          action={
            <Link href="/posts/new" className={secondaryButtonClass}>
              Publish your first post
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.id}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-5 transition hover:border-ink"
              >
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={post.kind === "seeking" ? "outline" : "solid"}>{POST_KIND_LABEL[post.kind]}</Badge>
                  <Badge tone="soft">{CATEGORY_LABEL[post.category]}</Badge>
                  {post.status !== "active" && <Badge tone="soft">{post.status}</Badge>}
                </div>
                <span className="min-w-40 flex-1 text-[15px] font-semibold tracking-[-0.01em]">{post.title}</span>
                {post.availability_total !== null && (
                  <span className="text-xs text-muted">
                    {post.availability_remaining ?? 0}/{post.availability_total} {post.availability_unit}
                  </span>
                )}
                <span className="text-xs text-muted">{timeAgo(post.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
