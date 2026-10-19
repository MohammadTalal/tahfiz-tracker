import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { aboutPage } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/legal-page";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return { title: aboutPage[locale as Locale].title };
}

export default function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  return <LegalPage doc={aboutPage[locale as Locale]} showMeta={false} />;
}
