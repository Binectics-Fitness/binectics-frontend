import type { ApiResponse } from "@/lib/types";
import { ADMIN_PERMISSION_MISSING, ADMIN_PERMISSION_MISSING_MESSAGE } from "./accessEvents";

/**
 * Plain copy for the admin roles API's refusals (ADMIN-ROLES-PLAN §5).
 * The API's own messages are written for logs as much as for people; these
 * say what happened and what to do next.
 */
export const ADMIN_ROLE_ERROR_COPY: Record<string, string> = {
  ADMIN_ROLE_SYSTEM:
    "The Super admin role can't be edited or deleted, and only a Super admin can give it or take it away.",
  ADMIN_ROLE_EXCEEDS_YOURS:
    "You can only give or take away permissions you hold yourself. Ask a Super admin to make this change.",
  ADMIN_SELF_CHANGE: "You can't change your own admin access. Ask another admin who manages roles.",
  [ADMIN_PERMISSION_MISSING]: ADMIN_PERMISSION_MISSING_MESSAGE,
  ADMIN_ROLE_NAME_TAKEN: "Another role already has this name. Choose a different one.",
  ADMIN_ROLE_STALE: "Someone else changed this role while you were editing. Reload it to see their changes, then try again.",
  ADMIN_LAST_MANAGER:
    "At least one active admin must be able to manage admins. Give that permission to someone else first.",
  ADMIN_TARGET_INELIGIBLE:
    "This account can't be made an admin. It needs a verified email, and it can't be suspended or a placeholder account.",
};

/** What a role in use says (409 ADMIN_ROLE_IN_USE carries holder_count). */
export function roleInUseMessage(holderCount: number | undefined): string {
  const who =
    holderCount === undefined ? "Some people" : holderCount === 1 ? "1 person" : `${holderCount} people`;
  return `${who} ${holderCount === 1 ? "holds" : "hold"} this role. Take it away from them before deleting it.`;
}

/**
 * The sentence a failed roles request shows. `assigning`: a 400 on
 * PUT /admin/admins/:userId/roles means a role id the API doesn't know
 * (the role was deleted since the page loaded).
 */
export function adminRoleErrorMessage(
  res: Pick<ApiResponse<unknown>, "code" | "status" | "message" | "details">,
  fallback: string,
  opts: { assigning?: boolean } = {},
): string {
  if (res.code === "ADMIN_ROLE_IN_USE") {
    const n = res.details?.holder_count;
    return roleInUseMessage(typeof n === "number" ? n : undefined);
  }
  if (res.code && ADMIN_ROLE_ERROR_COPY[res.code]) return ADMIN_ROLE_ERROR_COPY[res.code];
  if (opts.assigning && res.status === 400) {
    return "One of these roles no longer exists. Reload the page and try again.";
  }
  return res.message || fallback;
}
