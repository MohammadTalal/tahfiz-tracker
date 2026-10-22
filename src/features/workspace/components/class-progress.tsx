import { ChevronLeft, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { InitialAvatar } from "@/components/layout/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { StudentProgress } from "../queries";
import { DateLabel, PassageLabel, RatingBadge } from "./display";

/**
 * A class at a glance: each student's current memorization, last lesson and
 * linked parents. A table on wide screens, stacked rows on phones.
 */
export function ClassProgress({ orgId, students }: { orgId: string; students: StudentProgress[] }) {
  const t = useTranslations("Class");
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-(--shadow-soft)">
      <div className="text-muted-foreground bg-surface-tint hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_1rem] gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid">
        <span>{t("student")}</span>
        <span>{t("memorizingNow")}</span>
        <span>{t("lastLesson")}</span>
        <span>{t("parents")}</span>
        <span />
      </div>
      <ul className="divide-y">
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/o/${orgId}/students/${s.id}`}
              className="hover:bg-surface-tint grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_1rem]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <InitialAvatar name={s.name} size="sm" />
                <span className="truncate font-medium">{s.name}</span>
              </span>

              <span className="col-span-2 row-start-2 flex flex-col text-sm md:col-span-1 md:row-start-auto">
                <span className="text-muted-foreground text-xs md:hidden">{t("memorizingNow")}</span>
                {s.memorizing ? (
                  <PassageLabel row={s.memorizing} className="font-medium" />
                ) : (
                  <span className="text-subtle-foreground">{t("none")}</span>
                )}
              </span>

              <span className="col-span-2 flex flex-wrap items-center gap-2 text-sm md:col-span-1">
                <span className="text-muted-foreground text-xs md:hidden">{t("lastLesson")}</span>
                {s.lastLesson ? (
                  <>
                    <span className="text-muted-foreground text-xs">
                      <DateLabel date={s.lastLesson.lesson_date} />
                    </span>
                    <RatingBadge rating={s.lastLesson.performance_rating} />
                  </>
                ) : (
                  <span className="text-subtle-foreground">{t("noLessonsYet")}</span>
                )}
              </span>

              <span className="col-span-2 flex min-w-0 flex-wrap items-center gap-1.5 text-sm md:col-span-1">
                <span className="text-muted-foreground text-xs md:hidden">{t("parents")}</span>
                {s.parents.length === 0 ? (
                  <Badge variant="outline">{t("notLinked")}</Badge>
                ) : (
                  s.parents.map((p, i) => (
                    <Badge
                      key={i}
                      variant={p.status === "verified" ? "success" : "outline"}
                      className="max-w-full"
                    >
                      <Users aria-hidden />
                      <span className="truncate">{p.name}</span>
                    </Badge>
                  ))
                )}
              </span>

              <ChevronLeft
                className="text-subtle-foreground col-start-2 row-start-1 size-4 justify-self-end md:col-start-auto md:row-start-auto ltr:rotate-180"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
