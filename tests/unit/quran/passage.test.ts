import { describe, expect, it } from "vitest";
import { AYAH_COUNTS, ayahCount, SURAH_COUNT, TOTAL_AYAHS } from "@/lib/quran/ayah-counts";
import { passageSchema, suggestNext, wholeSurah } from "@/lib/quran/passage";

describe("ayah counts", () => {
  it("has 114 surahs and 6,236 ayahs", () => {
    expect(AYAH_COUNTS).toHaveLength(SURAH_COUNT);
    expect(AYAH_COUNTS.reduce((a, b) => a + b, 0)).toBe(TOTAL_AYAHS);
  });

  it("knows well-known surahs", () => {
    expect(ayahCount(1)).toBe(7);
    expect(ayahCount(2)).toBe(286);
    expect(ayahCount(67)).toBe(30);
    expect(ayahCount(114)).toBe(6);
  });

  it("rejects invalid surah numbers", () => {
    expect(ayahCount(0)).toBeUndefined();
    expect(ayahCount(115)).toBeUndefined();
    expect(ayahCount(1.5)).toBeUndefined();
  });
});

describe("passageSchema", () => {
  const ok = (p: object) => passageSchema.safeParse(p).success;

  it("accepts a range within one surah", () => {
    expect(ok({ startSurah: 67, startAyah: 1, endSurah: 67, endAyah: 5 })).toBe(true);
  });

  it("accepts a range that crosses surahs (Juz 30)", () => {
    expect(ok({ startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 })).toBe(true);
  });

  it("rejects an ayah beyond the surah's length", () => {
    expect(ok({ startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 8 })).toBe(false);
  });

  it("rejects ayah 0 and surah 115", () => {
    expect(ok({ startSurah: 1, startAyah: 0, endSurah: 1, endAyah: 3 })).toBe(false);
    expect(ok({ startSurah: 115, startAyah: 1, endSurah: 115, endAyah: 1 })).toBe(false);
  });

  it("rejects an end before the start", () => {
    expect(ok({ startSurah: 67, startAyah: 10, endSurah: 67, endAyah: 5 })).toBe(false);
    expect(ok({ startSurah: 68, startAyah: 1, endSurah: 67, endAyah: 30 })).toBe(false);
  });
});

describe("wholeSurah and suggestNext", () => {
  it("builds a whole-surah passage", () => {
    expect(wholeSurah(112)).toEqual({ startSurah: 112, startAyah: 1, endSurah: 112, endAyah: 4 });
  });

  it("suggests the next 5 ayahs after 67:1-5", () => {
    expect(suggestNext({ startSurah: 67, startAyah: 1, endSurah: 67, endAyah: 5 })).toEqual({
      startSurah: 67,
      startAyah: 6,
      endSurah: 67,
      endAyah: 10,
    });
  });

  it("stops at the end of the surah", () => {
    expect(suggestNext({ startSurah: 67, startAyah: 21, endSurah: 67, endAyah: 28 })?.endAyah).toBe(30);
    expect(suggestNext({ startSurah: 67, startAyah: 26, endSurah: 67, endAyah: 30 })).toBeUndefined();
  });
});
