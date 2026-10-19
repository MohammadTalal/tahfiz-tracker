import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AssignmentList, BackLink, LessonList, Section } from "@/features/workspace/components/display";
import { getLessons, getOpenAssignments, getStudent, getWorkspace } from "@/features/workspace/queries";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

// Parent view. Shows only what parents may see; RLS enforces it regardless.
export default async function ChildPage({ params }: PageProps<"/[locale]/children/[studentId]">) {
  const { locale, studentId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(studentId)) notFound();
  const user = await requireUser();
  const [workspace, student] = await Promise.all([getWorkspace(user.id), getStudent(studentId)]);
  if (!student || !workspace.children.some((c) => c.id === studentId)) notFound();

  const [lessons, assignments] = await Promise.all([
    getLessons(studentId, { withPrivateNotes: false }),
    getOpenAssignments(studentId),
  ]);
  const t = await getTranslations("Parent");
  const tn = await getTranslations("Nav");

  return (
    <>
      <div className="flex flex-col gap-1">
        <BackLink href="/dashboard" label={tn("home")} />
        <h1 className="text-2xl font-bold">{student.display_name}</h1>
      </div>
      <Section title={t("nextUp")}>
        <AssignmentList assignments={assignments} />
      </Section>
      <Section title={t("recentLessons")}>
        <LessonList lessons={lessons} />
      </Section>
    </>
  );
}
