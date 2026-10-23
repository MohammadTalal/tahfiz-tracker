import { ChevronLeft, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { InitialAvatar } from "@/components/layout/avatar";
import { Link } from "@/i18n/navigation";
import type { StudentProgress } from "../queries";
import { UnenrollStudentButton } from "./class-students";
import { PassageLabel } from "./display";

/**
 * A class at a glance: each student with what they are memorizing now, or
 * else what they memorized last (nothing if neither). `canRecord` adds a
 * one-tap "record lesson" button per row; `canManage` a button to unlink
 * the student.
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
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-xl border shadow-(--shadow-soft)">
      {students.map((s) => {
        const passage = s.memorizing ?? s.lastMemorized;
        return (
          <li key={s.id} className="flex items-center">
            <Link
              href={`/o/${orgId}/students/${s.id}`}
              className="hover:bg-surface-tint flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors duration-150"
            >
              <InitialAvatar name={s.name} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{s.name}</span>
                {passage && (
                  <span className="text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 text-xs">
                    {s.memorizing ? t("memorizingNow") : t("lastMemorized")}
                    <PassageLabel row={passage} className="text-foreground text-sm font-medium" />
                  </span>
                )}
              </span>
              <ChevronLeft
                className="text-subtle-foreground hidden size-4 shrink-0 md:block ltr:rotate-180"
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
        );
      })}
    </ul>
  );
}
