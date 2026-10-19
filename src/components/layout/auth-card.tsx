import type { ReactNode } from "react";

/** Card holding a sign-in style form: title, optional description, body, footer links. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-card w-full max-w-md rounded-2xl border shadow-(--shadow-soft)">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {children}
      </div>
      {footer && (
        <div className="bg-surface-tint text-muted-foreground flex flex-col items-center gap-2 rounded-b-2xl border-t px-6 py-4 text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}
