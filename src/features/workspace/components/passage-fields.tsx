"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ayahCount, SURAH_COUNT } from "@/lib/quran/ayah-counts";
import type { Passage } from "@/lib/quran/passage";
import { SURAH_NAMES } from "@/lib/quran/surah-names";

export type PassageDraft = { startSurah?: number; startAyah?: number; endSurah?: number; endAyah?: number };

const SURAHS = Array.from({ length: SURAH_COUNT }, (_, i) => ({
  number: i + 1,
  ar: SURAH_NAMES[i]!.ar,
  en: SURAH_NAMES[i]!.en,
}));

const arabicDigits = new Intl.NumberFormat("ar-u-nu-arab");

/** "٦٧ الملك" / "67 Al-Mulk": number first, no punctuation, so it reads right in RTL. */
function optionLabel(n: number, locale: string) {
  const name = locale === "ar" ? SURAHS[n - 1]!.ar : SURAHS[n - 1]!.en;
  return `${locale === "ar" ? arabicDigits.format(n) : n} ${name}`;
}

// Arabic search ignores hamza/alif variants and "ال" so "ملك" finds "الملك";
// Arabic-Indic digits are treated like Western ones.
function normalize(s: string) {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^ال/, "")
    .replace(/[\s'-]/g, "");
}

function SurahSelect({
  value,
  onChange,
  label,
  invalid,
}: {
  value?: number;
  onChange: (surah: number) => void;
  label: string;
  invalid?: boolean;
}) {
  const t = useTranslations("Lesson");
  const locale = useLocale();
  const id = useId();
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return SURAHS;
    return SURAHS.filter(
      (s) => String(s.number) === q || normalize(s.ar).includes(q) || normalize(s.en).includes(q),
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder={t("searchSurah")}
          aria-label={t("searchSurah")}
          className="w-36 shrink-0"
        />
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-invalid={invalid || undefined}
          className="border-input bg-background aria-invalid:border-destructive h-9 min-w-0 flex-1 rounded-md border px-2 text-base"
        >
          <option value="" disabled>
            {t("selectSurah")}
          </option>
          {/* Keep the current choice visible even when it doesn't match the search. */}
          {value && !options.some((s) => s.number === value) && (
            <option value={value}>{optionLabel(value, locale)}</option>
          )}
          {options.map((s) => (
            <option key={s.number} value={s.number}>
              {optionLabel(s.number, locale)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AyahInput({
  label,
  value,
  max,
  onChange,
  invalid,
}: {
  label: string;
  value?: number;
  max?: number;
  onChange: (n: number | undefined) => void;
  invalid?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        aria-invalid={invalid || undefined}
        dir="ltr"
        className="text-base"
      />
    </div>
  );
}

/**
 * Surah + ayah range picker. Surah/ayah is the main input (teachers track by
 * surah); "ends in another surah" reveals a second surah for cross-surah ranges.
 */
export function PassageFields({
  value,
  onChange,
  errors,
}: {
  value: PassageDraft;
  onChange: (next: PassageDraft) => void;
  errors?: Partial<Record<keyof Passage, string>>;
}) {
  const t = useTranslations("Lesson");
  const te = useTranslations("Errors");
  const [crossSurah, setCrossSurah] = useState(
    value.endSurah !== undefined && value.startSurah !== undefined && value.endSurah !== value.startSurah,
  );

  function setStartSurah(surah: number) {
    // Default to the whole surah; the teacher narrows the range if needed.
    onChange({
      startSurah: surah,
      startAyah: 1,
      endSurah: crossSurah ? value.endSurah : surah,
      endAyah: crossSurah ? value.endAyah : ayahCount(surah),
    });
  }

  const errorKey = errors?.startSurah ?? errors?.startAyah ?? errors?.endSurah ?? errors?.endAyah;

  return (
    <div className="flex flex-col gap-3">
      <SurahSelect
        value={value.startSurah}
        onChange={setStartSurah}
        label={t("surah")}
        invalid={!!errors?.startSurah}
      />
      {crossSurah && (
        <SurahSelect
          value={value.endSurah}
          onChange={(surah) => onChange({ ...value, endSurah: surah, endAyah: ayahCount(surah) })}
          label={t("endSurah")}
          invalid={!!errors?.endSurah}
        />
      )}
      <div className="flex gap-3">
        <AyahInput
          label={t("fromAyah")}
          value={value.startAyah}
          max={value.startSurah ? ayahCount(value.startSurah) : undefined}
          onChange={(n) => onChange({ ...value, startAyah: n })}
          invalid={!!errors?.startAyah}
        />
        <AyahInput
          label={t("toAyah")}
          value={value.endAyah}
          max={value.endSurah ? ayahCount(value.endSurah) : undefined}
          onChange={(n) => onChange({ ...value, endAyah: n })}
          invalid={!!errors?.endAyah}
        />
      </div>
      {errorKey && (
        <p role="alert" className="text-destructive text-sm">
          {te(errorKey)}
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {value.startSurah && !crossSurah && (
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => setStartSurah(value.startSurah!)}
          >
            {t("wholeSurah")}
          </button>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={crossSurah}
            className="accent-primary size-4"
            onChange={(e) => {
              setCrossSurah(e.target.checked);
              if (!e.target.checked && value.startSurah) {
                onChange({ ...value, endSurah: value.startSurah, endAyah: ayahCount(value.startSurah) });
              }
            }}
          />
          {t("endsInOtherSurah")}
        </label>
      </div>
    </div>
  );
}
