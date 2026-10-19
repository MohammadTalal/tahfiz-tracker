import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="text-muted-foreground mt-auto border-t">
      <nav
        aria-label={t("label")}
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-5 text-sm sm:px-6"
      >
        <Link href="/about" className="hover:text-foreground transition-colors duration-150">
          {t("about")}
        </Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors duration-150">
          {t("privacy")}
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors duration-150">
          {t("terms")}
        </Link>
      </nav>
    </footer>
  );
}
