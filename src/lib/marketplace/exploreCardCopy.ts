/**
 * The web Explore card's price line and flags (board:
 * binectics-plans/design/web-explore-card, frames D1-D5, M1-M4; copy `C` in
 * its build.py). Worded exactly as mobile words them (binectics-mobile
 * src/utils/plans.ts listingFromPrice, src/utils/exploreCopy.ts).
 */
import type { ListingPriceCadence } from "@/lib/types";
import { formatCurrency } from "@/utils/format";
import { minorToMajor } from "@/lib/money/minorMoney";

export const EXPLORE_CARD_COPY = {
  from: "From",
  notTakingClients: "Not taking new clients",
  freeFirstSession: "Free first session",
} as const;

/**
 * A one-off price's period in words (owner, 19 Nov 2026): 7 days is "1 week",
 * 30 or 31 "1 month", 90 "3 months", 365 "1 year", anything else "N days".
 */
export function cadencePeriodLabel(days: number): string {
  if (days === 7) return "1 week";
  if (days === 30 || days === 31) return "1 month";
  if (days === 90) return "3 months";
  if (days === 365) return "1 year";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** After a recurring price: "/week", "/month", "/3 months", "/year", "/N days". */
export function cadencePerLabel(days: number): string {
  if (days === 7) return "/week";
  if (days === 30 || days === 31) return "/month";
  if (days === 365) return "/year";
  return `/${cadencePeriodLabel(days)}`;
}

export interface CardPriceInput {
  price_from_minor?: number | null;
  currency?: string | null;
  price_cadence?: ListingPriceCadence | null;
  price_period_days?: number | null;
}

/**
 * The card price in its two drawn parts: the amount ("₦25,000", in ink) and
 * what follows it ("/month", "/session", " · One-off · 1 month", or nothing
 * when the cadence is unknown, rather than guessing one). Null without a
 * price or a currency.
 */
export function listingPriceParts(l: CardPriceInput): { amount: string; rest: string } | null {
  const minor = l.price_from_minor;
  if (minor == null || !Number.isFinite(minor) || !l.currency) return null;
  const amount = formatCurrency(minorToMajor(minor, l.currency), l.currency);
  const days = l.price_period_days ?? 0;
  switch (l.price_cadence) {
    case "session":
      return { amount, rest: "/session" };
    case "recurring":
      return { amount, rest: days ? cadencePerLabel(days) : "" };
    case "one_off":
      return { amount, rest: days ? ` · One-off · ${cadencePeriodLabel(days)}` : " · One-off" };
    default:
      return { amount, rest: "" };
  }
}

/** "From ₦25,000/month": the whole line as one string, as mobile shows it. */
export function listingFromPrice(l: CardPriceInput): string | null {
  const parts = listingPriceParts(l);
  return parts ? `${EXPLORE_CARD_COPY.from} ${parts.amount}${parts.rest}` : null;
}
