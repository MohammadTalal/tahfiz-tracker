"use client";

import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useId, useTransition } from "react";
import { toast } from "sonner";
import { InitialAvatar } from "@/components/layout/avatar";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { type ActionState, idleState } from "@/lib/action-state";
import { removeTeacher } from "../actions";

type Person = { id: string; name: string };

/** Teachers of a class, with assign / remove controls for admins. */
export function ClassTeachers({
  classId,
  assigned,
  available,
  canManage,
  assignAction,
}: {
  classId: string;
  assigned: Person[];
  available: Person[];
  canManage: boolean;
  assignAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const t = useTranslations("Class");
  return (
    <div className="flex flex-col gap-3">
      {assigned.length === 0 ? (
        <p className="bg-warning-soft text-warning rounded-lg p-2.5 text-sm">{t("noTeachersAssigned")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assigned.map((teacher) => (
            <li key={teacher.id} className="flex items-center gap-2">
              <InitialAvatar name={teacher.name} size="sm" />
              <span className="flex-1 truncate text-sm font-medium">{teacher.name}</span>
              {canManage && <RemoveTeacherButton classId={classId} teacher={teacher} />}
            </li>
          ))}
        </ul>
      )}
      {canManage &&
        (available.length > 0 ? (
          <AssignTeacherForm action={assignAction} available={available} />
        ) : (
          <p className="text-muted-foreground text-xs">{t("allTeachersAssigned")}</p>
        ))}
    </div>
  );
}

function AssignTeacherForm({
  action,
  available,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  available: Person[];
}) {
  const t = useTranslations("Class");
  const [state, formAction] = useActionState(action, idleState);
  const id = useId();
  useEffect(() => {
    if (state.status === "success") toast.success(t("teacherAssigned"));
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-1.5 border-t pt-3">
      {state.status === "error" && <FormMessage state={state} />}
      <Label htmlFor={id}>{t("assignTeacher")}</Label>
      <div className="flex gap-2">
        <NativeSelect id={id} name="teacherId" defaultValue="" className="min-w-0 flex-1" required>
          <option value="" disabled>
            {t("chooseTeacher")}
          </option>
          {available.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </NativeSelect>
        <SubmitButton className="h-10">
          <UserPlus className="size-4" aria-hidden />
          {t("assign")}
        </SubmitButton>
      </div>
    </form>
  );
}

function RemoveTeacherButton({ classId, teacher }: { classId: string; teacher: Person }) {
  const t = useTranslations("Class");
  const te = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      aria-label={t("removeTeacher", { name: teacher.name })}
      title={t("removeTeacher", { name: teacher.name })}
      onClick={() => {
        // Removing a teacher ends their access to this class's students.
        if (!window.confirm(t("confirmRemove", { name: teacher.name }))) return;
        startTransition(async () => {
          const result = await removeTeacher(classId, teacher.id);
          if (result?.error) toast.error(te(result.error));
          else toast.success(t("teacherRemoved"));
        });
      }}
    >
      <X className="size-4" aria-hidden />
    </Button>
  );
}
