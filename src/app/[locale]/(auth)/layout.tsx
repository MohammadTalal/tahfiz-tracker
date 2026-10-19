import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BrandMark } from "@/components/layout/brand";
import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/i18n/routing";

export default function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Every layout sets the locale so next-intl never falls back to request headers.
  setRequestLocale(use(params).locale as Locale);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-14">
        <div className="flex justify-center lg:order-none">{children}</div>
        <WelcomePanel />
      </main>
    </>
  );
}

/** Calm brand panel beside the sign-in forms (desktop only). */
function WelcomePanel() {
  const t = useTranslations("Home");
  return (
    <aside className="bg-primary-strong text-primary-foreground relative hidden min-h-96 overflow-hidden rounded-2xl p-10 lg:flex lg:flex-col lg:justify-end">
      <div className="bg-geometric pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <BrandMark className="size-12 rounded-xl bg-white/10 [&_svg]:size-7" />
        <p className="text-2xl leading-snug font-semibold">{t("headline")}</p>
        <p className="text-white/75">{t("subtitle")}</p>
      </div>
    </aside>
  );
}
