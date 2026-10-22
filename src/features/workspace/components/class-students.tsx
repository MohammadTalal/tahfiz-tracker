"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useId, useTransition } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { type ActionState, idleState } from "@/lib/action-state";
import { unenrollStudent } from "../actions";

type Person = { id: string; name: string };

/** Picks a student who has no class and adds them to this one. */
export function AddExistingStudentForm({
  action,
  students,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  students: Person[];
}) {
  const t = useTranslations("Class");
  const [state, formAction] = useActionState(action, idleState);
  const id = useId();
  useEffect(() => {
    if (state.status === "success") toast.success(t("studentAdded"));
  }, [state, t]);

  if (students.length === 0) return <p className="text-muted-foreground text-xs">{t("noUnassigned")}</p>;
  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      {state.status === "error" && <FormMessage state={state} />}
      <Label htmlFor={id}>{t("existingStudent")}</Label>
      <div className="flex gap-2">
        <NativeSelect id={id} name="studentId" defaultValue="" className="min-w-0 flex-1" required>
          <option value="" disabled>
            {t("chooseStudent")}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
        <SubmitButton className="h-10">
          <UserPlus className="size-4" aria-hidden />
          {t("add")}
        </SubmitButton>
      </div>
    </form>
  );
}

export function UnenrollStudentButton({ classId, student }: { classId: string; student: Person }) {
  const t = useTranslations("Class");
  const te = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      aria-label={t("unenrollStudent", { name: student.name })}
      title={t("unenrollStudent", { name: student.name })}
      onClick={() => {
        if (!window.confirm(t("confirmUnenroll", { name: student.name }))) return;
        startTransition(async () => {
          const result = await unenrollStudent(classId, student.id);
          if (result?.error) toast.error(te(result.error));
          else toast.success(t("studentUnenrolled"));
        });
      }}
    >
      <UserMinus className="size-4" aria-hidden />
    </Button>
  );
}
