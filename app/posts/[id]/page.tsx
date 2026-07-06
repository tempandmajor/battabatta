import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ChevronLeft, MapPin } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { OfferForm } from "@/components/offer-form";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/share-button";
import { Badge, secondaryButtonClass } from "@/components/ui";
import { toggleSavePost } from "@/lib/actions/posts";
import { getSessionUser, isProfileSuspended } from "@/lib/auth";
import { CATEGORY_LABEL, LOCATION_MODE_LABEL, POST_KIND_LABEL, timeAgo } from "@/lib/format";
import { getSiteUrl, publicStorageUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await getSessionUser();
  const { data: post } = await supabase
    .from("posts")
    .select("title, body, post_photos (path, position)")
    .eq("id", id)
    .maybeSingle();
  if (!post) return { title: "Post · Battarbox" };

  const descriptionSource = post.body.replace(/\s+/g, " ").trim();
  const description = descriptionSource.length > 160 ? `${descriptionSource.slice(0, 157)}...` : descriptionSource;
  const cover = [...(post.post_photos ?? [])].sort((a, b) => a.position - b.position)[0];
  const postUrl = `${getSiteUrl()}/posts/${id}`;
  const images = cover
    ? [
        {
          url: publicStorageUrl("post-photos", cover.path),
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    : undefined;

  return {
    title: `${post.title} · Battarbox`,
    description,
    alternates: {
      canonical: postUrl
    },
    openGraph: {
      title: post.title,
      description,
      url: postUrl,
      type: "article",
      siteName: "Battarbox",
      images
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: images?.map((image) => image.url)
    }
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, owner_id, kind, category, title, body, what_i_can_give, location_mode, approximate_location_label, approval_policy, availability_total, availability_remaining, availability_unit, status, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  const [{ data: owner }, { data: photos }, savedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, handle, bio, public_location_label, is_paused, avatar_url")
      .eq("id", post.owner_id)
      .single(),
    supabase.from("post_photos").select("id, path").eq("post_id", post.id).order("position"),
    user ? supabase.from("saved_posts").select("post_id").eq("profile_id", user.id).eq("post_id", post.id).maybeSingle() : Promise.resolve({ data: null })
  ]);
  if (!owner) notFound();

  const isOwner = user?.id === post.owner_id;
  if (!isOwner && (await isProfileSuspended(owner.id))) notFound();
  const soldOut = post.availability_total !== null && (post.availability_remaining ?? 0) <= 0;
  const isSaved = Boolean(savedResult.data);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <Link href="/" className="flex w-fit items-center gap-1.5 py-1 text-[13px] font-medium text-muted hover:text-ink">
        <ChevronLeft size={14} aria-hidden /> Back to Discover
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <article className="space-y-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={post.kind === "seeking" ? "outline" : "solid"}>{POST_KIND_LABEL[post.kind]}</Badge>
            <Badge tone="soft">{CATEGORY_LABEL[post.category]}</Badge>
            {post.status !== "active" && <Badge tone="soft">{post.status}</Badge>}
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-[-0.03em]">{post.title}</h1>

          {photos && photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <img
                  key={photo.id}
                  src={publicStorageUrl("post-photos", photo.path)}
                  alt={`Photo ${index + 1} of ${post.title}`}
                  className={
                    index === 0
                      ? "col-span-2 aspect-[4/3] w-full rounded-xl border border-line object-cover sm:col-span-3"
                      : "aspect-square w-full rounded-xl border border-line object-cover"
                  }
                />
              ))}
            </div>
          )}

          <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <MapPin size={14} aria-hidden />
            {post.approximate_location_label ?? LOCATION_MODE_LABEL[post.location_mode]}
            <span aria-hidden>·</span>
            {LOCATION_MODE_LABEL[post.location_mode]}
            <span aria-hidden>·</span>
            {timeAgo(post.created_at)}
          </p>

          <p className="whitespace-pre-line text-sm leading-7 text-[#3d3d3d]">{post.body}</p>

          {post.what_i_can_give && (
            <div className="rounded-xl bg-[#f7f7f7] px-4 py-3 text-[13px] text-ink">
              <span className="text-muted">Can give:</span> {post.what_i_can_give}
            </div>
          )}

          {post.availability_total !== null && (
            <div className="rounded-xl border border-line px-4 py-3 text-[13px] text-ink">
              <span className="font-semibold">
                {post.availability_remaining ?? 0} of {post.availability_total}
              </span>{" "}
              {post.availability_unit} available
              {post.approval_policy === "manual_approval" && <span className="text-muted"> · approval required</span>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <Link href={owner.handle ? `/profiles/${owner.handle}` : "#"} className="flex items-center gap-2.5">
              <Avatar name={owner.display_name} avatarPath={owner.avatar_url} tone={avatarTone(owner.id)} size="md" />
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold hover:underline">{owner.display_name}</span>
                <span className="block text-xs text-muted">{owner.public_location_label}</span>
              </span>
            </Link>
            <div className="ml-auto flex gap-2">
              {user && !isOwner && (
                <form action={toggleSavePost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="saved" value={isSaved ? "true" : "false"} />
                  <button
                    type="submit"
                    aria-pressed={isSaved}
                    className={secondaryButtonClass}
                  >
                    <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} className="mr-1.5" aria-hidden />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </form>
              )}
              <ShareButton title={post.title} path={`/posts/${post.id}`} />
              {isOwner ? (
                <Link href={`/posts/${post.id}/edit`} className={secondaryButtonClass}>
                  Edit post
                </Link>
              ) : (
                user && <ReportDialog postId={post.id} />
              )}
            </div>
          </div>
        </article>

        <aside>
          {isOwner ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-6 text-muted">
              This is your post. Offers from other members will appear in{" "}
              <Link href="/messages" className="font-semibold text-ink hover:underline">
                Messages
              </Link>
              .
            </div>
          ) : !user ? (
            <div className="space-y-3 rounded-2xl border border-line bg-white p-5">
              <p className="text-sm font-semibold">Want to trade?</p>
              <p className="text-[13px] leading-6 text-muted">
                Sign in to make a non-binding offer and message {owner.display_name}.
              </p>
              <Link href={`/login?next=/posts/${post.id}`} className={`${secondaryButtonClass} w-full`}>
                Sign in to make an offer
              </Link>
            </div>
          ) : owner.is_paused ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-6 text-muted">
              {owner.display_name} is not offering at the moment.
            </div>
          ) : soldOut ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-6 text-muted">
              All {post.availability_unit} are spoken for. Save the post in case availability opens up.
            </div>
          ) : (
            <OfferForm
              recipientId={owner.id}
              postId={post.id}
              defaultRequestedItem={post.kind === "offering" ? post.title : undefined}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
