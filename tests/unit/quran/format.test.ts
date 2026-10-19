import { describe, expect, it } from "vitest";
import { AYAH_COUNTS, ayahCount } from "@/lib/quran/ayah-counts";
import { formatPassage, surahName } from "@/lib/quran/format";
import { SURAH_NAMES } from "@/lib/quran/surah-names";

describe("surah names", () => {
  it("has a name for every surah", () => {
    expect(SURAH_NAMES).toHaveLength(AYAH_COUNTS.length);
    expect(surahName(1, "ar")).toBe("الفاتحة");
    expect(surahName(67, "ar")).toBe("الملك");
    expect(surahName(114, "en")).toBe("An-Naas");
  });
});

describe("formatPassage", () => {
  it("formats a range within a surah", () => {
    expect(formatPassage({ startSurah: 67, startAyah: 1, endSurah: 67, endAyah: 5 }, "en")).toBe(
      "Al-Mulk 1–5",
    );
    expect(formatPassage({ startSurah: 67, startAyah: 1, endSurah: 67, endAyah: 5 }, "ar")).toBe("الملك ١–٥");
  });

  it("shows just the name for a whole surah", () => {
    expect(formatPassage({ startSurah: 112, startAyah: 1, endSurah: 112, endAyah: 4 }, "en", ayahCount)).toBe(
      "Al-Ikhlaas",
    );
  });

  it("formats a cross-surah range", () => {
    expect(formatPassage({ startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 }, "en")).toBe(
      "An-Naba 1 – An-Naas 6",
    );
  });
});
