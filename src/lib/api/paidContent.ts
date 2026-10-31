import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Paid programs and meal plans (binectics-api src/content-access; spec
 * binectics-plans/paid-content-spec-2026-10-28.md).
 *
 * Money is integer minor units end to end. An item's price is its own: a
 * buyer never sends an amount, only (at most) which of the item's currencies
 * to pay in. `kind` is `programs` or `meal-plans` in URLs and `program` or
 * `meal_plan` inside bodies.
 *
 * Everything here sits behind the runtime flag `paid_content`. The API
 * answers 400 FEATURE_DISABLED when it is off for the seller; screens treat
 * that as "not available" (see paidContentErrorOf).
 */

export type ContentPathKind = "programs" | "meal-plans";
export type ContentItemKind = "program" | "meal_plan";

export const kindToPath = (kind: ContentItemKind): ContentPathKind =>
  kind === "program" ? "programs" : "meal-plans";

/** The item kind for a URL segment, or null for anything else. */
export const pathToKind = (segment: string): ContentItemKind | null =>
  segment === "programs" ? "program" : segment === "meal-plans" ? "meal_plan" : null;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContentPrice {
  currency: string;
  amountMinor: number;
}

/** An item's access block. Absent on the API means free. */
export interface ContentAccess {
  mode: "free" | "paid";
  prices: ContentPrice[];
  includedPlanIds: string[];
  showOnListing: boolean;
  sellerOrganizationId: string | null;
}

export interface OfferPlan {
  id: string;
  name: string;
  priceMinor: number;
  currency: string;
  durationDays: number;
  planType: string;
  listingId: string | null;
}

/** What a lock card shows: buy it once, and/or join a plan that has it. */
export interface ContentOffer {
  itemKind: ContentItemKind;
  itemId: string;
  title: string;
  prices: ContentPrice[];
  plans: OfferPlan[];
}

export type PurchaseStatus = "pending" | "paid" | "expired" | "failed" | "refunded" | "mismatch" | string;

export interface ContentPurchase {
  id: string;
  itemKind: ContentItemKind;
  itemId: string;
  itemName: string;
  amountMinor: number;
  currency: string;
  status: PurchaseStatus;
  reference: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  refundedAt: string | null;
}

export type OfferAccessState = "open" | "frozen" | "needs_payment";
export type OfferAccessVia = "purchase" | "grant" | "plan" | "carryover";

/** GET /content/:kind/:id/offer: the item's offer plus the caller's own access to it. */
export interface ContentOfferRead extends ContentOffer {
  isPaid: boolean;
  /** False when the seller cannot sell it right now (no prices, no plans offered). */
  forSale: boolean;
  access: { state: OfferAccessState; via: OfferAccessVia | null };
}

export type EntitlementSource = "purchase" | "grant" | "plan" | "carry_over";
export type EntitlementState = "open" | "frozen" | "expired";

/** One program or meal plan the member has, however they came to have it. */
export interface Entitlement {
  id: string;
  itemKind: ContentItemKind;
  itemId: string;
  title: string;
  source: EntitlementSource;
  planName: string | null;
  state: EntitlementState;
  since: string | null;
  until: string | null;
}

export interface EntitlementPage {
  items: Entitlement[];
  nextCursor: string | null;
}

/** The charge the API opened: the browser only resumes it with the access code. */
export interface ContentCheckout {
  reference: string;
  accessCode: string;
  authorizationUrl: string | null;
  amountMinor: number;
  currency: string;
  expiresAt: string | null;
}

export interface ContentSale extends ContentPurchase {
  buyerName: string;
  paymentRail: string;
}

export interface ContentGrant {
  id: string;
  clientId: string;
  createdAt: string | null;
}

export interface SetAccessInput {
  mode: "free" | "paid";
  prices: ContentPrice[];
  includedPlanIds: string[];
  showOnListing: boolean;
}

// ─── Normalisers ────────────────────────────────────────────────────────────

const idOf = (v: unknown): string => (v == null ? "" : String(v));
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

export function normalizePrices(raw: unknown): ContentPrice[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { currency?: unknown; amount_minor?: unknown }[])
    .filter(
      (p) =>
        p &&
        typeof p.currency === "string" &&
        typeof p.amount_minor === "number" &&
        p.amount_minor > 0,
    )
    .map((p) => ({ currency: String(p.currency).toUpperCase(), amountMinor: p.amount_minor as number }));
}

/** The item's `access` block, or null for an item that has none (free). */
export function normalizeAccess(raw: unknown): ContentAccess | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    mode: r.mode === "paid" ? "paid" : "free",
    prices: normalizePrices(r.prices),
    includedPlanIds: Array.isArray(r.included_in_plan_ids) ? r.included_in_plan_ids.map(idOf) : [],
    showOnListing: r.show_on_listing !== false,
    sellerOrganizationId: strOrNull(r.seller_organization_id),
  };
}

