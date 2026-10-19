import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/layout/empty-state";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const t = useTranslations("Common");
  const tn = useTranslations("Nav");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
        <EmptyState
          icon={SearchX}
          title={t("notFound")}
          action={
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
              {tn("home")}
            </Link>
          }
        />
      </main>
    </>
  );
}
