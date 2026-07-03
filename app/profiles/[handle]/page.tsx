import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, UserRoundX } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { ReportDialog } from "@/components/report-dialog";
import { Badge, ghostButtonClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { blockProfile, toggleFollow, unblockProfile } from "@/lib/actions/social";
import { getSessionUser } from "@/lib/auth";
import { CATEGORY_LABEL, LOCATION_MODE_LABEL, POST_KIND_LABEL } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle} · Battarbox` };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { supabase, user } = await getSessionUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, handle, bio, public_location_label, location_mode, is_paused, avatar_url")
    .eq("handle", handle)
    .maybeSingle();
  if (!profile) notFound();

  const isSelf = user?.id === profile.id;

  const [postsResult, interestsResult, followerCount, followingCount, myFollow, myBlock] = await Promise.all([
    supabase
      .from("posts")
      .select("id, kind, category, title, body, what_i_can_give")
      .eq("owner_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("profile_interests").select("label").eq("profile_id", profile.id).order("label"),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    user && !isSelf
      ? supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user && !isSelf
      ? supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const posts = postsResult.data ?? [];
  const interests = interestsResult.data ?? [];
  const isFollowing = Boolean(myFollow.data);
  const isBlocked = Boolean(myBlock.data);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <Link href="/" className="flex w-fit items-center gap-1.5 py-1 text-[13px] font-medium text-muted hover:text-ink">
        <ChevronLeft size={14} aria-hidden /> Back to Discover
      </Link>

      <div className="mt-7 flex flex-wrap items-start gap-7">
        <Avatar name={profile.display_name} avatarPath={profile.avatar_url} tone={avatarTone(profile.id)} size="lg" />
        <div className="min-w-72 flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-[-0.03em]">{profile.display_name}</h1>
                {profile.is_paused && (
                  <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-semibold text-[#8a8a8a]">
                    Not offering at the moment
                  </span>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                {profile.public_location_label && (
                  <>
                    <MapPin size={14} aria-hidden /> {profile.public_location_label} <span aria-hidden>·</span>
                  </>
                )}
                {LOCATION_MODE_LABEL[profile.location_mode]}
                <span aria-hidden>·</span>@{profile.handle}
              </p>
              <p className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
                <span>
                  <strong className="font-semibold text-ink">{followerCount.count ?? 0}</strong> followers
                </span>
                <span>
                  <strong className="font-semibold text-ink">{followingCount.count ?? 0}</strong> following
                </span>
              </p>
            </div>

            {!isSelf && user && (
              <div className="flex flex-wrap gap-2">
                {!isBlocked && (
                  <form action={toggleFollow}>
                    <input type="hidden" name="followeeId" value={profile.id} />
                    <input type="hidden" name="following" value={isFollowing ? "true" : "false"} />
                    <input type="hidden" name="handle" value={profile.handle ?? ""} />
                    <button type="submit" className={isFollowing ? secondaryButtonClass : primaryButtonClass}>
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </form>
                )}
                {!isBlocked && (
                  <Link href={`/messages/new?to=${profile.handle}`} className={secondaryButtonClass}>
                    Message
                  </Link>
                )}
              </div>
            )}
            {isSelf && (
              <Link href="/settings" className={secondaryButtonClass}>
                Edit profile
              </Link>
            )}
          </div>

          {profile.bio && <p className="max-w-2xl text-sm leading-6 text-[#3d3d3d]">{profile.bio}</p>}

          {!isSelf && user && (
            <div className="flex flex-wrap gap-2 pt-1">
              <ReportDialog reportedProfileId={profile.id} />
              <form action={isBlocked ? unblockProfile : blockProfile}>
                <input type="hidden" name="blockedId" value={profile.id} />
                <button type="submit" className={ghostButtonClass}>
                  <UserRoundX size={14} className="mr-1.5" aria-hidden />
                  {isBlocked ? "Unblock" : "Block"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {isBlocked ? (
        <EmptyState
          title="You have blocked this member."
          hint="They cannot send you offers or messages. Unblock to see their posts again."
        />
      ) : (
        <>
          <section className="mt-11">
            <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">Offering</h2>
            {posts.length === 0 ? (
              <p className="text-[13px] text-muted">No active posts right now.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="rounded-[14px] border border-line p-5 transition hover:border-ink"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{post.title}</h3>
                      <Badge tone="soft">
                        {POST_KIND_LABEL[post.kind]} · {CATEGORY_LABEL[post.category]}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-muted">{post.body}</p>
                    {post.what_i_can_give && (
                      <p className="mt-3 text-xs text-[#8a8a8a]">
                        <span className="font-medium text-ink">Can give:</span> {post.what_i_can_give}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
              Interested in
            </h2>
            {interests.length === 0 ? (
              <p className="text-[13px] text-muted">No interests listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest.label}
                    className="rounded-full bg-mist px-4 py-2 text-[13px] font-medium text-[#3d3d3d]"
                  >
                    {interest.label}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
