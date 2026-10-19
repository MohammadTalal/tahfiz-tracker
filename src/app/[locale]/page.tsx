import { PenLine, ShieldCheck, Users, WifiOff, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BrandMark } from "@/components/layout/brand";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const FEATURES: { key: "fast" | "parents" | "offline" | "private"; icon: LucideIcon }[] = [
  { key: "fast", icon: PenLine },
  { key: "parents", icon: Users },
  { key: "offline", icon: WifiOff },
  { key: "private", icon: ShieldCheck },
];

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Home");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <section className="flex flex-col items-start gap-5">
          <Badge variant="gold" className="h-7 px-3">
            {t("badge")}
          </Badge>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {t("headline")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "px-6")}>
              {t("getStarted")}
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-6")}>
              {t("login")}
            </Link>
          </div>
        </section>

        <section
          aria-label={t("featuresLabel")}
          className="bg-primary-strong text-primary-foreground relative overflow-hidden rounded-2xl p-6 shadow-(--shadow-soft) sm:p-8"
        >
          <div className="bg-geometric pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <BrandMark className="bg-white/10" />
              <span className="font-semibold">{t("title")}</span>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex gap-3">
                  <span
                    className="text-gold grid size-9 shrink-0 place-items-center rounded-lg bg-white/10"
                    aria-hidden
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{t(`feature_${key}`)}</span>
                    <span className="text-sm text-white/75">{t(`feature_${key}_desc`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
