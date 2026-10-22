import {
  BookOpenCheck,
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
import { ActivityChart } from "@/features/workspace/components/activity-chart";
import { DateLabel, PassageLabel, RatingBadge, Section } from "@/features/workspace/components/display";
import {
  getClasses,
  getOrganizationForStaff,
  getProfileName,
  getRecentLessons,
  getStudentDirectory,
  getTeachers,
} from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { addDays, daysBetween, todayIn } from "@/lib/dates";
import { isId } from "@/lib/ids";

const STALE_AFTER_DAYS = 7;
const WEAK_RATINGS = new Set(["needs_improvement", "not_completed"]);

/** The organization's home for admins and teachers: today, this week, and what needs attention. */
export default async function DashboardPage({ params }: PageProps<"/[locale]/o/[orgId]">) {
  const { locale, orgId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();

  const today = todayIn(org.timezone);
  const weekStart = addDays(today, -6);
  const [name, classes, students, lessons, teachers] = await Promise.all([
    getProfileName(user.id),
    getClasses(orgId, user.id, org.isAdmin),
    getStudentDirectory(orgId),
    getRecentLessons(orgId, addDays(today, -13)),
    org.isAdmin ? getTeachers(orgId) : Promise.resolve([]),
  ]);
  const t = await getTranslations("OrgDashboard");
  const number = (n: number) => n.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : "en");

  // Lessons per day for the last 14 days.
  const perDay = new Map<string, number>();
  for (const l of lessons) perDay.set(l.lesson_date, (perDay.get(l.lesson_date) ?? 0) + 1);
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i - 13);
    return { date, count: perDay.get(date) ?? 0 };
  });
  const weekLessons = lessons.filter((l) => l.lesson_date >= weekStart);
  const lastWeekCount = lessons.length - weekLessons.length;

  // Stars of the week: most "excellent" lessons in the last 7 days.
  const excellent = new Map<string, { id: string; name: string; count: number }>();
  for (const l of weekLessons) {
    if (l.performance_rating !== "excellent") continue;
    const s = excellent.get(l.student_id) ?? { id: l.student_id, name: l.studentName, count: 0 };
    s.count += 1;
    excellent.set(l.student_id, s);
  }
  const stars = [...excellent.values()].sort((a, b) => b.count - a.count).slice(0, 3);

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

  const now = new Date();
  const numbering = locale === "ar" ? "arab" : "latn";
  const gregorian = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: org.timezone,
    numberingSystem: numbering,
  }).format(now);
  const hijri = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: org.timezone,
    numberingSystem: numbering,
  }).format(now);

  return (
    <>
      {/* Greeting */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl p-6 shadow-(--shadow-soft) sm:p-8">
        <StarPattern />
        <div className="relative flex flex-col gap-1">
          <p className="text-primary-foreground/80 text-sm">{t("greeting")}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name || org.name}</h1>
          <p className="text-primary-foreground/85 mt-2 text-sm">
            {gregorian} · <span className="font-medium">{hijri}</span>
          </p>
          <p className="text-primary-foreground/85 mt-3 max-w-xl text-sm">
            {weekLessons.length === 0
              ? t("weekNone")
              : t("weekSummary", {
                  lessons: weekLessons.length,
                  students: new Set(weekLessons.map((l) => l.student_id)).size,
                })}
          </p>
        </div>
      </section>

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
            label: t("statWeekLessons"),
            value: (
              <span className="flex items-baseline gap-2">
                {number(weekLessons.length)}
                <Trend current={weekLessons.length} previous={lastWeekCount} />
              </span>
            ),
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Section title={t("activityTitle")}>
            <div className="bg-card rounded-xl border p-4 shadow-(--shadow-soft)">
              <ActivityChart days={days} />
            </div>
          </Section>

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

          <Section title={t("recentTitle")}>
            {lessons.length === 0 ? (
              <p className="bg-card text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                {t("recentNone")}
              </p>
            ) : (
              <ol className="bg-card divide-y overflow-hidden rounded-xl border shadow-(--shadow-soft)">
                {lessons.slice(0, 6).map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                    <Link
                      href={`/o/${orgId}/students/${l.student_id}`}
                      className="hover:text-primary font-medium transition-colors duration-150"
                    >
                      {l.studentName}
                    </Link>
                    <span className="text-muted-foreground text-sm">
                      <PassageLabel row={l} />
                    </span>
                    <RatingBadge rating={l.performance_rating} />
                    <span className="text-subtle-foreground ms-auto text-xs">
                      {l.teacherName && `${l.teacherName} · `}
                      <DateLabel date={l.lesson_date} />
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)">
            <h2 className="flex items-center gap-2 font-semibold">
              <Star className="text-gold fill-gold size-5" aria-hidden />
              {t("starsTitle")}
            </h2>
            {stars.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("starsNone")}</p>
            ) : (
              <ol className="flex flex-col gap-2">
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
                      <span className="text-muted-foreground text-xs">
                        {t("excellentCount", { count: s.count })}
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
                      <span className="bg-mint text-primary grid size-8 shrink-0 place-items-center rounded-lg">
                        <GraduationCap className="size-4" aria-hidden />
                      </span>
                      <span dir="auto" className="flex-1 truncate font-medium">
                        {c.name}
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

/** "↑ 3" / "↓ 2" against last week; nothing when equal. */
async function Trend({ current, previous }: { current: number; previous: number }) {
  const t = await getTranslations("OrgDashboard");
  if (current === previous) return null;
  const up = current > previous;
  return (
    <span className={up ? "text-success text-xs font-medium" : "text-muted-foreground text-xs font-medium"}>
      {up ? "↑" : "↓"} {t("vsLastWeek", { count: Math.abs(current - previous) })}
    </span>
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

/** Faint eight-point stars, echoing the brand mark. Decorative only. */
function StarPattern() {
  return (
    <svg className="absolute -end-10 -top-10 size-64 opacity-10" viewBox="0 0 100 100" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="25" y="25" width="50" height="50" />
        <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="12" />
      </g>
    </svg>
  );
}
