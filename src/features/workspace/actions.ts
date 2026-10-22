"use server";

import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { type ActionState, errorState, formObject, invalidState } from "@/lib/action-state";
import { getCurrentUser } from "@/lib/auth/session";
import { idSchema } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema, nameSchema, recordLessonSchema } from "./schemas";

// Every action re-checks the session. Permissions are enforced by RLS and the
// database functions; a "not allowed" result just maps their error.

const PERMISSION_DENIED = "42501";

async function signedInClient() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, supabase: await createClient() };
}

export async function createOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createOrganizationSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);
  const ctx = await signedInClient();
  if (!ctx) return errorState("not_allowed");

  const { data, error } = await ctx.supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_organization_type: parsed.data.organizationType,
    p_also_teacher: parsed.data.alsoTeacher === "on",
    p_preferred_language: await getLocale(),
  });
  if (error || !data) return errorState();

  return redirect({ href: `/o/${data}`, locale: await getLocale() });
}

export async function createClass(
  orgId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = nameSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);
  if (!idSchema.safeParse(orgId).success) return errorState("not_allowed");
  const ctx = await signedInClient();
  if (!ctx) return errorState("not_allowed");

  const { error } = await ctx.supabase.rpc("create_class", {
    p_organization_id: orgId,
    p_name: parsed.data.name,
  });
  if (error) return errorState(error.code === PERMISSION_DENIED ? "not_allowed" : "generic");

  refresh();
  return { status: "success" };
}

export async function enrollStudent(
  classId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = nameSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);
  if (!idSchema.safeParse(classId).success) return errorState("not_allowed");
  const ctx = await signedInClient();
  if (!ctx) return errorState("not_allowed");

  const { error } = await ctx.supabase.rpc("enroll_new_student", {
    p_class_id: classId,
    p_display_name: parsed.data.name,
  });
  if (error) return errorState(error.code === PERMISSION_DENIED ? "not_allowed" : "generic");

  refresh();
  return { status: "success" };
}

/** Adds a student who has no class to this class. */
export async function addExistingStudent(
  classId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const studentId = formData.get("studentId");
  if (!idSchema.safeParse(classId).success || !idSchema.safeParse(studentId).success) {
    return errorState("required");
  }
  const ctx = await signedInClient();
  if (!ctx) return errorState("not_allowed");

  const { error } = await ctx.supabase.rpc("enroll_existing_student", {
    p_class_id: classId,
    p_student_id: studentId as string,
  });
  if (error) return errorState(error.code === PERMISSION_DENIED ? "not_allowed" : "generic");

  refresh();
  return { status: "success" };
}

/** Unlinks a student from a class. The student, lessons and parents are kept. */
export async function unenrollStudent(
  classId: string,
  studentId: string,
): Promise<{ error: string } | undefined> {
  if (!idSchema.safeParse(classId).success || !idSchema.safeParse(studentId).success)
    return { error: "not_allowed" };
  const ctx = await signedInClient();
  if (!ctx) return { error: "not_allowed" };

  const { error } = await ctx.supabase.rpc("unenroll_student", {
    p_class_id: classId,
    p_student_id: studentId,
  });
  if (error) return { error: error.code === PERMISSION_DENIED ? "not_allowed" : "generic" };

  refresh();
}

/** Assigns a teacher of the organization to a class (admins; enforced by RLS). */
export async function assignTeacher(
  classId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacherId = formData.get("teacherId");
  if (!idSchema.safeParse(classId).success || !idSchema.safeParse(teacherId).success) {
    return errorState("required");
  }
  const ctx = await signedInClient();
  if (!ctx) return errorState("not_allowed");

  const { data: cls } = await ctx.supabase
    .from("classes")
    .select("organization_id")
    .eq("id", classId)
    .maybeSingle();
  if (!cls) return errorState("not_allowed");

  const { error } = await ctx.supabase.from("class_teachers").insert({
    organization_id: cls.organization_id,
    class_id: classId,
    teacher_user_id: teacherId as string,
  });
  if (error) return errorState(error.code === PERMISSION_DENIED ? "not_allowed" : "generic");

  refresh();
  return { status: "success" };
}

/** Removes a teacher from a class. Their access to its students ends; history stays. */
export async function removeTeacher(
  classId: string,
  teacherId: string,
): Promise<{ error: string } | undefined> {
  if (!idSchema.safeParse(classId).success || !idSchema.safeParse(teacherId).success)
    return { error: "not_allowed" };
  const ctx = await signedInClient();
  if (!ctx) return { error: "not_allowed" };

  const { data, error } = await ctx.supabase
    .from("class_teachers")
    .delete()
    .eq("class_id", classId)
    .eq("teacher_user_id", teacherId)
    .select("id");
  if (error) return { error: "generic" };
  if (data.length === 0) return { error: "not_allowed" };

  refresh();
}

