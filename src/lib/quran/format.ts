import type { Passage } from "./passage";
import { SURAH_NAMES } from "./surah-names";

export type QuranLocale = "ar" | "en";

export function surahName(surah: number, locale: QuranLocale): string {
  const names = SURAH_NAMES[surah - 1];
  if (!names) return String(surah);
  return locale === "ar" ? names.ar : names.en;
}

function num(n: number, locale: QuranLocale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-arab" : "en").format(n);
}

/**
 * Human label for a passage, e.g. "الملك ١–٥", "Al-Mulk 1–5",
 * "An-Naba 1 – An-Naas 6". A whole surah shows just its name.
 */
export function formatPassage(
  p: Passage,
  locale: QuranLocale,
  ayahCount?: (surah: number) => number | undefined,
) {
  if (p.startSurah === p.endSurah) {
    const name = surahName(p.startSurah, locale);
    if (p.startAyah === 1 && ayahCount?.(p.startSurah) === p.endAyah) return name;
    if (p.startAyah === p.endAyah) return `${name} ${num(p.startAyah, locale)}`;
    return `${name} ${num(p.startAyah, locale)}–${num(p.endAyah, locale)}`;
  }
  return `${surahName(p.startSurah, locale)} ${num(p.startAyah, locale)} – ${surahName(p.endSurah, locale)} ${num(p.endAyah, locale)}`;
}

/** Convert a database row's snake_case passage columns to a Passage. */
export function passageFromRow(row: {
  start_surah: number;
  start_ayah: number;
  end_surah: number;
  end_ayah: number;
}): Passage {
  return {
    startSurah: row.start_surah,
    startAyah: row.start_ayah,
    endSurah: row.end_surah,
    endAyah: row.end_ayah,
  };
}
