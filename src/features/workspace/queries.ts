import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MembershipRole = Database["public"]["Enums"]["membership_role"];
export type OpenAssignmentStatus = Database["public"]["Enums"]["assignment_status"];

// The API returns at most this many rows per request (supabase/config.toml max_rows).
const PAGE_SIZE = 1000;

/** Runs a query page by page so long lists are never cut off at the row cap. */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

const OPEN_STATUSES: OpenAssignmentStatus[] = [
  "assigned",
  "in_progress",
  "student_reported",
  "needs_practice",
];

/** Organizations the user belongs to (grouped roles) and children they are a verified parent of. */
export async function getWorkspace(userId: string) {
  const supabase = await createClient();
  const [memberships, children] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("role, organizations(id, name)")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("parent_student_relationships")
      .select("students(id, display_name, organization_id)")
      .eq("parent_user_id", userId)
      .eq("status", "verified"),
  ]);
  if (memberships.error) throw memberships.error;
  if (children.error) throw children.error;

  const orgs = new Map<string, { id: string; name: string; roles: MembershipRole[] }>();
  for (const m of memberships.data) {
    if (!m.organizations) continue;
    const org = orgs.get(m.organizations.id) ?? { ...m.organizations, roles: [] };
    org.roles.push(m.role);
    orgs.set(org.id, org);
  }

  return {
    organizations: [...orgs.values()],
    children: children.data.flatMap((c) => (c.students ? [c.students] : [])),
  };
}

/**
 * The organization plus the current user's active roles in it, or null if not
 * a member. Cached per request: the org layout and its pages both ask.
 */
