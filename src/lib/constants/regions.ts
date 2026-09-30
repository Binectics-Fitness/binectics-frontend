/**
 * Visitor region cookies and marketing price copy.
 *
 * Which currencies exist and what they can be used for is the API's
 * (GET /currencies, see lib/queries/currencies). Nothing here decides a
 * currency for a price, a payment or an organization, and there is no
 * gateway per currency: the API picks the gateway.
 */

/** The visitor's detected country (ISO 3166 alpha-2), for display only. */
export const REGION_COOKIE = "binectics-region";
/** A country the visitor chose in the region selector. */
export const REGION_OVERRIDE_COOKIE = "binectics-region-override";
/** A display currency the visitor chose; honoured only while it is listed. */
export const CURRENCY_OVERRIDE_COOKIE = "binectics-currency-override";

export type BillingPeriod = "monthly" | "annual";

/**
 * MARKETING COPY, not a price list. The landing and /pricing pages show
 * these tiers (Studio for providers, Premium and Family for members) in a
 * few round local amounts. They are not charged anywhere: the API's
 * provider plan catalogue (GET /provider-billing/plans) prices different
 * tiers (free, pro, enterprise) per market, and Premium and Family do not
 * exist as products yet. Keep them as copy until the pricing page reads the
 * catalogue.
 */
export const MARKET_PRICES = {
  studio: { USD: 48, GBP: 39, EUR: 45, NGN: 45_000, KES: 5_500, ZAR: 749, AED: 179, INR: 3_499 },
  premium: { USD: 9, GBP: 7, EUR: 8, NGN: 5_500, KES: 900, ZAR: 129, AED: 29, INR: 499 },
  family: { USD: 19, GBP: 15, EUR: 17, NGN: 12_000, KES: 1_900, ZAR: 279, AED: 59, INR: 999 },
} as const satisfies Record<string, Record<string, number>>;

export type PlanTier = keyof typeof MARKET_PRICES;

/**
 * The currency the marketing copy is shown in for a visitor: theirs when the
 * copy has an amount in it, else USD. Display only; it never prices
 * anything a person can buy.
 */
export function marketingCurrency(visitorCurrency: string | null | undefined): string {
  const code = (visitorCurrency ?? "").toUpperCase();
  return code in MARKET_PRICES.studio ? code : "USD";
}

/**
 * A tier's monthly-equivalent amount (major units) for the period, and the
 * currency it is in. Annual is ten months, shown per month.
 */
export function marketingMonthlyPrice(
  tier: PlanTier,
  visitorCurrency: string | null | undefined,
  period: BillingPeriod,
): { amount: number; currency: string } {
  const currency = marketingCurrency(visitorCurrency);
  const monthly = (MARKET_PRICES[tier] as Record<string, number>)[currency];
  return {
    amount: period === "annual" ? Math.round((monthly * 10) / 12) : monthly,
    currency,
  };
}
