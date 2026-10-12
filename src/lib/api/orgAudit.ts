/**
 * A workspace's own activity log (GET /teams/organizations/:id/audit-log).
 *
 * The API returns a projected, allow-listed view: no raw audit metadata,
 * no secrets, ids only for people on this team. Readable by the workspace
 * owner and anyone whose role holds `team:view_audit_log` (the default
 * Admin role does); `Organization.can_view_audit_log` says which.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export enum OrgAuditCategory {
  TEAM = "team",
  ROLES = "roles",
  PAYMENTS = "payments",
  LOYALTY = "loyalty",
}

/** Who did it, as this workspace may see them. */
export enum OrgAuditPersonKind {
  OWNER = "owner",
  MEMBER = "member",
  /** A Binectics admin who is not on this team. Never named. */
  PLATFORM_ADMIN = "platform_admin",
  /** Someone no longer on this team. Never named. */
  FORMER_MEMBER = "former_member",
  /** No person: a scheduled check, or a follow-on change. */
  SYSTEM = "system",
}

export interface OrgAuditPerson {
  kind: OrgAuditPersonKind;
  name: string;
  /** Only for the owner and current team members. */
  user_id?: string;
}

export interface OrgAuditDetails {
  role_name?: string | null;
  from_role_name?: string | null;
  to_role_name?: string | null;
  from_status?: string;
  to_status?: string;
  permissions?: string[];
  permissions_added?: string[];
  permissions_removed?: string[];
  gateway?: string;
  created?: boolean;
  public_key_changed?: boolean;
  is_active?: boolean;
  removed?: boolean;
  currency?: string;
  currencies_removed?: string[];
  currencies_missing?: string[];
  fields?: string[];
  enabled?: boolean;
}

export interface OrgAuditEntry {
  id: string;
  event: string;
  label: string;
  category: OrgAuditCategory;
  occurred_at: string;
  actor: OrgAuditPerson;
  subject: OrgAuditPerson | null;
  details: OrgAuditDetails;
}

export interface OrgAuditPage {
  items: OrgAuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface OrgAuditFilterOptions {
  event_types: Array<{ event: string; label: string; category: OrgAuditCategory }>;
  actors: Array<{ user_id: string; name: string }>;
}

export interface OrgAuditQuery {
  page?: number;
  limit?: number;
  event?: string;
  actor_id?: string;
  /** ISO date-time lower bound. */
  from?: string;
  /** ISO date-time upper bound. */
  to?: string;
}

function query(params: OrgAuditQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

class OrgAuditService {
  list(organizationId: string, params: OrgAuditQuery = {}): Promise<ApiResponse<OrgAuditPage>> {
    return apiClient.get<OrgAuditPage>(
      `/teams/organizations/${organizationId}/audit-log${query(params)}`,
    );
  }

  filters(organizationId: string): Promise<ApiResponse<OrgAuditFilterOptions>> {
    return apiClient.get<OrgAuditFilterOptions>(
      `/teams/organizations/${organizationId}/audit-log/filters`,
    );
  }
}

export const orgAuditService = new OrgAuditService();
