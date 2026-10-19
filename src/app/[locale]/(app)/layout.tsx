import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { PageLoading } from "@/components/layout/page-loading";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import type { Locale } from "@/i18n/routing";

// Pages in this group read the session (runtime data), so they stream in
// behind this boundary while the header renders immediately.
export default function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  setRequestLocale(use(params).locale as Locale);
  return (
    <>
      <SiteHeader homeHref="/dashboard" actions={<SignOutButton />} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6">
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </main>
    </>
  );
}

function SignOutButton() {
  const t = useTranslations("Auth");
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm" aria-label={t("signOut")}>
        <LogOut className="size-4 rtl:rotate-180" aria-hidden />
        <span className="hidden sm:inline">{t("signOut")}</span>
      </Button>
    </form>
  );
}
