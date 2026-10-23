/**
 * Soft colour tones for telling things apart at a glance (classes, avatars).
 * Each tone is a light background with readable text, defined for both
 * themes in globals.css. Class names are written out in full so Tailwind
 * keeps them.
 */
export const TONES = {
  emerald: "bg-tone-emerald-soft text-tone-emerald",
  sky: "bg-tone-sky-soft text-tone-sky",
  amber: "bg-tone-amber-soft text-tone-amber",
  rose: "bg-tone-rose-soft text-tone-rose",
  violet: "bg-tone-violet-soft text-tone-violet",
  teal: "bg-tone-teal-soft text-tone-teal",
} as const;

export type Tone = keyof typeof TONES;
const ORDER = Object.keys(TONES) as Tone[];

/** The same tone every time for the same key (a class id, a name). */
export function toneFor(key: string): Tone {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return ORDER[Math.abs(hash) % ORDER.length]!;
}

/** Background + text classes for a key's tone. */
export function toneClasses(key: string): string {
  return TONES[toneFor(key)];
}

/** Tones in a fixed order, for lists of a few items (e.g. stat boxes). */
export function toneAt(index: number): string {
  return TONES[ORDER[index % ORDER.length]!];
}
