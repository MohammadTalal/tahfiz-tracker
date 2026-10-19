import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function PageLoading() {
  const t = useTranslations("Common");
  return (
    <div role="status" className="text-muted-foreground flex items-center gap-2 py-10">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {t("loading")}
    </div>
  );
}
