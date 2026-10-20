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
 * Label for a Monthly/Annual toggle: "Annual (save 20%)" when every
 * discounted plan shares one figure, "Annual (save up to 25%)" when they
 * differ, plain "Annual" when no admin set one.
 */
export function annualToggleLabel(
  plans: readonly { prices: { year: { discount_percent?: number | null } | null } }[],
): string {
  const all = plans
    .map((p) => annualDiscountOf(p.prices.year))
    .filter((x): x is number => x !== null);
  if (all.length === 0) return "Annual";
  const max = Math.max(...all);
  return all.every((x) => x === max) ? `Annual (save ${max}%)` : `Annual (save up to ${max}%)`;
}
