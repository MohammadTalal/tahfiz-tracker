import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "invalid_email" }));
const newPassword = z.string().min(8, { error: "password_too_short" }).max(72, { error: "tooLong" });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "required" }),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(1, { error: "required" }).max(100, { error: "tooLong" }),
  email,
  password: newPassword,
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwords_do_not_match",
  });
