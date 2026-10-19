import { useTranslations } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

/** Top bar shared by every page. `actions` holds extra controls (e.g. the user menu). */
export function SiteHeader({ homeHref = "/", actions }: { homeHref?: string; actions?: ReactNode }) {
  const t = useTranslations("Home");
  return (
    <header className="bg-card/95 sticky top-0 z-30 border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={homeHref} className="flex items-center gap-2.5 rounded-lg">
          <BrandMark />
          <span className="text-primary-strong font-semibold">{t("title")}</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Reads the current URL, which is runtime data on dynamic routes. */}
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          {actions}
        </div>
      </div>
    </header>
  );
}
