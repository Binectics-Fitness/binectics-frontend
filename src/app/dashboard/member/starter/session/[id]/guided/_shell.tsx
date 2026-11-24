"use client";

import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";

/**
 * The member role guard without the dashboard chrome: a guided session fills
 * the screen (read from a few metres away), so no sidebar or top bar.
 */
export function GuidedShell({ children }: { children: React.ReactNode }) {
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return <>{children}</>;
}
