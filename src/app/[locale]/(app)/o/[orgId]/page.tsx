import {
  Megaphone,
  PenLine,
  UserPlus,
  BookOpenCheck,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  CircleCheck,
  GraduationCap,
  HeartHandshake,
  type LucideIcon,
  Star,
  TriangleAlert,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { StatStrip } from "@/components/layout/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/features/workspace/components/display";
import { NewsFeed } from "@/features/workspace/components/news";
import {
  getClasses,
  getOrganizationForStaff,
  getNews,
  getRecentLessons,
  getStudentDirectory,
  getTeachers,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { daysBetween, todayIn } from "@/lib/dates";
import { isId } from "@/lib/ids";
import { toneAt, toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { pagesInPassages } from "@/lib/quran/divisions";
import { passageFromRow } from "@/lib/quran/format";
import type { Passage } from "@/lib/quran/passage";
import { dayName, weekdayOf } from "@/lib/weekdays";

const STALE_AFTER_DAYS = 7;
const WEAK_RATINGS = new Set(["needs_improvement", "not_completed"]);

/** The organization's home for admins and teachers: today, this week, and what needs attention. */
export default async function DashboardPage({ params, searchParams }: PageProps<"/[locale]/o/[orgId]">) {
  const { locale, orgId } = await params;
  const openNewsForm = (await searchParams).news === "1";
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();

  const today = todayIn(org.timezone);
  const monthStart = `${today.slice(0, 8)}01`;
  const [classes, students, lessons, teachers, news] = await Promise.all([
    getClasses(orgId, user.id, org.isAdmin),
    getStudentDirectory(orgId),
    getRecentLessons(orgId, monthStart),
    org.isAdmin ? getTeachers(orgId) : Promise.resolve([]),
    getNews([orgId]),
  ]);
  const t = await getTranslations("OrgDashboard");
  const number = (n: number) => n.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en");

  // Classes that meet today, in the organization's time zone.
  const todayWeekday = weekdayOf(today);
  const todaysClasses = classes.filter((c) => c.meetingDays.includes(todayWeekday));

  // Stars of the month: most Mushaf pages memorized since the 1st of this
  // month. Lessons rated "not completed" do not count, and a passage recited
  // more than once counts once.
  const monthPassages = new Map<string, { id: string; name: string; passages: Passage[] }>();
  for (const l of lessons) {
    if (l.lesson_date < monthStart || l.performance_rating === "not_completed") continue;
    const s = monthPassages.get(l.student_id) ?? { id: l.student_id, name: l.studentName, passages: [] };
    s.passages.push(passageFromRow(l));
    monthPassages.set(l.student_id, s);
  }
  const pagesByStudent = new Map(
    [...monthPassages.values()].map((s) => [
      s.id,
      { id: s.id, name: s.name, pages: pagesInPassages(s.passages) },
    ]),
  );
  const roundPages = (pages: number) => Math.round(pages * 10) / 10;
  const stars = [...pagesByStudent.values()]
    .filter((s) => roundPages(s.pages) > 0)
    .sort((a, b) => b.pages - a.pages || a.name.localeCompare(b.name))
    .slice(0, 5);
  const monthPages = [...pagesByStudent.values()].reduce((sum, s) => sum + s.pages, 0);
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
    new Date(`${monthStart}T00:00:00Z`),
  );

  // Enrolled students who have not had a lesson lately or struggled last time.
  const attention = students
    .filter((s) => s.classes.length > 0)
    .map((s) => {
      const since = s.lastLesson ? daysBetween(s.lastLesson.lesson_date, today) : null;
      if (since === null) return { student: s, reason: t("reasonNever") };
      if (since >= STALE_AFTER_DAYS) return { student: s, reason: t("reasonStale", { days: number(since) }) };
      if (WEAK_RATINGS.has(s.lastLesson!.performance_rating)) return { student: s, reason: t("reasonWeak") };
      return null;
    })
    .filter((x) => x !== null);

  // Admin checklist: gaps in the organization's setup.
  const todo: { icon: LucideIcon; label: string; href: string }[] = [];
  if (org.isAdmin) {
    const noTeacher = classes.filter((c) => c.teachers.length === 0).length;
    const noClass = students.filter((s) => s.classes.length === 0).length;
    const idleTeachers = teachers.filter((x) => x.classes.length === 0).length;
    const noParent = students.filter((s) => s.parents.length === 0).length;
    if (classes.length === 0)
      todo.push({ icon: GraduationCap, label: t("todoNoClasses"), href: `/o/${orgId}/classes` });
    if (teachers.length === 0)
      todo.push({ icon: UserCheck, label: t("todoNoTeachers"), href: `/o/${orgId}/teachers` });
    if (noTeacher)
      todo.push({
        icon: GraduationCap,
        label: t("todoClassesNoTeacher", { count: noTeacher }),
        href: `/o/${orgId}/classes`,
      });
    if (idleTeachers)
      todo.push({
        icon: UserCheck,
        label: t("todoIdleTeachers", { count: idleTeachers }),
        href: `/o/${orgId}/teachers`,
      });
    if (noClass)
      todo.push({
        icon: UserX,
        label: t("todoStudentsNoClass", { count: noClass }),
        href: `/o/${orgId}/students`,
      });
    if (noParent)
      todo.push({
        icon: HeartHandshake,
        label: t("todoNoParents", { count: noParent }),
        href: `/o/${orgId}/students`,
      });
  }

  return (
    <>
      <h1 className="sr-only">{org.name}</h1>

      {/* Quick actions: the things people come here to do. */}
      <nav
        aria-label={t("quickActions")}
        className={cn("grid grid-cols-2 gap-3", org.isAdmin ? "sm:grid-cols-4" : "sm:grid-cols-2")}
      >
        <QuickAction
          href={
            todaysClasses.length === 1
              ? `/o/${orgId}/classes/${todaysClasses[0]!.id}`
              : `/o/${orgId}/students`
          }
          icon={PenLine}
          label={t("actionRecord")}
          tone={toneAt(0)}
        />
        {org.isAdmin ? (
          <>
            <QuickAction
              href={`/o/${orgId}/students?add=1`}
              icon={UserPlus}
              label={t("actionAddStudent")}
              tone={toneAt(1)}
            />
            <QuickAction
              href={`/o/${orgId}?news=1#news`}
              icon={Megaphone}
              label={t("actionPostNews")}
              tone={toneAt(2)}
            />
            <QuickAction
              href={`/o/${orgId}/teachers?invite=1#invite`}
              icon={UserCheck}
              label={t("actionInviteTeacher")}
              tone={toneAt(4)}
            />
          </>
        ) : (
          <QuickAction
            href={`/o/${orgId}/classes`}
            icon={GraduationCap}
            label={t("actionMyClasses")}
            tone={toneAt(1)}
          />
        )}
      </nav>

      <StatStrip
        stats={[
          {
            icon: Users,
            label: org.isAdmin ? t("statStudents") : t("statMyStudents"),
            value: number(students.length),
          },
          {
            icon: GraduationCap,
            label: org.isAdmin ? t("statClasses") : t("statMyClasses"),
            value: number(classes.length),
          },
          ...(org.isAdmin
            ? [{ icon: UserCheck, label: t("statTeachers"), value: number(teachers.length) }]
            : []),
          {
            icon: BookOpenCheck,
            label: t("statMonthPages", { month: monthName }),
            value: roundPages(monthPages).toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en"),
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <NewsFeed posts={news} postTo={org.isAdmin ? orgId : undefined} openForm={openNewsForm} />

          <Section title={t("attentionTitle")}>
            {attention.length === 0 ? (
              <AllGood text={t("attentionNone")} />
            ) : (
              <ul className="bg-card divide-y overflow-hidden rounded-xl border shadow-(--shadow-soft)">
                {attention.slice(0, 6).map(({ student, reason }) => (
                  <li key={student.id}>
                    <Link
                      href={`/o/${orgId}/students/${student.id}`}
                      className="hover:bg-surface-tint flex items-center gap-3 px-4 py-3 transition-colors duration-150"
                    >
                      <InitialAvatar name={student.name} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{student.name}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {student.classes.map((c) => c.name).join("، ")}
                        </span>
                      </span>
                      <Badge variant="warning">
                        <CalendarClock aria-hidden />
                        {reason}
                      </Badge>
                      <ChevronLeft className="text-subtle-foreground size-4 ltr:rotate-180" aria-hidden />
                    </Link>
                  </li>
                ))}
                {attention.length > 6 && (
                  <li className="text-muted-foreground px-4 py-2.5 text-sm">
                    <Link href={`/o/${orgId}/students`} className="hover:text-primary">
                      {t("andMore", { count: attention.length - 6 })}
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays className="text-primary size-5" aria-hidden />
              {t("todayTitle")}
              <span className="text-muted-foreground ms-auto text-xs font-normal">
                {dayName(todayWeekday, locale)}
              </span>
            </h2>
            {todaysClasses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {classes.some((c) => c.meetingDays.length > 0) ? t("todayNone") : t("todayNoDays")}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {todaysClasses.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/o/${orgId}/classes/${c.id}`}
                      className="hover:bg-surface-tint -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneClasses(c.id)}`}
                      >
                        <GraduationCap className="size-4" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">
                          <bdi>{c.name}</bdi>
                        </span>
                        {c.teachers.length > 0 && (
                          <span className="text-muted-foreground truncate text-xs">
                            {c.teachers.map((x) => x.name).join("، ")}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">{number(c.studentCount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)">
            <h2 className="flex items-center gap-2 font-semibold">
              <Star className="text-gold fill-gold size-5" aria-hidden />
              {t("starsTitle")}
              <span className="text-muted-foreground ms-auto text-xs font-normal">{monthName}</span>
            </h2>
            {stars.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("starsNone")}</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {stars.map((s, i) => (
                  <li key={s.id}>
                    <Link
                      href={`/o/${orgId}/students/${s.id}`}
                      className="hover:bg-surface-tint -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150"
                    >
                      <span className="bg-gold-soft text-gold-foreground grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold">
                        {number(i + 1)}
                      </span>
                      <span className="flex-1 truncate font-medium">{s.name}</span>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {t("pagesCount", { count: roundPages(s.pages) })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {org.isAdmin && (
            <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)">
              <h2 className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="text-warning size-5" aria-hidden />
                {t("todoTitle")}
              </h2>
              {todo.length === 0 ? (
                <AllGood text={t("todoNone")} />
              ) : (
                <ul className="flex flex-col gap-1">
                  {todo.map(({ icon: Icon, label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="hover:bg-surface-tint -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
                      >
                        <span className="bg-warning-soft text-warning grid size-8 shrink-0 place-items-center rounded-lg">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="flex-1">{label}</span>
                        <ChevronLeft className="text-subtle-foreground size-4 ltr:rotate-180" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!org.isAdmin && classes.length > 0 && (
            <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)">
              <h2 className="font-semibold">{t("myClassesTitle")}</h2>
              <ul className="flex flex-col gap-1">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/o/${orgId}/classes/${c.id}`}
                      className="hover:bg-surface-tint -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneClasses(c.id)}`}
                      >
                        <GraduationCap className="size-4" aria-hidden />
                      </span>
                      <span className="flex-1 truncate font-medium">
                        <bdi>{c.name}</bdi>
                      </span>
                      <span className="text-muted-foreground text-xs">{number(c.studentCount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function AllGood({ text }: { text: string }) {
  return (
    <p className="bg-success-soft text-success flex items-center gap-2 rounded-lg p-3 text-sm">
      <CircleCheck className="size-4 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

/** A big, coloured shortcut tile. */
function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card hover:border-primary/40 flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center font-semibold shadow-(--shadow-soft) transition-colors duration-150 last:odd:col-span-2 sm:last:odd:col-span-1"
    >
      <span className={`grid size-11 place-items-center rounded-full ${tone}`} aria-hidden>
        <Icon className="size-5" />
      </span>
      {label}
    </Link>
  );
}
