import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/i18n/routing";

export default function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  setRequestLocale(use(params).locale as Locale);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </>
  );
}
