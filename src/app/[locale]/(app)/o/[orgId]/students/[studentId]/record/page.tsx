import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { RecordLessonForm } from "@/features/workspace/components/record-lesson-form";
import {
  getLessons,
  getOpenAssignments,
  getOrganizationForStaff,
  getStudent,
} from "@/features/workspace/queries";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { passageFromRow } from "@/lib/quran/format";
import { suggestNext } from "@/lib/quran/passage";

export default async function RecordLessonPage({
  params,
}: PageProps<"/[locale]/o/[orgId]/students/[studentId]/record">) {
  const { locale, orgId, studentId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(studentId)) notFound();
  const user = await requireUser();
  const [org, student] = await Promise.all([getOrganizationForStaff(orgId, user.id), getStudent(studentId)]);
  if (!org || !student || student.organization_id !== orgId) notFound();

  // Pre-fill: the current memorization assignment, else the passage after the last lesson.
  const [assignments, lessons] = await Promise.all([
    getOpenAssignments(studentId),
    getLessons(studentId, { withPrivateNotes: false }),
  ]);
  const assignment = assignments.find((a) => a.assignment_type === "memorization");
  const lastLesson = lessons[0];
  const suggestion = lastLesson ? suggestNext(passageFromRow(lastLesson)) : undefined;
  const defaultPassage = assignment ? passageFromRow(assignment) : (suggestion ?? null);
  const defaultSource = assignment ? "assignment" : suggestion ? "suggestion" : null;

  const t = await getTranslations("Lesson");
  const studentHref = `/o/${orgId}/students/${studentId}`;

  return (
    // Forms read best at a moderate width, even on large screens.
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        back={{ href: studentHref, label: student.display_name }}
        leading={<InitialAvatar name={student.display_name} />}
        title={t("title", { name: student.display_name })}
        description={t("subtitle")}
      />
      {/* A new key after each saved lesson guarantees a fresh form (and idempotency key). */}
      <RecordLessonForm
        key={lastLesson?.id ?? "first"}
        studentId={studentId}
        studentHref={studentHref}
        defaultPassage={defaultPassage}
        defaultSource={defaultSource}
        assignmentId={assignment?.id ?? null}
      />
    </div>
  );
}
