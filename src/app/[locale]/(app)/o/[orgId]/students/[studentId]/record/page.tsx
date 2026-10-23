import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { InitialAvatar } from "@/components/layout/avatar";
import { RecordLessonForm } from "@/features/workspace/components/record-lesson-form";
import {
  getLessons,
  getOpenAssignments,
  getOrganizationForStaff,
  getClassWithRoster,
  getStudent,
  getStudentClassId,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { ayahCount } from "@/lib/quran/ayah-counts";
import { passageFromRow } from "@/lib/quran/format";
import { type Passage, suggestNext } from "@/lib/quran/passage";

export default async function RecordLessonPage({
  params,
}: PageProps<"/[locale]/o/[orgId]/students/[studentId]/record">) {
  const { locale, orgId, studentId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(studentId)) notFound();
  const user = await requireUser();
  const [org, student] = await Promise.all([getOrganizationForStaff(orgId, user.id), getStudent(studentId)]);
  if (!org || !student || student.organization_id !== orgId || student.status !== "active") notFound();

  // Pre-fill: the current memorization assignment, else the passage after the last lesson.
  const [assignments, lessons, classId] = await Promise.all([
    getOpenAssignments(studentId),
    getLessons(studentId, { withPrivateNotes: false }),
    getStudentClassId(studentId),
  ]);
  const assignment = assignments.find((a) => a.assignment_type === "memorization");
  const lastLesson = lessons[0];
  const suggestion = lastLesson ? suggestNext(passageFromRow(lastLesson)) : undefined;
  const defaultPassage = assignment ? withinOneSurah(passageFromRow(assignment)) : (suggestion ?? null);
  const defaultSource = assignment ? "assignment" : suggestion ? "suggestion" : null;

  const t = await getTranslations("Lesson");
  const studentHref = `/o/${orgId}/students/${studentId}`;

  // "Save & next": the next student (by name) in the same class, so a teacher
  // can go through the whole class without leaving this screen.
  const cls = classId ? await getClassWithRoster(orgId, classId, user.id) : null;
  const roster = cls?.students ?? [];
  const position = roster.findIndex((s) => s.id === studentId);
  const nextStudent = position >= 0 ? roster[position + 1] : undefined;
  const next = nextStudent
    ? { href: `/o/${orgId}/students/${nextStudent.id}/record`, name: nextStudent.display_name }
    : null;
  const fmt = (n: number) => n.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en");

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
          <p className="text-muted-foreground truncate text-xs">
            {cls && position >= 0
              ? t("positionInClass", { className: cls.name, n: fmt(position + 1), total: fmt(roster.length) })
              : t("heading")}
          </p>
          <h1 dir="auto" className="truncate text-lg leading-tight font-bold">
            {student.display_name}
          </h1>
        </div>
      </div>
      {/* A new key after each saved lesson guarantees a fresh form (and idempotency key). */}
      <RecordLessonForm
        key={`${studentId}:${lastLesson?.id ?? "first"}`}
        studentId={studentId}
        studentHref={studentHref}
        defaultPassage={defaultPassage}
        defaultSource={defaultSource}
        assignmentId={assignment?.id ?? null}
        next={next}
      />
    </div>
  );
}

/**
 * The lesson form records one surah at a time. Older assignments may run into
 * the next surah; pre-fill only their first surah, to its last ayah.
 */
function withinOneSurah(p: Passage): Passage {
  if (p.startSurah === p.endSurah) return p;
  return { ...p, endSurah: p.startSurah, endAyah: ayahCount(p.startSurah) ?? p.startAyah };
}
