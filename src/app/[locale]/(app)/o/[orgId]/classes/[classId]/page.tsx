import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { enrollStudent } from "@/features/workspace/actions";
import { BackLink, Section } from "@/features/workspace/components/display";
import { NameForm } from "@/features/workspace/components/simple-forms";
import { getClassWithRoster, getOrganizationForStaff } from "@/features/workspace/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

export default async function ClassPage({ params }: PageProps<"/[locale]/o/[orgId]/classes/[classId]">) {
  const { locale, orgId, classId } = await params;
  setRequestLocale(locale as Locale);
  if (!isId(orgId) || !isId(classId)) notFound();
  const user = await requireUser();
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) notFound();
  const cls = await getClassWithRoster(orgId, classId);
  if (!cls) notFound();

  const t = await getTranslations("Class");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <>
      <div className="flex flex-col gap-1">
        <BackLink href={`/o/${orgId}`} label={org.name} />
        <h1 className="text-2xl font-bold">{cls.name}</h1>
      </div>

      <Section title={t("roster")}>
        {cls.students.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noStudents")}</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {cls.students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/o/${orgId}/students/${s.id}`}
                  className="hover:bg-muted flex min-h-12 items-center justify-between p-3"
                >
                  <span className="font-medium">{s.display_name}</span>
                  <Chevron className="text-muted-foreground size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {org.isAdmin && (
          <NameForm
            action={enrollStudent.bind(null, classId)}
            label={t("studentName")}
            submitLabel={t("add")}
          />
        )}
      </Section>
    </>
  );
}
