import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandMark } from "@/components/layout/brand";
import { CreateOrganizationForm } from "@/features/workspace/components/simple-forms";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";

export default async function OnboardingPage({ params }: PageProps<"/[locale]/onboarding">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  await requireUser("/onboarding");
  const t = await getTranslations("Onboarding");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark className="size-12 rounded-xl [&_svg]:size-7" />
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground max-w-md">{t("help")}</p>
      </div>
      <div className="bg-card rounded-xl border p-5 shadow-(--shadow-soft) sm:p-6">
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
