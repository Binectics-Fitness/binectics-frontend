import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Settled revenue attributed to gym trainers (binectics-api
 * transactions/attributed-revenue.controller.ts, owner decision D6).
 *
 * REPORT ONLY. The gym keeps the money; any commission is settled outside
 * Binectics, so nothing here is a share, a payout or a balance. Amounts are
 * integer minor units per currency and are never summed across currencies.
 */

export interface AttributedMoney {
  currency: string;
  /** Settled payments. */
  grossMinor: number;
  /** Settled refunds of those payments. */
  refundsMinor: number;
  /** gross - refunds. */
  netMinor: number;
  /** Of gross: paid sessions. */
  consultationsMinor: number;
  /** Of gross: memberships a rule routed to the trainer. */
  subscriptionsMinor: number;
  /** Of gross: programs and meal plans. consultations + subscriptions + content = gross. */
  contentMinor: number;
  /** Number of settled payments. */
  payments: number;
}

export interface AttributedOrganization extends AttributedMoney {
  organizationId: string;
  organizationName: string;
}

export interface AttributedItem {
  id: string;
  occurredAt: string;
  type: string;
  direction: "credit" | "debit";
  amountMinor: number;
  currency: string;
  organizationId: string;
}

export interface WindowQuery {
  /** ISO instant, inclusive. */
  from: string;
  /** ISO instant, exclusive. */
  to: string;
  page?: number;
  limit?: number;
}

export interface MyAttributedEarnings {
  from: string;
  to: string;
  currencies: AttributedMoney[];
  byOrganization: AttributedOrganization[];
  items: AttributedItem[];
  total: number;
  page: number;
  limit: number;
}

export interface TrainerRevenueRow extends AttributedMoney {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface OrgTotal {
  currency: string;
  organizationNetMinor: number;
  attributedNetMinor: number;
}

export interface RevenueByTrainer {
  from: string;
  to: string;
  items: TrainerRevenueRow[];
  total: number;
  page: number;
  limit: number;
  totals: OrgTotal[];
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/**
 * Programs and meal plans in gross. The API sends `content_minor`; an API
 * from before that field (binectics-api #334) does not, so a missing field
 * falls back to the old derivation (gross - sessions - memberships, clamped).
 * TODO: delete this fallback once #334 is deployed everywhere.
 */
function contentOf(r: Record<string, unknown>): number {
  if (typeof r.content_minor === "number" && Number.isFinite(r.content_minor)) return r.content_minor;
  return Math.max(0, num(r.gross_minor) - num(r.consultations_minor) - num(r.subscriptions_minor));
}

function money(r: Record<string, unknown>): AttributedMoney {
  return {
    currency: str(r.currency),
    grossMinor: num(r.gross_minor),
    refundsMinor: num(r.refunds_minor),
    netMinor: num(r.net_minor),
    consultationsMinor: num(r.consultations_minor),
    subscriptionsMinor: num(r.subscriptions_minor),
    contentMinor: contentOf(r),
    payments: num(r.payments),
  };
}

export function parseMyEarnings(d: Record<string, unknown>): MyAttributedEarnings {
  const items = list(d.items).map(
    (i): AttributedItem => ({
      id: str(i.id),
      occurredAt: str(i.occurred_at),
      type: str(i.type),
      direction: i.direction === "debit" ? "debit" : "credit",
      amountMinor: num(i.amount_minor),
      currency: str(i.currency),
      organizationId: str(i.organization_id),
    }),
  );
  return {
    from: str(d.from),
    to: str(d.to),
    currencies: list(d.currencies).map(money),
    byOrganization: list(d.by_organization).map((o) => {
      const org = rec(o.organization);
      return { ...money(o), organizationId: str(org.id), organizationName: str(org.name) };
    }),
    items,
    total: typeof d.total === "number" ? d.total : items.length,
    page: num(d.page) || 1,
    limit: num(d.limit),
  };
}

export function parseRevenueByTrainer(d: Record<string, unknown>): RevenueByTrainer {
  const items = list(d.items).map((r): TrainerRevenueRow => {
    const t = rec(r.trainer);
    return { ...money(r), userId: str(t.user_id), firstName: str(t.first_name), lastName: str(t.last_name) };
  });
  return {
    from: str(d.from),
    to: str(d.to),
    items,
    total: typeof d.total === "number" ? d.total : items.length,
    page: num(d.page) || 1,
    limit: num(d.limit),
    totals: list(d.totals).map((t) => ({
      currency: str(t.currency),
      organizationNetMinor: num(t.organization_net_minor),
      attributedNetMinor: num(t.attributed_net_minor),
    })),
  };
}

function query(q: WindowQuery): string {
  const p = new URLSearchParams({ from: q.from, to: q.to });
  if (q.page) p.set("page", String(q.page));
  if (q.limit) p.set("limit", String(q.limit));
  return p.toString();
}

function mapOk<T, U>(res: ApiResponse<T>, fn: (d: T) => U): ApiResponse<U> {
  if (!res.success) return { ...res, data: undefined } as ApiResponse<U>;
  return { ...res, data: fn(res.data as T) };
}

export const attributedRevenueService = {
  /** The signed-in trainer's own attributed rows. Self only; no payer details. */
  async myEarnings(q: WindowQuery): Promise<ApiResponse<MyAttributedEarnings>> {
    const res = await apiClient.get<Record<string, unknown>>(`/transactions/me/attributed-earnings?${query(q)}`);
    return mapOk(res, (d) => parseMyEarnings(rec(d)));
  },

  /** The owner, or staff holding marketplace:manage_listing (Admin, Manager): anyone else gets 404. */
  async revenueByTrainer(orgId: string, q: WindowQuery): Promise<ApiResponse<RevenueByTrainer>> {
    const res = await apiClient.get<Record<string, unknown>>(
      `/transactions/organizations/${encodeURIComponent(orgId)}/revenue-by-trainer?${query(q)}`,
    );
    return mapOk(res, (d) => parseRevenueByTrainer(rec(d)));
  },
};
