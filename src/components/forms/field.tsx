"use client";

import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BaseProps = {
  label: ReactNode;
  error?: string;
  help?: ReactNode;
};

function FieldShell({ id, label, error, help, children }: BaseProps & { id: string; children: ReactNode }) {
  const t = useTranslations("Errors");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="text-muted-foreground text-sm">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, help?: ReactNode) {
  return error ? `${id}-error` : help ? `${id}-help` : undefined;
}

export function TextField({ label, error, help, ...props }: BaseProps & ComponentProps<typeof Input>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} help={help}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, help)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, error, help, ...props }: BaseProps & ComponentProps<typeof Textarea>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} help={help}>
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, help)}
        {...props}
      />
    </FieldShell>
  );
}
