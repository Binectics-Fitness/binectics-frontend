"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  type CurrencyCode,
  type PlanTier,
  type RegionConfig,
  DEFAULT_REGION,
  REGION_COOKIE,
  REGION_OVERRIDE_COOKIE,
  getRegionForCountry,
  getMarketPrice,
  formatRegionPrice,
} from "@/lib/constants/regions";
import { utilityService } from "@/lib/api/utility";

interface RegionContextValue {
  country: string;
  currency: CurrencyCode;
  symbol: string;
  locale: string;
  regionName: string;
  isDetected: boolean;
  formatPrice: (tier: PlanTier) => string;
  formatAmount: (amount: number) => string;
  setRegion: (countryCode: string) => void;
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

export function RegionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RegionConfig>(DEFAULT_REGION);
  const [country, setCountry] = useState("US");
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    const hydrateRegion = async () => {
      const overrideCountry = getCookie(REGION_OVERRIDE_COOKIE);
      if (overrideCountry) {
        const region = getRegionForCountry(overrideCountry);
        setConfig(region);
        setCountry(overrideCountry.toUpperCase());
        setIsDetected(true);
        return;
      }

      try {
        const response = await utilityService.resolveGeo();
        if (response.success && response.data?.country) {
          const code = response.data.country.toUpperCase();
          // Derive currency/gateway/locale canonically from the resolved
          // country. The server `currency` field is informational only — using
          // it directly risks showing a currency (and payment gateway) that
          // doesn't match the user's actual country.
          const region = getRegionForCountry(code);
          setConfig(region);
          setCountry(code);
          setCookie(REGION_COOKIE, code, 30);
          setIsDetected(true);
          return;
        }
      } catch {
        // Fallback below preserves previous behavior on network failure.
      }

      const cookieCountry = getCookie(REGION_COOKIE);
      if (cookieCountry) {
        const region = getRegionForCountry(cookieCountry);
        setConfig(region);
        setCountry(cookieCountry.toUpperCase());
      }
      setIsDetected(true);
    };

    void hydrateRegion();
  }, []);

  const setRegion = useCallback((countryCode: string) => {
    const code = countryCode.toUpperCase();
    const region = getRegionForCountry(code);
    setConfig(region);
    setCountry(code);
    setCookie(REGION_OVERRIDE_COOKIE, code, 365);
    setCookie(REGION_COOKIE, code, 30);
  }, []);

  const formatPrice = useCallback(
    (tier: PlanTier) => {
      const amount = getMarketPrice(tier, config.currencyCode);
      return formatRegionPrice(amount, config.currencyCode, config.locale);
    },
    [config],
  );

  const formatAmount = useCallback(
    (amount: number) => formatRegionPrice(amount, config.currencyCode, config.locale),
    [config],
  );

  return (
    <RegionContext.Provider
      value={{
        country,
        currency: config.currencyCode,
        symbol: config.symbol,
        locale: config.locale,
        regionName: config.regionName,
        isDetected,
        formatPrice,
        formatAmount,
        setRegion,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}
