import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/layout/auth-card";
import { buttonVariants } from "@/components/ui/button";
import { AcceptInviteForm } from "@/features/workspace/components/accept-invite-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";

// Shows nothing about the invitation before sign-in; the token is checked
// only when the signed-in user accepts it.
export default async function InvitePage({ params }: PageProps<"/[locale]/invite/[token]">) {
  const { locale, token } = await params;
  setRequestLocale(locale as Locale);
  const user = await getCurrentUser();
  const t = await getTranslations("Invite");
  const ta = await getTranslations("Auth");
  const next = `/${locale}/invite/${encodeURIComponent(token)}`;

  return (
    <div className="flex justify-center">
      <AuthCard title={t("acceptTitle")} description={user ? undefined : t("acceptHelp")}>
        {user ? (
          <AcceptInviteForm token={token} />
        ) : (
          <div className="flex flex-col gap-2">
            <Link href={{ pathname: "/signup", query: { next } }} className={buttonVariants({ size: "lg" })}>
              {ta("signupButton")}
            </Link>
            <Link
              href={{ pathname: "/login", query: { next } }}
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {ta("loginButton")}
            </Link>
          </div>
        )}
      </AuthCard>
    </div>
  );
}
