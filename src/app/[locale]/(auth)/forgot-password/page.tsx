import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { ForgotPasswordForm } from "@/features/auth/auth-forms";
import type { Locale } from "@/i18n/routing";

export default function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Auth");

  return (
    <AuthCard title={t("forgotTitle")} description={t("forgotHelp")}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
