import { AYAH_COUNTS } from "./ayah-counts";
import { JUZ_STARTS, PAGE_STARTS } from "./divisions-data";
import type { Passage } from "./passage";

export const PAGE_COUNT = 604;
export const JUZ_COUNT = 30;

type Point = readonly [number, number];

/** The ayah just before (surah, ayah); (1, 1) has none. */
function previousAyah([surah, ayah]: Point): Point {
  if (ayah > 1) return [surah, ayah - 1];
  return [surah - 1, AYAH_COUNTS[surah - 2]!];
}

const LAST_AYAH: Point = [114, AYAH_COUNTS[113]!];

/** Passage covering divisions `from`..`to` (1-based, inclusive), or undefined if out of range. */
function rangeOf(starts: readonly Point[], from: number, to: number): Passage | undefined {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > starts.length) {
    return undefined;
  }
  const start = starts[from - 1]!;
  const end = to === starts.length ? LAST_AYAH : previousAyah(starts[to]!);
  return { startSurah: start[0], startAyah: start[1], endSurah: end[0], endAyah: end[1] };
}

/** Pages `from`..`to` of the Madani Mushaf as an ayah range. */
export function passageForPages(from: number, to: number = from) {
  return rangeOf(PAGE_STARTS, from, to);
}

/** Juz `from`..`to` as an ayah range. */
export function passageForJuz(from: number, to: number = from) {
  return rangeOf(JUZ_STARTS, from, to);
}
