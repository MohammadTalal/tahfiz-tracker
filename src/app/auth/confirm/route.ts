import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "email",
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
];

/**
 * Target of the links in auth emails (see supabase/templates). The link
 * carries a one-time token hash, so it works on any device or browser — unlike
 * the PKCE code flow, which needs the browser that started the sign-up.
 *
 * `next` is the address the app asked Supabase to return to (a full URL);
 * only its path is used, so it can never send the user to another site.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = nextPath(searchParams.get("next"));

  if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const locale = next.startsWith("/en") ? "en" : "ar";
  return NextResponse.redirect(new URL(`/${locale}/login?error=link`, origin));
}

/** Path (+ query) of `next`, which may be a full URL or a path. */
function nextPath(next: string | null): string {
  if (!next) return "/";
  try {
    const url = new URL(next, "http://placeholder.invalid");
    return safeNextPath(url.pathname + url.search, "/");
  } catch {
    return "/";
  }
}
