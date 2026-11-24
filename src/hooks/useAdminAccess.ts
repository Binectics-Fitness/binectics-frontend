"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAccessService, type AdminMeAccess } from "@/lib/api/adminAccess";
import { onAdminPermissionMissing } from "@/lib/admin/accessEvents";
import { gateList, type AdminPermission, type AdminPermissionGate } from "@/lib/admin/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { isPlatformAdmin } from "@/hooks/useRequireAuth";

export const adminAccessQueryKey = ["admin", "me", "access"] as const;

/** Fresh enough to skip a refetch on every page change, short enough that a
 *  changed role shows within half a minute even without a 403 or a focus. */
const ACCESS_STALE_MS = 30_000;

class AdminAccessError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export interface AdminAccessState {
  /** The access answer has arrived (or failed); until then nothing gated shows. */
  ready: boolean;
  isSuper: boolean;
  roles: AdminMeAccess["roles"];
  permissions: readonly AdminPermission[];
  /** Holds this permission. */
  can: (permission: AdminPermission) => boolean;
  /** Holds at least one of these. */
  canAny: (...permissions: AdminPermission[]) => boolean;
  /** Passes a gate: one permission, or any one of a list. No gate passes. */
  allows: (gate: AdminPermissionGate | undefined) => boolean;
}

/**
 * What the signed-in admin may do, from GET /admin/me/access. Use it to HIDE
 * nav items and actions; the API enforces every route regardless, so this is
 * never a security boundary.
 *
 * - Refetches on window focus, after 30s, and whenever any request is
 *   refused with 403 ADMIN_PERMISSION_MISSING (the access changed).
 * - While the answer is loading, nothing gated is allowed (so a forbidden
 *   action never flashes in); `ready` says when it has arrived.
 * - If the call fails (an API without the endpoint, or a network blip), the
 *   UI fails OPEN and shows everything, as it did before roles: hiding is a
 *   convenience, and locking every admin out of the UI on a blip would be
 *   worse than offering a button the API then refuses.
 *
 * useAdminGuard still decides whether the person is an admin at all.
 */
export function useAdminAccess(): AdminAccessState {
  // Only an admin asks (no redirect here: the shell's useAdminGuard does that).
  const { user, isLoading } = useAuth();
  const isAuthorized = !isLoading && isPlatformAdmin(user);
  const queryClient = useQueryClient();

  const query = useQuery<AdminMeAccess, AdminAccessError>({
    queryKey: adminAccessQueryKey,
    queryFn: async () => {
      const res = await adminAccessService.getMyAccess();
      if (!res.success || !res.data) {
        throw new AdminAccessError(res.message || "Could not load your admin access", res.status);
      }
      return res.data;
    },
    enabled: isAuthorized,
    staleTime: ACCESS_STALE_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  useEffect(
    () =>
      onAdminPermissionMissing(() => {
        void queryClient.invalidateQueries({ queryKey: adminAccessQueryKey });
      }),
    [queryClient],
  );

  const data = query.data;
  const failedOpen = !data && query.isError;
  const ready = !!data || query.isError;

  const held = useMemo(() => new Set<string>(data?.permissions ?? []), [data]);

  const can = useCallback(
    (permission: AdminPermission) => {
      if (failedOpen) return true;
      if (!data) return false;
      return data.is_super || held.has(permission);
    },
    [data, failedOpen, held],
  );

  const canAny = useCallback(
    (...permissions: AdminPermission[]) => permissions.some((p) => can(p)),
    [can],
  );

  const allows = useCallback(
    (gate: AdminPermissionGate | undefined) => (gate === undefined ? true : gateList(gate).some((p) => can(p))),
    [can],
  );

  return {
    ready,
    isSuper: data?.is_super ?? false,
    roles: data?.roles ?? [],
    permissions: data?.permissions ?? [],
    can,
    canAny,
    allows,
  };
}
