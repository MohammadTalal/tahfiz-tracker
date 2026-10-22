import "server-only";

import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isInviteToken } from "@/lib/invite-token";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  /** Invitation token saved at sign-up and not yet accepted (see acceptInvite). */
  pendingInvite: string | null;
};

/**
 * The signed-in user, verified from the session JWT (never trusted from the
 * cookie alone). Returns null when signed out. Reads cookies, so callers must
 * render inside a Suspense boundary.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Session checks compare token expiry with the current time, so they must
  // run at request time, never during prerendering.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const pending = (data.claims.user_metadata as Record<string, unknown> | undefined)?.pending_invite;
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    pendingInvite: isInviteToken(pending) ? pending : null,
  };
}

/** Like getCurrentUser, but sends signed-out users to the login page. */
export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: next ? { pathname: "/login", query: { next } } : "/login", locale });
  }
  return user;
}
