import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { ResetPasswordForm } from "@/features/auth/auth-forms";
import type { Locale } from "@/i18n/routing";

// Reached from the password-reset email via /auth/callback, which signs the
// user in first. updateUser() fails without that session.
export default function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Auth");

  return (
    <AuthCard title={t("resetTitle")}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
