"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { ProviderDashboardShell } from "./ProviderDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { ROLE_LABEL, nameInitials, personInitials, shortName } from "@/lib/identity";

function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const SIDEBAR = [
  { label: "Operate", items: [
    { name: "Overview", href: "/dashboard/gym-owner", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Members", badge: "1,284", href: "/dashboard/gym-owner/members", icon: <I><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I> },
    { name: "Schedule", href: "/dashboard/gym-owner/schedule", icon: <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I> },
    { name: "Check‑ins", badge: "412", href: "/dashboard/gym-owner/checkins", icon: <I d="M12 22V2M2 7l10 5 10-5M2 17l10 5 10-5" /> },
    { name: "Devices", href: "/dashboard/gym-owner/devices", icon: <I d="M8 21h8M12 17v4M3 3h18v14H3z" /> },
  ]},
  { label: "Money", items: [
    { name: "Payouts", href: "/dashboard/gym-owner/payouts", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "Revenue", href: "/dashboard/gym-owner/revenue", icon: <I d="M3 3v18h18M7 14l4-4 3 3 5-7" /> },
    { name: "Plans & pricing", href: "/dashboard/gym-owner/plans", icon: <I d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
  ]},
  { label: "Workspace", items: [
    { name: "Forms", href: "/dashboard/forms", icon: <I><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></I> },
    { name: "Loyalty", href: "/dashboard/loyalty", icon: <I d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z" /> },
    { name: "Team & roles", href: "/dashboard/team", icon: <I><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/></I> },
    { name: "Assignment rules", href: "/dashboard/assignment-rules", icon: <I><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></I> },
    { name: "Billing", href: "/dashboard/billing", icon: <I><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></I> },
  ]},
  { label: "Manage", items: [
    { name: "Locations · 4", href: "/dashboard/gym-owner/locations", icon: <I><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></I> },
    { name: "Staff", href: "/dashboard/gym-owner/staff", icon: <I><circle cx="9" cy="8" r="4"/><circle cx="17" cy="10" r="3"/><path d="M2 21a7 7 0 0 1 14 0M14 21a5 5 0 0 1 10 0"/></I> },
    { name: "Settings", href: "/dashboard/gym-owner/settings", icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></I> },
  ]},
];

export interface GymDashboardShellProps {
  activeItem: string;
  crumb: string;
  actions?: React.ReactNode;
  organizationName?: string;
  organizationInitials?: string;
  children: React.ReactNode;
}

function GymSidebarContent({ activeItem }: { activeItem: string }) {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const orgName = currentOrg?.name ?? "Your workspace";
  const orgInitials = nameInitials(currentOrg?.name) || "··";
  const userName = shortName(user) || "Your account";
  const userInitials = personInitials(user) || "··";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : "";

  return (
    <div className="flex flex-col gap-6 px-3.5 pb-6">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1">
        <BinecticsLockup />
      </Link>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-(--r-2) cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
        <span className="w-5.5 h-5.5 rounded-[4px] flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--gym)", color: "oklch(0.98 0 0)" }}>{orgInitials}</span>
        <span className="text-[13px] font-medium flex-1" style={{ color: "var(--ink)" }}>{orgName}</span>
      </div>
      {SIDEBAR.map((s) => (
        <nav key={s.label} className="flex flex-col gap-0.5" aria-label={s.label}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2 py-1 mb-1" style={{ color: "var(--fg-4)" }}>{s.label}</div>
          {s.items.map((item) => {
            const isActive = item.name === activeItem;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-2.5 py-1.75 px-2 rounded-(--r-2) text-[13.5px] ${isActive ? "bg-bg-3 font-medium" : "hover:bg-bg-2"}`} style={{ color: isActive ? "var(--ink)" : "var(--fg-2)" }}>
                {item.icon}<span className="flex-1">{item.name}</span>
                {item.badge && <span className="ml-auto font-mono text-[11px] px-1.5 py-px rounded-full bg-bg-2" style={{ color: "var(--fg-3)" }}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
      ))}
      <Link href="/dashboard/settings" className="mt-auto flex items-center gap-2.5 pt-3.5" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--gym)", color: "oklch(0.98 0 0)" }}>{userInitials}</span>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{userName}</div>
          <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{roleLabel}</div>
        </div>
      </Link>
    </div>
  );
}

export function GymDashboardShell({
  activeItem,
  crumb,
  actions,
  children,
}: GymDashboardShellProps) {
  const { isAuthorized, isLoading } = useRoleGuard(UserRole.GYM_OWNER);
  const { currentOrg } = useOrganization();

  // Wrong role: useRoleGuard redirects; render nothing to avoid a flash.
  if (!isLoading && !isAuthorized) return null;

  return (
    <ProviderDashboardShell
      sidebarSlot={<GymSidebarContent activeItem={activeItem} />}
      crumb={crumb}
      breadcrumbRoot={{ label: currentOrg?.name ?? "Workspace", href: "/dashboard/gym-owner" }}
      actions={actions}
    >
      {children}
    </ProviderDashboardShell>
  );
}
