import { ChevronLeft, Database, Download, Network, School, UserCheck, Users, UserX } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClass } from "@/features/workspace/actions";
import { ArchiveStudentButton } from "@/features/workspace/components/class-students";
import { Panel, Section } from "@/features/workspace/components/display";
import { InvitePanel } from "@/features/workspace/components/invite-panel";
import { NameForm } from "@/features/workspace/components/simple-forms";
import { TeacherList } from "@/features/workspace/components/teacher-list";
import {
  getClasses,
  getOrganizationForStaff,
  getOrgUnassignedStudents,
  getTeachers,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { cn } from "@/lib/utils";

export default async function OrganizationPage({ params }: PageProps<"/[locale]/o/[orgId]">) {
  const { locale, orgId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();

  const [classes, teachers, unassigned] = await Promise.all([
    getClasses(orgId, user.id, org.isAdmin),
    org.isAdmin ? getTeachers(orgId) : Promise.resolve([]),
    org.isAdmin ? getOrgUnassignedStudents(orgId) : Promise.resolve([]),
  ]);
  const t = await getTranslations("Org");
  const td = await getTranslations("Dashboard");
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <>
      <PageHeader
        leading={
          <span
            className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-xl"
            aria-hidden
          >
            <School className="size-6" />
          </span>
        }
        title={org.name}
        description={t("summary", { classes: classes.length, students: totalStudents })}
        actions={
          <>
            {org.roles.map((role) => (
              <Badge key={role} variant="mint" className="self-center">
                {td(`role_${role}`)}
              </Badge>
            ))}
            {org.isAdmin && (
              <Link href={`/o/${orgId}/overview`} className={cn(buttonVariants({ variant: "outline" }))}>
                <Network className="size-4" aria-hidden />
                {t("viewOverview")}
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Section title={org.isAdmin ? t("classes") : t("myClasses")}>
            {classes.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("noClasses")}
                description={org.isAdmin ? t("noClassesHint") : t("noClassesTeacherHint")}
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/o/${orgId}/classes/${c.id}`}
                      className="bg-card hover:border-primary/40 group flex h-full items-center gap-3 rounded-xl border p-4 shadow-(--shadow-soft) transition-colors duration-150"
                    >
                      <span
                        className="bg-mint text-primary grid size-10 shrink-0 place-items-center rounded-lg"
                        aria-hidden
                      >
                        <Users className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold">{c.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {t("students", { count: c.studentCount })}
                        </span>
                      </span>
                      {c.taughtByMe && org.isAdmin && (
                        <Badge variant="outline" className="hidden sm:inline-flex">
                          <UserCheck aria-hidden />
                          {t("youTeach")}
                        </Badge>
                      )}
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
          {org.isAdmin && (
            <div className="bg-card rounded-xl border p-4 shadow-(--shadow-soft)">
              <NameForm
                action={createClass.bind(null, orgId)}
                label={t("newClass")}
                submitLabel={t("addClass")}
                successMessage={t("classAdded")}
              />
            </div>
          )}
        </div>

        {org.isAdmin && (
          <aside className="flex flex-col gap-4">
            <Panel title={t("teachers")} icon={UserCheck}>
              <TeacherList orgId={orgId} teachers={teachers} />
              <div className="flex flex-col gap-2 border-t pt-3">
                <p className="text-muted-foreground text-sm">{t("teachersHint")}</p>
                <InvitePanel orgId={orgId} type="teacher" label={t("inviteTeacher")} />
              </div>
            </Panel>
            {unassigned.length > 0 && (
              <Panel title={t("unassignedStudents")} icon={UserX}>
                <p className="text-muted-foreground text-sm">{t("unassignedHint")}</p>
                <ul className="flex flex-col gap-2">
                  {unassigned.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <InitialAvatar name={s.name} size="sm" />
                      <Link
                        href={`/o/${orgId}/students/${s.id}`}
                        className="hover:text-primary flex-1 truncate text-sm font-medium transition-colors duration-150"
                      >
                        {s.name}
                      </Link>
                      <ArchiveStudentButton student={s} />
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            <Panel title={t("data")} icon={Database}>
              <p className="text-muted-foreground text-sm">{t("exportHelp")}</p>
              <a
                href={`/api/orgs/${orgId}/lessons-csv?locale=${locale}`}
                download
                className="text-primary hover:text-primary-strong flex w-fit items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
              >
                <Download className="size-4" aria-hidden />
                {t("exportLessons")}
              </a>
            </Panel>
          </aside>
        )}
      </div>
    </>
  );
}
