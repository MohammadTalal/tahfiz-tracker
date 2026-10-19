import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { getWorkspace } from "@/features/workspace/queries";
import { Section } from "@/features/workspace/components/display";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser();
  const { organizations, children } = await getWorkspace(user.id);

  if (organizations.length === 0 && children.length === 0) {
    return redirect({ href: "/onboarding", locale });
  }
  if (organizations.length === 1 && children.length === 0) {
    return redirect({ href: `/o/${organizations[0]!.id}`, locale });
  }

  const t = await getTranslations("Dashboard");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {children.length > 0 && (
        <Section title={t("yourChildren")}>
          <ul className="flex flex-col divide-y rounded-lg border">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/children/${child.id}`}
                  className="hover:bg-muted flex items-center justify-between p-3"
                >
                  <span className="font-medium">{child.display_name}</span>
                  <Chevron className="text-muted-foreground size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {organizations.length > 0 && (
        <Section title={t("yourOrganizations")}>
          <ul className="flex flex-col divide-y rounded-lg border">
            {organizations.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/o/${org.id}`}
                  className="hover:bg-muted flex items-center justify-between gap-2 p-3"
                >
                  <span className="font-medium">{org.name}</span>
                  <span className="flex items-center gap-1">
                    {org.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {t(`role_${role}`)}
                      </Badge>
                    ))}
                    <Chevron className="text-muted-foreground size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Link href="/onboarding" className="text-primary text-sm underline-offset-4 hover:underline">
        {t("createAnother")}
      </Link>
    </>
  );
}
