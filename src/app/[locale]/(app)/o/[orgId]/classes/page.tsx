import { ChevronLeft, GraduationCap, TriangleAlert, UserCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { createClass } from "@/features/workspace/actions";
import { DaysLabel } from "@/features/workspace/components/class-days";
import { NameForm } from "@/features/workspace/components/simple-forms";
import { getClasses, getOrganizationForStaff } from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { toneClasses } from "@/lib/tones";

/** All classes (admins) or the user's own (teachers), with students and teachers. */
export default async function ClassesPage({ params }: PageProps<"/[locale]/o/[orgId]/classes">) {
  const { locale, orgId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();

  const classes = await getClasses(orgId, user.id, org.isAdmin);
  const t = await getTranslations("Classes");
  const to = await getTranslations("Org");
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <>
      <PageHeader
        title={org.isAdmin ? t("title") : t("myTitle")}
        description={to("summary", { classes: classes.length, students: totalStudents })}
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={to("noClasses")}
          description={org.isAdmin ? to("noClassesHint") : to("noClassesTeacherHint")}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/o/${orgId}/classes/${c.id}`}
                className="bg-card hover:border-primary/40 group flex h-full flex-col gap-4 rounded-xl border p-4 shadow-(--shadow-soft) transition-colors duration-150"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-lg ${toneClasses(c.id)}`}
                    aria-hidden
                  >
                    <GraduationCap className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">
                      <bdi>{c.name}</bdi>
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {to("students", { count: c.studentCount })}
                    </span>
                    <DaysLabel days={c.meetingDays} className="text-xs" />
                  </span>
                  <ChevronLeft
                    className="text-subtle-foreground group-hover:text-primary size-4 shrink-0 transition-colors ltr:rotate-180"
                    aria-hidden
                  />
                </span>

                <span className="flex flex-col gap-2 border-t pt-3">
                  <span className="text-muted-foreground text-xs">{t("teachers")}</span>
                  {c.teachers.length === 0 ? (
                    <Badge variant="warning" className="w-fit">
                      <TriangleAlert aria-hidden />
                      {t("noTeacher")}
                    </Badge>
                  ) : (
                    <span className="flex flex-wrap gap-2">
                      {c.teachers.map((teacher) => (
                        <span key={teacher.id} className="flex items-center gap-1.5 text-sm">
                          <InitialAvatar name={teacher.name} size="sm" />
                          <span className="truncate">{teacher.name}</span>
                          {teacher.id === user.id && (
                            <Badge variant="outline">
                              <UserCheck aria-hidden />
                              {to("youTeach")}
                            </Badge>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {org.isAdmin && (
        <div className="bg-card max-w-xl rounded-xl border p-4 shadow-(--shadow-soft)">
          <NameForm
            action={createClass.bind(null, orgId)}
            label={to("newClass")}
            submitLabel={to("addClass")}
            successMessage={to("classAdded")}
          />
        </div>
      )}
    </>
  );
}
