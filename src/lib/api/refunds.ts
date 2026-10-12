import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Refunds and disputes (api #218, #219). Money is always integer minor
 * units beside its currency; format it at the edge.
 *
 * Authority follows whoever collected the money:
 * - provider's own Paystack key: the provider refunds it; admins can't;
 * - platform key: admins refund it; the provider can only request one.
 * The API decides and says so in `quote.action`; the UI only follows it.
 */

export type RefundStatus =
  | "requested"
  | "rejected"
  | "queued"
  | "sending"
  | "pending"
  | "needs_attention"
  | "unknown"
  | "processed"
  | "failed";

export type PaymentRail = "provider" | "platform";

export type RefundOrigin =
  | "policy_cancellation"
  | "provider_cancellation"
  | "admin_cancellation"
  | "provider"
  | "admin"
  | "provider_request"
  /** Binectics suspended the provider: an admin decides (owner ruling, Oct 12). */
  | "provider_suspension"
  /** Binectics suspended the member: an admin decides. */
  | "member_suspension"
  /** Paid after the booking hold lapsed and the time was taken. */
  | "late_payment"
  /** The gym cancelled the membership: the unused part, pro rata. */
  | "gym_cancellation";

export interface Refund {
  id: string;
  charge_transaction_id: string;
  organization_id: string | null;
  member_user_id: string;
  reference_type: string | null;
  reference_id: string | null;
  payment_rail: PaymentRail;
  amount_minor: number;
  currency: string;
  status: RefundStatus;
  origin: RefundOrigin;
  reason: string | null;
  gateway_refund_id: string | null;
  gateway_status: string | null;
  needs_review: boolean;
  decision_note: string | null;
  decided_at: string | null;
  processed_at: string | null;
  failed_at: string | null;
  last_error: string | null;
  created_at: string | null;
  updated_at: string | null;
  history: Array<{ at: string; status: string; note?: string }>;
  member?: { id: string; first_name: string | null; last_name: string | null; email: string | null } | null;
  organization?: { id: string; name: string | null } | null;
}

export interface RefundPage {
  items: Refund[];
  total: number;
  page: number;
  limit: number;
}

export interface ChargeRefundQuote {
  charge: {
    id: string;
    type: string;
    amount_minor: number;
    currency: string;
    occurred_at: string | null;
    reference_type: string;
    reference_id: string;
    member_user_id: string;
  };
  payment_rail: PaymentRail;
  /** refund: send it now · request: ask Binectics · none: nothing to do */
  action: "refund" | "request" | "none";
  refundable_minor: number;
  refunded_minor: number;
  refunds: Refund[];
}

export interface RefundPolicy {
  window_hours: number;
  refund_percent: number;
  is_default: boolean;
}

export interface CreateRefundInput {
  amount_minor: number;
  reason?: string;
  idempotency_key: string;
}

export interface DisputeEvidence {
  at: string;
  by_role: "provider" | "admin";
  by_user_id: string;
  note: string | null;
  /** Short-lived signed link; null when the item is only a note. */
  document_url: string | null;
}

export interface Dispute {
  id: string;
  gateway_dispute_id: string;
  charge_transaction_id: string;
  organization_id: string | null;
  member_user_id: string;
  reference_type: string | null;
  reference_id: string | null;
  payment_rail: PaymentRail;
  handled_by: "provider" | "platform";
  can_act: boolean;
  open: boolean;
  gateway_status: string | null;
  category: string | null;
  resolution: string | null;
  refund_amount_minor: number | null;
  currency: string;
  due_at: string | null;
  resolved_at: string | null;
  evidence_requested_at: string | null;
  evidence_request_note: string | null;
  evidence: DisputeEvidence[];
  events: Array<{ at: string; event: string; status?: string }>;
  created_at: string | null;
  updated_at: string | null;
}

export interface DisputePage {
  items: Dispute[];
  total: number;
  page: number;
  limit: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") s.set(k, String(v));
  }
  const q = s.toString();
  return q ? `?${q}` : "";
}

export interface OrgCharge {
  _id: string;
  user_id?: { first_name?: string; last_name?: string; email?: string } | string;
  type: string;
  direction: "credit" | "debit";
  status: string;
  amount_minor: number;
  currency: string;
  occurred_at: string;
  reference_type: string;
  gateway?: string;
}

export interface CancellationQuote {
  booking_id: string;
  cancellable: boolean;
  cancelled_by: "member" | "provider" | "admin";
  paid_online: boolean;
  paid_minor: number;
  refund_minor: number;
  currency: string | null;
  late: boolean;
  percent: number;
  policy: { window_hours: number; refund_percent: number; is_default: boolean };
}