export function normalizeOffer(raw: unknown): ContentOffer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const plans = Array.isArray(r.plans) ? (r.plans as Record<string, unknown>[]) : [];
  return {
    itemKind: r.item_kind === "meal_plan" ? "meal_plan" : "program",
    itemId: idOf(r.item_id),
    title: typeof r.title === "string" ? r.title : "",
    prices: normalizePrices(r.prices),
    plans: plans.map((p) => ({
      id: idOf(p.id),
      name: typeof p.name === "string" ? p.name : "Plan",
      priceMinor: num(p.price_minor),
      currency: typeof p.currency === "string" ? p.currency.toUpperCase() : "",
      durationDays: num(p.duration_days),
      planType: typeof p.plan_type === "string" ? p.plan_type : "",
      listingId: strOrNull(p.listing_id),
    })),
  };
}

export function normalizePurchase(raw: Record<string, unknown>): ContentPurchase {
  return {
    id: idOf(raw.id ?? raw._id),
    itemKind: raw.item_kind === "meal_plan" ? "meal_plan" : "program",
    itemId: idOf(raw.item_id),
    itemName: typeof raw.item_name === "string" ? raw.item_name : "",
    amountMinor: num(raw.amount_minor),
    currency: typeof raw.currency === "string" ? raw.currency.toUpperCase() : "",
    status: typeof raw.status === "string" ? raw.status : "pending",
    reference: strOrNull(raw.reference),
    expiresAt: strOrNull(raw.expires_at),
    paidAt: strOrNull(raw.paid_at),
    refundedAt: strOrNull(raw.refunded_at),
  };
}

const OFFER_STATES: OfferAccessState[] = ["open", "frozen", "needs_payment"];
const OFFER_VIAS: OfferAccessVia[] = ["purchase", "grant", "plan", "carryover"];

/** The offer read. An unknown access state is needs_payment: never open by guess. */
export function normalizeOfferRead(raw: unknown): ContentOfferRead | null {
  const offer = normalizeOffer(raw);
  if (!offer) return null;
  const r = raw as Record<string, unknown>;
  const a = asRecord(r.access);
  const state = OFFER_STATES.includes(a.state as OfferAccessState)
    ? (a.state as OfferAccessState)
    : "needs_payment";
  const via = OFFER_VIAS.includes(a.via as OfferAccessVia) ? (a.via as OfferAccessVia) : null;
  return { ...offer, isPaid: r.is_paid === true, forSale: r.for_sale === true, access: { state, via } };
}

const SOURCES: EntitlementSource[] = ["purchase", "grant", "plan", "carry_over"];
const ENT_STATES: EntitlementState[] = ["open", "frozen", "expired"];

export function normalizeEntitlement(raw: Record<string, unknown>): Entitlement | null {
  const item = asRecord(raw.item);
  const itemId = idOf(item.id);
  if (!itemId) return null;
  return {
    id: idOf(raw.id),
    itemKind: item.kind === "meal_plan" ? "meal_plan" : "program",
    itemId,
    title: typeof item.title === "string" ? item.title : "",
    source: SOURCES.includes(raw.source as EntitlementSource) ? (raw.source as EntitlementSource) : "grant",
    planName: strOrNull(raw.plan_name),
    // An unknown state reads as ended: never offer to open on a guess.
    state: ENT_STATES.includes(raw.state as EntitlementState) ? (raw.state as EntitlementState) : "expired",
    since: strOrNull(raw.since),
    until: strOrNull(raw.until),
  };
}

export function normalizeSale(raw: Record<string, unknown>): ContentSale {
  const buyer = asRecord(raw.buyer);
  return {
    ...normalizePurchase(raw),
    buyerName: typeof buyer.name === "string" ? buyer.name : "",
    paymentRail: typeof raw.payment_rail === "string" ? raw.payment_rail : "platform",
  };
}

