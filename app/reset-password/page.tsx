import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Reset password · BattaBatta" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We will email you a link to choose a new password.">
      <ResetForm />
    </AuthCard>
  );
}
