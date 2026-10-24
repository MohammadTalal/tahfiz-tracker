"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { type ActionState, idleState } from "@/lib/action-state";

/** Pick one item from a list and add it (a class or a student to a teacher). */
export function PickAddForm({
  label,
  placeholder,
  name,
  options,
  action,
  successMessage,
  emptyMessage,
}: {
  label: string;
  placeholder: string;
  name: string;
  options: { id: string; name: string }[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  successMessage: string;
  emptyMessage: string;
}) {
  const t = useTranslations("Class");
  const id = useId();
  const [value, setValue] = useState("");
  const [add] = useState(() => async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.status === "success") {
      setValue("");
      toast.success(successMessage);
    }
    return result;
  });
  const [state, formAction] = useActionState(add, idleState);

  if (options.length === 0) return <p className="text-muted-foreground text-xs">{emptyMessage}</p>;
  return (
    <form action={formAction} className="flex flex-col gap-1.5 border-t pt-3">
      {state.status === "error" && <FormMessage state={state} />}
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <NativeSelect
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1"
          required
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </NativeSelect>
        <SubmitButton className="h-10">
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </SubmitButton>
      </div>
    </form>
  );
}

/** A button that asks first, then runs a server action and reports the result. */
export function ConfirmActionButton({
  label,
  confirmMessage,
  successMessage,
  action,
  icon,
  variant = "outline",
  iconOnly = false,
}: {
  label: string;
  confirmMessage: string;
  successMessage?: string;
  action: () => Promise<{ error: string } | undefined | void>;
  /** A rendered icon element (components cannot cross to client code). */
  icon: ReactNode;
  variant?: "outline" | "ghost" | "destructive";
  iconOnly?: boolean;
}) {
  const te = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      size={iconOnly ? "icon-sm" : "default"}
      disabled={pending}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          const result = await action();
          if (result?.error) toast.error(te(result.error));
          else if (successMessage) toast.success(successMessage);
        });
      }}
    >
      {icon}
      {!iconOnly && label}
    </Button>
  );
}
