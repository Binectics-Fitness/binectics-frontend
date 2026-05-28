"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "binectics-cookies";

export interface CookiePreferences {
  required: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieData extends CookiePreferences {
  version: string;
  ts: number;
  gdpr: boolean;
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    required: true,
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  const sync = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHasConsent(false);
        return;
      }
      const data: CookieData = JSON.parse(raw);
      setPreferences({
        required: data.required,
        functional: data.functional,
        analytics: data.analytics,
        marketing: data.marketing,
      });
      setHasConsent(true);
    } catch {
      setHasConsent(false);
    }
  }, []);

  useEffect(() => {
    sync();
    const onChange = () => sync();
    document.addEventListener("cookies:change", onChange);
    return () => document.removeEventListener("cookies:change", onChange);
  }, [sync]);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferences({ required: true, functional: false, analytics: false, marketing: false });
    setHasConsent(false);
  }, []);

  const isAllowed = useCallback(
    (category: keyof CookiePreferences) => preferences[category],
    [preferences],
  );

  return { preferences, hasConsent, resetConsent, isAllowed };
}
