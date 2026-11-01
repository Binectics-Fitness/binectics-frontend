"use client";

import type { ReactNode } from "react";
import { UserRole } from "@/lib/types";
import { ProviderShell, SidebarIcon as I, withNavBadge, type NavSection } from "./ProviderShell";
import { usePendingListingRequestCount } from "@/lib/queries/marketplace";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { useMessagingUnread } from "@/components/messaging/queries";
import { useRefundsAttentionCount } from "@/lib/queries/refunds";

/**
 * What a gym's staff trainer doesn't get: members find them through the
 * gym's listing (no requests or profile of their own), the gym sells the
 * plans, forms are the gym's to manage, and the gym pays Binectics and
 * handles refunds on money it took.
 */
const NOT_FOR_GYM_TRAINERS = new Set(["Requests", "Plans", "My profile", "Forms", "Refunds", "Discount codes", "Billing"]);

/** The one line that says why a gym's trainer sees fewer items (F25). */
export function gymTrainerNote(gymName: string): string {
  return `${gymName} manages your listing, plans, forms and billing.`;
}

export function sidebarFor(sections: NavSection[], gymTrainer: boolean): NavSection[] {
  if (!gymTrainer) return sections;
  return sections
    .map((s) => ({ ...s, items: s.items.filter((item) => !NOT_FOR_GYM_TRAINERS.has(item.name)) }))
    .filter((s) => s.items.length > 0);
}

export const SIDEBAR: NavSection[] = [
  { label: "Work", items: [
    { name: "Today", href: "/dashboard/trainer", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Calendar", href: "/dashboard/trainer/sessions", icon: <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I> },
    { name: "Clients", href: "/dashboard/trainer/clients", icon: <I><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I> },
    { name: "Requests", href: "/dashboard/marketplace/requests", icon: <I><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></I> },
    { name: "Inbox", href: "/dashboard/trainer/messages", icon: <I d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /> },
  ]},
  { label: "Practice", items: [
    { name: "Forms", href: "/dashboard/forms", icon: <I><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></I> },
    { name: "Loyalty", href: "/dashboard/loyalty", icon: <I d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z" /> },
    { name: "Earnings", href: "/dashboard/trainer/earnings", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "Refunds", href: "/dashboard/refunds", icon: <I d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /> },
    { name: "Discount codes", href: "/dashboard/discount-codes", icon: <I d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01" /> },
    { name: "Plans", href: "/dashboard/trainer/plans", icon: <I d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
    { name: "Programs", href: "/dashboard/trainer/programs", icon: <I><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></I> },
    { name: "My profile", href: "/dashboard/trainer/profile", icon: <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></I> },
    { name: "Billing", href: "/dashboard/billing", icon: <I><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></I> },
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
  const pendingRequests = usePendingListingRequestCount();
  const gym = useCoachingGym();
  const unreadMessages = useMessagingUnread();
  const refundsWaiting = useRefundsAttentionCount(!gym);
  const badged = withNavBadge(
    withNavBadge(withNavBadge(SIDEBAR, "Requests", pendingRequests, "warn"), "Inbox", unreadMessages),
    "Refunds",
    refundsWaiting,
    "warn",
  );
  return (
    <ProviderShell
      activeItem={activeItem}
      crumb={crumb}
      actions={actions}
      config={{
        role: UserRole.TRAINER,
        sections: sidebarFor(badged, Boolean(gym)),
        chipNote: gym ? `Coaching at ${gym.name}` : undefined,
        chipDetail: gym ? gymTrainerNote(gym.name) : undefined,
        identity: "user",
        tone: { avatarBg: "var(--trainer-soft)", avatarColor: "var(--trainer-ink)" },
        settingsHref: "/dashboard/trainer/settings",
        homeHref: "/dashboard/trainer",
        fallbackLabel: "Trainer",
        workspace: "trainer",
      }}
    >
      {children}
    </ProviderShell>
  );
}
