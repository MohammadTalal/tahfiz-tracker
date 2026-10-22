import { GraduationCap, TriangleAlert, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { PassageLabel } from "@/features/workspace/components/display";
import {
  getOrganizationForStaff,
  getOrganizationTree,
  getStudentsProgress,
  getTeachers,
  type StudentProgress,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

type TreeClass = Awaited<ReturnType<typeof getOrganizationTree>>[number];

/** Admin overview: teachers → their classes → students → parents. */
export default async function OverviewPage({ params }: PageProps<"/[locale]/o/[orgId]/overview">) {
  const { locale, orgId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org?.isAdmin) notFound();

  const [tree, teachers] = await Promise.all([getOrganizationTree(orgId), getTeachers(orgId)]);
  const allStudents = [...new Map(tree.flatMap((c) => c.students).map((s) => [s.id, s])).values()];
  const progress = new Map((await getStudentsProgress(allStudents)).map((p) => [p.id, p]));
  const classesWithoutTeacher = tree.filter((c) => c.teachers.length === 0);

  const t = await getTranslations("Overview");
  const to = await getTranslations("Org");

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}`, label: org.name }}
        title={t("title")}
        description={to("summary", { classes: tree.length, students: allStudents.length })}
      />

      {teachers.length === 0 && tree.length === 0 ? (
        <EmptyState icon={Users} title={t("empty")} description={t("emptyHint")} />
      ) : (
        <div className="flex flex-col gap-4">
          {teachers.map((teacher) => {
            const classes = tree.filter((c) => c.teachers.some((x) => x.id === teacher.id));
            return (
              <section key={teacher.id} className="bg-card rounded-xl border shadow-(--shadow-soft)">
                <header className="flex items-center gap-3 border-b p-4">
                  <InitialAvatar name={teacher.name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{teacher.name}</h2>
                    <p className="text-muted-foreground text-xs">
                      {t("teacher")} ·{" "}
                      {to("students", { count: classes.reduce((sum, c) => sum + c.students.length, 0) })}
                    </p>
                  </div>
                  {classes.length === 0 && <Badge variant="warning">{to("notAssigned")}</Badge>}
                </header>
                {classes.length > 0 && (
                  <div className="flex flex-col gap-4 p-4">
                    {classes.map((c) => (
                      <ClassBranch key={c.id} orgId={orgId} cls={c} progress={progress} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {classesWithoutTeacher.length > 0 && (
            <section className="bg-warning-soft/60 rounded-xl border border-dashed p-4">
              <h2 className="text-warning mb-3 flex items-center gap-2 font-semibold">
                <TriangleAlert className="size-4" aria-hidden />
                {t("noTeacherClasses")}
              </h2>
              <div className="flex flex-col gap-4">
                {classesWithoutTeacher.map((c) => (
                  <ClassBranch key={c.id} orgId={orgId} cls={c} progress={progress} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function ClassBranch({
  orgId,
  cls,
  progress,
}: {
  orgId: string;
  cls: TreeClass;
  progress: Map<string, StudentProgress>;
}) {
  const to = useTranslations("Org");
  const t = useTranslations("Overview");
  return (
    <div>
      <Link
        href={`/o/${orgId}/classes/${cls.id}`}
        className="hover:text-primary flex w-fit items-center gap-2 font-medium transition-colors duration-150"
      >
        <span className="bg-mint text-primary grid size-7 place-items-center rounded-md" aria-hidden>
          <GraduationCap className="size-4" />
        </span>
        {cls.name}
        <span className="text-muted-foreground text-xs font-normal">
          {to("students", { count: cls.students.length })}
        </span>
      </Link>
      {cls.students.length > 0 && (
        <ul className="ms-3.5 mt-2 flex flex-col gap-2 border-s-2 ps-4">
          {cls.students.map((s) => {
            const p = progress.get(s.id);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                  href={`/o/${orgId}/students/${s.id}`}
                  className="hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors duration-150"
                >
                  <InitialAvatar name={s.display_name} size="sm" />
                  {s.display_name}
                </Link>
                {p?.memorizing && (
                  <span className="text-muted-foreground text-xs">
                    <PassageLabel row={p.memorizing} />
                  </span>
                )}
                <span className="flex flex-wrap gap-1">
                  {p && p.parents.length > 0 ? (
                    p.parents.map((parent, i) => (
                      <Badge key={i} variant={parent.status === "verified" ? "success" : "outline"}>
                        <Users aria-hidden />
                        {parent.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{t("noParent")}</Badge>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
