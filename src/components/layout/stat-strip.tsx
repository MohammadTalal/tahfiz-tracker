import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toneAt } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type Stat = { icon: LucideIcon; label: string; value: ReactNode };

/** A flat row of key facts (not a card per number). Stacks on small screens. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="bg-card grid divide-y rounded-xl border shadow-(--shadow-soft) sm:auto-cols-fr sm:grid-flow-col sm:divide-y-0 sm:[&>*+*]:border-s">
      {stats.map(({ icon: Icon, label, value }, i) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3.5">
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
