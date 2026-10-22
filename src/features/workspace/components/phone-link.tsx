import { MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

/** A phone number to tap and call, with a WhatsApp shortcut. Always left-to-right. */
export function PhoneLink({ phone, name }: { phone: string; name: string }) {
  const t = useTranslations("Contact");
  const digits = phone.replace(/[^0-9]/g, "");
  return (
    <span className="inline-flex items-center gap-1">
      <a
        href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
        dir="ltr"
        className="text-primary hover:text-primary-strong inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap underline-offset-4 hover:underline"
        aria-label={t("call", { name })}
      >
        <Phone className="size-3.5" aria-hidden />
        {phone}
      </a>
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary grid size-7 place-items-center rounded-md transition-colors duration-150"
        aria-label={t("whatsapp", { name })}
        title={t("whatsapp", { name })}
      >
        <MessageCircle className="size-4" aria-hidden />
      </a>
    </span>
  );
}
