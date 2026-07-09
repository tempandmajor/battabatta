import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ChevronLeft, MapPin } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { OfferForm } from "@/components/offer-form";
import { PostCard } from "@/components/post-card";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/share-button";
import { Badge, secondaryButtonClass } from "@/components/ui";
import { toggleSavePost } from "@/lib/actions/posts";
import { getSessionUser, isProfileSuspended } from "@/lib/auth";
import { CATEGORY_LABEL, LOCATION_MODE_LABEL, POST_KIND_LABEL, formatAvailability, timeAgo } from "@/lib/format";
import { getPublicPostDetail } from "@/lib/public-posts";
import { getSiteUrl, publicStorageUrl } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPostDetail(id);
  if (!post) return { title: "Post · Battarbox" };

  const descriptionSource = post.body.replace(/\s+/g, " ").trim();
  const description = descriptionSource.length > 160 ? `${descriptionSource.slice(0, 157)}...` : descriptionSource;
  const cover = post.photos[0];
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
  const post = await getPublicPostDetail(id);
  if (!post) notFound();

  const { supabase, user } = await getSessionUser();
  const isOwner = user?.id === post.owner_id;
  if (!isOwner && (await isProfileSuspended(post.owner.id))) notFound();

  const adModerationPromise =
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? import("@/lib/supabase/admin").then(({ createSupabaseAdminClient }) =>
          createSupabaseAdminClient().from("post_ad_moderation").select("status, review_note").eq("post_id", post.id).maybeSingle()
        )
      : Promise.resolve({ data: null });

  const [{ data: savedResult }, { data: adModeration }] = await Promise.all([
    user
      ? supabase.from("saved_posts").select("post_id").eq("profile_id", user.id).eq("post_id", post.id).maybeSingle()
      : Promise.resolve({ data: null }),
    adModerationPromise
  ]);

  const soldOut = post.availability_total !== null && (post.availability_remaining ?? 0) <= 0;
  const isSaved = Boolean(savedResult);
  const availability = formatAvailability({
    remaining: post.availability_remaining,
    total: post.availability_total,
    unit: post.availability_unit
  });
  const locationText = post.approximate_location_label ?? LOCATION_MODE_LABEL[post.location_mode];
  const safetyNote =
    adModeration?.status === "approved"
      ? "This listing passed Battarbox's current ad-safety review."
      : "New, edited, or reported listings stay non-monetized until a moderator reviews them.";

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <Link href="/" className="flex w-fit items-center gap-1.5 py-1 text-[13px] font-medium text-muted hover:text-ink">
        <ChevronLeft size={14} aria-hidden /> Back to Discover
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="space-y-8">
          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={post.kind === "seeking" ? "outline" : "solid"}>{POST_KIND_LABEL[post.kind]}</Badge>
              <Badge tone="soft">{CATEGORY_LABEL[post.category]}</Badge>
              <Badge tone="soft">{LOCATION_MODE_LABEL[post.location_mode]}</Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight tracking-[-0.03em]">{post.title}</h1>
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                <MapPin size={14} aria-hidden />
                {locationText}
                <span aria-hidden>·</span>
                {timeAgo(post.created_at)}
              </p>
            </div>
          </header>

          {post.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {post.photos.map((photo, index) => (
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

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Description</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-[#3d3d3d]">{post.body}</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f7f7f7] p-4">
              <h2 className="text-sm font-semibold">What this member can provide</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#3d3d3d]">{post.what_i_can_give ?? "Not specified."}</p>
            </div>
            <div className="rounded-2xl bg-[#f7f7f7] p-4">
              <h2 className="text-sm font-semibold">What they want in exchange</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#3d3d3d]">{post.looking_for ?? "Not specified."}</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-line p-4">
              <h2 className="text-sm font-semibold">Offering or seeking</h2>
              <p className="mt-2 text-[13px] text-[#3d3d3d]">
                {POST_KIND_LABEL[post.kind]} · {CATEGORY_LABEL[post.category]}
              </p>
            </div>
            <div className="rounded-2xl border border-line p-4">
              <h2 className="text-sm font-semibold">Location mode</h2>
              <p className="mt-2 text-[13px] text-[#3d3d3d]">
                {locationText} · {LOCATION_MODE_LABEL[post.location_mode]}
              </p>
            </div>
            <div className="rounded-2xl border border-line p-4">
              <h2 className="text-sm font-semibold">Availability</h2>
              <p className="mt-2 text-[13px] text-[#3d3d3d]">
                {availability ?? "No quantity limit listed."}
                {post.approval_policy === "manual_approval" ? " Approval required." : ""}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-line p-4">
            <h2 className="text-sm font-semibold">Safety notes</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#3d3d3d]">
              Meet in a public place when possible, avoid sharing exact addresses too early, and use the Report button
              if a listing feels unsafe or violates policy. {safetyNote}
            </p>
          </section>

          <section className="border-t border-line pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={post.owner.handle ? `/profiles/${post.owner.handle}` : "#"} className="flex items-center gap-2.5">
                <Avatar
                  name={post.owner.display_name}
                  avatarPath={post.owner.avatar_url}
                  tone={avatarTone(post.owner.id)}
                  size="md"
                />
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold hover:underline">{post.owner.display_name}</span>
                  <span className="block text-xs text-muted">{post.owner.public_location_label ?? "Battarbox member"}</span>
                </span>
              </Link>
              <div className="ml-auto flex gap-2">
                {user && !isOwner && (
                  <form action={toggleSavePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="saved" value={isSaved ? "true" : "false"} />
                    <button type="submit" aria-pressed={isSaved} className={secondaryButtonClass}>
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
          </section>

          {post.related.length > 0 && (
            <section className="space-y-4 border-t border-line pt-6">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.02em]">Related listings</h2>
                <p className="mt-1 text-[13px] text-muted">More public listings in the same category.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {post.related.map((relatedPost) => (
                  <PostCard
                    key={relatedPost.id}
                    post={relatedPost}
                    saved={false}
                    showSave={false}
                    currentUserId={user?.id ?? null}
                  />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside id="make-an-offer" className="scroll-mt-24">
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
                Sign in to make a non-binding offer and message {post.owner.display_name}.
              </p>
              <Link href={`/login?next=/posts/${post.id}`} className={`${secondaryButtonClass} w-full`}>
                Sign in to make an offer
              </Link>
            </div>
          ) : post.owner.is_paused ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-6 text-muted">
              {post.owner.display_name} is not offering at the moment.
            </div>
          ) : soldOut ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-6 text-muted">
              All {post.availability_unit} are spoken for. Save the post in case availability opens up.
            </div>
          ) : (
            <OfferForm
              recipientId={post.owner.id}
              postId={post.id}
              defaultRequestedItem={post.kind === "offering" ? post.title : undefined}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
