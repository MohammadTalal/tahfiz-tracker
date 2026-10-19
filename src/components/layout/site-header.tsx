import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

/** Top bar shared by every page. `actions` holds extra controls (e.g. sign out). */
export function SiteHeader({ homeHref = "/", actions }: { homeHref?: string; actions?: ReactNode }) {
  const t = useTranslations("Home");
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
        <Link href={homeHref} className="text-primary flex items-center gap-2 font-semibold">
          <BookOpen className="size-5" aria-hidden />
          <span>{t("title")}</span>
        </Link>
        <div className="flex items-center gap-4">
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
