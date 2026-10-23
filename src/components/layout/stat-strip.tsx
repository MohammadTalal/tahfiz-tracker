import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toneAt } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type Stat = { icon: LucideIcon; label: string; value: ReactNode };

/**
 * A flat row of key facts (not a card per number). Two per row on phones
 * (an odd last one spans both); one row from sm up. The 1px gaps over the
 * border colour draw the dividers.
 */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border shadow-(--shadow-soft) sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
      {stats.map(({ icon: Icon, label, value }, i) => (
        <div
          key={label}
          className="bg-card flex items-center gap-3 px-4 py-3.5 last:odd:col-span-2 sm:last:odd:col-span-1"
        >
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", toneAt(i))}>
            <Icon className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="truncate font-semibold">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