export const getOrganizationForStaff = cache(async (orgId: string, userId: string) => {
  const supabase = await createClient();
  const [org, roles] = await Promise.all([
    supabase.from("organizations").select("id, name, timezone").eq("id", orgId).maybeSingle(),
    supabase
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);
  if (org.error) throw org.error;
  if (roles.error) throw roles.error;
  if (!org.data || roles.data.length === 0) return null;
  const roleList = roles.data.map((r) => r.role);
  return { ...org.data, roles: roleList, isAdmin: roleList.includes("admin") };
});

/** Classes with their teachers: all of them for admins, only taught classes for teachers. */
export async function getClasses(orgId: string, userId: string, isAdmin: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, name, meeting_days, class_teachers(teacher_user_id, profiles(display_name)), class_enrollments(status)",
    )
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data
    .map((c) => ({
      id: c.id,
      name: c.name,
      meetingDays: c.meeting_days,
      studentCount: c.class_enrollments.filter((e) => e.status === "active").length,
      teachers: c.class_teachers
        .map((t) => ({ id: t.teacher_user_id, name: t.profiles?.display_name ?? "" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      taughtByMe: c.class_teachers.some((t) => t.teacher_user_id === userId),
    }))
    .filter((c) => isAdmin || c.taughtByMe);
}

export async function getClassWithRoster(orgId: string, classId: string, userId: string) {
  const supabase = await createClient();
  const [cls, roster] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, meeting_days, class_teachers(teacher_user_id)")
      .eq("id", classId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("class_enrollments")
      .select("students(id, display_name)")
      .eq("class_id", classId)
      .eq("status", "active"),
  ]);
  if (cls.error) throw cls.error;
  if (roster.error) throw roster.error;
  if (!cls.data) return null;
  const students = roster.data
    .flatMap((r) => (r.students ? [r.students] : []))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
  const { class_teachers: teachers, ...rest } = cls.data;
  return { ...rest, students, taughtByMe: teachers.some((t) => t.teacher_user_id === userId) };
}

/** A student the user may see (RLS decides), or null. */
export async function getStudent(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, display_name, organization_id, status")
    .eq("id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Recent lessons. Private notes come back only for staff (RLS returns nothing
 * to parents); `withPrivateNotes: false` also drops them from the result.
 */
export async function getLessons(studentId: string, { withPrivateNotes }: { withPrivateNotes: boolean }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memorization_records")
    .select(
      "id, lesson_date, start_surah, start_ayah, end_surah, end_ayah, performance_rating, mistake_categories, parent_visible_feedback, memorization_record_private_notes(body)",
    )
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map(({ memorization_record_private_notes: note, ...row }) => ({
    ...row,
    // Embedded through a composite key, so PostgREST returns a 0-or-1 item array.
    privateNote: withPrivateNotes ? (note[0]?.body ?? null) : null,
  }));
}

export async function getOpenAssignments(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, assignment_type, start_surah, start_ayah, end_surah, end_ayah, due_date, status, instructions",
    )
    .eq("student_id", studentId)
    .in("status", OPEN_STATUSES)
    .order("assignment_type")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getParents(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parent_student_relationships")
    .select("id, status, profiles(display_name)")
    .eq("student_id", studentId)
    .neq("status", "revoked");
  if (error) throw error;
  return data.map((r) => ({ id: r.id, status: r.status, name: r.profiles?.display_name ?? "" }));
}

export async function getProfileName(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.display_name ?? "";
}

/** Total active lessons for a student (exact count, not limited like getLessons). */
export async function getLessonCount(studentId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("memorization_records")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "active");
  if (error) throw error;
  return count ?? 0;
}

export type TeacherSummary = {
  id: string;
  name: string;
  phone: string | null;
  classes: { id: string; name: string; studentCount: number }[];
};

/** All active teachers of the organization with the classes each one teaches (admins). */
export async function getTeachers(orgId: string): Promise<TeacherSummary[]> {
  const supabase = await createClient();
  const [members, classes] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("user_id, profiles(display_name, profile_contacts(phone))")
      .eq("organization_id", orgId)
      .eq("role", "teacher")
      .eq("status", "active"),
    supabase
      .from("classes")
      .select("id, name, class_teachers(teacher_user_id), class_enrollments(status)")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("name"),
  ]);
  if (members.error) throw members.error;
  if (classes.error) throw classes.error;

  return members.data
    .map((m) => ({
      id: m.user_id,
      name: m.profiles?.display_name ?? "",
      phone: m.profiles?.profile_contacts?.phone ?? null,
      classes: classes.data
        .filter((c) => c.class_teachers.some((t) => t.teacher_user_id === m.user_id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c.class_enrollments.filter((e) => e.status === "active").length,
        })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Teachers assigned to one class. */
export async function getClassTeachers(classId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_teachers")
    .select("teacher_user_id, profiles(display_name)")
    .eq("class_id", classId);
  if (error) throw error;
  return data
    .map((t) => ({ id: t.teacher_user_id, name: t.profiles?.display_name ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Students of the class's organization who are not in any class. */
export async function getUnassignedStudents(classId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unassigned_students", { p_class_id: classId });
  if (error) throw error;
  return data.map((s) => ({ id: s.id, name: s.display_name }));
}

export type StudentProgress = {
  id: string;
  name: string;
  memorizing: { start_surah: number; start_ayah: number; end_surah: number; end_ayah: number } | null;
  /** The passage of the last completed lesson (not "not completed"). */
  lastMemorized: { start_surah: number; start_ayah: number; end_surah: number; end_ayah: number } | null;
  lastLesson: {
    lesson_date: string;
    performance_rating: Database["public"]["Enums"]["performance_rating"];
  } | null;
  parents: { name: string; status: Database["public"]["Enums"]["relationship_status"] }[];
  /** The juz being memorized now and how much of it is done (0–100). */
  juz: { number: number; percent: number } | null;
};

/**
 * Progress for a set of students: last lesson, current memorization and
 * current juz progress (database calls that return one row per student, so
 * long histories are not loaded), plus linked parents unless `withParents`
 * is false.
 */
export async function getStudentsProgress(
  students: { id: string; display_name: string }[],
  { withParents = true }: { withParents?: boolean } = {},
): Promise<StudentProgress[]> {
  if (students.length === 0) return [];
  const ids = students.map((s) => s.id);
  const supabase = await createClient();
  const [progress, juz, parents] = await Promise.all([
    supabase.rpc("student_progress", { p_student_ids: ids }),
    supabase.rpc("student_juz_progress", { p_student_ids: ids }),
    withParents
      ? supabase
          .from("parent_student_relationships")
          .select("student_id, status, profiles(display_name)")
          .in("student_id", ids)
          .neq("status", "revoked")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (progress.error) throw progress.error;
  if (juz.error) throw juz.error;
  if (parents.error) throw parents.error;

  const byId = new Map(progress.data.map((p) => [p.student_id, p]));
  const juzById = new Map(juz.data.map((j) => [j.student_id, { number: j.juz, percent: j.percent }]));
  return students.map((s) => {
    const p = byId.get(s.id);
    return {
      id: s.id,
      name: s.display_name,
      memorizing:
        p?.mem_start_surah != null &&
        p.mem_start_ayah != null &&
        p.mem_end_surah != null &&
        p.mem_end_ayah != null
          ? {
              start_surah: p.mem_start_surah,
              start_ayah: p.mem_start_ayah,
              end_surah: p.mem_end_surah,
              end_ayah: p.mem_end_ayah,
            }
          : null,
      lastMemorized:
        p?.done_start_surah != null &&
        p.done_start_ayah != null &&
        p.done_end_surah != null &&
        p.done_end_ayah != null
          ? {
              start_surah: p.done_start_surah,
              start_ayah: p.done_start_ayah,
              end_surah: p.done_end_surah,
              end_ayah: p.done_end_ayah,
            }
          : null,
      lastLesson:
        p?.last_lesson_date && p.last_rating
          ? { lesson_date: p.last_lesson_date, performance_rating: p.last_rating }
          : null,
      parents: parents.data
        .filter((r) => r.student_id === s.id)
        .map((r) => ({ name: r.profiles?.display_name ?? "", status: r.status })),
      juz: juzById.get(s.id) ?? null,
    };
  });
}

/** The organization as a tree: classes with their teachers and students (admins). */
export async function getOrganizationTree(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, name, class_teachers(teacher_user_id, profiles(display_name)), class_enrollments(status, students(id, display_name))",
    )
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    teachers: c.class_teachers.map((t) => ({ id: t.teacher_user_id, name: t.profiles?.display_name ?? "" })),
    students: c.class_enrollments
      .filter((e) => e.status === "active" && e.students)
      .map((e) => e.students!)
      .sort((a, b) => a.display_name.localeCompare(b.display_name)),
  }));
}

export type DirectoryStudent = Omit<StudentProgress, "parents"> & {
  classes: { id: string; name: string }[];
  teachers: string[];
  parents: (StudentProgress["parents"][number] & { phone: string | null })[];
};

/**
 * Students the user may see (all for admins, their own for teachers; RLS) with
 * class, teachers, parents and phone numbers, plus their current progress.
 */
export async function getStudentDirectory(orgId: string): Promise<DirectoryStudent[]> {
  const supabase = await createClient();
  const data = await fetchAll((from, to) =>
    supabase
      .from("students")
      .select(
        "id, display_name, class_enrollments(status, classes(id, name, class_teachers(profiles(display_name)))), parent_student_relationships(status, profiles(display_name, profile_contacts(phone)))",
      )
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("display_name")
      .order("id")
      .range(from, to),
  );

  // Parents come from the query above (with phone numbers).
  const progress = new Map((await getStudentsProgress(data, { withParents: false })).map((p) => [p.id, p]));
  return data.map((s) => {
    const classes = s.class_enrollments
      .filter((e) => e.status === "active" && e.classes)
      .map((e) => e.classes!);
    return {
      ...progress.get(s.id)!,
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
      teachers: [
        ...new Set(classes.flatMap((c) => c.class_teachers.map((t) => t.profiles?.display_name ?? ""))),
      ].filter(Boolean),
      parents: s.parent_student_relationships
        .filter((p) => p.status !== "revoked")
        .map((p) => ({
          name: p.profiles?.display_name ?? "",
          status: p.status,
          phone: p.profiles?.profile_contacts?.phone ?? null,
        })),
    };
  });
}

/** Lessons of active (not archived) students from `since` onwards that the user may see, newest first. */
export async function getRecentLessons(orgId: string, since: string) {
  const supabase = await createClient();
  const data = await fetchAll((from, to) =>
    supabase
      .from("memorization_records")
      .select(
        "id, student_id, teacher_user_id, lesson_date, performance_rating, start_surah, start_ayah, end_surah, end_ayah, students!inner(display_name, status), profiles!memorization_records_teacher_user_id_fkey(display_name)",
      )
      .eq("organization_id", orgId)
      .eq("status", "active")
      .eq("students.status", "active")
      .gte("lesson_date", since)
      .order("lesson_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return data.map(({ students, profiles, ...l }) => ({
    ...l,
    studentName: students?.display_name ?? "",
    teacherName: profiles?.display_name ?? "",
  }));
}

/** The current user's phone number, or "" if none. */
export async function getOwnPhone(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_contacts")
    .select("phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.phone ?? "";
}

/** Progress through the juz one student is memorizing now, or null. */
export async function getJuzProgress(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("student_juz_progress", { p_student_ids: [studentId] });
  if (error) throw error;
  const row = data[0];
  return row ? { number: row.juz, percent: row.percent } : null;
}

/** A class the student is in now (the first by name), or null. */
export async function getStudentClassId(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("class_id, classes(name)")
    .eq("student_id", studentId)
    .eq("status", "active");
  if (error) throw error;
  return (
    data.sort((a, b) => (a.classes?.name ?? "").localeCompare(b.classes?.name ?? ""))[0]?.class_id ?? null
  );
}

export type NewsPost = {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
};

/** Latest news of the given organizations, newest first (RLS: staff and parents). */
export async function getNews(orgIds: string[], limit = 10): Promise<NewsPost[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_news")
    .select("id, organization_id, title, body, created_at, profiles(display_name), organizations(name)")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((n) => ({
    id: n.id,
    organizationId: n.organization_id,
    organizationName: n.organizations?.name ?? "",
    title: n.title,
    body: n.body,
    createdAt: n.created_at,
    authorName: n.profiles?.display_name ?? "",
  }));
}

/** One member of the organization for the admin's teacher page, or null. */
export async function getMemberDetail(orgId: string, userId: string) {
  const supabase = await createClient();
  const [memberships, profile, classes, direct] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase.from("profiles").select("display_name, profile_contacts(phone)").eq("id", userId).maybeSingle(),
    supabase
      .from("class_teachers")
      .select("classes(id, name, status)")
      .eq("organization_id", orgId)
      .eq("teacher_user_id", userId),
    supabase
      .from("teacher_student_assignments")
      .select("students(id, display_name, status)")
      .eq("organization_id", orgId)
      .eq("teacher_user_id", userId)
      .eq("status", "active"),
  ]);
  if (memberships.error) throw memberships.error;
  if (profile.error) throw profile.error;
  if (classes.error) throw classes.error;
  if (direct.error) throw direct.error;
  if (memberships.data.length === 0 || !profile.data) return null;
  const roles = memberships.data.map((m) => m.role);
  return {
    id: userId,
    name: profile.data.display_name,
    phone: profile.data.profile_contacts?.phone ?? null,
    isAdmin: roles.includes("admin"),
    isTeacher: roles.includes("teacher"),
    classes: classes.data
      .flatMap((c) =>
        c.classes && c.classes.status === "active" ? [{ id: c.classes.id, name: c.classes.name }] : [],
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
    students: direct.data
      .flatMap((d) =>
        d.students && d.students.status === "active"
          ? [{ id: d.students.id, name: d.students.display_name }]
          : [],
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
