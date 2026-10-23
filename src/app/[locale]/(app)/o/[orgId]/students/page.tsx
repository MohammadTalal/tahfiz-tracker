import { Download, GraduationCap, PenLine, UserCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AddStudentPanel } from "@/features/workspace/components/add-student-panel";
import { ArchiveStudentButton } from "@/features/workspace/components/class-students";
import { DateLabel, JuzProgress, PassageLabel, RatingBadge } from "@/features/workspace/components/display";
import { PhoneLink } from "@/features/workspace/components/phone-link";
import { type DirectoryRow, StudentDirectory } from "@/features/workspace/components/student-directory";
import {
  type DirectoryStudent,
  getClasses,
  getOrganizationForStaff,
  getStudentDirectory,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";
import { cn } from "@/lib/utils";

/** Every student the user may see, with class, teachers, parents and phone numbers. */
export default async function StudentsPage({ params }: PageProps<"/[locale]/o/[orgId]/students">) {
  const { locale, orgId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();

  const [students, classes] = await Promise.all([
    getStudentDirectory(orgId),
    getClasses(orgId, user.id, org.isAdmin),
  ]);
  const t = await getTranslations("Students");
  const to = await getTranslations("Org");

  const rows: DirectoryRow[] = students.map((s) => ({
    id: s.id,
    search: [
      s.name,
      ...s.classes.map((c) => c.name),
      ...s.teachers,
      ...s.parents.flatMap((p) => [p.name, p.phone ?? ""]),
    ]
      .join(" ")
      .toLowerCase(),
    classIds: s.classes.map((c) => c.id),
    content: <StudentRow orgId={orgId} student={s} canArchive={org.isAdmin && s.classes.length === 0} />,
  }));

  return (
    <>
      <PageHeader
        title={org.isAdmin ? t("title") : t("myTitle")}
        description={t("summary", { count: students.length })}
        actions={
          org.isAdmin && (
            <a
              href={`/api/orgs/${orgId}/lessons-csv?locale=${locale}`}
              download
              title={to("exportHelp")}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Download className="size-4" aria-hidden />
              {to("exportLessons")}
            </a>
          )
        }
      />
      {org.isAdmin && (
        <div className="flex">
          <AddStudentPanel classes={classes.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
      )}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("empty")}
          description={org.isAdmin ? t("emptyHint") : t("emptyTeacherHint")}
        />
      ) : (
        <StudentDirectory rows={rows} classes={classes.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </>
  );
}

async function StudentRow({
  orgId,
  student: s,
  canArchive,
}: {
  orgId: string;
  student: DirectoryStudent;
  canArchive: boolean;
}) {
  const t = await getTranslations("Students");
  return (
    <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)] md:items-start md:gap-6">
      <div className="flex min-w-0 items-start gap-3">
        <InitialAvatar name={s.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/o/${orgId}/students/${s.id}`}
            className="hover:text-primary truncate font-semibold transition-colors duration-150"
          >
            {s.name}
          </Link>
          {s.memorizing ? (
            <span className="text-muted-foreground text-xs">
              {t("memorizing")} <PassageLabel row={s.memorizing} />
            </span>
          ) : null}
          {s.lastLesson ? (
            <span className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
              {t("lastLesson")} <DateLabel date={s.lastLesson.lesson_date} />
              <RatingBadge rating={s.lastLesson.performance_rating} />
            </span>
          ) : (
            <span className="text-subtle-foreground text-xs">{t("noLessons")}</span>
          )}
          {s.juz && <JuzProgress juz={s.juz} className="mt-1 max-w-56" />}
        </div>
        {/* One tap to record; students without a class only get lessons once placed. */}
        {s.classes.length > 0 && (
          <Link
            href={`/o/${orgId}/students/${s.id}/record`}
            aria-label={t("recordFor", { name: s.name })}
            title={t("recordFor", { name: s.name })}
            className="bg-primary text-primary-foreground hover:bg-primary-strong grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-150"
          >
            <PenLine className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground text-xs">{t("classAndTeacher")}</span>
        {s.classes.length === 0 ? (
          <span className="flex items-center gap-1">
            <Badge variant="warning" className="w-fit">
              {t("withoutClass")}
            </Badge>
            {canArchive && <ArchiveStudentButton student={{ id: s.id, name: s.name }} />}
          </span>
        ) : (
          s.classes.map((c) => (
            <Link
              key={c.id}
              href={`/o/${orgId}/classes/${c.id}`}
              className="hover:text-primary flex w-fit items-center gap-1.5 font-medium transition-colors duration-150"
            >
              <GraduationCap className="text-primary size-4" aria-hidden />
              <span dir="auto">{c.name}</span>
            </Link>
          ))
        )}
        {s.teachers.length > 0 && (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="size-4" aria-hidden />
            {s.teachers.join("، ")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground text-xs">{t("parents")}</span>
        {s.parents.length === 0 ? (
          <Badge variant="outline" className="w-fit">
            {t("noParent")}
          </Badge>
        ) : (
          s.parents.map((p, i) => (
            <span key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-medium">{p.name}</span>
              {p.status === "pending" && <Badge variant="outline">{t("pending")}</Badge>}
              {p.phone && <PhoneLink phone={p.phone} name={p.name} />}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
