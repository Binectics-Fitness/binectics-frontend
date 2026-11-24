/**
 * A tiny bus between the API client and useAdminAccess: when any request is
 * refused with 403 ADMIN_PERMISSION_MISSING, the admin's access changed
 * under them (a role was edited or taken away), so the hook refetches
 * GET /admin/me/access and the nav and actions catch up.
 *
 * Kept apart from both so the client doesn't import React Query and the hook
 * doesn't import the client's internals.
 */
export const ADMIN_PERMISSION_MISSING = "ADMIN_PERMISSION_MISSING";

/** What a refused admin request names, when the API sends it. */
export interface AdminPermissionMissing {
  required?: string[];
  match?: "all" | "any";
}

type Listener = (event: AdminPermissionMissing) => void;

const listeners = new Set<Listener>();

export function onAdminPermissionMissing(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAdminPermissionMissing(event: AdminPermissionMissing): void {
  listeners.forEach((l) => l(event));
}

/** The sentence a refused admin action shows, in place of the API's key list. */
export const ADMIN_PERMISSION_MISSING_MESSAGE =
  "You don't have permission to do that. Your admin access may have changed; ask an admin who manages roles.";
