import { useFormatter, useTranslations } from "next-intl";
import { SITE } from "@/config/site";
import type { LegalDocument } from "./content";

export function LegalPage({ doc, showMeta = true }: { doc: LegalDocument; showMeta?: boolean }) {
  const t = useTranslations("Legal");
  const format = useFormatter();

  return (
    <article className="bg-card mx-auto flex w-full max-w-3xl flex-col gap-7 rounded-2xl border p-6 shadow-(--shadow-soft) sm:p-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold tracking-tight">{doc.title}</h1>
        {showMeta && (
          <p className="text-muted-foreground text-sm">
            {t("lastUpdated", {
              date: format.dateTime(new Date(`${SITE.legalUpdated}T00:00:00Z`), {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </p>
        )}
        {showMeta && !SITE.legalReviewed && (
          <p role="note" className="bg-warning-soft text-warning rounded-lg p-3 text-sm">
            {t("draftNotice")}
          </p>
        )}
        <p className="text-muted-foreground text-[1.05rem] leading-relaxed">{doc.intro}</p>
      </header>

      {doc.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.blocks.map((block, i) =>
            Array.isArray(block) ? (
              <ul key={i} className="flex list-disc flex-col gap-1 ps-5 leading-relaxed">
                {block.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p key={i} className="leading-relaxed">
                {block}
              </p>
            ),
          )}
        </section>
      ))}

      {showMeta && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t("contactHeading")}</h2>
          <p className="leading-relaxed">
            {SITE.contactEmail
              ? t.rich("contactEmail", {
                  email: SITE.contactEmail,
                  link: (chunks) => (
                    <a href={`mailto:${SITE.contactEmail}`} className="text-primary underline" dir="ltr">
                      {chunks}
                    </a>
                  ),
                })
              : t("contactPending")}
          </p>
        </section>
      )}
    </article>
  );
}
