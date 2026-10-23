"use client";

import { Megaphone, Send, Trash2 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useActionState, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, idleState } from "@/lib/action-state";
import { deleteNews, postNews } from "../actions";
import type { NewsPost } from "../queries";

/**
 * The organization's news: newest first. Admins (`postTo`) get a form to
 * post and a delete button on each item.
 */
export function NewsFeed({
  posts,
  postTo,
  showOrganization = false,
}: {
  posts: NewsPost[];
  /** Organization id to post to; only for admins. */
  postTo?: string;
  showOrganization?: boolean;
}) {
  const t = useTranslations("News");
  const format = useFormatter();
  const locale = useLocale();
  return (
    <section className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-(--shadow-soft)">
      <h2 className="flex items-center gap-2 font-semibold">
        <span
          className="bg-gold-soft text-gold-foreground grid size-7 place-items-center rounded-md"
          aria-hidden
        >
          <Megaphone className="size-4" />
        </span>
        {t("title")}
      </h2>

      {postTo && <NewsForm orgId={postTo} />}

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">{postTo ? t("emptyAdmin") : t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {posts.map((post) => (
            <li key={post.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p dir="auto" className="font-semibold">
                  {post.title}
                </p>
                {post.body && (
                  <p dir="auto" className="text-foreground/90 mt-1 text-sm whitespace-pre-line">
                    {post.body}
                  </p>
                )}
                <p className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-1.5 text-xs">
                  {/* Each part isolated, so names and dates in mixed scripts keep their order. */}
                  {[
                    showOrganization ? post.organizationName : null,
                    post.authorName,
                    format.dateTime(new Date(post.createdAt), {
                      dateStyle: "medium",
                      numberingSystem: locale === "ar" ? "arab" : "latn",
                    }),
                  ]
                    .filter(Boolean)
                    .map((part, i) => (
                      <span key={i}>
                        {i > 0 && "— "}
                        <bdi>{part}</bdi>
                      </span>
                    ))}
                </p>
              </div>
              {postTo && <DeleteNewsButton post={post} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NewsForm({ orgId }: { orgId: string }) {
  const t = useTranslations("News");
  const te = useTranslations("Errors");
  const [open, setOpen] = useState(false);
  // Controlled, so a failed post keeps what was written.
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [post] = useState(() => async (prev: ActionState, formData: FormData) => {
    const result = await postNews(orgId, prev, formData);
    if (result.status === "success") {
      setTitle("");
      setBody("");
      setOpen(false);
      toast.success(t("posted"));
    }
    return result;
  });
  const [state, action] = useActionState(post, idleState);
  const id = useId();

  if (!open) {
    return (
      <Button variant="outline" className="w-fit" onClick={() => setOpen(true)}>
        <Send className="size-4 rtl:-scale-x-100" aria-hidden />
        {t("post")}
      </Button>
    );
  }

  return (
    <form action={action} className="bg-surface-tint flex flex-col gap-3 rounded-lg border p-3" noValidate>
      {state.status === "error" && state.error !== "invalid" && <FormMessage state={state} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-title`}>{t("newsTitle")}</Label>
        <Input
          id={`${id}-title`}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          aria-invalid={state.fieldErrors?.title ? true : undefined}
        />
        {state.fieldErrors?.title && (
          <p className="text-destructive text-sm">{te(state.fieldErrors.title)}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-body`}>{t("newsBody")}</Label>
        <Textarea
          id={`${id}-body`}
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <SubmitButton>
          <Send className="size-4 rtl:-scale-x-100" aria-hidden />
          {t("publish")}
        </SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function DeleteNewsButton({ post }: { post: NewsPost }) {
  const t = useTranslations("News");
  const te = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      aria-label={t("delete", { title: post.title })}
      title={t("delete", { title: post.title })}
      onClick={() => {
        if (!window.confirm(t("confirmDelete", { title: post.title }))) return;
        startTransition(async () => {
          const result = await deleteNews(post.id);
          if (result?.error) toast.error(te(result.error));
          else toast.success(t("deleted"));
        });
      }}
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}
