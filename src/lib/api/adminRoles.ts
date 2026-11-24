/**
 * Admin roles and the admin team (admin roles plan §6, api-3).
 *
 * Reading needs admins:read; changing needs admins:manage, and the API
 * enforces the rest (no escalation, the system role, the last manager, a
 * role in use). Every refusal carries a code; adminRoleErrorMessage in
 * src/lib/admin/roleErrors.ts turns it into a sentence.
 */
import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { AdminPermission } from "@/lib/admin/permissions";
import type { AdminAccessRole } from "./adminAccess";

/** One permission as GET /admin/permissions describes it. */
export interface AdminPermissionItem {
  key: AdminPermission;
  label: string;
  description: string;
  /** Its reads return personal data: give it deliberately. */
  pii: boolean;
  kind: "read" | "write";
}

export interface AdminPermissionGroup {
  group: string;
  items: AdminPermissionItem[];
}

export interface AdminRole {
  id: string;
  name: string;
  code: string;
  description: string | null;
  permissions: AdminPermission[];
  /** The Super admin role: every permission, read-only. */
  is_system: boolean;
  holder_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminRoleHolder {
  id: string;
  first_name: string;
  last_name: string;
  /** Only for a caller with users:read. */
  email: string | null;
  is_suspended: boolean;
}

export interface AdminRoleDetail extends AdminRole {
  holders: AdminRoleHolder[];
}

export type AdminAccessEvent =
  | "ADMIN_ROLE_CREATED"
  | "ADMIN_ROLE_UPDATED"
  | "ADMIN_ROLE_DELETED"
  | "ADMIN_ROLES_ASSIGNED"
  | "ADMIN_GRANTED"
  | "ADMIN_REVOKED"
  | "ADMIN_ROLES_MIGRATED";

export interface AdminAccessDiff {
  added: string[];
  removed: string[];
  renamed?: { from: string; to: string };
  permissions_added?: string[];
  permissions_removed?: string[];
}

export interface AdminRoleHistoryItem {
  id: string;
  event: AdminAccessEvent;
  actor_user_id: string | null;
  actor: { id: string; first_name: string; last_name: string } | null;
  subject_type: "role" | "user";
  subject_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  diff: AdminAccessDiff;
  reason: string | null;
  created_at: string;
}

export interface AdminRoleHistoryPage {
  items: AdminRoleHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

/** One row of the Team table (GET /admin/admins). */
export interface AdminTeamMember {
  id: string;
  first_name: string;
  last_name: string;
  /** Only for a caller with users:read. */
  email: string | null;
  profile_picture: string | null;
  is_suspended: boolean;
  last_login: string | null;
  roles: AdminAccessRole[];
  /** Given directly (scripts, before roles), not through a role. */
  direct_permissions: AdminPermission[];
  effective_permissions: AdminPermission[];
  is_super: boolean;
  /** Resolved by the pre-migration rule. */
  legacy: boolean;
}

/** What PUT /admin/admins/:userId/roles and DELETE /admin/admins/:userId changed. */
export interface AdminRolesChange {
  user_id: string;
  is_admin: boolean;
  roles: AdminAccessRole[];
  effective_permissions: AdminPermission[];
  /** null when nothing changed. */
  event: AdminAccessEvent | null;
  diff: {
    roles_added: AdminAccessRole[];
    roles_removed: AdminAccessRole[];
    permissions_added: AdminPermission[];
    permissions_removed: AdminPermission[];
  };
}

/** A person's admin access on the user page (GET /admin/users/:userId). */
export interface AdminUserAccess {
  roles: AdminAccessRole[];
  direct_permissions: AdminPermission[];
  effective_permissions: AdminPermission[];
  is_super: boolean;
  legacy: boolean;
}

export interface AdminRoleInput {
  name: string;
  description?: string;
  permissions: AdminPermission[];
}

export const adminRoleKeys = {
  all: ["admin", "roles"] as const,
  permissions: () => ["admin", "permissions"] as const,
  list: () => ["admin", "roles", "list"] as const,
  detail: (id: string) => ["admin", "roles", "detail", id] as const,
  history: (id: string) => ["admin", "roles", "history", id] as const,
  admins: () => ["admin", "admins"] as const,
};

export const adminRolesService = {
  listPermissions(): Promise<ApiResponse<AdminPermissionGroup[]>> {
    return apiClient.get<AdminPermissionGroup[]>("/admin/permissions");
  },
  listRoles(): Promise<ApiResponse<AdminRole[]>> {
    return apiClient.get<AdminRole[]>("/admin/roles");
  },
  getRole(roleId: string): Promise<ApiResponse<AdminRoleDetail>> {
    return apiClient.get<AdminRoleDetail>(`/admin/roles/${encodeURIComponent(roleId)}`);
  },
  roleHistory(roleId: string, page = 1, limit = 25): Promise<ApiResponse<AdminRoleHistoryPage>> {
    return apiClient.get<AdminRoleHistoryPage>(
      `/admin/roles/${encodeURIComponent(roleId)}/history?page=${page}&limit=${limit}`,
    );
  },
  createRole(input: AdminRoleInput): Promise<ApiResponse<AdminRole>> {
    return apiClient.post<AdminRole>("/admin/roles", input);
  },
  /** `expected_updated_at` is the role's updated_at as loaded (409 ADMIN_ROLE_STALE otherwise). */
  updateRole(
    roleId: string,
    input: Partial<AdminRoleInput> & { expected_updated_at: string },
  ): Promise<ApiResponse<AdminRole>> {
    return apiClient.patch<AdminRole>(`/admin/roles/${encodeURIComponent(roleId)}`, input);
  },
  deleteRole(roleId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/admin/roles/${encodeURIComponent(roleId)}`);
  },
  listAdmins(): Promise<ApiResponse<AdminTeamMember[]>> {
    return apiClient.get<AdminTeamMember[]>("/admin/admins");
  },
  /** The whole list (set semantics); an empty list takes every role away. */
  setAdminRoles(userId: string, roleIds: string[], reason?: string): Promise<ApiResponse<AdminRolesChange>> {
    return apiClient.put<AdminRolesChange>(`/admin/admins/${encodeURIComponent(userId)}/roles`, {
      role_ids: roleIds,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    });
  },
  revokeAdmin(userId: string, reason?: string): Promise<ApiResponse<AdminRolesChange>> {
    return apiClient.delete<AdminRolesChange>(
      `/admin/admins/${encodeURIComponent(userId)}`,
      reason?.trim() ? { reason: reason.trim() } : {},
    );
  },
};
