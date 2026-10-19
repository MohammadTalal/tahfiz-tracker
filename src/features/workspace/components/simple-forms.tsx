"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { TextField } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { type ActionState, idleState } from "@/lib/action-state";
import { createOrganization } from "../actions";
import { ORGANIZATION_TYPES } from "../schemas";

/**
 * One-field form (class name, student name): input and button on one row,
 * clears itself and shows a toast after success.
 */
export function NameForm({
  action,
  label,
  submitLabel,
  successMessage,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  submitLabel: string;
  successMessage?: string;
}) {
  const te = useTranslations("Errors");
  const [state, formAction] = useActionState(action, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();
  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    if (successMessage) toast.success(successMessage);
  }, [state, successMessage]);

  const fieldError = state.fieldErrors?.name;
  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-1.5" noValidate>
      {state.status === "error" && state.error !== "invalid" && <FormMessage state={state} />}
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="name"
          required
          maxLength={100}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-error` : undefined}
          className="flex-1"
        />
        <SubmitButton className="h-10">
          <Plus className="size-4" aria-hidden />
          {submitLabel}
        </SubmitButton>
      </div>
      {fieldError && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {te(fieldError)}
        </p>
      )}
    </form>
  );
}

export function CreateOrganizationForm() {
  const t = useTranslations("Onboarding");
  const [state, action] = useActionState(createOrganization, idleState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <TextField
        label={t("name")}
        name="name"
        placeholder={t("namePlaceholder")}
        required
        maxLength={150}
        error={state.fieldErrors?.name}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="organizationType">{t("type")}</Label>
        <NativeSelect id="organizationType" name="organizationType" defaultValue="mosque">
          {ORGANIZATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`type_${type}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <label className="bg-surface-tint has-checked:border-primary/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
        <input type="checkbox" name="alsoTeacher" defaultChecked className="accent-primary mt-0.5 size-4" />
        <span className="flex flex-col">
          <span className="font-medium">{t("alsoTeacher")}</span>
          <span className="text-muted-foreground">{t("alsoTeacherHint")}</span>
        </span>
      </label>
      <SubmitButton size="lg">{t("create")}</SubmitButton>
    </form>
  );
}
