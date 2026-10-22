import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { InitialAvatar } from "@/components/layout/avatar";
import { RecordLessonForm } from "@/features/workspace/components/record-lesson-form";
import {
  getLessons,
  getOpenAssignments,
  getOrganizationForStaff,
  getStudent,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
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
    // Compact so the whole form fits one phone screen; moderate width on desktop.
    <div className="mx-auto -mt-2 flex w-full max-w-xl flex-col gap-3 sm:mt-0">
      <div className="flex items-center gap-3">
        <Link
          href={studentHref}
          aria-label={t("back")}
          title={t("back")}
          className="hover:bg-surface-tint text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full border transition-colors duration-150"
        >
          <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
        </Link>
        <InitialAvatar name={student.display_name} size="sm" />
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{t("heading")}</p>
          <h1 dir="auto" className="truncate text-lg leading-tight font-bold">
            {student.display_name}
          </h1>
        </div>
      </div>
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
