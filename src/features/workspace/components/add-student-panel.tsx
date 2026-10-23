"use client";

import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { idleState } from "@/lib/action-state";
import { addStudent } from "../actions";

/**
 * "Add student" on the Students page (admins): name and class in one small
 * form. A name that already exists asks for a second press, as on class pages.
 */
export function AddStudentPanel({ classes }: { classes: { id: string; name: string }[] }) {
  const t = useTranslations("Students");
  const tc = useTranslations("Class");
  const te = useTranslations("Errors");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addStudent, idleState);
  const [submitted, setSubmitted] = useState({ name: "", classId: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    toast.success(tc("studentAdded"));
  }, [state, tc]);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" aria-hidden />
        {t("addStudent")}
      </Button>
    );
  }

  const isError = state.status === "error";
  const needsConfirm = state.error === "duplicate_student";
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        setSubmitted({
          name: String(data.get("name") ?? "").trim(),
          classId: String(data.get("classId") ?? ""),
        });
      }}
      noValidate
      className="bg-card flex w-full flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <UserPlus className="text-primary size-4" aria-hidden />
          {t("addStudent")}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("close")}
          onClick={() => setOpen(false)}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      {classes.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("createClassFirst")}</p>
      ) : (
        <>
          {isError && state.error !== "invalid" && <FormMessage state={state} />}
          {needsConfirm && <input type="hidden" name="confirmedName" value={submitted.name} />}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-name`}>{tc("studentName")}</Label>
              <Input
                id={`${id}-name`}
                name="name"
                required
                maxLength={100}
                // React clears the form after each submit; keep the values on errors.
                defaultValue={isError ? submitted.name : ""}
                aria-invalid={state.fieldErrors?.name ? true : undefined}
              />
              {state.fieldErrors?.name && (
                <p role="alert" className="text-destructive text-sm">
                  {te(state.fieldErrors.name)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-class`}>{t("class")}</Label>
              <NativeSelect
                id={`${id}-class`}
                name="classId"
                defaultValue={isError ? submitted.classId : classes.length === 1 ? classes[0]!.id : ""}
                key={isError ? `e-${submitted.classId}` : "fresh"}
                required
              >
                <option value="" disabled>
                  {t("chooseClass")}
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
              {state.fieldErrors?.classId && (
                <p role="alert" className="text-destructive text-sm">
                  {te(state.fieldErrors.classId)}
                </p>
              )}
            </div>
            <SubmitButton className="h-10">
              <UserPlus className="size-4" aria-hidden />
              {tc("add")}
            </SubmitButton>
          </div>
          <p className="text-muted-foreground text-xs">{tc("nameHint")}</p>
        </>
      )}
    </form>
  );
}
