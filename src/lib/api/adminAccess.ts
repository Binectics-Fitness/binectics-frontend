/**
 * The signed-in admin's own access (GET /admin/me/access). Every admin may
 * call it; the API resolves it fresh on each request.
 */
import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { AdminPermission } from "@/lib/admin/permissions";

export interface AdminAccessRole {
  id: string;
  name: string;
  is_system: boolean;
}

export interface AdminMeAccess {
  /** Effective permissions, in catalogue order. */
  permissions: AdminPermission[];
  roles: AdminAccessRole[];
  /** Holds the Super admin role (every permission). */
  is_super: boolean;
  /** Resolved by the pre-migration rule (an empty admin_permissions). */
  legacy: boolean;
}

export const adminAccessService = {
  getMyAccess(): Promise<ApiResponse<AdminMeAccess>> {
    return apiClient.get<AdminMeAccess>("/admin/me/access");
  },
};
