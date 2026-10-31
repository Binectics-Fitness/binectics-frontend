import type { Tone } from "@/lib/ui/tones";
import type {
  ContentAccess,
  ContentOffer,
  ContentPrice,
  ContentPurchase,
  Entitlement,
  PaidContentError,
  SetAccessInput,
} from "@/lib/api/paidContent";
import { formatMinor } from "@/lib/currencies/helpers";
import { formatMinorForInput } from "@/lib/money/moneyInput";

/**
 * Pure rules for paid programs and meal plans: what a price reads as, what a
 * refusal says, what a purchase is. Mirrors the mobile app's
 * utils/paidContent.ts so both read the same. No wording names a fee: a
 * refund is the provider's decision.
 */

export const PAID_CONTENT_FLAG = "paid_content";

/** Re-read a purchase every 3 s, up to 20 times, after the checkout closes (same as bookings). */
export const PURCHASE_POLL_MS = 3000;
export const PURCHASE_POLL_LIMIT = 20;

/**
 * THE flag rule for paid content, used by every surface (member nav, the
 * provider's sales section, the pricing controls): the workspace the user is
 * in decides - `isEnabled(paid_content, currentOrg._id)`, which honours that
 * workspace's own override - and with no current workspace (a member with
 * none) it falls back to the global value. It does not mean "any workspace
 * I belong to": a flag turned off for the gym they are looking at stays off.
 * The API still decides everything.
 */
export function paidContentOn(
  isEnabled: (key: string, organizationId?: string | null) => boolean,
  currentOrgId?: string | null,
): boolean {
  return isEnabled(PAID_CONTENT_FLAG, currentOrgId ?? null);
}

// ─── Prices ─────────────────────────────────────────────────────────────────

export const priceText = (p: ContentPrice): string => formatMinor(p.currency, p.amountMinor);

/** "₦15,000.00", or "₦15,000.00 · $10.00" when sold in several currencies. */
export const pricesText = (prices: ContentPrice[]): string => prices.map(priceText).join(" · ");

/** The one-line state of an item for a list row: "Free", "₦15,000.00", "In 2 plans". */
export function accessSummary(access: ContentAccess | null | undefined): string {
  if (!access || access.mode !== "paid") return "Free";
  const parts: string[] = [];
  if (access.prices.length > 0) parts.push(pricesText(access.prices));
  const n = access.includedPlanIds.length;
  if (n > 0) parts.push(n === 1 ? "In 1 plan" : `In ${n} plans`);
  return parts.length > 0 ? parts.join(" · ") : "Paid";
}

export const isPaid = (access: ContentAccess | null | undefined): boolean => access?.mode === "paid";

// ─── The pricing draft ──────────────────────────────────────────────────────

/** The most prices one item can have (the API's limit): one per currency. */
export const MAX_PRICES = 5;

export interface PriceRow {
  currency: string;
  /** What the money field shows ("₦15,000"). */
  display: string;
  /** Integer minor units, or null while the field holds no number. */
  minor: number | null;
}

export interface PricingDraft {
  mode: "free" | "paid";
  prices: PriceRow[];
  planIds: string[];
  showOnListing: boolean;
}

export function draftFromAccess(access: ContentAccess | null | undefined): PricingDraft {
  return {
    mode: access?.mode === "paid" ? "paid" : "free",
    prices: (access?.prices ?? []).map((p) => ({
      currency: p.currency,
      display: formatMinorForInput(p.amountMinor, { currency: p.currency }),
      minor: p.amountMinor,
    })),
    planIds: access?.includedPlanIds ?? [],
    showOnListing: access?.showOnListing ?? true,
  };
}

