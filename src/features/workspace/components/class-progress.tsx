import { cn } from "cn";
import { ChevronLeft, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { InitialAvatar } from "@/components/layout/avatar";
import { Link } from "@/i18n/navigation";
import type { StudentProgress } from "../queries";
import { UnenrollStudentButton } from "./class-students";
import { JuzProgress, PassageLabel, RatingBadge } from "./display";

/**
 * A class at a glance: each student's progress through their current juz,
 * what they are memorizing now, and their last rating. A table on wide
 * screens, stacked rows on phones. `canRecord` adds a one-tap "record
 * lesson" button per row; `canManage` a button to unlink the student.
 */
export function ClassProgress({
  orgId,
  classId,
  students,
  canManage,
  canRecord,
}: {
  orgId: string;
  classId: string;
  students: StudentProgress[];
  canManage: boolean;
  canRecord: boolean;
}) {
  const t = useTranslations("Class");
  // The "memorizing now" column only appears when some student has one.
  const showMemorizing = students.some((s) => s.memorizing);
  const columns = showMemorizing
    ? "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_8rem_1rem]"
    : "md:grid-cols-[minmax(0,1.4fr)_8rem_1rem]";
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-(--shadow-soft)">
      <div
        className={cn(
          "text-muted-foreground bg-surface-tint hidden gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid",
          columns,
          canRecord ? (canManage ? "pe-26" : "pe-16") : canManage && "pe-14",
        )}
      >
        <span>{t("student")}</span>
        {showMemorizing && <span>{t("memorizingNow")}</span>}
        <span>{t("lastRating")}</span>
        <span />
      </div>
      <ul className="divide-y">
        {students.map((s) => (
          <li key={s.id} className="flex items-center">
            <Link
              href={`/o/${orgId}/students/${s.id}`}
              className={cn(
                "hover:bg-surface-tint grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150",
                columns,
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <InitialAvatar name={s.name} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium">{s.name}</span>
                  {s.juz && <JuzProgress juz={s.juz} className="max-w-48" />}
                </span>
              </span>

              {s.memorizing ? (
                <span className="col-span-2 row-start-2 flex flex-col text-sm md:col-span-1 md:row-start-auto">
                  <span className="text-muted-foreground text-xs md:hidden">{t("memorizingNow")}</span>
                  <PassageLabel row={s.memorizing} className="font-medium" />
                </span>
              ) : (
                // Keeps the desktop columns aligned; nothing on phones.
                showMemorizing && <span className="hidden md:block" />
              )}

              {/* Last rating only; dates and parents are on the student's page. */}
              <span className="col-start-2 row-start-1 justify-self-end text-sm md:col-start-auto md:row-start-auto md:justify-self-start">
                {s.lastLesson ? (
                  <RatingBadge rating={s.lastLesson.performance_rating} />
                ) : (
                  <span className="text-subtle-foreground text-xs">{t("noLessonsYet")}</span>
                )}
              </span>

              <ChevronLeft
                className="text-subtle-foreground hidden size-4 justify-self-end md:block ltr:rotate-180"
                aria-hidden
              />
            </Link>
            {(canRecord || canManage) && (
              <span className="me-2 flex shrink-0 items-center gap-1">
                {canRecord && (
                  <Link
                    href={`/o/${orgId}/students/${s.id}/record`}
                    aria-label={t("recordFor", { name: s.name })}
                    title={t("recordFor", { name: s.name })}
                    className="bg-primary text-primary-foreground hover:bg-primary-strong grid size-10 place-items-center rounded-full transition-colors duration-150"
                  >
                    <PenLine className="size-4" aria-hidden />
                  </Link>
                )}
                {canManage && <UnenrollStudentButton classId={classId} student={s} />}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
