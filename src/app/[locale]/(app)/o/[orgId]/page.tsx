import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClass } from "@/features/workspace/actions";
import { Section } from "@/features/workspace/components/display";
import { InvitePanel } from "@/features/workspace/components/invite-panel";
import { NameForm } from "@/features/workspace/components/simple-forms";
import { getClasses, getOrganizationForStaff } from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

export default async function OrganizationPage({ params }: PageProps<"/[locale]/o/[orgId]">) {
  const { locale, orgId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();

  const classes = await getClasses(orgId, user.id, org.isAdmin);
  const t = await getTranslations("Org");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <>
      <h1 className="text-2xl font-bold">{org.name}</h1>

      <Section title={org.isAdmin ? t("classes") : t("myClasses")}>
        {classes.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noClasses")}</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {classes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/o/${orgId}/classes/${c.id}`}
                  className="hover:bg-muted flex items-center justify-between gap-2 p-3"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    {t("students", { count: c.studentCount })}
                    <Chevron className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {org.isAdmin && (
          <NameForm
            action={createClass.bind(null, orgId)}
            label={t("newClass")}
            submitLabel={t("addClass")}
          />
        )}
      </Section>

      {org.isAdmin && (
        <Section title={t("teachers")}>
          <InvitePanel orgId={orgId} type="teacher" label={t("inviteTeacher")} />
        </Section>
      )}
    </>
  );
}
