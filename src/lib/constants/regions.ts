import { PaymentGateway } from "@/lib/types";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "NGN" | "KES" | "ZAR" | "AED" | "INR";

export interface RegionConfig {
  currencyCode: CurrencyCode;
  locale: string;
  gateway: PaymentGateway;
  symbol: string;
  regionName: string;
}

export const REGION_COOKIE = "binectics-region";
export const REGION_OVERRIDE_COOKIE = "binectics-region-override";

export const DEFAULT_REGION: RegionConfig = {
  currencyCode: "USD",
  locale: "en-US",
  gateway: PaymentGateway.STRIPE,
  symbol: "$",
  regionName: "United States",
};

const USD: RegionConfig = DEFAULT_REGION;
const GBP: RegionConfig = { currencyCode: "GBP", locale: "en-GB", gateway: PaymentGateway.STRIPE, symbol: "£", regionName: "United Kingdom" };
const EUR: RegionConfig = { currencyCode: "EUR", locale: "de-DE", gateway: PaymentGateway.STRIPE, symbol: "€", regionName: "Europe" };
const NGN: RegionConfig = { currencyCode: "NGN", locale: "en-NG", gateway: PaymentGateway.PAYSTACK, symbol: "₦", regionName: "Nigeria" };
const KES: RegionConfig = { currencyCode: "KES", locale: "en-KE", gateway: PaymentGateway.FLUTTERWAVE, symbol: "KSh", regionName: "Kenya" };
const ZAR: RegionConfig = { currencyCode: "ZAR", locale: "en-ZA", gateway: PaymentGateway.PAYSTACK, symbol: "R", regionName: "South Africa" };
const AED: RegionConfig = { currencyCode: "AED", locale: "en-AE", gateway: PaymentGateway.STRIPE, symbol: "د.إ", regionName: "UAE" };
const INR: RegionConfig = { currencyCode: "INR", locale: "en-IN", gateway: PaymentGateway.STRIPE, symbol: "₹", regionName: "India" };

export const COUNTRY_TO_REGION: Record<string, RegionConfig> = {
  // USD
  US: USD, PR: USD, VI: USD, GU: USD, AS: USD, MP: USD,
  // GBP
  GB: GBP, GG: GBP, JE: GBP, IM: GBP,
  // EUR
  DE: EUR, FR: EUR, IT: EUR, ES: EUR, NL: EUR, BE: EUR, AT: EUR, FI: EUR,
  PT: EUR, IE: EUR, GR: EUR, SK: EUR, SI: EUR, LT: EUR, LV: EUR, EE: EUR,
  CY: EUR, MT: EUR, LU: EUR, HR: EUR,
  // NGN
  NG: NGN,
  // KES
  KE: KES,
  // ZAR
  ZA: ZAR,
  // AED (only UAE uses AED; other Gulf states fall to USD since we don't support SAR/OMR/QAR/KWD/BHD yet)
  AE: AED,
  // INR
  IN: INR,
};

export const MARKET_PRICES = {
  studio: { USD: 48, GBP: 39, EUR: 45, NGN: 45_000, KES: 5_500, ZAR: 749, AED: 179, INR: 3_499 },
  premium: { USD: 9, GBP: 7, EUR: 8, NGN: 5_500, KES: 900, ZAR: 129, AED: 29, INR: 499 },
  family: { USD: 19, GBP: 15, EUR: 17, NGN: 12_000, KES: 1_900, ZAR: 279, AED: 59, INR: 999 },
} as const;

export type PlanTier = keyof typeof MARKET_PRICES;
export type BillingPeriod = "monthly" | "annual";

export function getMarketPriceForPeriod(tier: PlanTier, currency: CurrencyCode, period: BillingPeriod): number {
  const monthly = MARKET_PRICES[tier][currency];
  if (period === "annual") return monthly * 10;
  return monthly;
}

export function getMonthlyEquivalent(tier: PlanTier, currency: CurrencyCode, period: BillingPeriod): number {
  const monthly = MARKET_PRICES[tier][currency];
  if (period === "annual") return Math.round((monthly * 10) / 12);
  return monthly;
}

export const SUPPORTED_REGIONS: { code: string; config: RegionConfig }[] = [
  { code: "US", config: USD },
  { code: "GB", config: GBP },
  { code: "DE", config: EUR },
  { code: "NG", config: NGN },
  { code: "ZA", config: ZAR },
  { code: "KE", config: KES },
  { code: "IN", config: INR },
  { code: "AE", config: AED },
];

export function getRegionForCountry(countryCode: string): RegionConfig {
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] ?? DEFAULT_REGION;
}

export function getMarketPrice(tier: PlanTier, currency: CurrencyCode): number {
  return MARKET_PRICES[tier][currency];
}

/**
 * Currencies we display without minor units. Decimal places are decided per
 * currency rather than per amount, so a single fee table is internally
 * consistent (e.g. ₦25,000 and ₦475 both render without decimals instead of
 * ₦25,000 next to ₦475.00).
 */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "NGN",
  "KES",
  "INR",
  "JPY",
  "KRW",
  "VND",
]);

/** The maximum decimal places a currency ever displays (2, or 0 for whole-unit currencies). */
export function currencyFractionDigits(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Decimals to actually render for a specific amount: whole amounts show none
 * (so round prices stay clean — "$1,200", "₦45,000"), fractional amounts show
 * the currency's full precision ("$12.50"). Decided per currency, never by
 * magnitude, so a single table is internally consistent.
 */
export function displayFractionDigits(amount: number, currency: string): number {
  return Number.isInteger(amount) ? 0 : currencyFractionDigits(currency);
}

export function formatRegionPrice(amount: number, currency: CurrencyCode, locale: string): string {
  const digits = displayFractionDigits(amount, currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  }
}
