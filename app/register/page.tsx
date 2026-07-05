import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account · Battarbox" };

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const { user } = await getSessionUser();
  if (user) redirect("/");

  return (
    <AuthCard title="Create your account" subtitle="Free-first barter discovery for local and online exchanges.">
      <RegisterForm inviteToken={invite} />
    </AuthCard>
  );
}