/** Stable text for "has the draft changed" (unsaved-changes guard). */
export function draftFingerprint(d: PricingDraft): string {
  return JSON.stringify({
    mode: d.mode,
    prices: [...d.prices].map((p) => [p.currency, p.minor]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    planIds: [...d.planIds].sort(),
    showOnListing: d.showOnListing,
  });
}

/**
 * The body to send, or the first thing wrong with the draft. A free item
 * sends no prices and no plans. An empty price row is dropped; a row with
 * text that is not an amount is an error, never a guess.
 */
export function buildAccessInput(d: PricingDraft): { input: SetAccessInput } | { error: string } {
  if (d.mode === "free") {
    return { input: { mode: "free", prices: [], includedPlanIds: [], showOnListing: true } };
  }
  const prices: ContentPrice[] = [];
  for (const row of d.prices) {
    if (row.display.trim() === "") continue;
    if (row.minor === null || !Number.isSafeInteger(row.minor) || row.minor <= 0) {
      return { error: `Enter a valid ${row.currency} price, like 15,000.` };
    }
    prices.push({ currency: row.currency, amountMinor: row.minor });
  }
  if (prices.length === 0 && d.planIds.length === 0) {
    return { error: "Add a price, or include it in a plan, so someone can get it." };
  }
  return { input: { mode: "paid", prices, includedPlanIds: d.planIds, showOnListing: d.showOnListing } };
}

// ─── Errors ─────────────────────────────────────────────────────────────────

/**
 * Plain copy for the paid-content refusals. The API's own sentence wins when
 * it sent one (it names the money, the provider and the minimum); these are
 * the fallback for a bare code.
 */
export function paidContentCopy(e: PaidContentError): string {
  if (e.message) return e.message;
  switch (e.code) {
    case "FEATURE_DISABLED":
      return "Selling programs and meal plans is not available yet.";
    case "CONTENT_ENTITLEMENT_REQUIRED":
      return "This client doesn't have this yet. Ask them to pay, or give it to them for free.";
    case "CONTENT_ACCESS_FROZEN":
    case "PROGRAM_FROZEN_LAPSED":
      return "This has paused because access ended. It resumes when the client renews, or when you give it to them for free.";
    case "PAID_MEAL_PLAN_IN_FREE_PROGRAM":
      return e.conflicts.length > 0
        ? `A free program can't include a paid meal plan: ${e.conflicts.join(", ")}.`
        : "A free program can't include a paid meal plan.";
    case "CONTENT_PRICE_BELOW_MINIMUM":
      return e.currency && e.minimumMinor
        ? `The lowest price Paystack can charge in ${e.currency} is ${formatMinor(e.currency, e.minimumMinor)}.`
        : "That price is below the lowest amount Paystack can charge. Try a higher price.";
    case "CONTENT_NO_SEAT":
      return "This provider isn't taking on new clients right now, so you haven't been charged. Try again later.";
    case "CONTENT_OWN_ITEM":
      return "This is your own, so there's nothing to buy.";
    case "CONTENT_ALREADY_OWNED":
      return "You already have this.";
    case "CONTENT_NOT_FOR_SALE":
      return "This isn't for sale on its own right now.";
    case "CONTENT_PURCHASE_NOT_REFUNDABLE":
      return "This sale can't be refunded.";
  }
}

// ─── Frozen content ─────────────────────────────────────────────────────────

export const FROZEN_TITLE = "Renew to keep your plan going";
export const FROZEN_BODY =
  "Everything you have done is still here to read. New tasks and edits are on hold until your access is back.";

/** What a frozen item offers: the plans that would bring it back, or just the words. */
export function renewHint(offer: ContentOffer | undefined | null): string | null {
  if (!offer) return null;
  if (offer.plans.length > 0) return `Included in ${offer.plans.map((p) => p.name).join(", ")}.`;
  if (offer.prices.length > 0) return `Or buy it again for ${pricesText(offer.prices)}.`;
  return null;
}

// ─── Purchases ──────────────────────────────────────────────────────────────

export type PurchaseView = "unlocked" | "settling" | "payable" | "refunded" | "unmatched";

/** What a purchase is to the member, from the API's status only. */
export function purchaseView(p: Pick<ContentPurchase, "status">): PurchaseView {
  switch (p.status) {
    case "paid":
      return "unlocked";
    case "refunded":
      return "refunded";
    case "mismatch":
      return "unmatched";
    case "pending":
      return "settling";
    default:
      // expired / failed / cancelled: nothing was taken or it was returned;
      // buying again starts a fresh one.
      return "payable";
  }
}

export function purchaseStatusLabel(p: Pick<ContentPurchase, "status">): string {
  switch (purchaseView(p)) {
    case "unlocked":
      return "Unlocked";
    case "refunded":
      return "Refunded";
    case "unmatched":
      return "Needs attention";
    case "settling":
      return "Waiting for payment";
    default:
      return "Not completed";
  }
}

export const PURCHASE_TONE: Record<PurchaseView, Tone> = {
  unlocked: "success",
  settling: "warn",
  payable: "neutral",
  refunded: "neutral",
  unmatched: "danger",
};

/**
 * What to tell the buyer when the API has checked the charge and the
 * purchase is still not paid. Anything not listed is "still settling".
 */
export function gatewayFailureCopy(status: string | null | undefined): string | null {
  switch (status) {
    case "failed":
      return "The payment did not go through. You have not been charged; you can try again.";
    case "abandoned":
      return "The checkout closed before the payment completed. You have not been charged; you can try again.";
    case "mismatch":
      return "The amount paid does not match this purchase. Contact support and we will sort it out.";
    case "reversed":
      return "This payment was reversed, so the purchase did not complete. If money left your account, your bank returns it; you can try again.";
    case "error":
      return "The payment service reported a problem with this payment. If you were charged, contact support and we will sort it out; otherwise you can try again.";
    case "not_payable":
      return "This purchase can no longer be paid. Start again from the item.";
    default:
      return null;
  }
}

/** Whether a purchase can no longer become paid, so a new checkout is needed. */
export function purchaseIsDead(p: Pick<ContentPurchase, "status">): boolean {
  return p.status === "expired" || p.status === "failed" || p.status === "cancelled";
}

export const kindLabel = (kind: "program" | "meal_plan"): string =>
  kind === "program" ? "Program" : "Meal plan";

/** "3 Nov 2026", or "" when the API sent no (or a bad) date. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The refund confirmation: the provider's decision, never automatic, no fee talk. */
export function refundConfirmCopy(buyer: string, amount: string, rail: string): string {
  const who = buyer || "the buyer";
  const how =
    rail === "platform"
      ? "This money was collected by Binectics, so the refund is sent to us to process."
      : "It goes back to their original payment method.";
  return `Refund ${amount} to ${who}? ${how} Their copy stays readable but is paused.`;
}

// ─── Everything the member has (entitlements) ───────────────────────────────

/** Where an item came from: Bought / Given to you / Included in <plan> / Kept until your plan ends. */
export function entitlementSourceLabel(e: Pick<Entitlement, "source" | "planName">): string {
  switch (e.source) {
    case "purchase":
      return "Bought";
    case "plan":
      return e.planName ? `Included in ${e.planName}` : "Included in your plan";
    case "carry_over":
      return "Kept until your plan ends";
    default:
      return "Given to you";
  }
}

export function entitlementStateLabel(state: Entitlement["state"]): string {
  return state === "open" ? "Open" : state === "frozen" ? "Renew to keep it" : "Ended";
}

export const ENTITLEMENT_TONE: Record<Entitlement["state"], Tone> = {
  open: "success",
  frozen: "warn",
  expired: "neutral",
};

/** The in-app path of an item's offer page. */
export function offerPath(kind: "program" | "meal_plan", id: string): string {
  return `/dashboard/member/content/${kind === "program" ? "programs" : "meal-plans"}/${encodeURIComponent(id)}`;
}
