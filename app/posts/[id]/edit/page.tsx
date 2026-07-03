import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { deletePost } from "@/lib/actions/posts";
import { requireOnboardedUser } from "@/lib/auth";
import { ghostButtonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Edit post · BattaBatta" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireOnboardedUser();

  const { data: post } = await supabase
    .from("posts")
    .select("id, owner_id, kind, category, title, body, what_i_can_give, location_mode, approval_policy, availability_total, availability_unit, status")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!post) notFound();

  const { data: photos } = await supabase
    .from("post_photos")
    .select("id, path")
    .eq("post_id", post.id)
    .order("position");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Edit post</h1>
      <div className="mt-8">
        <PostForm post={post} existingPhotos={photos ?? []} />
      </div>
      <form
        action={deletePost}
        className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-line p-4"
      >
        <p className="text-[13px] leading-6 text-muted">
          Deleting hides the post permanently. Existing offer threads stay readable to their participants.
        </p>
        <input type="hidden" name="postId" value={post.id} />
        <button type="submit" className={ghostButtonClass}>
          Delete post
        </button>
      </form>
    </main>
  );
}
