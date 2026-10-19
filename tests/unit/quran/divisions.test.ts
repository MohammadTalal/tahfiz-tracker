import { describe, expect, it } from "vitest";
import { JUZ_STARTS, PAGE_STARTS } from "@/lib/quran/divisions-data";
import { passageForJuz, passageForPages } from "@/lib/quran/divisions";
import { passageSchema } from "@/lib/quran/passage";

describe("division data", () => {
  it("has 604 pages and 30 juz", () => {
    expect(PAGE_STARTS).toHaveLength(604);
    expect(JUZ_STARTS).toHaveLength(30);
  });
});

describe("passageForPages", () => {
  it("page 1 is Al-Fatiha", () => {
    expect(passageForPages(1)).toEqual({ startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 7 });
  });

  it("page 562 starts Al-Mulk", () => {
    expect(passageForPages(562)).toMatchObject({ startSurah: 67, startAyah: 1 });
  });

  it("the last page ends with An-Nas", () => {
    expect(passageForPages(604)).toMatchObject({ endSurah: 114, endAyah: 6 });
  });

  it("a page range ends where the next page begins", () => {
    const range = passageForPages(2, 3)!;
    expect(range).toMatchObject({ startSurah: 2, startAyah: 1 });
    expect(range.endSurah * 1000 + range.endAyah).toBeLessThan(
      PAGE_STARTS[3]![0] * 1000 + PAGE_STARTS[3]![1],
    );
  });

  it("every page is a valid passage", () => {
    for (let p = 1; p <= 604; p++) {
      expect(passageSchema.safeParse(passageForPages(p)).success, `page ${p}`).toBe(true);
    }
  });

  it("rejects invalid pages", () => {
    expect(passageForPages(0)).toBeUndefined();
    expect(passageForPages(605)).toBeUndefined();
    expect(passageForPages(10, 5)).toBeUndefined();
  });
});

describe("passageForJuz", () => {
  it("juz 30 is An-Naba to An-Nas", () => {
    expect(passageForJuz(30)).toEqual({ startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 });
  });

  it("juz 1 ends just before 2:142", () => {
    expect(passageForJuz(1)).toEqual({ startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 });
  });

  it("juz 29 starts with Al-Mulk", () => {
    expect(passageForJuz(29)).toMatchObject({ startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 });
  });
});
