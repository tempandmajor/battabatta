import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in · Battarbox" };

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { user } = await getSessionUser();
  if (user) redirect("/");

  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to keep bartering.">
      <LoginForm next={next} initialError={params.error} />
    </AuthCard>
  );
}
