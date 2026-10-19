"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { type ActionState, errorState, formObject, invalidState } from "@/lib/action-state";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "./schemas";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Strips a leading /ar or /en so next-intl's redirect can re-add the locale. */
function withoutLocale(path: string): string {
  return path.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return errorState("invalid_credentials");

  const locale = await getLocale();
  return redirect({ href: withoutLocale(safeNextPath(parsed.data.next)), locale });
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);

  const locale = await getLocale();
  const next = safeNextPath(parsed.data.next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName, preferred_language: locale },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(`/${locale}${withoutLocale(next)}`)}`,
    },
  });
  // One generic message, so the form can't be used to check which emails exist.
  if (error) return errorState("signup_failed");
  if (!data.session) return { status: "success", message: "checkEmail" };

  return redirect({ href: withoutLocale(next), locale });
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);

  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(`/${locale}/reset-password`)}`,
  });
  // Same answer whether or not the account exists.
  return { status: "success", message: "linkSent" };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalidState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return errorState();

  const locale = await getLocale();
  return redirect({ href: "/dashboard", locale });
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
