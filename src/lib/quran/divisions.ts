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

// Ayahs numbered 0..6235 across the Mushaf, for page arithmetic.
const SURAH_OFFSETS = AYAH_COUNTS.reduce<number[]>((acc, count, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1]! + AYAH_COUNTS[i - 1]!);
  return acc;
}, []);
const globalIndex = ([surah, ayah]: Point) => SURAH_OFFSETS[surah - 1]! + ayah - 1;
const PAGE_START_INDEX = PAGE_STARTS.map(globalIndex);
const TOTAL = SURAH_OFFSETS[113]! + AYAH_COUNTS[113]!;

/**
 * How many Mushaf pages a passage covers, counting each ayah as its share of
 * its page (an ayah on a 10-ayah page is 0.1). Half a page memorized is 0.5.
 */
export function pagesInPassage(p: Passage): number {
  return pagesBetween(globalIndex([p.startSurah, p.startAyah]), globalIndex([p.endSurah, p.endAyah]));
}

/** Pages covered by global ayah indexes from..to (inclusive). */
function pagesBetween(from: number, to: number): number {
  let pages = 0;
  for (let page = 0; page < PAGE_COUNT; page++) {
    const start = PAGE_START_INDEX[page]!;
    const end = (PAGE_START_INDEX[page + 1] ?? TOTAL) - 1;
    if (end < from) continue;
    if (start > to) break;
    const overlap = Math.min(end, to) - Math.max(start, from) + 1;
    pages += overlap / (end - start + 1);
  }
  return pages;
}

/**
 * Pages covered by several passages together; overlapping or repeated ayahs
 * count once (re-reciting a passage is not new memorization).
 */
export function pagesInPassages(passages: Passage[]): number {
  const ranges = passages
    .map((p) => [globalIndex([p.startSurah, p.startAyah]), globalIndex([p.endSurah, p.endAyah])] as const)
    .sort((a, b) => a[0] - b[0]);
  let pages = 0;
  let current: [number, number] | null = null;
  const flush = () => {
    if (current) pages += pagesBetween(current[0], current[1]);
  };
  for (const [from, to] of ranges) {
    if (current && from <= current[1] + 1) current[1] = Math.max(current[1], to);
    else {
      flush();
      current = [from, to];
    }
  }
  flush();
  return pages;
}
