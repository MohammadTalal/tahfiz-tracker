"use client";

import { Loader2, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { TextAreaField, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { suggestNext, type Passage } from "@/lib/quran/passage";
import { recordLesson } from "../actions";
import { MISTAKES, RATINGS, recordLessonSchema, type RecordLessonInput } from "../schemas";
import { type PassageDraft, PassageFields } from "./passage-fields";

type Rating = (typeof RATINGS)[number];
type Mistake = (typeof MISTAKES)[number];

type FormState = {
  idempotencyKey: string;
  lessonDate: string;
  passage: PassageDraft;
  rating?: Rating;
  mistakes: Mistake[];
  parentFeedback: string;
  privateNote: string;
  assignNext: boolean;
  nextMemorization: PassageDraft;
  nextTouched: boolean;
  assignRevision: boolean;
  nextRevision: PassageDraft;
};

type Status = "idle" | "saving" | "offline" | "error";

const DRAFT_VERSION = 1;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isComplete(p: PassageDraft): p is Passage {
  return !!(p.startSurah && p.startAyah && p.endSurah && p.endAyah);
}

function suggestionFor(p: PassageDraft): PassageDraft {
  return isComplete(p) ? (suggestNext(p) ?? {}) : {};
}

function initialState(defaultPassage: Passage | null): FormState {
  const nextMemorization = defaultPassage ? suggestionFor(defaultPassage) : {};
  return {
    idempotencyKey: "",
    lessonDate: "",
    passage: defaultPassage ?? {},
    mistakes: [],
    parentFeedback: "",
    privateNote: "",
    assignNext: isComplete(nextMemorization),
    nextMemorization,
    nextTouched: false,
    assignRevision: false,
    nextRevision: {},
  };
}

function toInput(studentId: string, assignmentId: string | null, s: FormState): RecordLessonInput {
  return {
    studentId,
    idempotencyKey: s.idempotencyKey,
    lessonDate: s.lessonDate,
    passage: s.passage as Passage,
    rating: s.rating as Rating,
    mistakes: s.mistakes,
    parentFeedback: s.parentFeedback,
    privateNote: s.privateNote,
    nextMemorization: s.assignNext ? (s.nextMemorization as Passage) : null,
    nextRevision: s.assignRevision ? (s.nextRevision as Passage) : null,
    completesAssignmentId: assignmentId,
  };
}

/** Errors keyed like "passage.startAyah" → { startAyah: key } for one passage group. */
function passageErrors(errors: Record<string, string>, prefix: string) {
  const out: Partial<Record<keyof Passage, string>> = {};
  for (const [path, message] of Object.entries(errors)) {
    if (path === prefix) out.endAyah ??= message;
    if (path.startsWith(`${prefix}.`)) out[path.slice(prefix.length + 1) as keyof Passage] ??= message;
  }
  return out;
}

type Props = {
  studentId: string;
  studentHref: string;
  defaultPassage: Passage | null;
  defaultSource: "assignment" | "suggestion" | null;
  /** Open memorization assignment the lesson is for; closed when the lesson is saved. */
  assignmentId: string | null;
};

const noopSubscribe = () => () => {};

/**
 * The form depends on the device (saved draft, today's local date, a fresh
 * idempotency key), so it renders only in the browser.
 */
export function RecordLessonForm(props: Props) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const tc = useTranslations("Common");
  if (!isClient) return <p className="text-muted-foreground">{tc("loading")}</p>;
  return <LessonForm {...props} />;
}

function draftKeyFor(studentId: string) {
  return `lesson-draft:v${DRAFT_VERSION}:${studentId}`;
}

/** An unsaved draft for this student, or a fresh state with a new idempotency key. */
function loadOrStart(
  studentId: string,
  defaultPassage: Passage | null,
): { state: FormState; restored: boolean } {
  try {
    const raw = window.localStorage.getItem(draftKeyFor(studentId));
    const draft = raw ? (JSON.parse(raw) as FormState) : null;
    if (draft?.idempotencyKey) return { state: draft, restored: true };
  } catch {
    // Storage unavailable (private mode) or corrupt: start fresh.
  }
  return {
    state: { ...initialState(defaultPassage), idempotencyKey: crypto.randomUUID(), lessonDate: today() },
    restored: false,
  };
}

function LessonForm({ studentId, studentHref, defaultPassage, defaultSource, assignmentId }: Props) {
  const t = useTranslations("Lesson");
  const tr = useTranslations("Rating");
  const tm = useTranslations("Mistake");
  const te = useTranslations("Errors");
  const router = useRouter();
  const draftKey = draftKeyFor(studentId);

  const [initial] = useState(() => loadOrStart(studentId, defaultPassage));
  const [state, setState] = useState<FormState>(initial.state);
  const [restored, setRestored] = useState(initial.restored);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const saving = useRef(false);
  // Set after a successful save so the reset form is not stored as a new draft.
  const skipNextPersist = useRef(false);

  // Keep the draft on the device until the lesson is saved.
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(state));
    } catch {
      // Ignore quota/private-mode errors.
    }
  }, [draftKey, state]);

  const update = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));

  function setPassage(passage: PassageDraft) {
    setState((s) => {
      if (s.nextTouched) return { ...s, passage };
      const nextMemorization = suggestionFor(passage);
      return { ...s, passage, nextMemorization, assignNext: isComplete(nextMemorization) };
    });
  }

  const submit = useCallback(async () => {
    if (saving.current) return;
    const input = toInput(studentId, assignmentId, state);
    const parsed = recordLessonSchema.safeParse(input);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      setFormError("invalid");
      setStatus("error");
      return;
    }

    saving.current = true;
    setErrors({});
    setFormError(null);
    setStatus("saving");
    try {
      const result = await recordLesson(input);
      if (result.ok) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {}
        // Next.js keeps visited routes mounted (hidden) for back/forward, so
        // reset now: a reused idempotency key would turn the next lesson into
        // a duplicate of this one.
        skipNextPersist.current = true;
        setState({
          ...initialState(defaultPassage),
          idempotencyKey: crypto.randomUUID(),
          lessonDate: today(),
        });
        setRestored(false);
        setStatus("idle");
        router.push(studentHref);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      setStatus("error");
    } catch {
      // Network failure: the draft stays on the device; retried when back online.
      setStatus("offline");
    } finally {
      saving.current = false;
    }
  }, [assignmentId, defaultPassage, draftKey, router, state, studentHref, studentId]);

  useEffect(() => {
    if (status !== "offline") return;
    window.addEventListener("online", submit);
    return () => window.removeEventListener("online", submit);
  }, [status, submit]);

  function discardDraft() {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {}
    setState({ ...initialState(defaultPassage), idempotencyKey: crypto.randomUUID(), lessonDate: today() });
    setRestored(false);
    setErrors({});
    setStatus("idle");
  }

  const ratingGroup = useId();

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {restored && (
        <div
          role="status"
          className="bg-muted flex flex-wrap items-center justify-between gap-2 rounded-md p-3 text-sm"
        >
          <span>{t("draftRestored")}</span>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            {t("discardDraft")}
          </Button>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("passage")}</h2>
        {defaultSource && !restored && (
          <p className="text-muted-foreground text-sm">
            {defaultSource === "assignment" ? t("fromAssignment") : t("suggested")}
          </p>
        )}
        <PassageFields
          value={state.passage}
          onChange={setPassage}
          errors={passageErrors(errors, "passage")}
        />
      </section>

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={errors.rating ? `${ratingGroup}-error` : undefined}
      >
        <legend className="mb-2 font-semibold">{t("rating")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RATINGS.map((rating) => (
            <label
              key={rating}
              className="has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-ring flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 text-center text-sm font-medium has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name={ratingGroup}
                value={rating}
                checked={state.rating === rating}
                onChange={() => update({ rating })}
                className="sr-only"
              />
              {tr(rating)}
            </label>
          ))}
        </div>
        {errors.rating && (
          <p id={`${ratingGroup}-error`} role="alert" className="text-destructive text-sm">
            {te(errors.rating)}
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{t("mistakes")}</legend>
        <div className="flex flex-wrap gap-2">
          {MISTAKES.map((mistake) => (
            <label
              key={mistake}
              className="has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-ring flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm has-focus-visible:ring-2"
            >
              <input
                type="checkbox"
                checked={state.mistakes.includes(mistake)}
                onChange={(e) =>
                  update({
                    mistakes: e.target.checked
                      ? [...state.mistakes, mistake]
                      : state.mistakes.filter((m) => m !== mistake),
                  })
                }
                className="sr-only"
              />
              {tm(mistake)}
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        label={t("parentFeedback")}
        help={t("parentFeedbackHelp")}
        value={state.parentFeedback}
        onChange={(e) => update({ parentFeedback: e.target.value })}
        maxLength={2000}
        rows={2}
        error={errors.parentFeedback}
      />
      <TextAreaField
        label={t("privateNote")}
        help={t("privateNoteHelp")}
        value={state.privateNote}
        onChange={(e) => update({ privateNote: e.target.value })}
        maxLength={5000}
        rows={2}
        error={errors.privateNote}
      />

      <section className="flex flex-col gap-3 rounded-lg border p-3">
        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={state.assignNext}
            onChange={(e) => update({ assignNext: e.target.checked })}
            className="accent-primary size-4"
          />
          {t("nextMemorization")}
        </label>
        {state.assignNext && (
          <PassageFields
            value={state.nextMemorization}
            onChange={(nextMemorization) => update({ nextMemorization, nextTouched: true })}
            errors={passageErrors(errors, "nextMemorization")}
          />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border p-3">
        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={state.assignRevision}
            onChange={(e) => update({ assignRevision: e.target.checked })}
            className="accent-primary size-4"
          />
          {t("nextRevision")}
        </label>
        {state.assignRevision && (
          <PassageFields
            value={state.nextRevision}
            onChange={(nextRevision) => update({ nextRevision })}
            errors={passageErrors(errors, "nextRevision")}
          />
        )}
      </section>

      <TextField
        label={t("date")}
        type="date"
        value={state.lessonDate}
        onChange={(e) => update({ lessonDate: e.target.value })}
        error={errors.lessonDate}
        dir="ltr"
        className="w-44"
      />

      {status === "offline" && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-3 text-sm"
        >
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          {te("network")}
        </p>
      )}
      {status === "error" && formError && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {te(formError)}
        </p>
      )}

      <div className="bg-background/95 sticky bottom-0 -mx-4 border-t px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={status === "saving"}>
          {status === "saving" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
