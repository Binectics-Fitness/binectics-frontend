"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { ProviderDashboardShell } from "./ProviderDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { ROLE_LABEL, fullName, personInitials, shortName } from "@/lib/identity";

function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d ? <path d={d} /> : children}</svg>;
}

const SIDEBAR = [
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
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function DietitianSidebarContent({ activeItem }: { activeItem: string }) {
  const { user } = useAuth();
  const name = fullName(user) || "Your account";
  const initials = personInitials(user) || "··";
  return (
    <div className="flex flex-col gap-6 px-3.5 pb-6">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1"><BinecticsLockup /></Link>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
        <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>{initials}</span>
        <span className="text-[13px] font-medium flex-1" style={{ color: "var(--ink)" }}>{name}</span>
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
      <Link href="/dashboard/dietitian/settings" className="mt-auto flex items-center gap-2.5 pt-3.5" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>{initials}</span>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{shortName(user) || name}</div>
          <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{user ? (ROLE_LABEL[user.role] ?? user.role) : ""}</div>
        </div>
      </Link>
    </div>
  );
}

export function DietitianDashboardShell({ activeItem, crumb, actions, children }: DietitianDashboardShellProps) {
  const { user, isAuthorized, isLoading } = useRoleGuard(UserRole.DIETITIAN);
  if (!isLoading && !isAuthorized) return null;
  return (
    <ProviderDashboardShell
      sidebarSlot={<DietitianSidebarContent activeItem={activeItem} />}
      crumb={crumb}
      breadcrumbRoot={{ label: fullName(user) || "Dietitian", href: "/dashboard/dietitian" }}
      actions={actions}
    >
      {children}
    </ProviderDashboardShell>
  );
}
