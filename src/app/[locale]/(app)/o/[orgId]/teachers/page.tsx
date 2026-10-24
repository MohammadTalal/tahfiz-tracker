import { BookOpenCheck, ChevronLeft, GraduationCap, Network, UserCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/features/workspace/components/display";
import { InvitePanel } from "@/features/workspace/components/invite-panel";
import { PhoneLink } from "@/features/workspace/components/phone-link";
import { getOrganizationForStaff, getRecentLessons, getTeachers } from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { addDays, todayIn } from "@/lib/dates";
import { isId } from "@/lib/ids";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";

/** Admin view of the teachers: their classes, students, contact and this week's lessons. */
export default async function TeachersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/o/[orgId]/teachers">) {
  const { locale, orgId } = await params;
  // From the "Invite a teacher" shortcut: show the invite box first and highlight it.
  const inviting = (await searchParams).invite === "1";
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org?.isAdmin) notFound();

  const today = todayIn(org.timezone);
  const [teachers, lessons] = await Promise.all([
    getTeachers(orgId),
    getRecentLessons(orgId, addDays(today, -6)),
  ]);
  const lessonsByTeacher = new Map<string, number>();
  for (const l of lessons)
    lessonsByTeacher.set(l.teacher_user_id, (lessonsByTeacher.get(l.teacher_user_id) ?? 0) + 1);

  const t = await getTranslations("Teachers");
  const to = await getTranslations("Org");
  const number = (n: number) => n.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("summary", { count: teachers.length })}
        actions={
          <Link href={`/o/${orgId}/overview`} className={cn(buttonVariants({ variant: "outline" }))}>
            <Network className="size-4" aria-hidden />
            {to("viewOverview")}
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {teachers.length === 0 ? (
            <EmptyState icon={UserCheck} title={to("noTeachers")} description={to("teachersHint")} />
          ) : (
            <ul className="flex flex-col gap-3">
              {teachers.map((teacher) => {
                const students = teacher.classes.reduce((sum, c) => sum + c.studentCount, 0);
                const weekLessons = lessonsByTeacher.get(teacher.id) ?? 0;
                return (
                  <li
                    key={teacher.id}
                    className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-(--shadow-soft)"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/o/${orgId}/teachers/${teacher.id}`}
                        // Same target as the name link below; a bigger tap area, not a second link to announce.
                        aria-hidden
                        tabIndex={-1}
                        className="shrink-0 rounded-full"
                      >
                        <InitialAvatar name={teacher.name} />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          href={`/o/${orgId}/teachers/${teacher.id}`}
                          className="hover:text-primary flex items-center gap-1 truncate font-semibold transition-colors duration-150"
                        >
                          <bdi>{teacher.name}</bdi>
                          <ChevronLeft
                            className="text-subtle-foreground size-4 shrink-0 ltr:rotate-180"
                            aria-hidden
                          />
                        </Link>
                        {teacher.phone ? (
                          <PhoneLink phone={teacher.phone} name={teacher.name} />
                        ) : (
                          <span className="text-subtle-foreground text-xs">{t("noPhone")}</span>
                        )}
                      </div>
                      <dl className="flex basis-full gap-6 sm:basis-auto sm:gap-4 sm:text-center">
                        <div>
                          <dt className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Users className="size-3.5" aria-hidden />
                            {t("students")}
                          </dt>
                          <dd className="font-semibold">{number(students)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground flex items-center gap-1 text-xs">
                            <BookOpenCheck className="size-3.5" aria-hidden />
                            {t("lessonsThisWeek")}
                          </dt>
                          <dd className="font-semibold">{number(weekLessons)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      {teacher.classes.length === 0 ? (
                        <Badge variant="warning">{to("notAssigned")}</Badge>
                      ) : (
                        teacher.classes.map((c) => (
                          <Link
                            key={c.id}
                            href={`/o/${orgId}/classes/${c.id}`}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-opacity duration-150 hover:opacity-80 ${toneClasses(c.id)}`}
                          >
                            <GraduationCap className="size-4" aria-hidden />
                            <span className="font-medium">
                              <bdi>{c.name}</bdi>
                            </span>
                            <span className="text-xs opacity-80">
                              {to("students", { count: c.studentCount })}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <aside className={cn("flex flex-col gap-4", inviting && "order-first lg:order-none")}>
          <div
            id="invite"
            className={cn("scroll-mt-20 rounded-xl", inviting && "ring-primary ring-2 ring-offset-2")}
          >
            <Panel title={to("inviteTeacher")} icon={UserCheck}>
              <p className="text-muted-foreground text-sm">{to("teachersHint")}</p>
              <InvitePanel orgId={orgId} type="teacher" label={to("inviteTeacher")} />
            </Panel>
          </div>
        </aside>
      </div>
    </>
  );
}
