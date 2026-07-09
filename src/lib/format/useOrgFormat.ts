"use client";

import { useMemo } from "react";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import {
  resolveOrgFormatPrefs,
  formatOrgDate,
  formatOrgTime,
  formatOrgDateTime,
  formatOrgNumber,
  formatOrgMoney,
  WEEK_STARTS_ON,
  type OrgFormatPrefs,
} from "./orgFormat";

export interface OrgFormatters {
  prefs: OrgFormatPrefs;
  /** "18 May 2026" per the org's date format & time zone. */
  fmtDate: (date: string | Date | null | undefined) => string;
  /** "14:30" / "2:30 PM" per the org's time format & time zone. */
  fmtTime: (date: string | Date | null | undefined) => string;
  /** "18 May 2026 · 14:30". */
  fmtDateTime: (date: string | Date | null | undefined) => string;
  /** Plain number in the org's grouping style. */
  fmtNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /**
   * Money grouped per the org's number style. Pass the amount's own currency;
   * omit it to fall back to the org default.
   */
  fmtMoney: (amount: number, currency?: string | null) => string;
  /** 0 (Sun) / 1 (Mon) / 6 (Sat) — for calendars and date pickers. */
  weekStartsOn: 0 | 1 | 6;
}

/**
 * Formatting bound to the active organization's saved locale settings
 * (Settings → Currency & locale). Falls back to platform defaults and the
 * browser time zone when no org is active or nothing is saved yet, so it is
 * safe to use in any client component.
 */
export function useOrgFormat(): OrgFormatters {
  const orgContext = useOptionalOrganization();
  const org = orgContext?.currentOrg ?? null;

  return useMemo(() => {
    const prefs = resolveOrgFormatPrefs(org);
    return {
      prefs,
      fmtDate: (date) => formatOrgDate(date, prefs),
      fmtTime: (date) => formatOrgTime(date, prefs),
      fmtDateTime: (date) => formatOrgDateTime(date, prefs),
      fmtNumber: (value, options) => formatOrgNumber(value, prefs, options),
      fmtMoney: (amount, currency) => formatOrgMoney(amount, currency, prefs),
      weekStartsOn: WEEK_STARTS_ON[prefs.firstDayOfWeek],
    };
  }, [org]);
}
