import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { LoginForm } from "@/features/auth/auth-forms";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Auth");

  return (
    <AuthCard
      title={t("loginTitle")}
      footer={
        <>
          <Link href="/forgot-password" className="underline-offset-4 hover:underline">
            {t("forgotPassword")}
          </Link>
          <Suspense>
            <SignupLink searchParams={searchParams} label={t("noAccount")} cta={t("signupButton")} />
          </Suspense>
        </>
      }
    >
      <Suspense>
        <LoginFormFromParams searchParams={searchParams} linkInvalid={t("linkInvalid")} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormFromParams({
  searchParams,
  linkInvalid,
}: {
  searchParams: PageProps<"/[locale]/login">["searchParams"];
  linkInvalid: string;
}) {
  const { next, error } = await searchParams;
  return (
    <>
      {error === "link" && (
        <p role="alert" className="bg-destructive/10 text-destructive mb-4 rounded-md px-3 py-2 text-sm">
          {linkInvalid}
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}

async function SignupLink({
  searchParams,
  label,
  cta,
}: {
  searchParams: PageProps<"/[locale]/login">["searchParams"];
  label: string;
  cta: string;
}) {
  const { next } = await searchParams;
  return (
    <p>
      {label}{" "}
      <Link
        href={typeof next === "string" ? { pathname: "/signup", query: { next } } : "/signup"}
        className="text-primary font-medium underline-offset-4 hover:underline"
      >
        {cta}
      </Link>
    </p>
  );
}
