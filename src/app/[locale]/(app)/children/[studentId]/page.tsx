import { BookMarked, CalendarDays, Hash } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { StatStrip } from "@/components/layout/stat-strip";
import {
  AssignmentList,
  DateLabel,
  LessonList,
  PassageLabel,
  Section,
} from "@/features/workspace/components/display";
import {
  getLessonCount,
  getLessons,
  getOpenAssignments,
  getStudent,
  getWorkspace,
} from "@/features/workspace/queries";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

// Parent view. Shows only what parents may see; RLS enforces it regardless.
export default async function ChildPage({ params }: PageProps<"/[locale]/children/[studentId]">) {
  const { locale, studentId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(studentId)) notFound();
  const user = await requireUser();
  const [workspace, student] = await Promise.all([getWorkspace(user.id), getStudent(studentId)]);
  if (!student || !workspace.children.some((c) => c.id === studentId)) notFound();

  const [lessons, lessonCount, assignments] = await Promise.all([
    getLessons(studentId, { withPrivateNotes: false }),
    getLessonCount(studentId),
    getOpenAssignments(studentId),
  ]);
  const t = await getTranslations("Parent");
  const ts = await getTranslations("Student");
  const tn = await getTranslations("Nav");
  const memorization = assignments.find((a) => a.assignment_type === "memorization");
  const lastLesson = lessons[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        back={{ href: "/dashboard", label: tn("home") }}
        leading={<InitialAvatar name={student.display_name} size="lg" />}
        title={student.display_name}
        description={t("subtitle")}
      />

      {memorization && (
        <section className="bg-primary text-primary-foreground relative overflow-hidden rounded-xl p-5 shadow-(--shadow-soft)">
          <div className="bg-geometric pointer-events-none absolute inset-0 opacity-30" aria-hidden />
          <div className="relative flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/15" aria-hidden>
              <BookMarked className="size-5" />
            </span>
            <div>
              <p className="text-sm text-white/80">{t("nowMemorizing")}</p>
              <p className="text-xl font-bold">
                <PassageLabel row={memorization} />
              </p>
            </div>
          </div>
        </section>
      )}

      <StatStrip
        stats={[
          {
            icon: CalendarDays,
            label: ts("lastLesson"),
            value: lastLesson ? <DateLabel date={lastLesson.lesson_date} /> : ts("none"),
          },
          {
            icon: Hash,
            label: ts("lessonsCount"),
            value: lessonCount.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en"),
          },
        ]}
      />

      <Section title={t("nextUp")}>
        <AssignmentList assignments={assignments} />
      </Section>
      <Section title={t("recentLessons")}>
        <LessonList lessons={lessons} />
      </Section>
    </div>
  );
}
