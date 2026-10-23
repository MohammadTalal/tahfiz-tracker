"use client";

import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dayName, weekOrder } from "@/lib/weekdays";
import { setClassDays } from "../actions";

/** "السبت، الاثنين، الأربعاء" in week order, or nothing. */
export function DaysLabel({ days, className }: { days: number[]; className?: string }) {
  const locale = useLocale();
  if (days.length === 0) return null;
  const names = weekOrder(locale)
    .filter((d) => days.includes(d))
    .map((d) => dayName(d, locale));
  return (
    <span className={cn("text-muted-foreground inline-flex items-center gap-1.5 text-sm", className)}>
      <CalendarDays className="size-4 shrink-0" aria-hidden />
      {names.join(locale === "ar" ? "، " : ", ")}
    </span>
  );
}

/** The days a class meets: tap to toggle (admins), saved right away. */
export function ClassDaysPicker({ classId, days }: { classId: string; days: number[] }) {
  const t = useTranslations("Class");
  const te = useTranslations("Errors");
  const locale = useLocale();
  const [optimisticDays, setOptimisticDays] = useOptimistic(days);
  const [, startTransition] = useTransition();

  function toggle(day: number) {
    const next = optimisticDays.includes(day)
      ? optimisticDays.filter((d) => d !== day)
      : [...optimisticDays, day];
    startTransition(async () => {
      setOptimisticDays(next);
      const result = await setClassDays(classId, next);
      if (result?.error) toast.error(te(result.error));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1" role="group" aria-label={t("days")}>
        {weekOrder(locale).map((day) => {
          const on = optimisticDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              aria-label={dayName(day, locale)}
              title={dayName(day, locale)}
              onClick={() => toggle(day)}
              className={cn(
                "focus-visible:ring-ring h-10 rounded-lg border text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
                on ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-surface-tint",
              )}
            >
              {dayName(day, locale, "short").replace(/^ال/, "")}
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        {optimisticDays.length === 0 ? t("noDays") : t("daysHint")}
      </p>
    </div>
  );
}
