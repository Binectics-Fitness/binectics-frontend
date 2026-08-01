"use client";

/**
 * RoleShell — renders a page that belongs to EVERY role inside the current
 * user's own dashboard chrome, members included.
 *
 * WorkspaceShell does the same job but is deliberately provider-only ("provider
 * features should not appear in the member experience"). Some features are not
 * provider features at all — Loyalty is the clear case: the member owns the
 * points, the member dashboard links to it, and a gym owner administers it.
 * Hard-wiring such a page to GymDashboardShell puts it behind
 * useRoleGuard(GYM_OWNER), which bounces the very people the page is for.
 *
 * So: members get MemberDashboardShell, every other role delegates to
 * WorkspaceShell (trainer / dietitian / admin / gym owner).
 */

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import { MemberDashboardShell } from "./MemberDashboardShell";
import { WorkspaceShell } from "./WorkspaceShell";

export interface RoleShellProps {
  /** Provider shells: must match the corresponding nav item `name`. */
  activeItem: string;
  /**
   * Member shell: must match a MemberDashboardShell nav link label. Pass a
   * label that isn't in the member nav to highlight nothing.
   */
  memberActiveLabel: string;
  /** Provider shells only — the member shell has no breadcrumb. */
  crumb: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function RoleShell({
  activeItem,
  memberActiveLabel,
  crumb,
  actions,
  children,
}: RoleShellProps) {
  const { user, isLoading } = useAuth();

  // Avoid briefly rendering the wrong role's chrome before auth resolves.
  if (isLoading) return null;

  if (user?.role === UserRole.USER) {
    return (
      <MemberDashboardShell activeLabel={memberActiveLabel} actions={actions}>
        {children}
      </MemberDashboardShell>
    );
  }

  return (
    <WorkspaceShell activeItem={activeItem} crumb={crumb} actions={actions}>
      {children}
    </WorkspaceShell>
  );
}
