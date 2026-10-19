"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex gap-3 text-sm">
      {routing.locales
        .filter((locale) => locale !== current)
        .map((locale) => (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            className="underline-offset-4 hover:underline"
          >
            {t(locale)}
          </Link>
        ))}
    </nav>
  );
}
