"use client";

import type { ReactNode } from "react";
import { UserRole } from "@/lib/types";
import { ProviderShell, SidebarIcon as I, type NavSection } from "./ProviderShell";

const SIDEBAR: NavSection[] = [
  { label: "Practice", items: [
    { name: "Today", href: "/dashboard/dietitian", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Consultations", href: "/dashboard/dietitian/consultations", icon: <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I> },
    { name: "Clients", badge: "68", href: "/dashboard/dietitian/clients", icon: <I><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I> },
    { name: "Inbox", badge: "12", href: "/dashboard/dietitian/messages", icon: <I d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /> },
  ]},
  { label: "Plans & food", items: [
    { name: "Plans", href: "/dashboard/dietitian/plans", icon: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v6M9 14h6"/></I> },
    { name: "Meal plans", href: "/dashboard/dietitian/meal-plans", icon: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></I> },
    { name: "Food database", href: "/dashboard/dietitian/foods", icon: <I d="M3 7h18M3 12h18M3 17h12" /> },
    { name: "Protocols", href: "/dashboard/dietitian/protocols", icon: <I><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></I> },
  ]},
  { label: "Practice ops", items: [
    { name: "Forms", href: "/dashboard/forms", icon: <I><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></I> },
    { name: "Earnings", href: "/dashboard/dietitian/earnings", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "My profile", href: "/dashboard/dietitian/profile", icon: <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></I> },
    { name: "Settings", href: "/dashboard/dietitian/settings", icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></I> },
  ]},
];

export interface DietitianDashboardShellProps {
  activeItem: string;
  crumb: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DietitianDashboardShell({ activeItem, crumb, actions, children }: DietitianDashboardShellProps) {
  return (
    <ProviderShell
      activeItem={activeItem}
      crumb={crumb}
      actions={actions}
      config={{
        role: UserRole.DIETITIAN,
        sections: SIDEBAR,
        identity: "user",
        tone: { avatarBg: "var(--dietitian-soft)", avatarColor: "var(--dietitian)" },
        settingsHref: "/dashboard/dietitian/settings",
        homeHref: "/dashboard/dietitian",
        fallbackLabel: "Dietitian",
      }}
    >
      {children}
    </ProviderShell>
  );
}
