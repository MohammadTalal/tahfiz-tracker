import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("Common");
  const tn = useTranslations("Nav");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
        <p>{t("notFound")}</p>
        <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">
          {tn("home")}
        </Link>
      </main>
    </>
  );
}
