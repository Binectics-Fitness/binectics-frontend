"use client";

import type { ReactNode } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";

/**
 * The frame every solo page shares. The pages are always on. Members of any
 * other role are sent to their own dashboard by the guard, and the data each
 * page reads comes from the signed-in member's own session.
 */
export function SoloPage({ activeLabel, children }: { activeLabel: string; children: ReactNode }) {
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return <MemberDashboardShell activeLabel={activeLabel}>{children}</MemberDashboardShell>;
}
