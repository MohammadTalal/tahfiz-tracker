"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "../actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const t = useTranslations("Invite");
  const te = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error === "invalid" ? t("invalid") : te(error)}
        </p>
      )}
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvite(token);
            if (result?.error) setError(result.error);
          })
        }
      >
        {t("accept")}
      </Button>
    </div>
  );
}
