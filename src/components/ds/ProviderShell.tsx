"use client";

/**
 * ProviderShell — the shared scaffold behind the gym/trainer/dietitian
 * dashboard shells. They were three near-identical files (same sidebar
 * structure, nav rendering, user footer, and role guard) differing only in
 * nav config, accent, identity source (org vs user), and role. This extracts
 * all of that so each role shell is just a small config wrapper.
 *
 * Admin is intentionally NOT built on this — it uses a distinct dark theme and
 * its own mobile nav.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { ProviderDashboardShell } from "./ProviderDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { ShellAccountMenu } from "@/components/ds/ShellAccountMenu";
import type { UserRole } from "@/lib/types";
import { ROLE_LABEL, fullName, nameInitials, personInitials, shortName } from "@/lib/identity";

/** Shared 15px stroked icon used by every provider sidebar nav item. */
export function SidebarIcon({ children, d }: { children?: ReactNode; d?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}
export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Avatar styling for the identity chip + user footer. */
interface ShellTone {
  avatarBg: string;
  avatarColor: string;
  /** Square chip (gym/org) vs round (a person). Footer avatar is always round. */
  chipSquare?: boolean;
}

export interface ProviderShellConfig {
  role: UserRole;
  sections: NavSection[];
  /** Identity chip + breadcrumb source: the current org, or the signed-in user. */
  identity: "org" | "user";
  tone: ShellTone;
  /** Where the footer (and the chip, conceptually) point for settings. */
  settingsHref: string;
  /** Breadcrumb root link target. */
  homeHref: string;
  /** Breadcrumb/chip label when org/user data isn't loaded yet. */
  fallbackLabel: string;
}

function ProviderSidebar({ activeItem, config }: { activeItem: string; config: ProviderShellConfig }) {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { tone, identity, sections, fallbackLabel } = config;

  const userName = shortName(user) || "Your account";
  const userInitials = personInitials(user) || "··";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : "";

  const chipLabel = identity === "org" ? (currentOrg?.name ?? fallbackLabel) : (fullName(user) || "Your account");
  const chipInitials = identity === "org" ? (nameInitials(currentOrg?.name) || "··") : userInitials;

  return (
    <div className="flex flex-col gap-6 px-3.5 pb-6">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1">
        <BinecticsLockup />
      </Link>

      {/* Identity chip */}
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
        <span className={`w-5.5 h-5.5 ${tone.chipSquare ? "rounded-[4px]" : "rounded-full"} flex items-center justify-center text-[11px] font-semibold`} style={{ background: tone.avatarBg, color: tone.avatarColor }}>{chipInitials}</span>
        <span className="text-[13px] font-medium flex-1" style={{ color: "var(--ink)" }}>{chipLabel}</span>
      </div>

      {/* Nav sections */}
      {sections.map((s) => (
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

      {/* User footer — opens the account menu (profile / settings / admin / log out) */}
      <div className="mt-auto pt-3.5" style={{ borderTop: "1px solid var(--border)" }}>
        <ShellAccountMenu
          direction="up"
          trigger={
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: tone.avatarBg, color: tone.avatarColor }}>{userInitials}</span>
              <span className="flex-1">
                <span className="block text-[13px] font-medium" style={{ color: "var(--ink)" }}>{userName}</span>
                <span className="block font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{roleLabel}</span>
              </span>
            </span>
          }
        />
      </div>
    </div>
  );
}

export interface ProviderShellProps {
  activeItem: string;
  crumb: string;
  actions?: ReactNode;
  children: ReactNode;
  config: ProviderShellConfig;
}

export function ProviderShell({ activeItem, crumb, actions, children, config }: ProviderShellProps) {
  const { user, isAuthorized, isLoading } = useRoleGuard(config.role);
  const { currentOrg } = useOrganization();

  // Wrong role: useRoleGuard redirects; render nothing to avoid a flash.
  if (!isLoading && !isAuthorized) return null;

  const breadcrumbLabel =
    config.identity === "org" ? (currentOrg?.name ?? config.fallbackLabel) : (fullName(user) || config.fallbackLabel);

  return (
    <ProviderDashboardShell
      sidebarSlot={<ProviderSidebar activeItem={activeItem} config={config} />}
      crumb={crumb}
      breadcrumbRoot={{ label: breadcrumbLabel, href: config.homeHref }}
      actions={actions}
    >
      {children}
    </ProviderDashboardShell>
  );
}
