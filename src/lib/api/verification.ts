import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Provider verification review (gyms, trainers, dietitians). Admins read the
 * queue and documents (signed links that expire) and decide; a provider
 * reads their own status.
 */

export type VerificationSubjectType = "organization" | "dietitian";
export type VerificationKind = "gym" | "trainer" | "dietitian";
export type VerificationStatus = "pending" | "verified" | "rejected" | "revoked";
export type VerificationReasonCode =
  | "documents_missing_or_expired"
  | "documents_unreadable"
  | "details_do_not_match"
  | "not_eligible"
  | "other";

interface VerificationStatusFields {
  status: VerificationStatus;
  reason_code: VerificationReasonCode | null;
  reason_label: string | null;
  reason: string | null;
  decided_at: string | null;
  /** The documents changed after the latest decision. */
  documents_changed: boolean;
  /** A rejected or revoked provider sent new documents. */
  resubmitted: boolean;
}

export interface VerificationQueueItem extends VerificationStatusFields {
  subject_type: VerificationSubjectType;
  subject_id: string;
  kind: VerificationKind;
  name: string;
  country: string | null;
  owner: { id: string; name: string | null; email: string | null };
  document_count: number;
  updated_at: string | null;
}

export interface VerificationDocument {
  key: string;
  label: string;
  has_file: boolean;
  /** A signed link that expires (documents_expire_in_seconds), or null. */
  url: string | null;
  format: string | null;
  unavailable_reason: "not_uploaded" | "not_private" | null;
  uploaded_at: string | null;
  license: {
    name: string;
    issuing_body: string;
    number: string | null;
    country_code: string;
    expires_at: string;
    is_current: boolean;
  } | null;
}

export interface VerificationDetail extends VerificationStatusFields {
  subject_type: VerificationSubjectType;
  subject_id: string;
  kind: VerificationKind;
  name: string;
  country: string | null;
  updated_at: string | null;
  owner: {
    id: string;
    name: string;
    email: string | null;
    phone_number: string | null;
    is_suspended: boolean;
    joined_at: string | null;
  } | null;
  documents: VerificationDocument[];
  documents_expire_in_seconds: number;
  listings: {
    id: string;
    headline: string | null;
    slug: string | null;
    account_type: string;
    verification_badge: string;
    is_suspended: boolean;
  }[];
  history: {
    action: "approved" | "rejected" | "revoked";
    reason_code: VerificationReasonCode | null;
    reason_label: string | null;
    reason: string | null;
    at: string;
    by: { id: string; name: string | null };
  }[];
}

export interface VerificationSummary {
  pending: number;
  by_kind: Record<VerificationKind, number>;
}

/** The caller's own verification, per workspace they own and for their dietitian credentials. */
export interface MyVerification {
  subject_type: VerificationSubjectType;
  subject_id: string;
  kind: VerificationKind;
  name: string;
  document_count: number;
  status: VerificationStatus | "not_submitted";
  reason_code: VerificationReasonCode | null;
  reason_label: string | null;
  reason: string | null;
  decided_at: string | null;
  documents_changed: boolean;
}

const base = (type: VerificationSubjectType, id: string) =>
  `/admin/verification/${type}/${encodeURIComponent(id)}`;

export const verificationService = {
  async list(filters: { kind?: VerificationKind; status?: VerificationStatus } = {}): Promise<ApiResponse<VerificationQueueItem[]>> {
    const qs = new URLSearchParams();
    if (filters.kind) qs.set("kind", filters.kind);
    if (filters.status) qs.set("status", filters.status);
    const q = qs.toString();
    return apiClient.get<VerificationQueueItem[]>(`/admin/verification${q ? `?${q}` : ""}`);
  },

  async summary(): Promise<ApiResponse<VerificationSummary>> {
    return apiClient.get<VerificationSummary>("/admin/verification/summary");
  },

  async detail(type: VerificationSubjectType, id: string): Promise<ApiResponse<VerificationDetail>> {
    return apiClient.get<VerificationDetail>(base(type, id));
  },

  async approve(type: VerificationSubjectType, id: string): Promise<ApiResponse<VerificationDetail>> {
    return apiClient.post<VerificationDetail>(`${base(type, id)}/approve`);
  },

  async reject(
    type: VerificationSubjectType,
    id: string,
    body: { reason_code: VerificationReasonCode; message: string },
  ): Promise<ApiResponse<VerificationDetail>> {
    return apiClient.post<VerificationDetail>(`${base(type, id)}/reject`, body);
  },

  async revoke(
    type: VerificationSubjectType,
    id: string,
    body: { reason_code: VerificationReasonCode; message: string },
  ): Promise<ApiResponse<VerificationDetail>> {
    return apiClient.post<VerificationDetail>(`${base(type, id)}/revoke`, body);
  },

  async getMine(): Promise<ApiResponse<MyVerification[]>> {
    return apiClient.get<MyVerification[]>("/verification/me");
  },
};
