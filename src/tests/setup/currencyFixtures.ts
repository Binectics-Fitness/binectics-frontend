import type { CurrencyUse, PlatformCurrency } from "@/lib/api/currencies";

/** One GET /currencies row; every use selectable unless overridden. */
export function currency(
  code: string,
  overrides: Partial<Omit<PlatformCurrency, "selectable">> & {
    selectable?: Partial<Record<CurrencyUse, boolean>>;
  } = {},
): PlatformCurrency {
  const { selectable, ...rest } = overrides;
  return {
    code,
    name: code,
    symbol: code,
    minor_unit: 2,
    suggested_for_countries: [],
    ...rest,
    selectable: { price: true, charge_card: true, charge_transfer: false, ...selectable },
  };
}

/**
 * The seeded state the design doc describes: NGN live on Paystack; ZAR, KES,
 * GHS and USD platform-enabled but not yet confirmed on our account, so not
 * selectable for anything.
 */
export const SEEDED_CURRENCIES: PlatformCurrency[] = [
  currency("NGN", { name: "Nigerian Naira", symbol: "₦", suggested_for_countries: ["NG"] }),
  currency("ZAR", {
    name: "South African Rand",
    symbol: "R",
    suggested_for_countries: ["ZA"],
    selectable: { price: false, charge_card: false },
  }),
  currency("KES", {
    name: "Kenyan Shilling",
    symbol: "KSh",
    suggested_for_countries: ["KE"],
    selectable: { price: false, charge_card: false },
  }),
  currency("GHS", {
    name: "Ghanaian Cedi",
    symbol: "GH₵",
    suggested_for_countries: ["GH"],
    selectable: { price: false, charge_card: false },
  }),
  currency("USD", {
    name: "US Dollar",
    symbol: "$",
    suggested_for_countries: ["US"],
    selectable: { price: false, charge_card: false },
  }),
];
