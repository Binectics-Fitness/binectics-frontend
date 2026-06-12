"use client";

import type { ReactNode } from "react";
import { UserRole } from "@/lib/types";
import { ProviderShell, SidebarIcon as I, type NavSection } from "./ProviderShell";

const SIDEBAR: NavSection[] = [
  { label: "Work", items: [
    { name: "Today", href: "/dashboard/trainer", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Calendar", href: "/dashboard/trainer/sessions", icon: <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I> },
    { name: "Clients", href: "/dashboard/trainer/clients", icon: <I><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I> },
    { name: "Inbox", href: "/dashboard/trainer/messages", icon: <I d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /> },
  ]},
  { label: "Practice", items: [
    { name: "Forms", href: "/dashboard/forms", icon: <I><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></I> },
    { name: "Earnings", href: "/dashboard/trainer/earnings", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "Packages", href: "/dashboard/trainer/plans", icon: <I d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
    { name: "My profile", href: "/dashboard/trainer/profile", icon: <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></I> },
    { name: "Settings", href: "/dashboard/trainer/settings", icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></I> },
  ]},
];

export interface TrainerDashboardShellProps {
  activeItem: string;
  crumb: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function TrainerDashboardShell({ activeItem, crumb, actions, children }: TrainerDashboardShellProps) {
  return (
    <ProviderShell
      activeItem={activeItem}
      crumb={crumb}
      actions={actions}
      config={{
        role: UserRole.TRAINER,
        sections: SIDEBAR,
        identity: "user",
        tone: { avatarBg: "var(--trainer-soft)", avatarColor: "var(--trainer)" },
        settingsHref: "/dashboard/trainer/settings",
        homeHref: "/dashboard/trainer",
        fallbackLabel: "Trainer",
      }}
    >
      {children}
    </ProviderShell>
  );
}
