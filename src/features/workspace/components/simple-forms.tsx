"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { TextField } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { type ActionState, idleState } from "@/lib/action-state";
import { createOrganization } from "../actions";
import { ORGANIZATION_TYPES } from "../schemas";

/** One-field form (class name, student name) that clears itself after success. */
export function NameForm({
  action,
  label,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2" noValidate>
      {state.status === "error" && state.error !== "invalid" && <FormMessage state={state} />}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField label={label} name="name" required maxLength={100} error={state.fieldErrors?.name} />
        </div>
        <SubmitButton className="h-9">{submitLabel}</SubmitButton>
      </div>
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
        <select
          id="organizationType"
          name="organizationType"
          defaultValue="mosque"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          {ORGANIZATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`type_${type}`)}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="alsoTeacher" defaultChecked className="accent-primary size-4" />
        {t("alsoTeacher")}
      </label>
      <SubmitButton size="lg">{t("create")}</SubmitButton>
    </form>
  );
}
