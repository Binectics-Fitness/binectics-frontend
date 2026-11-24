"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalRegion } from "@/contexts/RegionContext";
import { useCountries } from "@/lib/queries/utility";
import { providerCountryCode } from "./_config";

/**
 * The country a provider track starts on (ISO 3166-1 alpha-2): the
 * account's own when it has one, else the visitor's detected region (web
 * sign-up asks for no country). Undefined until either is known, and when
 * the region is only the API's fallback: the track never starts on one
 * fixed country.
 */
export function useHomeCountry(): string | undefined {
  const { user } = useAuth();
  const region = useOptionalRegion();
  const own = user?.country_code?.toUpperCase();
  if (own && /^[A-Z]{2}$/.test(own)) return own;
  return region?.isDetected && !region.isFallback && /^[A-Z]{2}$/.test(region.country) ? region.country : undefined;
}

/**
 * Step 1's country for the trainer and dietitian tracks, as the gym track
 * has it: every country from /utility/countries, starting on the account's
 * own (or the detected region), never on one fixed country; with neither the
 * person picks. The code and the name are written into the form once the
 * list has named the default, so the save and the summary read them.
 */
export function useStepCountry(
  data: Record<string, unknown>,
  setField: (key: string, value: unknown) => void,
): {
  countryCode: string;
  countryName: string;
  options: string[];
  pick: (name: string) => void;
} {
  const home = useHomeCountry();
  const { data: countries = [] } = useCountries();
  const countryCode = providerCountryCode(data) || home || "";
  const countryName = countries.find((c) => c.code === countryCode)?.name ?? ((data.country as string) || "");
  useEffect(() => {
    if (!data.countryCode && countryCode) setField("countryCode", countryCode);
    if (!data.country && countryName) setField("country", countryName);
  }, [countryCode, countryName, data.country, data.countryCode, setField]);
  return {
    countryCode,
    countryName,
    options: countries.map((c) => c.name),
    pick: (name) => {
      setField("country", name);
      setField("countryCode", countries.find((c) => c.name === name)?.code ?? "");
    },
  };
}
