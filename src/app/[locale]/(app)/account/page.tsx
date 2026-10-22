import { getTranslations, setRequestLocale } from "next-intl/server";
import { InitialAvatar } from "@/components/layout/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { AccountForm } from "@/features/workspace/components/account-form";
import { getOwnPhone, getProfileName } from "@/features/workspace/queries";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";

export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser("/account");
  const [name, phone, t] = await Promise.all([
    getProfileName(user.id),
    getOwnPhone(user.id),
    getTranslations("Account"),
  ]);

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard", label: t("back") }}
        leading={<InitialAvatar name={name || user.email || ""} size="lg" />}
        title={t("title")}
        description={user.email}
      />
      <div className="bg-card max-w-xl rounded-xl border p-6 shadow-(--shadow-soft)">
        <AccountForm displayName={name} phone={phone} />
      </div>
    </>
  );
}
