import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { termsOfService } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/legal-page";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  return { title: termsOfService[locale as Locale].title };
}

export default function Page({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  return <LegalPage doc={termsOfService[locale as Locale]} />;
}
