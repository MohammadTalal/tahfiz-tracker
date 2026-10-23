import {
  BookMarked,
  BookOpen,
  ListChecks,
  Lock,
  MessageSquareQuote,
  Repeat2,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { ayahCount } from "@/lib/quran/ayah-counts";
import { formatPassage, passageFromRow, type QuranLocale } from "@/lib/quran/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import { CompleteAssignmentButton } from "./complete-assignment-button";
import { RATING_STYLE } from "./rating-style";

type Rating = Database["public"]["Enums"]["performance_rating"];
type PassageRow = { start_surah: number; start_ayah: number; end_surah: number; end_ayah: number };

/** A Quran reference ("الملك ١–٥"). Arabic uses the Naskh Quran face, slightly larger. */
export function PassageLabel({ row, className }: { row: PassageRow; className?: string }) {
  const locale = useLocale() as QuranLocale;
  return (
    <span className={cn(locale === "ar" && "font-quran text-[1.15em] leading-snug", className)}>
      {formatPassage(passageFromRow(row), locale, ayahCount)}
    </span>
  );
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
  const { icon: Icon, badge } = RATING_STYLE[rating];
  return (
    <Badge variant={badge}>
      <Icon aria-hidden />
      {t(rating)}
    </Badge>
  );
}

export type LessonItem = PassageRow & {
  id: string;
  lesson_date: string;
  performance_rating: Rating;
  mistake_categories: string[] | null;
  parent_visible_feedback: string | null;
  privateNote: string | null;
};

/** Lesson history as a vertical timeline, newest first. */
export function LessonList({ lessons, emptyAction }: { lessons: LessonItem[]; emptyAction?: ReactNode }) {
  const t = useTranslations("Student");
  const tm = useTranslations("Mistake");
  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("noLessons")}
        description={t("noLessonsHint")}
        action={emptyAction}
      />
    );
  }
  return (
    <ol className="border-border relative ms-2 flex flex-col gap-3 border-s-2 ps-5">
      {lessons.map((lesson) => (
        <li key={lesson.id} className="relative">
          <span
            aria-hidden
            className={cn(
              "ring-background absolute -start-[1.6rem] top-4 size-3 rounded-full ring-4",
              RATING_STYLE[lesson.performance_rating].dot,
            )}
          />
          <article className="bg-card flex flex-col gap-2.5 rounded-xl border p-4 shadow-(--shadow-soft)">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col">
                <PassageLabel row={lesson} className="font-semibold" />
                <span className="text-muted-foreground text-xs">
                  <DateLabel date={lesson.lesson_date} />
                </span>
              </div>
              <RatingBadge rating={lesson.performance_rating} />
            </div>
            {lesson.mistake_categories && lesson.mistake_categories.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label={t("mistakes")}>
                {lesson.mistake_categories.map((m) => (
                  <li key={m}>
                    <Badge variant="outline">{tm(m)}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {lesson.parent_visible_feedback && (
              <p className="bg-gold-soft text-foreground flex items-start gap-2 rounded-lg p-2.5 text-sm">
                <MessageSquareQuote className="text-gold-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                <span dir="auto">{lesson.parent_visible_feedback}</span>
              </p>
            )}
            {lesson.privateNote && (
              <p className="bg-muted flex items-start gap-2 rounded-lg p-2.5 text-sm">
                <Lock
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-label={t("privateNote")}
                />
                <span dir="auto">{lesson.privateNote}</span>
              </p>
            )}
          </article>
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
  if (assignments.length === 0) {
    return <EmptyState icon={ListChecks} title={t("noAssignments")} description={t("noAssignmentsHint")} />;
  }
  return (
    <ul className="bg-card flex flex-col divide-y rounded-xl border shadow-(--shadow-soft)">
      {assignments.map((a) => {
        const memorize = a.assignment_type === "memorization";
        const Icon = memorize ? BookMarked : Repeat2;
        return (
          <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg",
                memorize ? "bg-mint text-primary" : "bg-gold-soft text-gold-foreground",
              )}
              aria-hidden
            >
              <Icon className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-muted-foreground text-xs">{t(`assignment_${a.assignment_type}`)}</span>
              <PassageLabel row={a} className="font-semibold" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {a.status !== "assigned" && <Badge variant="outline">{t(`status_${a.status}`)}</Badge>}
              {a.due_date && (
                <span className="text-muted-foreground text-xs">
                  {t("due", { date: format.dateTime(dayAsUtc(a.due_date), dayFormat(locale)) })}
                </span>
              )}
              {canComplete && <CompleteAssignmentButton assignmentId={a.id} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A plain white panel for side content (no nested cards inside). */
export function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-(--shadow-soft)">
      <h2 className="flex items-center gap-2 font-semibold">
        {Icon && <Icon className="text-primary size-4.5" aria-hidden />}
        {title}
      </h2>
      {children}
    </section>
  );
}

/** "Juz 30 · 45%" with a thin bar: progress through the juz being memorized now. */
export function JuzProgress({
  juz,
  size = "sm",
  className,
}: {
  juz: { number: number; percent: number };
  size?: "sm" | "lg";
  className?: string;
}) {
  const t = useTranslations("Juz");
  const locale = useLocale();
  const numbering = locale === "ar" ? "ar-u-nu-arab" : "en";
  const number = new Intl.NumberFormat(numbering).format(juz.number);
  const percent = new Intl.NumberFormat(numbering, { style: "percent" }).format(juz.percent / 100);
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className={cn("flex items-baseline justify-between gap-2", size === "lg" ? "text-sm" : "text-xs")}>
        <span className={size === "lg" ? "font-medium" : "text-muted-foreground"}>
          {t("label", { juz: number })}
        </span>
        <span className={cn("font-semibold tabular-nums", size === "lg" && "text-primary text-lg")}>
          {percent}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={juz.percent}
        aria-label={t("label", { juz: number })}
        className={cn("bg-muted overflow-hidden rounded-full", size === "lg" ? "h-2.5" : "h-1.5")}
      >
        <div className="bg-primary h-full rounded-full" style={{ width: `${juz.percent}%` }} />
      </div>
    </div>
  );
}
