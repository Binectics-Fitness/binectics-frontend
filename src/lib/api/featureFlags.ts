/**
 * Runtime feature flags (binectics-api docs/platform/FEATURE_FLAGS.md).
 *
 * Admins turn a flag on or off globally and per organisation; an
 * organisation's override beats the global value. These are operational
 * switches, not plan entitlements.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface FeatureFlagPerson {
  id: string;
  name: string;
}

export interface FeatureFlagOrg {
  id: string;
  /** Null when the organisation no longer exists. */
  name: string | null;
  account_type: string | null;
}

export interface AdminFeatureFlag {
  key: string;
  description: string;
  /** The console asks for the key to be typed before changing it. */
  risky: boolean;
  default: boolean;
  /** The global value in force now. */
  enabled: boolean;
  /** No admin has set it yet; the registry default applies. */
  is_default: boolean;
  overrides_on: number;
  overrides_off: number;
  updated_at: string | null;
  updated_by: FeatureFlagPerson | null;
}

export interface AdminFeatureFlagOverride {
  organization: FeatureFlagOrg;
  enabled: boolean;
  reason: string | null;
  updated_at: string | null;
  updated_by: FeatureFlagPerson | null;
}

export interface AdminFeatureFlagDetail extends AdminFeatureFlag {
  overrides: AdminFeatureFlagOverride[];
}

export type FeatureFlagChangeAction = "global_set" | "override_set" | "override_removed";

export interface AdminFeatureFlagChange {
  id: string;
  key: string;
  action: FeatureFlagChangeAction;
  organization: FeatureFlagOrg | null;
  previous: boolean | null;
  value: boolean | null;
  reason: string | null;
  actor: FeatureFlagPerson | null;
  created_at: string | null;
}

/** GET /feature-flags/me: global values and the caller's own orgs only. */
export interface EffectiveFeatureFlags {
  flags: Record<string, boolean>;
  organizations: { organization_id: string; flags: Record<string, boolean> }[];
}

const enc = encodeURIComponent;

export const featureFlagsService = {
  async me(): Promise<ApiResponse<EffectiveFeatureFlags>> {
    return apiClient.get<EffectiveFeatureFlags>("/feature-flags/me");
  },

  async adminList(): Promise<ApiResponse<AdminFeatureFlag[]>> {
    return apiClient.get<AdminFeatureFlag[]>("/admin/feature-flags");
  },

  async adminGet(key: string): Promise<ApiResponse<AdminFeatureFlagDetail>> {
    return apiClient.get<AdminFeatureFlagDetail>(`/admin/feature-flags/${enc(key)}`);
  },

  async adminHistory(key: string, limit = 50): Promise<ApiResponse<AdminFeatureFlagChange[]>> {
    return apiClient.get<AdminFeatureFlagChange[]>(
      `/admin/feature-flags/${enc(key)}/history?limit=${limit}`,
    );
  },

  async searchOrganizations(search: string): Promise<ApiResponse<FeatureFlagOrg[]>> {
    const q = search.trim();
    return apiClient.get<FeatureFlagOrg[]>(
      `/admin/feature-flags/organizations${q ? `?search=${enc(q)}` : ""}`,
    );
  },

  async setGlobal(
    key: string,
    enabled: boolean,
    reason?: string,
  ): Promise<ApiResponse<{ changed: boolean; flag: AdminFeatureFlag }>> {
    return apiClient.patch(`/admin/feature-flags/${enc(key)}`, withReason({ enabled }, reason));
  },

  async setOverride(
    key: string,
    organizationId: string,
    enabled: boolean,
    reason?: string,
  ): Promise<ApiResponse<{ changed: boolean; override: AdminFeatureFlagOverride }>> {
    return apiClient.put(
      `/admin/feature-flags/${enc(key)}/overrides/${enc(organizationId)}`,
      withReason({ enabled }, reason),
    );
  },

  async removeOverride(
    key: string,
    organizationId: string,
    reason?: string,
  ): Promise<ApiResponse<{ removed: boolean }>> {
    return apiClient.delete(
      `/admin/feature-flags/${enc(key)}/overrides/${enc(organizationId)}`,
      withReason({}, reason),
    );
  },
};

function withReason<T extends object>(body: T, reason?: string): T & { reason?: string } {
  const r = reason?.trim();
  return r ? { ...body, reason: r } : body;
}

export const featureFlagKeys = {
  all: ["featureFlags"] as const,
  me: (userId: string | null | undefined) => [...featureFlagKeys.all, "me", userId ?? "anon"] as const,
  adminList: () => [...featureFlagKeys.all, "admin", "list"] as const,
  adminDetail: (key: string) => [...featureFlagKeys.all, "admin", "detail", key] as const,
  adminHistory: (key: string) => [...featureFlagKeys.all, "admin", "history", key] as const,
  orgSearch: (q: string) => [...featureFlagKeys.all, "admin", "orgSearch", q] as const,
};
