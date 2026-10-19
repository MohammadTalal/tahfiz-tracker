import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { privacyPolicy } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/legal-page";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  return { title: privacyPolicy[locale as Locale].title };
}

export default function Page({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  return <LegalPage doc={privacyPolicy[locale as Locale]} />;
}
