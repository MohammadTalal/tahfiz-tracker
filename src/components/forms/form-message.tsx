"use client";

import { useTranslations } from "next-intl";
import type { ActionState } from "@/lib/action-state";

/** Shows a form-level error (Errors.*) or success message (namespace of `successNamespace`). */
export function FormMessage({
  state,
  successNamespace = "Common",
}: {
  state: ActionState;
  successNamespace?: string;
}) {
  const tErrors = useTranslations("Errors");
  const tSuccess = useTranslations(successNamespace);
  if (state.status === "error" && state.error) {
    return (
      <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
        {tErrors(state.error)}
      </p>
    );
  }
  if (state.status === "success" && state.message) {
    return (
      <p role="status" className="bg-primary/10 text-primary rounded-md px-3 py-2 text-sm">
        {tSuccess(state.message)}
      </p>
    );
  }
  return null;
}
