import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { OrgNav } from "@/features/workspace/components/org-nav";
import { getOrganizationForStaff } from "@/features/workspace/queries";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { isId } from "@/lib/ids";

/** Every organization page gets the section tabs above its content. */
export default function OrganizationLayout({ children, params }: LayoutProps<"/[locale]/o/[orgId]">) {
  const { locale, orgId } = use(params);
  setRequestLocale(locale as Locale);
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <OrgNavLoader orgId={orgId} />
      </Suspense>
      {children}
    </>
  );
}

async function OrgNavLoader({ orgId }: { orgId: string }) {
  if (!isId(orgId)) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const org = await getOrganizationForStaff(orgId, user.id);
  if (!org) return null;
  // usePathname reads the URL, which is runtime data.
  return (
    <Suspense fallback={<div className="h-16" />}>
      <OrgNav orgId={orgId} orgName={org.name} isAdmin={org.isAdmin} />
    </Suspense>
  );
}
