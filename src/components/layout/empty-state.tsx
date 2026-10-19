import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A friendly placeholder for an empty list: icon, one-line title, hint, optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-surface-tint flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center">
      <span className="bg-mint text-primary grid size-10 place-items-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
