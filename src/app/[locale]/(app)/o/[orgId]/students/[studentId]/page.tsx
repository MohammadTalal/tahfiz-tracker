import { PenLine } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AssignmentList, BackLink, LessonList, Section } from "@/features/workspace/components/display";
import { InvitePanel } from "@/features/workspace/components/invite-panel";
import {
  getLessons,
  getOpenAssignments,
  getOrganizationForStaff,
  getParents,
  getStudent,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

export default async function StudentPage({ params }: PageProps<"/[locale]/o/[orgId]/students/[studentId]">) {
  const { locale, orgId, studentId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(studentId)) notFound();
  const user = await requireUser();
  const [org, student] = await Promise.all([getOrganizationForStaff(orgId, user.id), getStudent(studentId)]);
  if (!org || !student || student.organization_id !== orgId) notFound();

  const [lessons, assignments, parents] = await Promise.all([
    getLessons(studentId, { withPrivateNotes: true }),
    getOpenAssignments(studentId),
    getParents(studentId),
  ]);
  const t = await getTranslations("Student");

  return (
    <>
      <div className="flex flex-col gap-3">
        <BackLink href={`/o/${orgId}`} label={org.name} />
        <h1 className="text-2xl font-bold">{student.display_name}</h1>
        <Link
          href={`/o/${orgId}/students/${studentId}/record`}
          className={buttonVariants({ size: "lg", className: "h-12 text-base sm:self-start" })}
        >
          <PenLine className="size-4" aria-hidden />
          {t("recordLesson")}
        </Link>
      </div>

      <Section title={t("openAssignments")}>
        <AssignmentList assignments={assignments} />
      </Section>

      <Section title={t("history")}>
        <LessonList lessons={lessons} />
      </Section>

      <Section title={t("parents")}>
        {parents.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noParents")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {parents.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span>{p.name}</span>
                <Badge variant="outline">{t(`parent_${p.status}`)}</Badge>
              </li>
            ))}
          </ul>
        )}
        <InvitePanel orgId={orgId} type="parent" studentId={studentId} label={t("inviteParent")} />
      </Section>
    </>
  );
}
