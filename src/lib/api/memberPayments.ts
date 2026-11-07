import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * The member's own money (binectics-api src/member-payments; design note
 * binectics-plans/member-payments-design.md): payment history, receipts, and
 * paying what a gym says they owe.
 *
 * Money is integer minor units end to end and currencies are never added
 * together. The checkout amount is the API's: the client sends no amount, and
 * the popup's callback is never proof of payment, only `verify` and a re-read
 * are.
 */

export type PaymentKind = "membership" | "session" | "content" | "service" | "refund";
export const PAYMENT_KINDS: PaymentKind[] = ["membership", "session", "content", "service", "refund"];
export type PaymentMethodWord = "card" | "bank_transfer" | "cash" | "other";

export interface PaymentProvider {
  id: string | null;
  name: string;
}

export interface RefundState {
  state: "none" | "partial" | "full";
  refundedMinor: number;
}

export interface MemberPayment {
  id: string;
  kind: PaymentKind;
  description: string;
  provider: PaymentProvider;
  amountMinor: number;
  currency: string;
  status: "paid" | "refund";
  paidAt: string;
  method: PaymentMethodWord;
  reference: string | null;
  receiptAvailable: boolean;
  refund: RefundState;
}

export interface MemberPaymentsPage {
  items: MemberPayment[];
  nextCursor: string | null;
}

export interface CurrencyTotal {
  currency: string;
  paidMinor: number;
  refundedMinor: number;
  netMinor: number;
}

export interface MemberReceipt {
  receiptNumber: string;
  kind: PaymentKind;
  provider: PaymentProvider;
  memberName: string;
  description: string;
  period: { start: string; end: string } | null;
  amountMinor: number;
  currency: string;
  paidAt: string;
  method: PaymentMethodWord;
  reference: string | null;
  refunds: { amountMinor: number; refundedAt: string }[];
  refund: RefundState;
}

export type OwedKind = "first_payment" | "renewal";
export type OwedState = "payable" | "paid" | "closed";

export interface OwedCharge {
  id: string;
  kind: OwedKind;
  state: OwedState;
  provider: PaymentProvider;
  description: string;
  amountMinor: number;
  currency: string;
  owedSince: string;
  lapsesAt: string | null;
  payVia: "checkout" | "renewal_checkout";
  renewal: { listingId: string | null; planId: string } | null;
  paidAt: string | null;
}

export interface OwedList {
  items: OwedCharge[];
  totalsByCurrency: { currency: string; amountMinor: number }[];
}

export interface OwedCheckout {
  reference: string;
  accessCode: string;
  authorizationUrl: string | null;
  amountMinor: number;
  currency: string;
}

export type OwedGatewayStatus =
  | "paid"
  | "not_payable"
  | "success"
  | "failed"
  | "abandoned"
  | "ongoing"
  | "pending"
  | "mismatch"
  | "error";

export interface OwedVerification {
  charge: OwedCharge;
  gatewayStatus: OwedGatewayStatus | null;
}

/** API refusal codes the pay page speaks to by name. */
export const MEMBER_CHARGE_CODES = {
  ALREADY_PAID: "MEMBER_CHARGE_ALREADY_PAID",
  NOT_PAYABLE: "MEMBER_CHARGE_NOT_PAYABLE",
  USE_RENEWAL_CHECKOUT: "MEMBER_CHARGE_USE_RENEWAL_CHECKOUT",
  TRANSFER_IN_PROGRESS: "MEMBER_CHARGE_TRANSFER_IN_PROGRESS",
} as const;

// ─── Normalisers ────────────────────────────────────────────────────────────

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
const cur = (v: unknown): string => str(v).toUpperCase();
const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

const provider = (v: unknown): PaymentProvider => {
  const r = rec(v);
  return { id: strOrNull(r.id), name: str(r.name) };
};
const refundState = (v: unknown): RefundState => {
  const r = rec(v);
  const state = r.state === "partial" || r.state === "full" ? r.state : "none";
  return { state, refundedMinor: num(r.refunded_minor) };
};
const kindOf = (v: unknown): PaymentKind =>
  PAYMENT_KINDS.includes(v as PaymentKind) ? (v as PaymentKind) : "service";
const methodOf = (v: unknown): PaymentMethodWord =>
  v === "card" || v === "bank_transfer" || v === "cash" ? v : "other";

export function normalizePayment(raw: Record<string, unknown>): MemberPayment {
  return {
    id: str(raw.id),
    kind: kindOf(raw.kind),
    description: str(raw.description),
    provider: provider(raw.provider),
    amountMinor: num(raw.amount_minor),
    currency: cur(raw.currency),
    status: raw.status === "refund" ? "refund" : "paid",
    paidAt: str(raw.paid_at),
    method: methodOf(raw.method),
    reference: strOrNull(raw.reference),
    receiptAvailable: raw.receipt_available === true,
    refund: refundState(raw.refund),
  };
}

export function normalizeReceipt(raw: Record<string, unknown>): MemberReceipt {
  const p = rec(raw.period);
  return {
    receiptNumber: str(raw.receipt_number),
    kind: kindOf(raw.kind),
    provider: provider(raw.provider),
    memberName: str(raw.member_name),
    description: str(raw.description),
    period: strOrNull(p.start) && strOrNull(p.end) ? { start: str(p.start), end: str(p.end) } : null,
    amountMinor: num(raw.amount_minor),
    currency: cur(raw.currency),
    paidAt: str(raw.paid_at),
    method: methodOf(raw.method),
    reference: strOrNull(raw.reference),
    refunds: list(raw.refunds).map((r) => ({ amountMinor: num(r.amount_minor), refundedAt: str(r.refunded_at) })),
    refund: refundState(raw.refund),
  };
}

