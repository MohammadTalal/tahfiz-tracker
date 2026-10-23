"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { ayahCount } from "@/lib/quran/ayah-counts";
import { JUZ_COUNT, juzOf, surahsInJuz } from "@/lib/quran/divisions";
import type { Passage } from "@/lib/quran/passage";
import { SURAH_NAMES } from "@/lib/quran/surah-names";
import { Wheel, WHEEL_ITEM_HEIGHT } from "./wheel";

export type PassageDraft = { startSurah?: number; startAyah?: number; endSurah?: number; endAyah?: number };

/** Juz 30 (An-Naba to An-Nas) is where most memorization starts. */
export const DEFAULT_JUZ = 30;

const range = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/** A surah inside a juz, from the first to the last of its ayahs in that juz. */
export function passageInJuz(juz: number, surah?: number): Passage {
  const parts = surahsInJuz(juz);
  const part = parts.find((p) => p.surah === surah) ?? parts[0]!;
  return { startSurah: part.surah, startAyah: part.fromAyah, endSurah: part.surah, endAyah: part.toAyah };
}

function isComplete(p: PassageDraft): p is Passage {
  return !!(p.startSurah && p.startAyah && p.endSurah && p.endAyah);
}

const COLUMNS = "grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_3.5rem] gap-1";

/**
 * A passage inside one surah, picked with four wheels like the iPhone alarm:
 * juz, then a surah of that juz, then from and to ayah. Picking a juz or a
 * surah selects that surah's ayahs inside the juz; "to" never goes below
 * "from".
 */
export function SurahAyahFields({
  value,
  onChange,
  errors = {},
}: {
  value: PassageDraft;
  onChange: (value: PassageDraft) => void;
  errors?: Partial<Record<keyof Passage, string>>;
}) {
  const t = useTranslations("Lesson");
  const te = useTranslations("Errors");
  const locale = useLocale();
  const numbers = useMemo(() => new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-arab" : "en"), [locale]);

  // The wheels always show a passage; a blank one starts at the default juz.
  const complete = isComplete(value);
  useEffect(() => {
    if (!complete) onChange(passageInJuz(DEFAULT_JUZ));
  }, [complete, onChange]);

  const passage = complete ? value : passageInJuz(DEFAULT_JUZ);
  const juz = juzOf(passage.startSurah, passage.startAyah);
  const count = ayahCount(passage.startSurah) ?? passage.endAyah;

  const juzItems = useMemo(
    () => range(1, JUZ_COUNT).map((j) => ({ value: j, label: numbers.format(j) })),
    [numbers],
  );
  const surahItems = useMemo(
    () =>
      surahsInJuz(juz).map((p) => ({
        value: p.surah,
        label: locale === "ar" ? SURAH_NAMES[p.surah - 1]!.ar : SURAH_NAMES[p.surah - 1]!.en,
      })),
    [juz, locale],
  );
  const fromItems = useMemo(
    () => range(1, count).map((a) => ({ value: a, label: numbers.format(a) })),
    [count, numbers],
  );
  const toItems = useMemo(
    () => range(passage.startAyah, count).map((a) => ({ value: a, label: numbers.format(a) })),
    [passage.startAyah, count, numbers],
  );

  const error = errors.startSurah ?? errors.startAyah ?? errors.endAyah;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`${COLUMNS} text-muted-foreground text-center text-xs font-medium`} aria-hidden>
        <span>{t("juz")}</span>
        <span>{t("surah")}</span>
        <span>{t("fromAyah")}</span>
        <span>{t("toAyah")}</span>
      </div>
      <div className="relative">
        {/* The selection band shared by all four wheels. */}
        <div
          aria-hidden
          className="bg-mint border-primary/15 pointer-events-none absolute inset-x-0 rounded-lg border"
          style={{ top: 2 * WHEEL_ITEM_HEIGHT, height: WHEEL_ITEM_HEIGHT }}
        />
        <div className={`relative ${COLUMNS}`}>
          <Wheel label={t("juz")} items={juzItems} value={juz} onChange={(j) => onChange(passageInJuz(j))} />
          <Wheel
            label={t("surah")}
            items={surahItems}
            value={passage.startSurah}
            onChange={(surah) => onChange(passageInJuz(juz, surah))}
            itemClassName={locale === "ar" ? "font-quran" : undefined}
          />
          <Wheel
            label={t("fromAyah")}
            items={fromItems}
            value={passage.startAyah}
            onChange={(startAyah) =>
              onChange({ ...passage, startAyah, endAyah: Math.max(startAyah, passage.endAyah) })
            }
          />
          <Wheel
            label={t("toAyah")}
            items={toItems}
            value={passage.endAyah}
            onChange={(endAyah) => onChange({ ...passage, endAyah })}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {te(error)}
        </p>
      ) : (
        <p className="text-muted-foreground text-center text-xs">
          {t("ayahCount", { count: numbers.format(count) })}
        </p>
      )}
    </div>
  );
}
