import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Lessons per day as a single-series bar chart. Each column is a hover
 * target with its own tooltip; a visually hidden table carries the numbers.
 */
export function ActivityChart({ days }: { days: { date: string; count: number }[] }) {
  const t = useTranslations("OrgDashboard");
  const locale = useLocale();
  const max = Math.max(1, ...days.map((d) => d.count));
  const numbering = locale === "ar" ? "arab" : "latn";
  const dayNumber = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone: "UTC",
    numberingSystem: numbering,
  });
  const fullDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    numberingSystem: numbering,
  });
  const asDate = (d: string) => new Date(`${d}T00:00:00Z`);
  const last = days.length - 1;

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-36 items-end gap-0.5" aria-hidden>
        {days.map((d, i) => (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
            {/* Tooltip */}
            <div className="bg-foreground text-background pointer-events-none absolute start-1/2 bottom-full z-10 mb-1 hidden -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-md group-hover:block rtl:translate-x-1/2">
              <span className="font-semibold">{t("lessonsCount", { count: d.count })}</span>
              <span className="opacity-80"> · {fullDate.format(asDate(d.date))}</span>
            </div>
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-colors duration-150",
                d.count === 0 ? "bg-border h-0.5" : "bg-primary/80 group-hover:bg-primary",
                i === last && d.count > 0 && "bg-primary",
              )}
              style={d.count > 0 ? { height: `${Math.max(6, (d.count / max) * 100)}%` } : undefined}
            />
          </div>
        ))}
      </div>
      <div className="text-subtle-foreground flex gap-0.5 border-t pt-1 text-[0.65rem]" aria-hidden>
        {days.map((d, i) => (
          <span
            key={d.date}
            className={cn("flex-1 text-center", i === last && "text-foreground font-semibold")}
          >
            {dayNumber.format(asDate(d.date))}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{t("activityTitle")}</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{fullDate.format(asDate(d.date))}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
