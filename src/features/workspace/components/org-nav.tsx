"use client";

import { cn } from "cn";
import { GraduationCap, LayoutDashboard, type LucideIcon, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type Tab = { key: "dashboard" | "classes" | "teachers" | "students"; href: string; icon: LucideIcon };

/** The organization's sections; the current one is marked with aria-current. */
export function OrgNav({ orgId, orgName, isAdmin }: { orgId: string; orgName: string; isAdmin: boolean }) {
  const t = useTranslations("OrgNav");
  const pathname = usePathname();
  const base = `/o/${orgId}`;
  const tabs: Tab[] = [
    { key: "dashboard", href: base, icon: LayoutDashboard },
    { key: "classes", href: `${base}/classes`, icon: GraduationCap },
    ...(isAdmin ? [{ key: "teachers" as const, href: `${base}/teachers`, icon: UserCheck }] : []),
    { key: "students", href: `${base}/students`, icon: Users },
  ];
  // Recording a lesson gets the whole phone screen.
  if (pathname.endsWith("/record")) return null;
  const isActive = (tab: Tab) =>
    tab.key === "dashboard" ? pathname === base : pathname.startsWith(tab.href);

  return (
    <nav aria-label={orgName} className="-mt-2 flex flex-col gap-2">
      <p className="text-muted-foreground text-xs font-medium">{orgName}</p>
      {/* Equal-width tabs on phones so all fit; natural width from sm up. */}
      <ul className="grid auto-cols-fr grid-flow-col gap-1 sm:flex">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <li key={tab.key} className="min-w-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 sm:gap-2 sm:px-4 sm:text-sm",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-(--shadow-soft)"
                    : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
