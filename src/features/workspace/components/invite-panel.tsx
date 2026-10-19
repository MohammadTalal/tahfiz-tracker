"use client";

import { Check, Copy, QrCode, Share2, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { createInvite } from "../actions";

/**
 * Creates a single-use invite link and offers copy / WhatsApp / native share.
 * The token is shown only here; the server keeps just its hash.
 */
export function InvitePanel({
  orgId,
  type,
  studentId,
  label,
}: {
  orgId: string;
  type: "teacher" | "parent";
  studentId?: string;
  label: string;
}) {
  const t = useTranslations("Invite");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  function create() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createInvite({ orgId, type, studentId });
        if ("error" in result) setError(result.error);
        else setUrl(`${window.location.origin}/${locale}/invite/${result.token}`);
      } catch {
        setError("generic");
      }
    });
  }

  if (!url) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={create} disabled={pending} className="self-start">
          <UserPlus className="size-4" aria-hidden />
          {pending ? t("creating") : label}
        </Button>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {te(error)}
          </p>
        )}
      </div>
    );
  }

  const message = t(type === "parent" ? "messageParent" : "messageTeacher", { url });
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-3">
      <p className="text-sm">{t("linkReady")}</p>
      <Input readOnly value={url} dir="ltr" onFocus={(e) => e.currentTarget.select()} aria-label={label} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? tc("copied") : tc("copy")}
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          {t("whatsapp")}
        </a>
        <Button
          variant="outline"
          aria-expanded={qrSvg !== null}
          onClick={async () => {
            if (qrSvg) return setQrSvg(null);
            setQrSvg(await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" }));
          }}
        >
          <QrCode className="size-4" aria-hidden />
          {t("qr")}
        </Button>
        {canShare && (
          <Button variant="outline" onClick={() => navigator.share({ text: message }).catch(() => {})}>
            <Share2 className="size-4" aria-hidden />
            {t("share")}
          </Button>
        )}
      </div>
      {qrSvg && (
        <div className="flex flex-col items-center gap-2 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated inline SVG */}
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`}
            alt={t("qrAlt")}
            className="size-56 rounded-md bg-white p-2"
          />
          <p className="text-muted-foreground text-center text-sm">{t("qrHelp")}</p>
        </div>
      )}
    </div>
  );
}
