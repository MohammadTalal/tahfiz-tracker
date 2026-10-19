import { ChevronLeft, Lock } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { ayahCount } from "@/lib/quran/ayah-counts";
import { formatPassage, passageFromRow, type QuranLocale } from "@/lib/quran/format";
import type { Database } from "@/types/database";
import { CompleteAssignmentButton } from "./complete-assignment-button";

type Rating = Database["public"]["Enums"]["performance_rating"];
type PassageRow = { start_surah: number; start_ayah: number; end_surah: number; end_ayah: number };

export function PassageLabel({ row }: { row: PassageRow }) {
  const locale = useLocale() as QuranLocale;
  return <span>{formatPassage(passageFromRow(row), locale, ayahCount)}</span>;
}

/** Parses a "YYYY-MM-DD" date as UTC midnight, so formatting never shifts the day. */
function dayAsUtc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

/** Date style for lesson days; Arabic uses Arabic-Indic digits like ayah numbers. */
function dayFormat(locale: string) {
  return {
    dateStyle: "medium",
    timeZone: "UTC",
    numberingSystem: locale === "ar" ? "arab" : "latn",
  } as const;
}

/** Formats a "YYYY-MM-DD" date without shifting it across time zones. */
export function DateLabel({ date }: { date: string }) {
  const format = useFormatter();
  const locale = useLocale();
  return <time dateTime={date}>{format.dateTime(dayAsUtc(date), dayFormat(locale))}</time>;
}

export function RatingBadge({ rating }: { rating: Rating }) {
  const t = useTranslations("Rating");
  const variant =
    rating === "excellent" || rating === "very_good"
      ? "default"
      : rating === "good"
        ? "secondary"
        : "destructive";
  return <Badge variant={variant}>{t(rating)}</Badge>;
}

export type LessonItem = PassageRow & {
  id: string;
  lesson_date: string;
  performance_rating: Rating;
  mistake_categories: string[] | null;
  parent_visible_feedback: string | null;
  privateNote: string | null;
};

export function LessonList({ lessons }: { lessons: LessonItem[] }) {
  const t = useTranslations("Student");
  const tm = useTranslations("Mistake");
  if (lessons.length === 0) return <p className="text-muted-foreground text-sm">{t("noLessons")}</p>;
  return (
    <ol className="flex flex-col divide-y rounded-lg border">
      {lessons.map((lesson) => (
        <li key={lesson.id} className="flex flex-col gap-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">
              <PassageLabel row={lesson} />
            </span>
            <RatingBadge rating={lesson.performance_rating} />
          </div>
          <div className="text-muted-foreground text-sm">
            <DateLabel date={lesson.lesson_date} />
          </div>
          {lesson.mistake_categories && lesson.mistake_categories.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {lesson.mistake_categories.map((m) => (
                <li key={m}>
                  <Badge variant="outline">{tm(m)}</Badge>
                </li>
              ))}
            </ul>
          )}
          {lesson.parent_visible_feedback && <p className="text-sm">{lesson.parent_visible_feedback}</p>}
          {lesson.privateNote && (
            <p className="bg-muted flex items-start gap-2 rounded-md p-2 text-sm">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-label={t("privateNote")} />
              <span>{lesson.privateNote}</span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export type AssignmentItem = PassageRow & {
  id: string;
  assignment_type: Database["public"]["Enums"]["assignment_type"];
  status: Database["public"]["Enums"]["assignment_status"];
  due_date: string | null;
};

/** Open assignments. `canComplete` (staff only) adds a "done" button to each. */
export function AssignmentList({
  assignments,
  canComplete = false,
}: {
  assignments: AssignmentItem[];
  canComplete?: boolean;
}) {
  const t = useTranslations("Student");
  const format = useFormatter();
  const locale = useLocale();
  if (assignments.length === 0) return <p className="text-muted-foreground text-sm">{t("noAssignments")}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <Badge variant={a.assignment_type === "memorization" ? "default" : "secondary"}>
            {t(`assignment_${a.assignment_type}`)}
          </Badge>
          <span className="font-medium">
            <PassageLabel row={a} />
          </span>
          {a.status !== "assigned" && <Badge variant="outline">{t(`status_${a.status}`)}</Badge>}
          <span className="ms-auto flex items-center gap-3">
            {a.due_date && (
              <span className="text-muted-foreground text-sm">
                {t("due", {
                  date: format.dateTime(dayAsUtc(a.due_date), dayFormat(locale)),
                })}
              </span>
            )}
            {canComplete && <CompleteAssignmentButton assignmentId={a.id} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 self-start text-sm"
    >
      <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
      {label}
    </Link>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
