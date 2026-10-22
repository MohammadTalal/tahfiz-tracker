import { useTranslations } from "next-intl";
import { InitialAvatar } from "@/components/layout/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { TeacherSummary } from "../queries";

/** The organization's teachers and the classes each one teaches (admin view). */
export function TeacherList({ orgId, teachers }: { orgId: string; teachers: TeacherSummary[] }) {
  const t = useTranslations("Org");
  if (teachers.length === 0) return <p className="text-muted-foreground text-sm">{t("noTeachers")}</p>;
  return (
    <ul className="flex flex-col divide-y">
      {teachers.map((teacher) => (
        <li key={teacher.id} className="flex flex-col gap-1.5 py-2.5 first:pt-0">
          <span className="flex items-center gap-2">
            <InitialAvatar name={teacher.name} size="sm" />
            <span className="flex-1 truncate text-sm font-medium">{teacher.name}</span>
            <span className="text-muted-foreground text-xs">
              {t("students", { count: teacher.classes.reduce((sum, c) => sum + c.studentCount, 0) })}
            </span>
          </span>
          <span className="flex flex-wrap gap-1.5 ps-10">
            {teacher.classes.length === 0 ? (
              <Badge variant="warning">{t("notAssigned")}</Badge>
            ) : (
              teacher.classes.map((c) => (
                <Link key={c.id} href={`/o/${orgId}/classes/${c.id}`}>
                  <Badge variant="mint" className="hover:bg-accent transition-colors duration-150">
                    {c.name}
                  </Badge>
                </Link>
              ))
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
