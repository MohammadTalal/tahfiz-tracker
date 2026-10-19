import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { getDirection, routing } from "@/i18n/routing";
import "../globals.css";

const appSans = IBM_Plex_Sans_Arabic({
  variable: "--font-app-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Quran references (surah names, passages) use a classical Naskh face.
const quranFont = Amiri({
  variable: "--font-app-quran",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${appSans.variable} ${quranFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          {children}
          <SiteFooter />
          <Toaster position="top-center" dir={getDirection(locale)} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
