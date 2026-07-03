import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Update password · BattaBatta" };

export default async function UpdatePasswordPage() {
  await requireUser("/update-password");

  return (
    <AuthCard title="Choose a new password">
      <UpdatePasswordForm />
    </AuthCard>
  );
}
