import { z } from "zod";
import { ayahCount, SURAH_COUNT } from "./ayah-counts";

/** A Quran passage. May cross surahs. Mirrors the database CHECK and FKs. */
export const passageSchema = z
  .object({
    // Error messages are translation keys (Errors.*).
    startSurah: z
      .int({ error: "required" })
      .min(1, { error: "required" })
      .max(SURAH_COUNT, { error: "required" }),
    startAyah: z.int({ error: "required" }).min(1, { error: "required" }),
    endSurah: z
      .int({ error: "required" })
      .min(1, { error: "required" })
      .max(SURAH_COUNT, { error: "required" }),
    endAyah: z.int({ error: "required" }).min(1, { error: "required" }),
  })
  .superRefine((p, ctx) => {
    const startMax = ayahCount(p.startSurah);
    const endMax = ayahCount(p.endSurah);
    if (startMax !== undefined && p.startAyah > startMax) {
      ctx.addIssue({ code: "custom", path: ["startAyah"], message: "ayah_out_of_range" });
    }
    if (endMax !== undefined && p.endAyah > endMax) {
      ctx.addIssue({ code: "custom", path: ["endAyah"], message: "ayah_out_of_range" });
    }
    if (comparePoints(p.startSurah, p.startAyah, p.endSurah, p.endAyah) > 0) {
      ctx.addIssue({ code: "custom", path: ["endAyah"], message: "end_before_start" });
    }
  });

export type Passage = z.infer<typeof passageSchema>;

/** Negative if a comes before b, 0 if equal, positive if after. */
export function comparePoints(aSurah: number, aAyah: number, bSurah: number, bAyah: number): number {
  return aSurah !== bSurah ? aSurah - bSurah : aAyah - bAyah;
}

/** A whole surah as a passage — the default when a teacher picks a surah. */
export function wholeSurah(surah: number): Passage {
  const count = ayahCount(surah);
  if (count === undefined) throw new RangeError(`Invalid surah: ${surah}`);
  return { startSurah: surah, startAyah: 1, endSurah: surah, endAyah: count };
}

/**
 * Suggests the next passage of the same length after `previous`, staying
 * within the same surah. Returns undefined at the end of a surah; the teacher
 * always confirms or changes the suggestion.
 */
export function suggestNext(previous: Passage): Passage | undefined {
  if (previous.startSurah !== previous.endSurah) return undefined;
  const count = ayahCount(previous.endSurah);
  if (count === undefined || previous.endAyah >= count) return undefined;
  const length = previous.endAyah - previous.startAyah + 1;
  const startAyah = previous.endAyah + 1;
  return {
    startSurah: previous.endSurah,
    startAyah,
    endSurah: previous.endSurah,
    endAyah: Math.min(startAyah + length - 1, count),
  };
}