export function normalizeOwed(raw: Record<string, unknown>): OwedCharge {
  const renewal = rec(raw.renewal);
  const state: OwedState = raw.state === "payable" || raw.state === "paid" ? raw.state : "closed";
  return {
    id: str(raw.id),
    kind: raw.kind === "renewal" ? "renewal" : "first_payment",
    // An unknown state is never offered for payment.
    state,
    provider: provider(raw.provider),
    description: str(raw.description),
    amountMinor: num(raw.amount_minor),
    currency: cur(raw.currency),
    owedSince: str(raw.owed_since),
    lapsesAt: strOrNull(raw.lapses_at),
    payVia: raw.pay_via === "renewal_checkout" ? "renewal_checkout" : "checkout",
    renewal: strOrNull(renewal.plan_id)
      ? { listingId: strOrNull(renewal.listing_id), planId: str(renewal.plan_id) }
      : null,
    paidAt: strOrNull(raw.paid_at),
  };
}

const GATEWAY: OwedGatewayStatus[] = [
  "paid",
  "not_payable",
  "success",
  "failed",
  "abandoned",
  "ongoing",
  "pending",
  "mismatch",
  "error",
];

// ─── Calls ──────────────────────────────────────────────────────────────────

const enc = encodeURIComponent;

function mapOk<T, U>(res: ApiResponse<T>, fn: (data: T) => U): ApiResponse<U> {
  if (!res.success) return { ...res, data: undefined } as ApiResponse<U>;
  return { ...res, data: fn(res.data as T) };
}

export interface PaymentsQuery {
  limit?: number;
  cursor?: string | null;
  kind?: PaymentKind | "";
  currency?: string;
  from?: string;
  to?: string;
}

export const memberPaymentsService = {
  async list(q: PaymentsQuery = {}): Promise<ApiResponse<MemberPaymentsPage>> {
    const params = new URLSearchParams();
    if (q.limit) params.set("limit", String(q.limit));
    if (q.cursor) params.set("cursor", q.cursor);
    if (q.kind) params.set("kind", q.kind);
    if (q.currency) params.set("currency", q.currency);
    if (q.from) params.set("from", q.from);
    if (q.to) params.set("to", q.to);
    const qs = params.toString();
    const res = await apiClient.get<{ items?: unknown; next_cursor?: unknown }>(
      `/transactions/me${qs ? `?${qs}` : ""}`,
    );
    return mapOk(res, (d) => ({
      items: list(d?.items).map(normalizePayment),
      nextCursor: strOrNull(d?.next_cursor),
    }));
  },

  async summary(): Promise<ApiResponse<CurrencyTotal[]>> {
    const res = await apiClient.get<{ by_currency?: unknown }>("/transactions/me/summary");
    return mapOk(res, (d) =>
      list(d?.by_currency).map((t) => ({
        currency: cur(t.currency),
        paidMinor: num(t.paid_minor),
        refundedMinor: num(t.refunded_minor),
        netMinor: num(t.net_minor),
      })),
    );
  },

  async receipt(id: string): Promise<ApiResponse<MemberReceipt>> {
    const res = await apiClient.get<Record<string, unknown>>(`/transactions/me/${enc(id)}/receipt`);
    return mapOk(res, (d) => normalizeReceipt(rec(d)));
  },

  async owed(): Promise<ApiResponse<OwedList>> {
    const res = await apiClient.get<{ items?: unknown; totals_by_currency?: unknown }>("/member-billing/charges");
    return mapOk(res, (d) => ({
      items: list(d?.items).map(normalizeOwed),
      totalsByCurrency: list(d?.totals_by_currency).map((t) => ({
        currency: cur(t.currency),
        amountMinor: num(t.amount_minor),
      })),
    }));
  },

  async charge(id: string): Promise<ApiResponse<OwedCharge>> {
    const res = await apiClient.get<Record<string, unknown>>(`/member-billing/charges/${enc(id)}`);
    return mapOk(res, (d) => normalizeOwed(rec(d)));
  },

  /** Opens the checkout for what is owed. No amount is sent: the API decides it. */
  async checkout(id: string): Promise<ApiResponse<OwedCheckout | null>> {
    const res = await apiClient.post<Record<string, unknown>>(`/member-billing/charges/${enc(id)}/checkout`, {});
    return mapOk(res, (d) => {
      const r = rec(d);
      if (typeof r.reference !== "string" || typeof r.access_code !== "string") return null;
      return {
        reference: r.reference,
        accessCode: r.access_code,
        authorizationUrl: strOrNull(r.authorization_url),
        amountMinor: num(r.amount_minor),
        currency: cur(r.currency),
      };
    });
  },

  /** Asks the API to check the payment with Paystack. The popup's word is never used. */
  async verify(id: string): Promise<ApiResponse<OwedVerification>> {
    const res = await apiClient.post<{ charge?: unknown; verification?: { gateway_status?: unknown } }>(
      `/member-billing/charges/${enc(id)}/verify`,
      {},
    );
    return mapOk(res, (d) => {
      const g = d?.verification?.gateway_status;
      return {
        charge: normalizeOwed(rec(d?.charge)),
        gatewayStatus: GATEWAY.includes(g as OwedGatewayStatus) ? (g as OwedGatewayStatus) : null,
      };
    });
  },
};