export const refundsService = {
  /** What cancelling this booking now would refund, for whoever may cancel it. */
  cancellationQuote(bookingId: string): Promise<ApiResponse<CancellationQuote>> {
    return apiClient.get(`/refunds/bookings/${bookingId}/cancellation-quote`);
  },

  // ── Provider (organization owner) ──────────────────────────────────────
  listOrgCharges(orgId: string, page = 1): Promise<ApiResponse<{ items: OrgCharge[]; total: number; page: number; limit: number }>> {
    return apiClient.get(
      `/transactions/organizations/${orgId}/transactions${qs({ page, limit: 20, direction: "credit", status: "succeeded" })}`,
    );
  },
  orgQuote(orgId: string, chargeId: string): Promise<ApiResponse<ChargeRefundQuote>> {
    return apiClient.get(`/refunds/organizations/${orgId}/charges/${chargeId}`);
  },
  orgRefund(orgId: string, chargeId: string, input: CreateRefundInput): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/refunds/organizations/${orgId}/charges/${chargeId}/refunds`, input);
  },
  orgRequest(orgId: string, chargeId: string, input: CreateRefundInput): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/refunds/organizations/${orgId}/charges/${chargeId}/refund-requests`, input);
  },
  orgRefunds(orgId: string, params: { status?: RefundStatus; page?: number } = {}): Promise<ApiResponse<RefundPage>> {
    return apiClient.get(`/refunds/organizations/${orgId}${qs(params)}`);
  },
  orgMarkNotSent(orgId: string, refundId: string, note: string): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/refunds/organizations/${orgId}/refunds/${refundId}/mark-not-sent`, { note });
  },
  getPolicy(orgId: string): Promise<ApiResponse<RefundPolicy>> {
    return apiClient.get(`/refunds/organizations/${orgId}/policy`);
  },
  setPolicy(orgId: string, policy: { window_hours: number; refund_percent: number }): Promise<ApiResponse<RefundPolicy>> {
    return apiClient.put(`/refunds/organizations/${orgId}/policy`, policy);
  },
  orgDisputes(orgId: string, params: { state?: "open" | "resolved"; page?: number } = {}): Promise<ApiResponse<DisputePage>> {
    return apiClient.get(`/disputes/organizations/${orgId}${qs(params)}`);
  },
  orgDispute(orgId: string, disputeId: string): Promise<ApiResponse<Dispute>> {
    return apiClient.get(`/disputes/organizations/${orgId}/${disputeId}`);
  },
  addEvidence(orgId: string, disputeId: string, input: { note?: string; document_url?: string }): Promise<ApiResponse<Dispute>> {
    return apiClient.post(`/disputes/organizations/${orgId}/${disputeId}/evidence`, input);
  },
  uploadEvidenceDocument(file: File): Promise<ApiResponse<{ url?: string; publicId?: string }>> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "disputes/evidence");
    return apiClient.postFormData("/upload/document", form);
  },

  // ── Admin ──────────────────────────────────────────────────────────────
  adminRefunds(params: { status?: RefundStatus; payment_rail?: PaymentRail; page?: number } = {}): Promise<ApiResponse<RefundPage>> {
    return apiClient.get(`/admin/refunds${qs(params)}`);
  },
  adminQuote(chargeId: string): Promise<ApiResponse<ChargeRefundQuote>> {
    return apiClient.get(`/admin/refunds/charges/${chargeId}`);
  },
  adminRefund(chargeId: string, input: CreateRefundInput): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/admin/refunds/charges/${chargeId}/refunds`, input);
  },
  approve(refundId: string, note?: string): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/admin/refunds/${refundId}/approve`, note ? { note } : {});
  },
  reject(refundId: string, note: string): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/admin/refunds/${refundId}/reject`, { note });
  },
  check(refundId: string): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/admin/refunds/${refundId}/check`, {});
  },
  adminMarkNotSent(refundId: string, note: string): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/admin/refunds/${refundId}/mark-not-sent`, { note });
  },
  adminDisputes(params: { state?: "open" | "resolved"; handled_by?: "provider" | "platform"; page?: number } = {}): Promise<ApiResponse<DisputePage>> {
    return apiClient.get(`/admin/disputes${qs(params)}`);
  },
  adminDispute(disputeId: string): Promise<ApiResponse<Dispute>> {
    return apiClient.get(`/admin/disputes/${disputeId}`);
  },
  requestEvidence(disputeId: string, note: string): Promise<ApiResponse<Dispute>> {
    return apiClient.post(`/admin/disputes/${disputeId}/request-evidence`, { note });
  },
  adminNote(disputeId: string, note: string): Promise<ApiResponse<Dispute>> {
    return apiClient.post(`/admin/disputes/${disputeId}/notes`, { note });
  },
};
