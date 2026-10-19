"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeAssignment } from "../actions";

/** Marks an open assignment as verified by the teacher. */
export function CompleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const t = useTranslations("Student");
  const te = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-destructive text-sm">
          {te(error)}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await completeAssignment(assignmentId);
            if (result?.error) setError(result.error);
          })
        }
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Check className="size-3.5" aria-hidden />
        )}
        {t("markDone")}
      </Button>
    </span>
  );
}
