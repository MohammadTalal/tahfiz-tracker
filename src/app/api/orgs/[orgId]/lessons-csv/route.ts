import { type NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getOrganizationForStaff } from "@/features/workspace/queries";
import { routing, type Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { isId } from "@/lib/ids";
import { ayahCount } from "@/lib/quran/ayah-counts";
import { formatPassage, passageFromRow } from "@/lib/quran/format";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

/**
 * Admin-only download of an organization's lesson records as CSV. Includes
 * private teacher notes, since admins can already see them.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/orgs/[orgId]/lessons-csv">) {
  const { orgId } = await ctx.params;
  const requested = request.nextUrl.searchParams.get("locale");
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;

  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!isId(orgId)) return new NextResponse(null, { status: 404 });
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org?.isAdmin) return new NextResponse(null, { status: 403 });

  const supabase = await createClient();
  const rows: Awaited<ReturnType<typeof fetchPage>> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await fetchPage(supabase, orgId, from);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const t = await getTranslations({ locale, namespace: "Export" });
  const tr = await getTranslations({ locale, namespace: "Rating" });
  const tm = await getTranslations({ locale, namespace: "Mistake" });

  const csv = toCsv(
    [
      t("date"),
      t("student"),
      t("passage"),
      t("rating"),
      t("mistakes"),
      t("parentFeedback"),
      t("privateNote"),
      t("teacher"),
    ],
    rows.map((r) => [
      r.lesson_date,
      r.students?.display_name,
      formatPassage(passageFromRow(r), locale, ayahCount),
      tr(r.performance_rating),
      (r.mistake_categories ?? []).map((m) => tm(m)).join("، "),
      r.parent_visible_feedback,
      r.memorization_record_private_notes[0]?.body,
      r.teacher?.display_name,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lessons-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function fetchPage(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, from: number) {
  const { data, error } = await supabase
    .from("memorization_records")
    .select(
      "lesson_date, start_surah, start_ayah, end_surah, end_ayah, performance_rating, mistake_categories, parent_visible_feedback, students(display_name), teacher:profiles!memorization_records_teacher_user_id_fkey(display_name), memorization_record_private_notes(body)",
    )
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return data;
}
