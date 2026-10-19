import { LogOut } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageLoading } from "@/components/layout/page-loading";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { getProfileName } from "@/features/workspace/queries";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";

// Pages in this group read the session (runtime data), so they stream in
// behind this boundary while the header renders immediately.
export default function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  setRequestLocale(use(params).locale as Locale);
  return (
    <>
      <SiteHeader
        homeHref="/dashboard"
        actions={
          <Suspense>
            <UserMenu />
          </Suspense>
        }
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </main>
    </>
  );
}

/** Signed-in user's name and sign-out. Renders nothing when signed out. */
async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [name, t] = await Promise.all([getProfileName(user.id), getTranslations("Auth")]);
  return (
    <div className="flex items-center gap-1 border-s ps-2 sm:ps-3">
      {name && (
        <span className="hidden items-center gap-2 md:flex">
          <InitialAvatar name={name} size="sm" />
          <span className="max-w-40 truncate text-sm font-medium">{name}</span>
        </span>
      )}
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" aria-label={t("signOut")} title={t("signOut")}>
          <LogOut className="size-4 rtl:rotate-180" aria-hidden />
          <span className="hidden sm:inline">{t("signOut")}</span>
        </Button>
      </form>
    </div>
  );
}
