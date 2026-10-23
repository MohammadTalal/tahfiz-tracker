import { CalendarDays, GraduationCap, UserPlus, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { addExistingStudent, assignTeacher, enrollStudent } from "@/features/workspace/actions";
import { ClassProgress } from "@/features/workspace/components/class-progress";
import { AddExistingStudentForm } from "@/features/workspace/components/class-students";
import { ClassTeachers } from "@/features/workspace/components/class-teachers";
import { ClassDaysPicker, DaysLabel } from "@/features/workspace/components/class-days";
import { Panel, Section } from "@/features/workspace/components/display";
import { NameForm } from "@/features/workspace/components/simple-forms";
import {
  getClassTeachers,
  getClassWithRoster,
  getOrganizationForStaff,
  getStudentsProgress,
  getTeachers,
  getUnassignedStudents,
} from "@/features/workspace/queries";
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

  // Only admins change who is in a class; teachers record lessons.
  const canAdd = org.isAdmin;
  const [progress, classTeachers, orgTeachers, unassigned] = await Promise.all([
    getStudentsProgress(cls.students),
    getClassTeachers(classId),
    org.isAdmin ? getTeachers(orgId) : Promise.resolve([]),
    canAdd ? getUnassignedStudents(classId) : Promise.resolve([]),
  ]);
  const available = orgTeachers.filter((teacher) => !classTeachers.some((c) => c.id === teacher.id));

  const t = await getTranslations("Class");
  const to = await getTranslations("Org");
  const tn = await getTranslations("OrgNav");

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/classes`, label: tn("classes") }}
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
          <Section title={t("progress")}>
            {cls.students.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title={t("noStudents")}
                description={canAdd ? t("noStudentsHint") : t("noStudentsTeacherHint")}
              />
            ) : (
              <ClassProgress
                orgId={orgId}
                classId={classId}
                students={progress}
                canManage={canAdd}
                canRecord={org.isAdmin || cls.taughtByMe}
              />
            )}
          </Section>
        </div>
        <aside className="flex flex-col gap-4">
          <Panel title={t("days")} icon={CalendarDays}>
            {org.isAdmin ? (
              <ClassDaysPicker classId={classId} days={cls.meeting_days} />
            ) : cls.meeting_days.length > 0 ? (
              <DaysLabel days={cls.meeting_days} />
            ) : (
              <p className="text-muted-foreground text-sm">{t("noDaysTeacher")}</p>
            )}
          </Panel>
          <Panel title={t("teachers")} icon={GraduationCap}>
            <ClassTeachers
              classId={classId}
              assigned={classTeachers}
              available={available}
              canManage={org.isAdmin}
              assignAction={assignTeacher.bind(null, classId)}
            />
          </Panel>
          {canAdd && (
            <Panel title={t("addStudent")} icon={UserPlus}>
              <AddExistingStudentForm action={addExistingStudent.bind(null, classId)} students={unassigned} />
              <div className="flex flex-col gap-1.5 border-t pt-3">
                <h3 className="text-sm font-medium">{t("newStudent")}</h3>
                <NameForm
                  action={enrollStudent.bind(null, classId)}
                  label={t("studentName")}
                  submitLabel={t("add")}
                  successMessage={t("studentAdded")}
                  confirmError="duplicate_student"
                />
                <p className="text-muted-foreground text-xs">{t("nameHint")}</p>
              </div>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
