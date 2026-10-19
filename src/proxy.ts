import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Locale redirects don't render a page, so skip the session refresh.
  if (response.headers.has("location")) {
    return response;
  }

  return updateSession(request, response);
}

export const config = {
  // Skip Next.js internals, the auth email callback, static files and anything
  // with a file extension.
  matcher: ["/((?!api|auth/|_next|_vercel|.*\\..*).*)"],
};
