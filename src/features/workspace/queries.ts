import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MembershipRole = Database["public"]["Enums"]["membership_role"];
export type OpenAssignmentStatus = Database["public"]["Enums"]["assignment_status"];

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
      .select("students(id, display_name)")
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

/** The organization plus the current user's active roles in it, or null if not a member. */
export async function getOrganizationForStaff(orgId: string, userId: string) {
  const supabase = await createClient();
  const [org, roles] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
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
}

/** Classes shown on the org page: all of them for admins, only taught classes for teachers. */
export async function getClasses(orgId: string, userId: string, isAdmin: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, class_teachers(teacher_user_id), class_enrollments(status)")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data
    .map((c) => ({
      id: c.id,
      name: c.name,
      studentCount: c.class_enrollments.filter((e) => e.status === "active").length,
      taughtByMe: c.class_teachers.some((t) => t.teacher_user_id === userId),
    }))
    .filter((c) => isAdmin || c.taughtByMe);
}

export async function getClassWithRoster(orgId: string, classId: string, userId: string) {
  const supabase = await createClient();
  const [cls, roster] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, class_teachers(teacher_user_id)")
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
    .select("id, display_name, organization_id")
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
  classes: { id: string; name: string; studentCount: number }[];
};

/** All active teachers of the organization with the classes each one teaches (admins). */
export async function getTeachers(orgId: string): Promise<TeacherSummary[]> {
  const supabase = await createClient();
  const [members, classes] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("user_id, profiles(display_name)")
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
  lastLesson: {
    lesson_date: string;
    performance_rating: Database["public"]["Enums"]["performance_rating"];
  } | null;
  parents: { name: string; status: Database["public"]["Enums"]["relationship_status"] }[];
};

/**
 * Progress for a set of students in three batched queries (not one per
 * student): current memorization, last lesson and linked parents.
 */
export async function getStudentsProgress(
  students: { id: string; display_name: string }[],
): Promise<StudentProgress[]> {
  if (students.length === 0) return [];
  const ids = students.map((s) => s.id);
  const supabase = await createClient();
  const [lessons, assignments, parents] = await Promise.all([
    supabase
      .from("memorization_records")
      .select("student_id, lesson_date, performance_rating")
      .in("student_id", ids)
      .eq("status", "active")
      .order("lesson_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("student_id, start_surah, start_ayah, end_surah, end_ayah")
      .in("student_id", ids)
      .eq("assignment_type", "memorization")
      .in("status", OPEN_STATUSES)
      .order("created_at", { ascending: false }),
    supabase
      .from("parent_student_relationships")
      .select("student_id, status, profiles(display_name)")
      .in("student_id", ids)
      .neq("status", "revoked"),
  ]);
  if (lessons.error) throw lessons.error;
  if (assignments.error) throw assignments.error;
  if (parents.error) throw parents.error;

  return students.map((s) => {
    const last = lessons.data.find((l) => l.student_id === s.id);
    const current = assignments.data.find((a) => a.student_id === s.id);
    return {
      id: s.id,
      name: s.display_name,
      memorizing: current
        ? {
            start_surah: current.start_surah,
            start_ayah: current.start_ayah,
            end_surah: current.end_surah,
            end_ayah: current.end_ayah,
          }
        : null,
      lastLesson: last
        ? { lesson_date: last.lesson_date, performance_rating: last.performance_rating }
        : null,
      parents: parents.data
        .filter((p) => p.student_id === s.id)
        .map((p) => ({ name: p.profiles?.display_name ?? "", status: p.status })),
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
