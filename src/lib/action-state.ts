import type { z } from "zod";

/**
 * Result of a form Server Action. Messages are translation keys under
 * `Errors.*` (or another namespace for `message`), never raw server errors.
 */
export type ActionState = {
  status: "idle" | "error" | "success";
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

export const idleState: ActionState = { status: "idle" };

export function invalidState(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    fieldErrors[field] ??= issue.message;
  }
  return { status: "error", error: "invalid", fieldErrors };
}

export function errorState(error: string = "generic"): ActionState {
  return { status: "error", error };
}

/** FormData to a plain object of strings (checkboxes become "on"). */
export function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  }
  return out;
}
