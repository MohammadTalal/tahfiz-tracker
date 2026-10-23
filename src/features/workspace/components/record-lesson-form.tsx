"use client";

import {
  BookMarked,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  History,
  Loader2,
  Repeat2,
  Save,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { TextAreaField, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { ayahCount } from "@/lib/quran/ayah-counts";
import { formatPassage, type QuranLocale } from "@/lib/quran/format";
import { suggestNext, type Passage } from "@/lib/quran/passage";
import { cn } from "@/lib/utils";
import { recordLesson } from "../actions";
import { MISTAKES, RATINGS, recordLessonSchema, type RecordLessonInput } from "../schemas";
import { RATING_STYLE } from "./rating-style";
import { type PassageDraft, SurahAyahFields } from "./surah-ayah-fields";

type Rating = (typeof RATINGS)[number];
type Mistake = (typeof MISTAKES)[number];

type FormState = {
  idempotencyKey: string;
  lessonDate: string;
  passage: PassageDraft;
  rating?: Rating;
  mistakes: Mistake[];
  parentFeedback: string;
  assignNext: boolean;
  nextMemorization: PassageDraft;
  nextTouched: boolean;
  assignRevision: boolean;
  nextRevision: PassageDraft;
};

type Status = "idle" | "saving" | "offline" | "error";

// v2: passages stay inside one surah.
const DRAFT_VERSION = 2;

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
    privateNote: "",
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
  /** The next student in the class, for "Save & next". */
  next: { href: string; name: string } | null;
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

function LessonForm({ studentId, studentHref, defaultPassage, defaultSource, assignmentId, next }: Props) {
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
  const [extrasOpen, setExtrasOpen] = useState(false);
  const saving = useRef(false);
  // Which save button was pressed; kept for the automatic retry when back online.
  const goNext = useRef(false);
  const [pressedNext, setPressedNext] = useState(false);
  const press = (toNext: boolean) => {
    goNext.current = toNext;
    setPressedNext(toNext);
  };
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
      // Show the extras when the problem is in there.
      if (Object.keys(next).some((k) => !k.startsWith("passage") && k !== "rating")) setExtrasOpen(true);
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
        toast.success(t("saved"));
        router.push(goNext.current && next ? next.href : studentHref);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      if (Object.keys(result.fieldErrors ?? {}).some((k) => !k.startsWith("passage") && k !== "rating")) {
        setExtrasOpen(true);
      }
      setFormError(result.error);
      setStatus("error");
    } catch {
      // Network failure: the draft stays on the device; retried when back online.
      setStatus("offline");
    } finally {
      saving.current = false;
    }
  }, [assignmentId, defaultPassage, draftKey, next, router, state, studentHref, studentId, t]);

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
  const locale = useLocale() as QuranLocale;
  const nextLabel = isComplete(state.nextMemorization)
    ? formatPassage(state.nextMemorization, locale, ayahCount)
    : null;
  const extrasCount =
    state.mistakes.length + (state.parentFeedback.trim() ? 1 : 0) + (state.assignRevision ? 1 : 0);

  // Built for one phone screen: passage, rating, save. Everything optional
  // sits behind "Extras".
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {restored && (
        <div
          role="status"
          className="bg-info-soft text-info flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-sm"
        >
          <span className="flex items-center gap-2">
            <History className="size-4" aria-hidden />
            {t("draftRestored")}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            {t("discardDraft")}
          </Button>
        </div>
      )}

      <section className="bg-card flex flex-col gap-2 rounded-xl border p-3 shadow-(--shadow-soft) sm:p-4">
        <SurahAyahFields
          value={state.passage}
          onChange={setPassage}
          errors={passageErrors(errors, "passage")}
        />
        {defaultSource && !restored && (
          <p className="text-muted-foreground text-xs">
            {defaultSource === "assignment" ? t("fromAssignment") : t("suggested")}
          </p>
        )}
      </section>

      <fieldset
        className="bg-card flex flex-col gap-2 rounded-xl border p-3 shadow-(--shadow-soft) sm:p-4"
        aria-describedby={errors.rating ? `${ratingGroup}-error` : undefined}
      >
        <legend className="sr-only">{t("rating")}</legend>
        <p className="text-sm font-medium" aria-hidden>
          {t("rating")}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {RATINGS.map((rating) => {
            const { icon: Icon, selected } = RATING_STYLE[rating];
            return (
              <label
                key={rating}
                className={cn(
                  "has-focus-visible:ring-ring hover:bg-surface-tint flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-0.5 text-center text-[0.7rem] leading-tight font-medium transition-colors duration-150 has-focus-visible:ring-2 sm:text-sm",
                  selected,
                )}
              >
                <input
                  type="radio"
                  name={ratingGroup}
                  value={rating}
                  checked={state.rating === rating}
                  onChange={() => update({ rating })}
                  className="sr-only"
                />
                <Icon className="size-5" aria-hidden />
                {tr(rating)}
              </label>
            );
          })}
        </div>
        {errors.rating && (
          <p id={`${ratingGroup}-error`} role="alert" className="text-destructive text-sm">
            {te(errors.rating)}
          </p>
        )}
      </fieldset>

      {/* Next memorization, pre-filled; one tap turns it off. */}
      {nextLabel && (
        <label
          className={cn(
            "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm transition-colors duration-150",
            state.assignNext ? "border-primary/30 bg-surface-tint" : "bg-card",
          )}
        >
          <input
            type="checkbox"
            checked={state.assignNext}
            onChange={(e) => update({ assignNext: e.target.checked })}
            className="accent-primary size-5"
          />
          <BookMarked className="text-primary size-4 shrink-0" aria-hidden />
          <span className="flex-1">
            {t("nextMemorization")}:{" "}
            <span className={cn("font-semibold", locale === "ar" && "font-quran text-base")}>
              {nextLabel}
            </span>
          </span>
        </label>
      )}

      <div className="bg-card rounded-xl border">
        <button
          type="button"
          aria-expanded={extrasOpen}
          onClick={() => setExtrasOpen((open) => !open)}
          className="flex min-h-12 w-full items-center gap-2 px-3 text-sm font-medium"
        >
          {t("extras")}
          {extrasCount > 0 && (
            <span className="bg-primary text-primary-foreground grid size-5 place-items-center rounded-full text-xs">
              {extrasCount}
            </span>
          )}
          <span className="text-muted-foreground text-xs font-normal">{t("extrasHint")}</span>
          <ChevronDown
            className={cn(
              "text-muted-foreground ms-auto size-4 transition-transform",
              extrasOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {extrasOpen && (
          <div className="flex flex-col gap-4 border-t p-3">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground mb-2 text-sm font-medium">{t("mistakes")}</legend>
              <div className="flex flex-wrap gap-2">
                {MISTAKES.map((mistake) => (
                  <label
                    key={mistake}
                    className="has-checked:border-warning has-checked:bg-warning-soft has-checked:text-warning has-focus-visible:ring-ring hover:bg-surface-tint flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150 has-focus-visible:ring-2"
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
                      className="peer sr-only"
                    />
                    <Check className="hidden size-3.5 peer-checked:block" aria-hidden />
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

            <ToggleBlock
              label={t("nextMemorization")}
              icon={BookMarked}
              checked={state.assignNext}
              onChange={(assignNext) => update({ assignNext })}
            >
              <SurahAyahFields
                compact
                value={state.nextMemorization}
                onChange={(nextMemorization) => update({ nextMemorization, nextTouched: true })}
                errors={passageErrors(errors, "nextMemorization")}
              />
            </ToggleBlock>
            <ToggleBlock
              label={t("nextRevision")}
              icon={Repeat2}
              checked={state.assignRevision}
              onChange={(assignRevision) => update({ assignRevision })}
            >
              <SurahAyahFields
                compact
                value={state.nextRevision}
                onChange={(nextRevision) => update({ nextRevision })}
                errors={passageErrors(errors, "nextRevision")}
              />
            </ToggleBlock>

            <TextField
              label={t("date")}
              type="date"
              value={state.lessonDate}
              onChange={(e) => update({ lessonDate: e.target.value })}
              error={errors.lessonDate}
              dir="ltr"
              className="w-44"
            />
          </div>
        )}
      </div>

      {status === "offline" && (
        <p
          role="alert"
          className="bg-warning-soft text-warning flex items-start gap-2 rounded-xl p-3 text-sm"
        >
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          {te("network")}
        </p>
      )}
      {status === "error" && formError && (
        <p
          role="alert"
          className="bg-destructive-soft text-destructive flex items-start gap-2 rounded-xl p-3 text-sm"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {te(formError)}
        </p>
      )}

      <div className="bg-background/95 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex gap-2 sm:justify-end">
          <Button
            type="submit"
            size="lg"
            variant={next ? "outline" : "default"}
            className={cn("h-12 text-base", next ? "shrink-0 px-5" : "w-full sm:w-64")}
            disabled={status === "saving"}
            onClick={() => press(false)}
          >
            {status === "saving" && !pressedNext ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            {t("save")}
          </Button>
          {next && (
            <Button
              type="submit"
              size="lg"
              className="h-12 min-w-0 flex-1 text-base sm:w-64 sm:flex-none"
              disabled={status === "saving"}
              onClick={() => press(true)}
            >
              {status === "saving" && pressedNext && <Loader2 className="size-4 animate-spin" aria-hidden />}
              <span className="truncate">{t("saveAndNext", { name: next.name })}</span>
              <ChevronLeft className="size-4 shrink-0 ltr:rotate-180" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

/** A checkbox that reveals its fields when ticked (next memorization, revision). */
function ToggleBlock({
  label,
  icon: Icon,
  checked,
  onChange,
  children,
}: {
  label: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-colors duration-150",
        checked && "border-primary/30 bg-surface-tint",
      )}
    >
      <label className="flex cursor-pointer items-center gap-3 p-3 font-medium">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-primary size-4"
        />
        <Icon className="text-primary size-4" aria-hidden />
        {label}
      </label>
      {checked && <div className="border-t p-3">{children}</div>}
    </div>
  );
}
