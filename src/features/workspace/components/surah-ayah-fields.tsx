"use client";

import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ayahCount, SURAH_COUNT } from "@/lib/quran/ayah-counts";
import type { Passage } from "@/lib/quran/passage";
import { SURAH_NAMES } from "@/lib/quran/surah-names";
import { cn } from "@/lib/utils";

export type PassageDraft = { startSurah?: number; startAyah?: number; endSurah?: number; endAyah?: number };

const arabicDigits = new Intl.NumberFormat("ar-u-nu-arab");

/** "٦٧ الملك" / "67 Al-Mulk": number first, no punctuation, so it reads right in RTL. */
function surahLabel(n: number, locale: string) {
  const name = locale === "ar" ? SURAH_NAMES[n - 1]!.ar : SURAH_NAMES[n - 1]!.en;
  return `${locale === "ar" ? arabicDigits.format(n) : n} ${name}`;
}

function toAyah(value: string): number | undefined {
  const n = Number(value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)));
  return value.trim() && Number.isInteger(n) ? n : undefined;
}

/**
 * A passage inside one surah: surah, then "from ayah" and "to ayah" on one
 * row. The end surah always follows the start surah.
 */
export function SurahAyahFields({
  value,
  onChange,
  errors = {},
  compact = false,
}: {
  value: PassageDraft;
  onChange: (value: PassageDraft) => void;
  errors?: Partial<Record<keyof Passage, string>>;
  compact?: boolean;
}) {
  const t = useTranslations("Lesson");
  const te = useTranslations("Errors");
  const locale = useLocale();
  const id = useId();
  const count = value.startSurah ? ayahCount(value.startSurah) : undefined;
  const ayahError = errors.startAyah ?? errors.endAyah;
  const fmt = (n: number) => (locale === "ar" ? arabicDigits.format(n) : String(n));

  return (
    <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-surah`}>{t("surah")}</Label>
        <NativeSelect
          id={`${id}-surah`}
          value={value.startSurah ?? ""}
          aria-invalid={errors.startSurah ? true : undefined}
          onChange={(e) => {
            const surah = Number(e.target.value);
            // A new surah defaults to the whole surah: first to last ayah.
            onChange({ startSurah: surah, startAyah: 1, endSurah: surah, endAyah: ayahCount(surah) });
          }}
          className="h-12 text-base"
        >
          <option value="" disabled>
            {t("selectSurah")}
          </option>
          {Array.from({ length: SURAH_COUNT }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {surahLabel(i + 1, locale)}
            </option>
          ))}
        </NativeSelect>
        {errors.startSurah && <p className="text-destructive text-sm">{te(errors.startSurah)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AyahInput
          id={`${id}-from`}
          label={t("fromAyah")}
          value={value.startAyah}
          min={1}
          max={value.endAyah ?? count}
          invalid={!!errors.startAyah}
          onChange={(startAyah) => onChange({ ...value, startAyah, endSurah: value.startSurah })}
        />
        <AyahInput
          id={`${id}-to`}
          label={t("toAyah")}
          placeholder={count !== undefined ? String(count) : undefined}
          value={value.endAyah}
          min={value.startAyah ?? 1}
          max={count}
          invalid={!!errors.endAyah}
          onChange={(endAyah) => onChange({ ...value, endAyah, endSurah: value.startSurah })}
        />
      </div>
      {ayahError ? (
        <p role="alert" className="text-destructive -mt-1 text-sm">
          {te(ayahError)}
        </p>
      ) : (
        count !== undefined && (
          <p className="text-muted-foreground -mt-1 text-xs">{t("ayahCount", { count: fmt(count) })}</p>
        )
      )}
    </div>
  );
}

function AyahInput({
  id,
  label,
  value,
  invalid,
  placeholder,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value?: number;
  invalid: boolean;
  placeholder?: string;
  min: number;
  max?: number;
  onChange: (value: number | undefined) => void;
}) {
  const t = useTranslations("Lesson");
  // One tap moves the ayah by one, within the surah and the range.
  const step = (delta: number) => {
    const base = value ?? (delta > 0 ? min - 1 : (max ?? min) + 1);
    const nextValue = Math.max(min, Math.min(max ?? Infinity, base + delta));
    onChange(nextValue);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-1" dir="ltr">
        <StepButton
          label={t("ayahLess", { field: label })}
          disabled={value !== undefined && value <= min}
          onClick={() => step(-1)}
        >
          <Minus className="size-4" aria-hidden />
        </StepButton>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="next"
          dir="ltr"
          autoComplete="off"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(toAyah(e.target.value))}
          onFocus={(e) => e.target.select()}
          aria-invalid={invalid ? true : undefined}
          className="h-12 min-w-0 flex-1 px-1 text-center text-lg font-semibold"
        />
        <StepButton
          label={t("ayahMore", { field: label })}
          disabled={value !== undefined && max !== undefined && value >= max}
          onClick={() => step(1)}
        >
          <Plus className="size-4" aria-hidden />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="bg-surface-tint hover:bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-lg border transition-colors duration-150 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
