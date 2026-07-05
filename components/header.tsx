import Link from "next/link";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { getSessionUser, isAdminProfile } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

async function getHeaderData() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { user: null, profile: null, unreadThreads: 0, isAdmin: false };

  const [{ data: profile }, { data: threads }, isAdmin] = await Promise.all([
    supabase.from("profiles").select("display_name, handle, avatar_url").eq("id", user.id).single(),
    supabase.rpc("list_threads"),
    isAdminProfile(user.id)
  ]);
  const unreadThreads = (threads ?? []).filter((thread) => thread.unread_count > 0).length;
  return { user, profile, unreadThreads, isAdmin };
}

export async function Header() {
  const { user, profile, unreadThreads, isAdmin } = await getHeaderData();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:gap-8 sm:px-8">
        <Link href="/" className="flex h-10 shrink-0 items-center" aria-label="Battarbox home">
          <Image
            src="/battarbox-favicon.png"
            alt=""
            width={32}
            height={32}
            priority
            className="size-8 object-contain sm:hidden"
          />
          <Image
            src="/battarbox-logo.png"
            alt="Battarbox"
            width={150}
            height={50}
            priority
            className="hidden h-8 w-auto object-contain sm:block"
          />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          <HeaderLink href="/">Discover</HeaderLink>
          {user && (
            <HeaderLink href="/messages">
              Messages
              {unreadThreads > 0 && (
                <span className="ml-1.5 rounded-full bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {unreadThreads}
                </span>
              )}
            </HeaderLink>
          )}
          <HeaderLink href="/support">Support</HeaderLink>
          {isAdmin && <HeaderLink href="/admin">Admin</HeaderLink>}
        </nav>

        <form action="/" className="ml-auto hidden w-64 items-center gap-2 rounded-lg bg-mist px-3 py-2 md:flex">
          <Search size={15} className="shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            placeholder="Search offers..."
            aria-label="Search offers"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
          />
        </form>

        {user && profile ? (
          <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0">
            <Link
              href="/posts/new"
              className="hidden items-center gap-1.5 rounded-full border border-ink px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-mist sm:inline-flex"
            >
              <Plus size={14} aria-hidden /> Post
            </Link>
            <UserMenu
              displayName={profile.display_name}
              handle={profile.handle}
              userId={user.id}
              avatarPath={profile.avatar_url}
            />
          </div>
        ) : (
          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-mist"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-85"
            >
              Join free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as never}
      className={cn("flex items-center whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium text-muted hover:text-ink")}
    >
      {children}
    </Link>
  );
}
