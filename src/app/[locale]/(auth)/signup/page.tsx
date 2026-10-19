import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { SignupForm } from "@/features/auth/auth-forms";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default function SignupPage({ params, searchParams }: PageProps<"/[locale]/signup">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Auth");

  return (
    <AuthCard
      title={t("signupTitle")}
      footer={
        <p>
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
            {t("loginButton")}
          </Link>
        </p>
      }
    >
      <Suspense>
        <SignupFormFromParams searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function SignupFormFromParams({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/signup">["searchParams"];
}) {
  const { next } = await searchParams;
  return <SignupForm next={typeof next === "string" ? next : undefined} />;
}
