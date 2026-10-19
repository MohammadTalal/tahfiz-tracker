import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="text-muted-foreground border-t">
      <nav
        aria-label={t("label")}
        className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-4 text-sm"
      >
        <Link href="/about" className="hover:text-foreground underline-offset-4 hover:underline">
          {t("about")}
        </Link>
        <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
          {t("privacy")}
        </Link>
        <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
          {t("terms")}
        </Link>
      </nav>
    </footer>
  );
}
