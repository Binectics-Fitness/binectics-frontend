/**
 * Close / reopen a gym and download its records (binectics-api PR #336).
 * Routes live under /teams because that is where organizations live.
 */
import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import {
  exportPath,
  parseClosure,
  parseClosures,
  type ClosedOrganization,
  type ExportFormat,
  type ExportKind,
} from "@/lib/orgClosure/closure";

export const orgClosureService = {
  async close(
    orgId: string,
    body: { confirm: string; reason?: string },
  ): Promise<ApiResponse<ClosedOrganization | null>> {
    const res = await apiClient.post<unknown>(`/teams/organizations/${orgId}/close`, body);
    return res.success ? { ...res, data: parseClosure(res.data) } : { ...res, data: undefined };
  },

  async reopen(orgId: string): Promise<ApiResponse<ClosedOrganization | null>> {
    const res = await apiClient.post<unknown>(`/teams/organizations/${orgId}/reopen`, {});
    return res.success ? { ...res, data: parseClosure(res.data) } : { ...res, data: undefined };
  },

  async listClosed(): Promise<ApiResponse<ClosedOrganization[]>> {
    const res = await apiClient.get<unknown>("/teams/closed-organizations");
    return res.success ? { ...res, data: parseClosures(res.data) } : { ...res, data: undefined };
  },

  /** The file's text: CSV as sent, or the JSON re-serialised for saving. */
  async fetchExport(
    kind: ExportKind,
    orgId: string,
    format: ExportFormat,
  ): Promise<ApiResponse<string>> {
    const res = await apiClient.get<unknown>(exportPath(kind, orgId, format));
    if (!res.success) return { ...res, data: undefined };
    const text =
      typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? { items: [] }, null, 2);
    return { ...res, data: text };
  },
};
