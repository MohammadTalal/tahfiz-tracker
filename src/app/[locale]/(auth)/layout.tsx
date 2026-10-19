import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/i18n/routing";

export default function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Every layout sets the locale so next-intl never falls back to request headers.
  setRequestLocale(use(params).locale as Locale);
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10">{children}</main>
    </>
  );
}
