/** Weekdays as 0 = Sunday … 6 = Saturday, like Date#getDay(). */

/** Week order for display: Saturday first in Arabic, Sunday first in English. */
export function weekOrder(locale: string): number[] {
  return locale === "ar" ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
}

/** Weekday name (7 Jan 2024 was a Sunday). */
export function dayName(day: number, locale: string, width: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + day)),
  );
}

/** Weekday of a "YYYY-MM-DD" date. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}
