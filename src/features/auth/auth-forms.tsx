"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { TextField } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Link } from "@/i18n/navigation";
import { idleState } from "@/lib/action-state";
import { forgotPassword, login, resetPassword, signup } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const [state, action] = useActionState(login, idleState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        label={t("email")}
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label={t("password")}
        name="password"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton size="lg">{t("loginButton")}</SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const [state, action] = useActionState(signup, idleState);
  if (state.status === "success") return <FormMessage state={state} successNamespace="Auth" />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        label={t("displayName")}
        name="displayName"
        autoComplete="name"
        required
        maxLength={100}
        error={state.fieldErrors?.displayName}
      />
      <TextField
        label={t("email")}
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label={t("password")}
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        minLength={8}
        error={state.fieldErrors?.password}
      />
      <p className="text-muted-foreground text-sm">
        {t.rich("agreement", {
          terms: (chunks) => (
            <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <SubmitButton size="lg">{t("signupButton")}</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const [state, action] = useActionState(forgotPassword, idleState);
  if (state.status === "success") return <FormMessage state={state} successNamespace="Auth" />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <TextField
        label={t("email")}
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        error={state.fieldErrors?.email}
      />
      <SubmitButton size="lg">{t("sendLink")}</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const [state, action] = useActionState(resetPassword, idleState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <TextField
        label={t("newPassword")}
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        minLength={8}
        error={state.fieldErrors?.password}
      />
      <TextField
        label={t("confirmPassword")}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton size="lg">{t("resetButton")}</SubmitButton>
    </form>
  );
}
