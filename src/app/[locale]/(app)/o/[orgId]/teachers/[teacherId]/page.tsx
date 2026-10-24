import { GraduationCap, ShieldCheck, ShieldOff, UserMinus, Users, X } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  assignClassToTeacher,
  assignStudentToTeacher,
  removeMember,
  removeTeacher,
  setMemberAdmin,
  unassignStudentFromTeacher,
} from "@/features/workspace/actions";
import { Panel } from "@/features/workspace/components/display";
import { PhoneLink } from "@/features/workspace/components/phone-link";
import { ConfirmActionButton, PickAddForm } from "@/features/workspace/components/teacher-manage";
import {
  getClasses,
  getMemberDetail,
  getOrganizationForStaff,
  getStudentDirectory,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { toneClasses } from "@/lib/tones";

/** Admin view of one teacher: their classes, directly assigned students, admin role, removal. */
export default async function TeacherPage({ params }: PageProps<"/[locale]/o/[orgId]/teachers/[teacherId]">) {
  const { locale, orgId, teacherId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(teacherId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org?.isAdmin) notFound();

  const [member, classes, students] = await Promise.all([
    getMemberDetail(orgId, teacherId),
    getClasses(orgId, user.id, true),
    getStudentDirectory(orgId),
  ]);
  if (!member) notFound();

  const t = await getTranslations("Teacher");
  const tn = await getTranslations("OrgNav");
  const isSelf = teacherId === user.id;
  const otherClasses = classes.filter((c) => !member.classes.some((m) => m.id === c.id));
  const otherStudents = students.filter((s) => !member.students.some((m) => m.id === s.id));

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/teachers`, label: tn("teachers") }}
        leading={<InitialAvatar name={member.name} size="lg" />}
        title={member.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {member.isAdmin && <Badge variant="mint">{t("roleAdmin")}</Badge>}
            {member.isTeacher && <Badge variant="outline">{t("roleTeacher")}</Badge>}
            {member.phone && <PhoneLink phone={member.phone} name={member.name} />}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("classes")} icon={GraduationCap}>
          {member.classes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noClasses")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {member.classes.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Link
                    href={`/o/${orgId}/classes/${c.id}`}
                    className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80 ${toneClasses(c.id)}`}
                  >
                    <GraduationCap className="size-4" aria-hidden />
                    <bdi>{c.name}</bdi>
                  </Link>
                  <ConfirmActionButton
                    iconOnly
                    variant="ghost"
                    icon={<X className="size-4" aria-hidden />}
                    label={t("removeFromClass", { className: c.name })}
                    confirmMessage={t("confirmRemoveFromClass", { name: member.name, className: c.name })}
                    successMessage={t("removedFromClass")}
                    action={removeTeacher.bind(null, c.id, teacherId)}
                  />
                </li>
              ))}
            </ul>
          )}
          {member.isTeacher ? (
            <PickAddForm
              label={t("addClass")}
              placeholder={t("chooseClass")}
              name="classId"
              options={otherClasses.map((c) => ({ id: c.id, name: c.name }))}
              action={assignClassToTeacher.bind(null, teacherId)}
              successMessage={t("classAdded")}
              emptyMessage={t("noOtherClasses")}
            />
          ) : (
            <p className="text-muted-foreground text-xs">{t("notATeacher")}</p>
          )}
        </Panel>

        <Panel title={t("students")} icon={Users}>
          <p className="text-muted-foreground -mt-1 text-xs">{t("studentsHint")}</p>
          {member.students.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noStudents")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {member.students.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <Link
                    href={`/o/${orgId}/students/${s.id}`}
                    className="hover:bg-surface-tint flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
                  >
                    <InitialAvatar name={s.name} size="sm" />
                    <bdi>{s.name}</bdi>
                  </Link>
                  <ConfirmActionButton
                    iconOnly
                    variant="ghost"
                    icon={<X className="size-4" aria-hidden />}
                    label={t("unassignStudent", { name: s.name })}
                    confirmMessage={t("confirmUnassignStudent", { student: s.name, teacher: member.name })}
                    successMessage={t("studentUnassigned")}
                    action={unassignStudentFromTeacher.bind(null, teacherId, s.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          {member.isTeacher && (
            <PickAddForm
              label={t("addStudent")}
              placeholder={t("chooseStudent")}
              name="studentId"
              options={otherStudents.map((s) => ({ id: s.id, name: s.name }))}
              action={assignStudentToTeacher.bind(null, teacherId)}
              successMessage={t("studentAssigned")}
              emptyMessage={t("noOtherStudents")}
            />
          )}
        </Panel>
      </div>

      {/* Role and removal. You cannot change your own role or remove yourself. */}
      {!isSelf && (
        <div className="bg-card flex flex-wrap items-center gap-2 rounded-xl border p-4 shadow-(--shadow-soft)">
          {member.isAdmin ? (
            <ConfirmActionButton
              icon={<ShieldOff className="size-4" aria-hidden />}
              label={t("removeAdmin")}
              confirmMessage={t("confirmRemoveAdmin", { name: member.name })}
              successMessage={t("adminRemoved")}
              action={setMemberAdmin.bind(null, orgId, teacherId, false)}
            />
          ) : (
            <ConfirmActionButton
              icon={<ShieldCheck className="size-4" aria-hidden />}
              label={t("makeAdmin")}
              confirmMessage={t("confirmMakeAdmin", { name: member.name })}
              successMessage={t("madeAdmin")}
              action={setMemberAdmin.bind(null, orgId, teacherId, true)}
            />
          )}
          <ConfirmActionButton
            variant="destructive"
            icon={<UserMinus className="size-4" aria-hidden />}
            label={t("remove")}
            confirmMessage={t("confirmRemove", { name: member.name, org: org.name })}
            action={removeMember.bind(null, orgId, teacherId)}
          />
          <p className="text-muted-foreground basis-full text-xs">{t("removeHint")}</p>
        </div>
      )}
    </>
  );
}
