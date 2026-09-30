"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
  CURRENCY_OVERRIDE_COOKIE,
  REGION_COOKIE,
  REGION_OVERRIDE_COOKIE,
} from "@/lib/constants/regions";
import { utilityService } from "@/lib/api/utility";
import { useCurrencyList } from "@/lib/queries/currencies";
import type { PlatformCurrency } from "@/lib/api/currencies";
import { selectableFor, suggestCurrency } from "@/lib/currencies/helpers";
import { formatCurrency } from "@/utils/format";

/**
 * The visitor's region, for DISPLAY: which country they seem to be in and
 * which currency marketing amounts are shown in. It never decides the
 * currency of a price or a payment; org and listing money always renders
 * in its own currency.
 *
 * The display currency is the first of these that the platform lists
 * (GET /currencies): the visitor's own pick, the currency /geo/resolve
 * reports, the country's suggested currency, then the first currency prices
 * can be set in. A currency the API doesn't list is never shown.
 */
interface RegionContextValue {
  /** ISO 3166 alpha-2. */
  country: string;
  /** ISO 4217, or "" until the currency list has loaded. */
  currency: string;
  locale: string;
  regionName: string;
  isDetected: boolean;
  /** Platform-enabled currencies, for the region selector. */
  currencies: PlatformCurrency[];
  /** A MAJOR-unit amount in the display currency. */
  formatAmount: (amount: number) => string;
  setRegion: (countryCode: string) => void;
  setCurrency: (code: string) => void;
}

const RegionContext = createContext<RegionContextValue | null>(null);

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${expires};samesite=lax`;
}

const COUNTRY = /^[A-Z]{2}$/;

function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Pure: the display currency for a visitor. Exported for tests. */
export function resolveDisplayCurrency(input: {
  list: readonly PlatformCurrency[] | undefined;
  override?: string | null;
  geoCurrency?: string | null;
  country?: string | null;
}): string {
  const list = input.list ?? [];
  const listed = (code: string | null | undefined) => {
    const upper = (code ?? "").toUpperCase();
    return upper && list.some((c) => c.code === upper) ? upper : null;
  };
  return (
    listed(input.override) ??
    listed(input.geoCurrency) ??
    suggestCurrency(input.country, list) ??
    selectableFor(list, "price")[0]?.code ??
    list[0]?.code ??
    ""
  );
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState("US");
  const [geo, setGeo] = useState<{ currency?: string; locale?: string; regionName?: string } | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const { data: list } = useCurrencyList();

  useEffect(() => {
    const hydrateRegion = async () => {
      const currencyOverride = getCookie(CURRENCY_OVERRIDE_COOKIE);
      if (currencyOverride) setOverride(currencyOverride.toUpperCase());

      const overrideCountry = getCookie(REGION_OVERRIDE_COOKIE)?.toUpperCase();
      if (overrideCountry && COUNTRY.test(overrideCountry)) {
        setCountry(overrideCountry);
        setIsDetected(true);
        return;
      }

      try {
        const response = await utilityService.resolveGeo();
        const code = response.success ? response.data?.country?.toUpperCase() : undefined;
        if (code && COUNTRY.test(code)) {
          setCountry(code);
          // The geo currency is a hint; it is used only if the platform
          // lists it (resolveDisplayCurrency).
          setGeo({
            currency: response.data?.currency,
            locale: response.data?.locale,
            regionName: response.data?.region_name,
          });
          setCookie(REGION_COOKIE, code, 30);
          setIsDetected(true);
          return;
        }
      } catch {
        // Fall back to the cookie below.
      }

      const cookieCountry = getCookie(REGION_COOKIE)?.toUpperCase();
      if (cookieCountry && COUNTRY.test(cookieCountry)) setCountry(cookieCountry);
      setIsDetected(true);
    };

    void hydrateRegion();
  }, []);

  const setRegion = useCallback((countryCode: string) => {
    const code = countryCode.toUpperCase();
    if (!COUNTRY.test(code)) return;
    setCountry(code);
    setGeo(null);
    setCookie(REGION_OVERRIDE_COOKIE, code, 365);
    setCookie(REGION_COOKIE, code, 30);
  }, []);

  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase();
    setOverride(upper);
    setCookie(CURRENCY_OVERRIDE_COOKIE, upper, 365);
  }, []);

  const currency = resolveDisplayCurrency({
    list,
    override,
    geoCurrency: geo?.currency,
    country,
  });
  // A fixed default until geo answers, so the server and first client
  // render agree.
  const locale = geo?.locale || "en-US";
  const regionName = geo?.regionName || countryName(country, "en");

  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, currency || null, locale),
    [currency, locale],
  );

  const value = useMemo<RegionContextValue>(
    () => ({
      country,
      currency,
      locale,
      regionName,
      isDetected,
      currencies: list ?? [],
      formatAmount,
      setRegion,
      setCurrency,
    }),
    [country, currency, locale, regionName, isDetected, list, formatAmount, setRegion, setCurrency],
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}
