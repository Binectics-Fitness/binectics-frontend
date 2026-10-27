"use client";

import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";

/** Role guard + member shell shared by the starter pages. */
export function StarterShell({ children }: { children: React.ReactNode }) {
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return <MemberDashboardShell activeLabel="Starter">{children}</MemberDashboardShell>;
}
