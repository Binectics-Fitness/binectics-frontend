import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Member import (API: marketplace/organizations/:orgId/member-imports).
 *
 * A gym moving from another system uploads its member list as CSV, maps
 * the columns, previews every row, and confirms. Each imported member gets
 * a membership offer carrying the end date from the old system; they claim
 * it by signing in (or signing up) with that email, and the membership
 * keeps that end date. Nothing is charged and nothing is recorded as
 * revenue: they paid the gym before Binectics.
 */

export const IMPORT_FIELDS = [
  "full_name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "plan",
  "end_date",
  "start_date",
  "branch",
  "notes",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Our field → the file's column (0-based). A field left out isn't in the file. */
export type ImportMapping = Partial<Record<ImportField, number>>;

export type ImportDateFormat = "auto" | "dmy" | "mdy" | "ymd";
export type ImportInviteMode = "now" | "later";
export type MemberImportState = "draft" | "importing" | "done" | "failed";
export type ImportRowStatus = "ready" | "error" | "skipped" | "over_cap";

export interface ImportRowProblem {
  code: string;
  /** error: not imported until fixed; skip: already here; warning: imported anyway. */
  severity: "error" | "skip" | "warning";
  field?: ImportField;
  message: string;
}

export interface ImportPreviewRow {
  /** 1-based data row (the spreadsheet's line number minus the header). */
  row: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  plan_value: string;
  plan_id: string | null;
  branch_value: string | null;
  listing_id: string | null;
  notes: string | null;
  /** YYYY-MM-DD as read from the file, so a day/month swap is visible. */
  start_date: string | null;
  end_date: string | null;
  status: ImportRowStatus;
  problems: ImportRowProblem[];
}

export interface ImportSeats {
  /** Null on an uncapped plan. */
  limit: number | null;
  used: number;
  reserved_by_imports: number;
  available: number | null;
  needed: number;
  fits: number;
  over_by: number;
  /** The seat cap that would take every ready row. */
  limit_needed: number;
  plan_tier: string | null;
}

export interface MemberImportPreview {
  import_id: string;
  status: MemberImportState;
  file_name: string | null;
  headers: string[];
  sample: string[][];
  mapping: ImportMapping;
  mapping_problems: string[];
  date_format: {
    requested: ImportDateFormat;
    applied: ImportDateFormat;
    day_first_only: number;
    month_first_only: number;
    ambiguous_rows: number;
  };
  time_zone: string;
  plans: Array<{
    value: string;
    rows: number;
    plan_id: string | null;
    plan_name: string | null;
    matched: "name" | "chosen" | null;
  }>;
  branches: Array<{
    value: string;
    rows: number;
    listing_id: string | null;
    listing_name: string | null;
    matched: "name" | "chosen" | null;
  }>;
  gym_plans: Array<{ _id: string; name: string }>;
  gym_branches: Array<{ _id: string; name: string }>;
  default_branch: { _id: string; name: string } | null;
  seats: ImportSeats;
  summary: {
    total: number;
    ready: number;
    errors: number;
    skipped: number;
    over_cap: number;
    warnings: number;
  };
  rows: ImportPreviewRow[];
  limits: { max_rows: number; max_file_bytes: number; invites_per_day: number };
}

export interface MemberImportChoices {
  mapping?: ImportMapping;
  plan_map?: Array<{ value: string; plan_id: string }>;
  branch_map?: Array<{ value: string; listing_id: string }>;
  default_listing_id?: string | null;
  date_format?: ImportDateFormat;
}

export interface ImportInviteCounts {
  held: number;
  queued: number;
  sent: number;
}

export interface MemberImportStatus {
  import_id: string;
  status: MemberImportState;
  invite_mode: ImportInviteMode | null;
  processed: number;
  total: number;
  result: {
    total?: number;
    imported?: number;
    already_imported?: number;
    already_member?: number;
    errors?: number;
    over_cap?: number;
  } | null;
  invites: ImportInviteCounts;
  invites_per_day: number;
}

export interface MemberImportListItem {
  _id: string;
  status: MemberImportState;
  file_name: string | null;
  row_count: number;
  result: MemberImportStatus["result"];
  invite_mode: ImportInviteMode | null;
  created_at: string | null;
  confirmed_at: string | null;
  finished_at: string | null;
  invites: ImportInviteCounts;
}

const base = (orgId: string) => `/marketplace/organizations/${orgId}/member-imports`;

export const memberImportsApi = {
  upload(orgId: string, file: File): Promise<ApiResponse<MemberImportPreview>> {
    const form = new FormData();
    form.append("file", file);
    return apiClient.postFormData<MemberImportPreview>(base(orgId), form);
  },
  preview(orgId: string, importId: string, choices: MemberImportChoices): Promise<ApiResponse<MemberImportPreview>> {
    return apiClient.post<MemberImportPreview>(`${base(orgId)}/${importId}/preview`, choices);
  },
  confirm(orgId: string, importId: string, inviteMode: ImportInviteMode): Promise<ApiResponse<MemberImportStatus>> {
    return apiClient.post<MemberImportStatus>(`${base(orgId)}/${importId}/confirm`, {
      invite_mode: inviteMode,
    });
  },
  status(orgId: string, importId: string): Promise<ApiResponse<MemberImportStatus>> {
    return apiClient.get<MemberImportStatus>(`${base(orgId)}/${importId}`);
  },
  list(orgId: string): Promise<ApiResponse<MemberImportListItem[]>> {
    return apiClient.get<MemberImportListItem[]>(base(orgId));
  },
  sendInvites(orgId: string, importId: string): Promise<ApiResponse<MemberImportStatus>> {
    return apiClient.post<MemberImportStatus>(`${base(orgId)}/${importId}/invites`, {});
  },
};
