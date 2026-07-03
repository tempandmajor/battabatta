import type { Metadata } from "next";
import { PostForm } from "@/components/post-form";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "New post · BattaBatta" };

export default async function NewPostPage() {
  await requireOnboardedUser("/posts/new");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Publish a post</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Describe what you are offering or seeking. Your post shows only your approximate location label.
      </p>
      <div className="mt-8">
        <PostForm />
      </div>
    </main>
  );
}
