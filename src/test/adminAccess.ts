import type { AdminAccessState } from "@/hooks/useAdminAccess";
import { AdminPermission, gateList, type AdminPermissionGate } from "@/lib/admin/permissions";

const ALL = Object.values(AdminPermission);

/**
 * A ready useAdminAccess answer for tests: "all" is a Super admin, a list is
 * an admin holding exactly those permissions.
 */
export function adminAccessStub(held: "all" | AdminPermission[] = "all"): AdminAccessState {
  const permissions = held === "all" ? ALL : held;
  const set = new Set<string>(permissions);
  const can = (p: AdminPermission) => set.has(p);
  return {
    ready: true,
    isSuper: held === "all",
    roles: [],
    permissions,
    can,
    canAny: (...ps) => ps.some(can),
    allows: (gate?: AdminPermissionGate) => (gate === undefined ? true : gateList(gate).some(can)),
  };
}

/**
 * For `vi.mock("@/hooks/useAdminAccess", ...)` in page tests that are not
 * about permissions: every admin action shows, as before roles.
 *
 *   vi.mock("@/hooks/useAdminAccess", async () => (await import("@/test/adminAccess")).superAdminAccessModule);
 */
export const superAdminAccessModule = {
  useAdminAccess: () => adminAccessStub("all"),
  adminAccessQueryKey: ["admin", "me", "access"] as const,
};
