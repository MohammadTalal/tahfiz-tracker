import { useTranslations } from "next-intl";

/** Skeleton shown while a signed-in page streams in. */
export function PageLoading() {
  const t = useTranslations("Common");
  return (
    <div role="status" aria-label={t("loading")} className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-8 w-56 rounded-lg" />
      </div>
      <div className="bg-muted h-20 rounded-xl" />
      <div className="flex flex-col gap-3">
        <div className="bg-muted h-14 rounded-xl" />
        <div className="bg-muted h-14 rounded-xl" />
        <div className="bg-muted h-14 rounded-xl" />
      </div>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
