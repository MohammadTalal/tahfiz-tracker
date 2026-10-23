import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Consistent page header: optional back link, optional leading visual
 * (avatar/icon), title, one-line description, and the page's main action.
 */
export function PageHeader({
  back,
  leading,
  title,
  description,
  actions,
}: {
  back?: { href: string; label: string };
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && (
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground -ms-1 flex w-fit items-center gap-1 rounded-md px-1 text-sm transition-colors duration-150"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-[1.75rem]">
              <bdi>{title}</bdi>
            </h1>
            {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </div>
  );
}
