import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreateOrganizationForm } from "@/features/workspace/components/simple-forms";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";

export default async function OnboardingPage({ params }: PageProps<"/[locale]/onboarding">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  await requireUser("/onboarding");
  const t = await getTranslations("Onboarding");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("help")}</p>
      <CreateOrganizationForm />
    </div>
  );
}
