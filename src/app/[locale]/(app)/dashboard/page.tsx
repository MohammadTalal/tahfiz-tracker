import { ChevronLeft, Plus, School } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/features/workspace/components/display";
import { NewsFeed } from "@/features/workspace/components/news";
import { getNews, getProfileName, getWorkspace } from "@/features/workspace/queries";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";

const rowClass =
  "bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-4 shadow-(--shadow-soft) transition-colors duration-150";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser();
  const [{ organizations, children }, name] = await Promise.all([
    getWorkspace(user.id),
    getProfileName(user.id),
  ]);

  if (organizations.length === 0 && children.length === 0) {
    // Invited at sign-up but not joined yet (e.g. the email was confirmed on
    // another device): finish joining instead of creating a new circle.
    if (user.pendingInvite) return redirect({ href: `/invite/${user.pendingInvite}`, locale });
    return redirect({ href: "/onboarding", locale });
  }
  if (organizations.length === 1 && children.length === 0) {
    return redirect({ href: `/o/${organizations[0]!.id}`, locale });
  }

  const t = await getTranslations("Dashboard");
  // Parents see the news of their children's organizations.
  const childOrgIds = [...new Set(children.map((c) => c.organization_id))];
  const news = await getNews(childOrgIds);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title={name ? t("greeting", { name }) : t("title")} description={t("subtitle")} />
      {childOrgIds.length > 0 && <NewsFeed posts={news} showOrganization={childOrgIds.length > 1} />}
      {children.length > 0 && (
        <Section title={t("yourChildren")}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link href={`/children/${child.id}`} className={rowClass}>
                  <InitialAvatar name={child.display_name} />
                  <span className="flex-1 truncate font-semibold">{child.display_name}</span>
                  <ChevronLeft className="text-subtle-foreground size-4 ltr:rotate-180" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {organizations.length > 0 && (
        <Section title={t("yourOrganizations")}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {organizations.map((org) => (
              <li key={org.id}>
                <Link href={`/o/${org.id}`} className={rowClass}>
                  <span
                    className="bg-mint text-primary grid size-10 shrink-0 place-items-center rounded-lg"
                    aria-hidden
                  >
                    <School className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-semibold">{org.name}</span>
                    <span className="flex gap-1">
                      {org.roles.map((role) => (
                        <Badge key={role} variant="mint">
                          {t(`role_${role}`)}
                        </Badge>
                      ))}
                    </span>
                  </span>
                  <ChevronLeft className="text-subtle-foreground size-4 ltr:rotate-180" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Link
        href="/onboarding"
        className="text-primary hover:text-primary-strong flex w-fit items-center gap-1.5 text-sm font-medium"
      >
        <Plus className="size-4" aria-hidden />
        {t("createAnother")}
      </Link>
    </div>
  );
}
