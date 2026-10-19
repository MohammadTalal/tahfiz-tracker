import { ChevronLeft, UserPlus, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { enrollStudent } from "@/features/workspace/actions";
import { Panel, Section } from "@/features/workspace/components/display";
import { NameForm } from "@/features/workspace/components/simple-forms";
import { getClassWithRoster, getOrganizationForStaff } from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

export default async function ClassPage({ params }: PageProps<"/[locale]/o/[orgId]/classes/[classId]">) {
  const { locale, orgId, classId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(classId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();
  const cls = await getClassWithRoster(orgId, classId, user.id);
  if (!cls) notFound();

  const t = await getTranslations("Class");
  const to = await getTranslations("Org");
  const canAdd = org.isAdmin || cls.taughtByMe;

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}`, label: org.name }}
        leading={
          <span className="bg-mint text-primary grid size-12 place-items-center rounded-xl" aria-hidden>
            <Users className="size-6" />
          </span>
        }
        title={cls.name}
        description={to("students", { count: cls.students.length })}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={t("roster")}>
            {cls.students.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title={t("noStudents")}
                description={canAdd ? t("noStudentsHint") : undefined}
              />
            ) : (
              <ul className="bg-card flex flex-col divide-y rounded-xl border shadow-(--shadow-soft)">
                {cls.students.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/o/${orgId}/students/${s.id}`}
                      className="hover:bg-surface-tint flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                    >
                      <InitialAvatar name={s.display_name} />
                      <span className="flex-1 truncate font-medium">{s.display_name}</span>
                      <ChevronLeft
                        className="text-subtle-foreground size-4 shrink-0 ltr:rotate-180"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
        {canAdd && (
          <aside>
            <Panel title={t("addStudent")} icon={UserPlus}>
              <NameForm
                action={enrollStudent.bind(null, classId)}
                label={t("studentName")}
                submitLabel={t("add")}
                successMessage={t("studentAdded")}
              />
              <p className="text-muted-foreground text-xs">{t("nameHint")}</p>
            </Panel>
          </aside>
        )}
      </div>
    </>
  );
}