export function normalizeCheckout(raw: unknown): ContentCheckout | null {
  const p = asRecord(raw);
  if (typeof p.reference !== "string" || typeof p.access_code !== "string") return null;
  return {
    reference: p.reference,
    accessCode: p.access_code,
    authorizationUrl: strOrNull(p.authorization_url),
    amountMinor: num(p.amount_minor),
    currency: typeof p.currency === "string" ? p.currency.toUpperCase() : "",
    expiresAt: strOrNull(p.expires_at),
  };
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export type PaidContentErrorCode =
  | "FEATURE_DISABLED"
  | "CONTENT_ENTITLEMENT_REQUIRED"
  | "CONTENT_ACCESS_FROZEN"
  | "PROGRAM_FROZEN_LAPSED"
  | "PAID_MEAL_PLAN_IN_FREE_PROGRAM"
  | "CONTENT_PRICE_BELOW_MINIMUM"
  | "CONTENT_NO_SEAT"
  | "CONTENT_OWN_ITEM"
  | "CONTENT_ALREADY_OWNED"
  | "CONTENT_NOT_FOR_SALE"
  | "CONTENT_PURCHASE_NOT_REFUNDABLE";

export const PAID_CONTENT_CODES: PaidContentErrorCode[] = [
  "FEATURE_DISABLED",
  "CONTENT_ENTITLEMENT_REQUIRED",
  "CONTENT_ACCESS_FROZEN",
  "PROGRAM_FROZEN_LAPSED",
  "PAID_MEAL_PLAN_IN_FREE_PROGRAM",
  "CONTENT_PRICE_BELOW_MINIMUM",
  "CONTENT_NO_SEAT",
  "CONTENT_OWN_ITEM",
  "CONTENT_ALREADY_OWNED",
  "CONTENT_NOT_FOR_SALE",
  "CONTENT_PURCHASE_NOT_REFUNDABLE",
];

export interface PaidContentError {
  code: PaidContentErrorCode;
  /** The API's sentence, when it sent one. */
  message: string;
  /** CONTENT_ENTITLEMENT_REQUIRED carries what would unlock the item. */
  offer: ContentOffer | null;
  /** PAID_MEAL_PLAN_IN_FREE_PROGRAM: the meal plans in the way. */
  conflicts: string[];
  /** CONTENT_PRICE_BELOW_MINIMUM */
  currency?: string;
  minimumMinor?: number;
}

/** The API's paid-content refusal on a failed response, or null for any other error. */
export function paidContentErrorOf(
  res: Pick<ApiResponse<unknown>, "code" | "message" | "details"> | null | undefined,
): PaidContentError | null {
  const code = res?.code;
  if (!code || !PAID_CONTENT_CODES.includes(code as PaidContentErrorCode)) return null;
  const d = res?.details ?? {};
  const rawConflicts = d.conflicts;
  const conflicts = Array.isArray(rawConflicts)
    ? rawConflicts
        .map((c) =>
          typeof c === "string" ? c : ((c as { title?: string })?.title ?? (c as { name?: string })?.name),
        )
        .filter((c): c is string => typeof c === "string" && c.length > 0)
    : [];
  return {
    code: code as PaidContentErrorCode,
    message: res?.message ?? "",
    offer: normalizeOffer(d.offer),
    conflicts,
    ...(typeof d.currency === "string" ? { currency: d.currency } : {}),
    ...(typeof d.minimum_minor === "number" ? { minimumMinor: d.minimum_minor } : {}),
  };
}

// ─── Calls ──────────────────────────────────────────────────────────────────

const enc = encodeURIComponent;
const base = (kind: ContentItemKind, id: string) => `/content/${kindToPath(kind)}/${enc(id)}`;

/** Maps a successful response's data, leaving a failed response as it came. */
function mapOk<T, U>(res: ApiResponse<T>, fn: (data: T) => U): ApiResponse<U> {
  if (!res.success) return { ...res, data: undefined } as ApiResponse<U>;
  return { ...res, data: fn(res.data as T) };
}

const asList = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

export const paidContentService = {
  // ── The buyer ────────────────────────────────────────────────────────────

  /**
   * Opens the checkout for a paid item at its own price. Only the currency
   * (one of the item's own) is chosen. Idempotent while a purchase is still
   * pending: a second call returns the open one, so a retry keeps the same
   * reference.
   */
  async checkout(
    kind: ContentItemKind,
    id: string,
    currency?: string,
  ): Promise<ApiResponse<{ purchase: ContentPurchase; payment: ContentCheckout | null }>> {
    const res = await apiClient.post<{ purchase?: unknown; payment?: unknown }>(
      `${base(kind, id)}/checkout`,
      currency ? { currency } : {},
    );
    return mapOk(res, (d) => ({
      purchase: normalizePurchase(asRecord(d?.purchase)),
      payment: normalizeCheckout(d?.payment),
    }));
  },

  /** Asks the API to check the purchase with Paystack. The popup's word is never used. */
  async verify(
    purchaseId: string,
  ): Promise<ApiResponse<{ purchase: ContentPurchase; gatewayStatus: string | null }>> {
    const res = await apiClient.post<{ purchase?: unknown; verification?: { gatewayStatus?: unknown } }>(
      `/content/purchases/${enc(purchaseId)}/verify-payment`,
      {},
    );
    return mapOk(res, (d) => ({
      purchase: normalizePurchase(asRecord(d?.purchase)),
      gatewayStatus: strOrNull(d?.verification?.gatewayStatus),
    }));
  },

  /** The purchase as the API has it now. */
  async getPurchase(purchaseId: string): Promise<ApiResponse<ContentPurchase>> {
    const res = await apiClient.get<Record<string, unknown>>(`/content/purchases/${enc(purchaseId)}`);
    return mapOk(res, (d) => normalizePurchase(asRecord(d)));
  },

  async myPurchases(): Promise<ApiResponse<ContentPurchase[]>> {
    const res = await apiClient.get<unknown>("/content/purchases/mine");
    return mapOk(res, (d) => asList(d).map(normalizePurchase));
  },

  /** Everything the member has: bought, given, in a plan, kept. Newest first, paged. */
  async myEntitlements(limit = 20, cursor?: string | null): Promise<ApiResponse<EntitlementPage>> {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    const res = await apiClient.get<{ items?: unknown; next_cursor?: unknown }>(
      `/content/entitlements/mine?${qs.toString()}`,
    );
    return mapOk(res, (d) => ({
      items: asList(d?.items)
        .map(normalizeEntitlement)
        .filter((e): e is Entitlement => e !== null),
      nextCursor: strOrNull(d?.next_cursor),
    }));
  },

  /** An item's offer and the caller's access to it. A 404 means free, unlisted or unknown. */
  async getOffer(kind: ContentItemKind, id: string): Promise<ApiResponse<ContentOfferRead | null>> {
    const res = await apiClient.get<unknown>(`${base(kind, id)}/offer`);
    return mapOk(res, normalizeOfferRead);
  },

  /** Starts a program the member has access to, themselves (D9). */
  async startProgram(
    programId: string,
    body: { startDate?: string; timezone?: string },
  ): Promise<ApiResponse<unknown>> {
    return apiClient.post(`/content/programs/${enc(programId)}/start`, {
      ...(body.startDate ? { start_date: body.startDate } : {}),
      ...(body.timezone ? { timezone: body.timezone } : {}),
    });
  },

  // ── The seller ───────────────────────────────────────────────────────────

  /** Sets an item free or paid. Returns the saved block and the API's warnings. */
  async setAccess(
    kind: ContentItemKind,
    id: string,
    input: SetAccessInput,
  ): Promise<ApiResponse<{ access: ContentAccess | null; warnings: string[] }>> {
    const res = await apiClient.put<{ access?: unknown; warnings?: unknown }>(`${base(kind, id)}/access`, {
      mode: input.mode,
      prices: input.prices.map((p) => ({ currency: p.currency, amount_minor: p.amountMinor })),
      included_in_plan_ids: input.includedPlanIds,
      show_on_listing: input.showOnListing,
    });
    return mapOk(res, (d) => ({
      access: normalizeAccess(d?.access),
      warnings: Array.isArray(d?.warnings)
        ? (d.warnings as unknown[]).filter((w): w is string => typeof w === "string")
        : [],
    }));
  },

  async listGrants(kind: ContentItemKind, id: string): Promise<ApiResponse<ContentGrant[]>> {
    const res = await apiClient.get<unknown>(`${base(kind, id)}/grants`);
    return mapOk(res, (d) =>
      asList(d).map((g) => ({
        id: idOf(g._id ?? g.id),
        clientId: idOf(g.client_id),
        createdAt: strOrNull(g.created_at),
      })),
    );
  },

  async grant(kind: ContentItemKind, id: string, clientProfileId: string): Promise<ApiResponse<unknown>> {
    return apiClient.post(`${base(kind, id)}/grants`, { client_profile_id: clientProfileId });
  },

  async revokeGrant(grantId: string): Promise<ApiResponse<unknown>> {
    return apiClient.delete(`/content/grants/${enc(grantId)}`);
  },

  async sales(limit = 50, skip = 0): Promise<ApiResponse<ContentSale[]>> {
    const res = await apiClient.get<unknown>(`/content/sales?limit=${limit}&skip=${skip}`);
    return mapOk(res, (d) => asList(d).map(normalizeSale));
  },

  /**
   * Refunds a sale in full. `refunded` when it was sent at once (the
   * provider's own Paystack account); `requested` when Binectics has to
   * process it (money collected on the platform account).
   */
  async refund(saleId: string, reason?: string): Promise<ApiResponse<"refunded" | "requested">> {
    const res = await apiClient.post<{ mode?: string }>(
      `/content/sales/${enc(saleId)}/refund`,
      reason ? { reason } : {},
    );
    return mapOk(res, (d) => (d?.mode === "requested" ? "requested" : "refunded"));
  },
};
