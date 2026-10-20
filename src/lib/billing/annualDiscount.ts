/**
 * The annual discount on Binectics plans (owner ruling, Oct 20 2026).
 *
 * A Binectics admin sets it on each yearly price in /admin/plans, and the API
 * returns it as `prices.year.discount_percent`. "Save N%" is shown from that
 * number only: never a hardcoded figure, and never a saving worked out from
 * the monthly and yearly amounts. Checkout still charges the server's amount.
 */

/** Ceiling the API enforces on the annual discount. */
export const MAX_ANNUAL_DISCOUNT_PERCENT = 90;

/** A discount as it may be shown or sent: a whole number in 0–90. */
export function clampAnnualDiscount(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(MAX_ANNUAL_DISCOUNT_PERCENT, Math.max(0, Math.round(n)));
}

/** The admin's discount on a yearly price, or null when none was set. */
export function annualDiscountOf(
  year: { discount_percent?: number | null } | null | undefined,
): number | null {
  const pct = clampAnnualDiscount(year?.discount_percent);
  return pct > 0 ? pct : null;
}

/**
 * The yearly amount a discount implies: twelve monthly payments, less the
 * discount, in minor units. Integer maths with one rounding at the end, so
 * there is no float drift between what the editor shows and what it saves.
 */
export function annualFromMonthlyMinor(monthlyMinor: number, discountPercent: number): number {
  const pct = clampAnnualDiscount(discountPercent);
  return Math.round((monthlyMinor * 12 * (100 - pct)) / 100);
}

/**
 * Label for a Monthly/Annual toggle. The set is every self-serve plan with
 * a paid yearly price (a plan with no discount counts as 0; "Contact us"
 * tiers such as Enterprise are left out):
 * - "Annual (save 20%)" when every plan in the set saves the same 20%;
 * - "Annual (save up to 25%)" when they differ and the best is above 0;
 * - plain "Annual" otherwise.
 * The mobile app's annualChipLabel uses the same rule and words.
 */
export function annualToggleLabel(
  plans: readonly {
    is_self_serve?: boolean;
    prices: { year: { amount_minor?: number; discount_percent?: number | null } | null };
  }[],
): string {
  const set = plans
    // A ₦0 yearly price (a free tier) is nothing to save on, so it is not a
    // paid yearly price and stays out of the set.
    .filter((p) => p.is_self_serve !== false && !!p.prices.year && (p.prices.year.amount_minor ?? 1) > 0)
    .map((p) => annualDiscountOf(p.prices.year) ?? 0);
  if (set.length === 0) return "Annual";
  const max = Math.max(...set);
  if (max <= 0) return "Annual";
  return set.every((x) => x === max) ? `Annual (save ${max}%)` : `Annual (save up to ${max}%)`;
}