export type InviteResult = { token: string } | { error: string };

export async function createInvite(input: {
  orgId: string;
  type: "teacher" | "parent";
  studentId?: string;
}): Promise<InviteResult> {
  if (!idSchema.safeParse(input.orgId).success) return { error: "not_allowed" };
  if (input.studentId !== undefined && !idSchema.safeParse(input.studentId).success)
    return { error: "not_allowed" };
  const ctx = await signedInClient();
  if (!ctx) return { error: "not_allowed" };

  const { data, error } = await ctx.supabase.rpc("create_invitation", {
    p_organization_id: input.orgId,
    p_type: input.type,
    p_student_id: input.type === "parent" ? input.studentId : undefined,
  });
  if (error || !data) return { error: error?.code === PERMISSION_DENIED ? "not_allowed" : "generic" };
  return { token: data };
}

export async function acceptInvite(token: string): Promise<{ error: string } | undefined> {
  const ctx = await signedInClient();
  if (!ctx) return { error: "not_allowed" };

  const { data, error } = await ctx.supabase.rpc("accept_invitation", { p_token: token.slice(0, 200) });
  // Used or not, this invitation no longer needs to be remembered on the account.
  if (ctx.user.pendingInvite === token) await forgetPendingInvite(ctx.supabase);
  if (error) return { error: "invalid" };

  const result = data as { type?: string; student_id?: string | null; organization_id?: string };
  const locale = await getLocale();
  if (result.type === "parent" && result.student_id) {
    return redirect({ href: `/children/${result.student_id}`, locale });
  }
  return redirect({ href: `/o/${result.organization_id}`, locale });
}

/** Clears the invitation saved at sign-up, and refreshes the session so its claims match. */
async function forgetPendingInvite(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.auth.updateUser({ data: { pending_invite: null } });
  if (!error) await supabase.auth.refreshSession();
}

/** Marks an open assignment as verified. RLS limits this to the student's teachers and admins. */
export async function completeAssignment(assignmentId: string): Promise<{ error: string } | undefined> {
  if (!idSchema.safeParse(assignmentId).success) return { error: "not_allowed" };
  const ctx = await signedInClient();
  if (!ctx) return { error: "not_allowed" };

  const { data, error } = await ctx.supabase
    .from("assignments")
    .update({ status: "teacher_verified" })
    .eq("id", assignmentId)
    .in("status", ["assigned", "in_progress", "student_reported", "needs_practice"])
    .select("id");
  if (error) return { error: "generic" };
  if (data.length === 0) return { error: "not_allowed" };

  refresh();
}

export type RecordLessonResult =
  { ok: true; recordId: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function recordLesson(input: unknown): Promise<RecordLessonResult> {
  const parsed = recordLessonSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "invalid", fieldErrors };
  }
  const ctx = await signedInClient();
  if (!ctx) return { ok: false, error: "not_allowed" };

  const v = parsed.data;
  const toJson = (p: typeof v.passage) => ({
    start_surah: p.startSurah,
    start_ayah: p.startAyah,
    end_surah: p.endSurah,
    end_ayah: p.endAyah,
  });

  const { data, error } = await ctx.supabase.rpc("record_lesson", {
    p_student_id: v.studentId,
    p_idempotency_key: v.idempotencyKey,
    p_lesson_date: v.lessonDate,
    p_start_surah: v.passage.startSurah,
    p_start_ayah: v.passage.startAyah,
    p_end_surah: v.passage.endSurah,
    p_end_ayah: v.passage.endAyah,
    p_performance_rating: v.rating,
    p_mistake_categories: v.mistakes.length > 0 ? v.mistakes : undefined,
    p_parent_visible_feedback: v.parentFeedback || undefined,
    p_private_note: v.privateNote || undefined,
    p_next_memorization: v.nextMemorization ? toJson(v.nextMemorization) : undefined,
    p_next_revisions: v.nextRevision ? [toJson(v.nextRevision)] : [],
    p_completes_assignment_id: v.completesAssignmentId ?? undefined,
  });
  if (error || !data)
    return { ok: false, error: error?.code === PERMISSION_DENIED ? "not_allowed" : "generic" };
  return { ok: true, recordId: data };
}
