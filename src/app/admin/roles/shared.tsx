"use client";

import type { QueryClient } from "@tanstack/react-query";
import { adminAccessQueryKey } from "@/hooks/useAdminAccess";
import { adminRoleKeys } from "@/lib/api/adminRoles";

/**
 * Everything that may have changed after a role or an assignment changes,
 * including the signed-in admin's own access: they may hold the role, and
 * their nav and actions should follow at once.
 */
export function invalidateAdminRoles(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
  void queryClient.invalidateQueries({ queryKey: adminRoleKeys.admins() });
  void queryClient.invalidateQueries({ queryKey: adminAccessQueryKey });
}

/** A role's name as a chip; the system role reads a little heavier. */
export function RoleChip({ name, system }: { name: string; system?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[2px] text-[12px] whitespace-nowrap"
      style={{
        border: "1px solid var(--border-2)",
        color: "var(--ink)",
        background: system ? "var(--bg-2)" : "var(--bg)",
        fontWeight: system ? 500 : 400,
      }}
    >
      {name}
    </span>
  );
}
