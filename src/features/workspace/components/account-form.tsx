"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { TextField } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleState } from "@/lib/action-state";
import { updateAccount } from "../actions";

export function AccountForm({ displayName, phone }: { displayName: string; phone: string }) {
  const t = useTranslations("Account");
  const [state, action] = useActionState(updateAccount, idleState);
  // Controlled fields: React clears uncontrolled forms after each submit,
  // which would erase a number the person is about to correct.
  const [name, setName] = useState(displayName);
  const [phoneValue, setPhoneValue] = useState(phone);
  useEffect(() => {
    if (state.status === "success") toast.success(t("saved"));
  }, [state, t]);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.error !== "invalid" && <FormMessage state={state} />}
      <TextField
        label={t("name")}
        name="displayName"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={100}
        autoComplete="name"
        error={state.fieldErrors?.displayName}
      />
      <TextField
        label={t("phone")}
        name="phone"
        type="tel"
        dir="ltr"
        value={phoneValue}
        onChange={(e) => setPhoneValue(e.target.value)}
        maxLength={24}
        autoComplete="tel"
        placeholder="+1 604 555 0100"
        help={t("phoneHelp")}
        error={state.fieldErrors?.phone}
      />
      <SubmitButton size="lg" className="sm:w-fit">
        {t("save")}
      </SubmitButton>
    </form>
  );
}
