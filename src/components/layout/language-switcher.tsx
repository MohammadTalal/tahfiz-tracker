"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex gap-1">
      {routing.locales
        .filter((locale) => locale !== current)
        .map((locale) => (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors duration-150"
          >
            <Languages className="size-4" aria-hidden />
            {t(locale)}
          </Link>
        ))}
    </nav>
  );
}
