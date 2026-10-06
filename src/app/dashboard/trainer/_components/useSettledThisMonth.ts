"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { earningsService } from "@/lib/api/earnings";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { formatMinorMap } from "@/lib/money/minorMoney";

/**
 * This month's SETTLED revenue for the coach's own workspace, formatted, off
 * the org ledger (the same window the Earnings page shows as "This month").
 *
 * The ledger is owner-only, so a staff coach working in someone else's gym
 * gets null and the Today page leaves the card out rather than showing a
 * zero it can't vouch for. Null too while loading and on any failure.
 *
 * Settled only: the session-price ESTIMATE (/consultations/provider/earnings)
 * covers all completed sessions, not a month, and overlaps settled money, so
 * it stays on the Earnings page under its own label.
 */
export function useSettledThisMonth(): string | null {
  const { user } = useAuth();
  const { currentOrg, isLoading } = useOrganization();
  const { fmtMoney } = useOrgFormat();
  // Keyed by org, so a workspace switch never shows the previous one's month.
  const [result, setResult] = useState<{ orgId: string; month: Record<string, number> | null } | null>(null);

  const orgId = currentOrg?._id;
  const ownerId = currentOrg?.owner_id;
  // Fails closed: an org without an owner_id is not treated as the user's.
  const isOwner = Boolean(orgId && user?.id && ownerId != null && String(ownerId) === user.id);

  useEffect(() => {
    if (isLoading || !orgId || !isOwner) return;
    let active = true;
    const kick = window.setTimeout(() => {
      earningsService
        .getOrgSummary(orgId)
        .then((res) => {
          if (active) setResult({ orgId, month: res.success && res.data ? res.data.windows.month : null });
        })
        .catch(() => {
          if (active) setResult({ orgId, month: null });
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [orgId, isOwner, isLoading]);

  if (!isOwner || !result || result.orgId !== orgId || !result.month) return null;
  // An empty month is a real zero, in the workspace's own currency.
  return formatMinorMap(result.month, fmtMoney) ?? fmtMoney(0, currentOrg?.currency ?? "");
}
