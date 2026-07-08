import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "Community Barter Examples · Battarbox",
  description:
    "Realistic examples of local and online barter ideas that fit Battarbox's safety and policy boundaries."
};

const ideas = [
  {
    title: "Garden surplus for repair help",
    body:
      "A gardener with extra herbs or tomatoes can trade weekly produce boxes for small household fixes, mending, or bike tune-up help."
  },
  {
    title: "Creative work for lessons",
    body:
      "An illustrator can offer a portrait commission in exchange for photography, music, language, or software tutoring."
  },
  {
    title: "Online skill swap",
    body:
      "Someone comfortable with spreadsheets can offer a remote cleanup session in exchange for resume feedback or beginner design help."
  },
  {
    title: "Moving help for home-cooked meals",
    body:
      "A neighbor can ask for an extra set of hands moving furniture and offer prepared meals, yard help, or another practical favor."
  },
  {
    title: "Houseplant cuttings for supplies",
    body:
      "A plant collector can offer rooted cuttings for pots, soil, garden labels, or a short lesson on propagation."
  },
  {
    title: "Beginner coaching for equipment",
    body:
      "A hobbyist can offer patient beginner coaching in exchange for used, working gear that another member no longer needs."
  }
] as const;

export default function CommunityExamplesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <section className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Examples</p>
        <h1 className="mt-3 text-4xl font-bold leading-none tracking-[-0.04em]">
          Community barter ideas that fit Battarbox
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          These examples are not listings or guarantees. They show the kinds of specific, non-monetary, policy-safe
          exchanges that make a barter community easier to browse and understand.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {ideas.map((idea) => (
          <article key={idea.title} className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-lg font-bold tracking-[-0.02em]">{idea.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{idea.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold tracking-[-0.02em]">What these examples have in common</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          They are specific, personal, non-monetary, and easy to evaluate. They avoid regulated goods, adult content,
          financial products, cash equivalents, unsafe services, and anything that would require Battarbox to verify a
          professional license or process payment.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className={primaryButtonClass}>
          Browse current posts
        </Link>
        <Link href="/guides/good-posts" className={secondaryButtonClass}>
          Write a good post
        </Link>
      </div>
    </main>
  );
}
