/**
 * Admin permissions (`area:verb`), as the API's AdminPermission enum names
 * them. The API enforces every one on its routes; the web only reads them to
 * hide nav items and actions the signed-in admin can't use.
 *
 * Labels here are a fallback for the "You don't have access" state only,
 * which must work for admins who can't read the catalogue (it needs
 * admins:read). Anything that lists permissions (the roles editor) reads
 * GET /admin/permissions instead.
 */
export const AdminPermission = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",
  VERIFICATION_READ: "verification:read",
  SUGGESTIONS_READ: "suggestions:read",
  SUGGESTIONS_WRITE: "suggestions:write",
  BILLING_READ: "billing:read",
  BILLING_WRITE: "billing:write",
  REFUNDS_READ: "refunds:read",
  REFUNDS_WRITE: "refunds:write",
  PLATFORM_READ: "platform:read",
  PLATFORM_WRITE: "platform:write",
  ANNOUNCEMENTS_SEND: "announcements:send",
  LOYALTY_READ: "loyalty:read",
  LOYALTY_WRITE: "loyalty:write",
  ANALYTICS_READ: "analytics:read",
  AUDIT_READ: "audit:read",
  EXPORTS_RUN: "exports:run",
  ADMINS_READ: "admins:read",
  ADMINS_MANAGE: "admins:manage",
} as const;

export type AdminPermission = (typeof AdminPermission)[keyof typeof AdminPermission];

/** A gate: one permission, or a list where any one of them is enough. */
export type AdminPermissionGate = AdminPermission | readonly AdminPermission[];

const LABELS: Record<AdminPermission, string> = {
  "users:read": "View users",
  "users:write": "Manage users",
  "content:read": "View content",
  "content:write": "Moderate content",
  "verification:read": "View verification documents",
  "suggestions:read": "View suggestions",
  "suggestions:write": "Manage suggestions",
  "billing:read": "View billing",
  "billing:write": "Manage billing",
  "refunds:read": "View refunds and disputes",
  "refunds:write": "Handle refunds and disputes",
  "platform:read": "View platform settings",
  "platform:write": "Change platform settings",
  "announcements:send": "Send announcements",
  "loyalty:read": "View loyalty balances",
  "loyalty:write": "Manage loyalty",
  "analytics:read": "View analytics",
  "audit:read": "View the audit log",
  "exports:run": "Run exports",
  "admins:read": "View admins and roles",
  "admins:manage": "Manage admins and roles",
};

/** The plain name of a permission; an unknown key is shown as itself. */
export function permissionLabel(key: string): string {
  return LABELS[key as AdminPermission] ?? key;
}

/** A gate as a list (one permission becomes a list of one). */
export function gateList(gate: AdminPermissionGate): readonly AdminPermission[] {
  return typeof gate === "string" ? [gate] : gate;
}
