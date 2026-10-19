import { BookMarked, CalendarDays, Hash, PenLine, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { StatStrip } from "@/components/layout/stat-strip";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  AssignmentList,
  DateLabel,
  LessonList,
  Panel,
  PassageLabel,
  Section,
} from "@/features/workspace/components/display";
import { InvitePanel } from "@/features/workspace/components/invite-panel";
import {
  getLessonCount,
  getLessons,
  getOpenAssignments,
  getOrganizationForStaff,
  getParents,
  getStudent,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { cn } from "@/lib/utils";

export default async function StudentPage({ params }: PageProps<"/[locale]/o/[orgId]/students/[studentId]">) {
  const { locale, orgId, studentId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(studentId)) notFound();
  const user = await requireUser();
  const [org, student] = await Promise.all([getOrganizationForStaff(orgId, user.id), getStudent(studentId)]);
  if (!org || !student || student.organization_id !== orgId) notFound();

  const [lessons, lessonCount, assignments, parents] = await Promise.all([
    getLessons(studentId, { withPrivateNotes: true }),
    getLessonCount(studentId),
    getOpenAssignments(studentId),
    getParents(studentId),
  ]);
  const t = await getTranslations("Student");
  const recordHref = `/o/${orgId}/students/${studentId}/record`;
  const currentMemorization = assignments.find((a) => a.assignment_type === "memorization");
  const lastLesson = lessons[0];

  const recordButton = (className?: string) => (
    <Link href={recordHref} className={cn(buttonVariants({ size: "lg" }), className)}>
      <PenLine className="size-4" aria-hidden />
      {t("recordLesson")}
    </Link>
  );

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}`, label: org.name }}
        leading={<InitialAvatar name={student.display_name} size="lg" />}
        title={student.display_name}
        actions={recordButton("hidden sm:inline-flex")}
      />

      <StatStrip
        stats={[
          {
            icon: BookMarked,
            label: t("currentMemorization"),
            value: currentMemorization ? <PassageLabel row={currentMemorization} /> : t("none"),
          },
          {
            icon: CalendarDays,
            label: t("lastLesson"),
            value: lastLesson ? <DateLabel date={lastLesson.lesson_date} /> : t("none"),
          },
          {
            icon: Hash,
            label: t("lessonsCount"),
            value: lessonCount.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en"),
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Section title={t("openAssignments")}>
            <AssignmentList assignments={assignments} canComplete />
          </Section>
          <Section title={t("history")}>
            <LessonList lessons={lessons} />
          </Section>
        </div>
        <aside className="flex flex-col gap-4">
          <Panel title={t("parents")} icon={Users}>
            {parents.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noParents")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {parents.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <InitialAvatar name={p.name} size="sm" />
                    <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                    <Badge variant={p.status === "verified" ? "success" : "outline"}>
                      {t(`parent_${p.status}`)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <InvitePanel orgId={orgId} type="parent" studentId={studentId} label={t("inviteParent")} />
          </Panel>
        </aside>
      </div>

      {/* On phones the main action stays within thumb reach. */}
      <div className="bg-background/95 sticky bottom-0 -mx-4 -mb-6 border-t px-4 py-3 sm:hidden">
        {recordButton("h-12 w-full text-base")}
      </div>
    </>
  );
}
