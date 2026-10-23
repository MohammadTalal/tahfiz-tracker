"use client";

import { cn } from "cn";
import { GraduationCap, LayoutDashboard, type LucideIcon, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type Tab = { key: "dashboard" | "classes" | "teachers" | "students"; href: string; icon: LucideIcon };

/**
 * The organization's sections; the current one is marked with aria-current.
 * On phones it is a tab bar fixed to the bottom of the screen (thumb reach),
 * from sm up a row of pills under the organization name.
 */
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
      <ul
        data-tabbar
        className="bg-card/95 fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur sm:static sm:flex sm:gap-1 sm:border-0 sm:bg-transparent sm:pb-0 sm:shadow-none sm:backdrop-blur-none"
      >
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <li key={tab.key} className="min-w-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Phone: icon over label, the current tab's icon in a soft pill.
                  "group flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium whitespace-nowrap transition-colors duration-150",
                  // From sm: a pill with the icon beside the label.
                  "sm:h-10 sm:flex-row sm:gap-2 sm:rounded-full sm:border sm:px-4 sm:text-sm",
                  active
                    ? "text-primary sm:bg-primary sm:text-primary-foreground sm:border-primary sm:shadow-(--shadow-soft)"
                    : "text-muted-foreground hover:text-foreground sm:bg-card sm:hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 sm:h-auto sm:w-auto sm:bg-transparent",
                    active && "bg-mint",
                  )}
                >
                  <Icon className="size-5 sm:size-4" aria-hidden />
                </span>
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
