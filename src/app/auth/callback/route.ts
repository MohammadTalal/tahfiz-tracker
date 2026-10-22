import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Where auth emails return to (`emailRedirectTo` / `redirectTo`), for both
 * email templates:
 * - Supabase's default template sends a one-time `code` (PKCE). It can only be
 *   exchanged in the browser that started the sign-up or reset.
 * - Our template (supabase/templates) verifies the link at /auth/confirm first,
 *   which signs the user in on any device, then lands here without a code.
 * Either way, a signed-in user continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) return NextResponse.redirect(new URL(next, origin));
  }

  // E.g. the default-template link opened on another device. The email is
  // still confirmed; after logging in, any invitation from sign-up resumes.
  const locale = next.startsWith("/en") ? "en" : "ar";
  return NextResponse.redirect(new URL(`/${locale}/login?error=link`, origin));
}
