import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { Badge } from "@/components/ui";
import { toggleSavePost } from "@/lib/actions/posts";
import { CATEGORY_LABEL, POST_KIND_LABEL, timeAgo } from "@/lib/format";
import { publicStorageUrl } from "@/lib/utils";

export type PostCardData = {
  id: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  what_i_can_give: string | null;
  approximate_location_label: string | null;
  availability_total: number | null;
  availability_remaining: number | null;
  availability_unit: string | null;
  approval_policy: string;
  created_at: string;
  distance_bucket?: string | null;
  owner_id: string;
  owner_display_name: string;
  owner_handle: string | null;
  owner_avatar_url?: string | null;
  cover_photo_path?: string | null;
};

export function PostCard({ post, saved, showSave }: { post: PostCardData; saved: boolean; showSave: boolean }) {
  const meta = [post.distance_bucket ?? post.approximate_location_label, timeAgo(post.created_at)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="relative flex min-h-[260px] flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lift">
      {post.cover_photo_path && (
        <img
          src={publicStorageUrl("post-photos", post.cover_photo_path)}
          alt=""
          className="-mx-5 -mt-5 h-40 w-[calc(100%+2.5rem)] max-w-none object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={post.kind === "seeking" ? "outline" : "solid"}>{POST_KIND_LABEL[post.kind]}</Badge>
          <Badge tone="soft">{CATEGORY_LABEL[post.category]}</Badge>
        </div>
        {showSave && (
          <form action={toggleSavePost} className="relative z-10">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="saved" value={saved ? "true" : "false"} />
            <button
              type="submit"
              aria-label={saved ? "Remove from saved" : "Save post"}
              aria-pressed={saved}
              className="rounded-md p-1.5 hover:bg-mist"
            >
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} aria-hidden />
            </button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">
          <Link href={`/posts/${post.id}`} className="after:absolute after:inset-0 hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="line-clamp-2 text-[13px] leading-6 text-muted">{post.body}</p>
      </div>

      {post.what_i_can_give && (
        <div className="rounded-lg bg-[#f7f7f7] px-3 py-2 text-xs text-ink">
          <span className="text-muted">Can give:</span> {post.what_i_can_give}
        </div>
      )}

      {post.availability_total !== null && (
        <div className="rounded-lg border border-line px-3 py-2 text-xs text-ink">
          <span className="font-semibold">
            {post.availability_remaining ?? 0} of {post.availability_total}
          </span>{" "}
          {post.availability_unit} available
          {post.approval_policy === "manual_approval" && <span className="text-muted"> · approval required</span>}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2.5 pt-1">
        <Avatar
          name={post.owner_display_name}
          avatarPath={post.owner_avatar_url}
          tone={avatarTone(post.owner_id)}
          size="sm"
        />
        <div className="leading-tight">
          <p className="text-[13px] font-medium">{post.owner_display_name}</p>
          <p className="text-xs text-[#8a8a8a]">{meta}</p>
        </div>
      </div>
    </article>
  );
}
