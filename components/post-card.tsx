import Link from "next/link";
import { Bookmark, Handshake } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { Badge, secondaryButtonClass } from "@/components/ui";
import { toggleSavePost } from "@/lib/actions/posts";
import { CATEGORY_LABEL, POST_KIND_LABEL, formatAvailability, timeAgo } from "@/lib/format";
import { publicStorageUrl } from "@/lib/utils";

export type PostCardData = {
  id: string;
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
  distance_bucket?: string | null;
  owner_id: string;
  owner_display_name: string;
  owner_handle: string | null;
  owner_avatar_url?: string | null;
  owner_supporter_since?: string | null;
  cover_photo_path?: string | null;
};

export function PostCard({
  post,
  saved,
  showSave,
  currentUserId
}: {
  post: PostCardData;
  saved: boolean;
  showSave: boolean;
  currentUserId?: string | null;
}) {
  const meta = [post.distance_bucket ?? post.approximate_location_label, timeAgo(post.created_at)]
    .filter(Boolean)
    .join(" · ");
  const profileHref = post.owner_handle ? `/profiles/${post.owner_handle}` : null;
  const availability = formatAvailability({
    remaining: post.availability_remaining,
    total: post.availability_total,
    unit: post.availability_unit
  });
  const soldOut = post.availability_total !== null && (post.availability_remaining ?? 0) <= 0;
  const isOwner = currentUserId != null && currentUserId === post.owner_id;
  const showOfferCta = !isOwner && !soldOut;

  return (
    <article className="flex min-h-[260px] flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lift">
      {post.cover_photo_path && (
        <Link href={`/posts/${post.id}`} aria-label={post.title}>
          <img
            src={publicStorageUrl("post-photos", post.cover_photo_path)}
            alt=""
            className="-mx-5 -mt-5 h-40 w-[calc(100%+2.5rem)] max-w-none object-cover"
          />
        </Link>
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
          <Link href={`/posts/${post.id}`} className="hover:underline">
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

      {post.looking_for && (
        <div className="rounded-lg bg-[#f7f7f7] px-3 py-2 text-xs text-ink">
          <span className="text-muted">Looking for:</span> {post.looking_for}
        </div>
      )}

      {availability && (
        <div className="rounded-lg border border-line px-3 py-2 text-xs text-ink">
          <span className="font-semibold">{availability}</span>
          {post.approval_policy === "manual_approval" && <span className="text-muted"> · approval required</span>}
        </div>
      )}

      <div className="mt-auto space-y-3 pt-1">
        {profileHref ? (
          <Link href={profileHref as never} className="flex w-fit items-center gap-2.5 hover:underline">
            <Avatar
              name={post.owner_display_name}
              avatarPath={post.owner_avatar_url}
              tone={avatarTone(post.owner_id)}
              size="sm"
            />
            <span className="leading-tight">
              <span className="block text-[13px] font-medium">{post.owner_display_name}</span>
              <span className="block text-xs text-[#8a8a8a]">
                @{post.owner_handle} {post.owner_supporter_since ? "· Supporter" : ""} {meta ? `· ${meta}` : ""}
              </span>
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar
              name={post.owner_display_name}
              avatarPath={post.owner_avatar_url}
              tone={avatarTone(post.owner_id)}
              size="sm"
            />
            <div className="leading-tight">
              <p className="text-[13px] font-medium">{post.owner_display_name}</p>
              <p className="text-xs text-[#8a8a8a]">
                {post.owner_supporter_since ? "Supporter" : ""}
                {post.owner_supporter_since && meta ? " · " : ""}
                {meta}
              </p>
            </div>
          </div>
        )}

        {showOfferCta && (
          <Link href={`/posts/${post.id}#make-an-offer`} className={`${secondaryButtonClass} w-full`}>
            <Handshake size={14} className="mr-1.5" aria-hidden /> Make an offer
          </Link>
        )}
      </div>
    </article>
  );
}
