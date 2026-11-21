"use client";

import { useEffect, useState } from "react";
import { onAnalyticsConsentChange, type ConsentCategory } from "./consent";

/**
 * React hook: true once the visitor has accepted `category` in the cookie
 * banner, false before (including during server render) and after they
 * withdraw it. Re-renders on every change.
 *
 *   const analyticsAllowed = useConsent("analytics");
 *   // load/opt-in the analytics client only when true
 */
export function useConsent(category: ConsentCategory): boolean {
  const [granted, setGranted] = useState(false);
  useEffect(() => {
    if (category !== "analytics") return;
    return onAnalyticsConsentChange(setGranted);
  }, [category]);
  return granted;
}
