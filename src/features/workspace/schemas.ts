import { z } from "zod";
import { passageSchema } from "@/lib/quran/passage";
import { idSchema } from "@/lib/ids";

export const ORGANIZATION_TYPES = ["mosque", "school", "program", "center", "independent", "other"] as const;

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, { error: "required" }).max(150, { error: "tooLong" }),
  organizationType: z.enum(ORGANIZATION_TYPES).default("mosque"),
  alsoTeacher: z.literal("on").optional(),
});

export const nameSchema = z.object({
  name: z.string().trim().min(1, { error: "required" }).max(100, { error: "tooLong" }),
});

export const accountSchema = z.object({
  displayName: z.string().trim().min(1, { error: "required" }).max(100, { error: "tooLong" }),
  // Optional; same rule as the database check.
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9 ()-]{6,24})?$/, { error: "invalid_phone" }),
});

export const RATINGS = ["excellent", "very_good", "good", "needs_improvement", "not_completed"] as const;
export const MISTAKES = ["forgotten_words", "sequence", "pronunciation", "tajweed", "hesitation"] as const;

const optionalText = (max: number) => z.string().trim().max(max, { error: "tooLong" }).optional();

/** The record-lesson form, validated identically on the client and the server. */
export const recordLessonSchema = z.object({
  studentId: idSchema,
  idempotencyKey: idSchema,
  lessonDate: z.iso.date({ error: "required" }),
  passage: passageSchema,
  rating: z.enum(RATINGS, { error: "required" }),
  mistakes: z.array(z.enum(MISTAKES)).default([]),
  parentFeedback: optionalText(2000),
  privateNote: optionalText(5000),
  nextMemorization: passageSchema.nullable(),
  nextRevision: passageSchema.nullable(),
  /** The memorization assignment this lesson was for, if any (closed on save). */
  completesAssignmentId: idSchema.nullable(),
});

export type RecordLessonInput = z.input<typeof recordLessonSchema>;
