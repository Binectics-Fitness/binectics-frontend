/**
 * Client progress reports (PDF).
 *
 * A coach generates a report for a period (a draft only they and their
 * colleagues with access can open), checks the PDF, then shares it, which
 * lists it on the client's Reports page and notifies them. The PDF itself is
 * served behind a signed link minted on click (valid 24 hours by default,
 * set by the API), and nothing here stores or reuses it: every click asks
 * for a fresh one, and the API re-checks access on every download.
 */

import { apiClient, API_BASE_URL } from "./client";
import type { ApiResponse } from "@/lib/types";
import type {
  CreateProgressReportDto,
  ProgressReportLink,
  ProgressReportSnapshot,
  ProgressReportView,
} from "./generated/types";

export type { CreateProgressReportDto, ProgressReportLink, ProgressReportSnapshot, ProgressReportView };

export const progressReportsService = {
  generate(profileId: string, body: CreateProgressReportDto): Promise<ApiResponse<ProgressReportView>> {
    return apiClient.post<ProgressReportView>(`/progress/clients/${profileId}/reports`, body);
  },

  listForClient(profileId: string): Promise<ApiResponse<ProgressReportView[]>> {
    return apiClient.get<ProgressReportView[]>(`/progress/clients/${profileId}/reports`);
  },

  listMine(): Promise<ApiResponse<ProgressReportView[]>> {
    return apiClient.get<ProgressReportView[]>(`/progress/my-reports`);
  },

  share(reportId: string): Promise<ApiResponse<ProgressReportView>> {
    return apiClient.post<ProgressReportView>(`/progress/reports/${reportId}/share`);
  },

  link(reportId: string): Promise<ApiResponse<ProgressReportLink>> {
    return apiClient.post<ProgressReportLink>(`/progress/reports/${reportId}/link`);
  },
};

/**
 * Opens a report's PDF in a new tab.
 *
 * The tab is opened synchronously inside the click (so popup blockers allow
 * it) and pointed at the signed link once the API returns it. Returns an
 * error message, or null on success.
 */
export async function openReportPdf(reportId: string): Promise<string | null> {
  const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (tab) tab.opener = null;
  const res = await progressReportsService.link(reportId);
  if (!res.success || !res.data) {
    tab?.close();
    return res.message ?? "Couldn't open the report.";
  }
  const url = `${API_BASE_URL}${res.data.path}`;
  if (tab) tab.location.href = url;
  else window.location.assign(url);
  return null;
}
