"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { DSCard, PageHeader } from "@/components/ds";
import { StatusPill } from "@/components/ds/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { formatMinor } from "@/lib/currencies/helpers";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  memberBillingService,
  type ChargeStatus,
  type OrgChargeView,
} from "@/lib/api/memberBilling";
import { chargeFailureCopy, chargeStatusCopy } from "@/lib/billing/autoRenew";
import type { MembershipSubscription } from "@/lib/types";

const FILTERS: Array<{ value: ChargeStatus | ""; label: string }> = [
  { value: "", label: "Open and failed" },
  { value: "failed_final", label: "Failed" },
  { value: "awaiting_payment", label: "Waiting for member" },
  { value: "retry_scheduled", label: "Retrying" },
  { value: "scheduled", label: "Scheduled" },
];

class ForbiddenError extends Error {}

function memberName(sub: MembershipSubscription | undefined): string {
  const m = sub?.member_user_id;
  if (m && typeof m === "object") return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email;
  return "Member";
}

function planName(sub: MembershipSubscription | undefined): string {
  return sub && typeof sub.plan_id === "object" ? sub.plan_id.name : "Plan";
}

/**
 * Card renewals: the gym's open and failed saved-card renewal charges
 * (api #205). Read-only. The API lets only the organization's owner read it,
 * so the page asks only when the signed-in user owns the current workspace,
 * and says so when they don't. The API returns no card codes or Paystack
 * text, and nothing here could show them.
 */
export default function CardRenewalsClient() {
  const { user } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { fmtDate } = useOrgFormat();
  const [status, setStatus] = useState<ChargeStatus | "">("");

  const orgId = currentOrg?._id;
  const ownerId = currentOrg?.owner_id;
  // Fails closed: an org without an owner_id is not treated as the user's.
  const isOwner = Boolean(orgId && user?.id && ownerId != null && String(ownerId) === user.id);

  const charges = useQuery<OrgChargeView[]>({
    queryKey: ["memberBilling", "orgCharges", orgId, status],
    queryFn: async () => {
      const res = await memberBillingService.listOrgCharges(orgId!, status || undefined);
      if (res.status === 403) throw new ForbiddenError();
      if (!res.success) throw new Error(res.message ?? "Couldn't load card renewals.");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !orgLoading && isOwner,
    retry: false,
  });

  // Names come from the members list; the charges carry ids only.
  const subs = useQuery<MembershipSubscription[]>({
    queryKey: ["memberBilling", "orgChargeSubs", orgId],
    queryFn: async () => {
      const res = await marketplaceService.getOrgMembershipSubscriptions(orgId!);
      return res.success && res.data ? res.data : [];
    },
    enabled: !orgLoading && isOwner,
    retry: false,
  });
  const subById = useMemo(
    () => new Map((subs.data ?? []).map((s) => [s._id, s])),
    [subs.data],
  );

  const forbidden = !orgLoading && (!isOwner || charges.error instanceof ForbiddenError);
  const rows = charges.data ?? [];

  const attemptLine = (c: OrgChargeView): string => {
    if (c.next_attempt_at) return `Next try ${fmtDate(c.next_attempt_at)}`;
    const last = c.attempts[c.attempts.length - 1];
    if (last) return `Last tried ${fmtDate(last.finished_at ?? last.started_at)}`;
    return "Not tried yet";
  };

  return (
    <GymDashboardShell activeItem="Members" crumb="Card renewals">
      <PageHeader
        className="mb-0!"
        title="Card renewals"
        subtitle="Memberships renewing on a member's saved card that are due, being retried or have failed."
        actions={
          <Link href="/dashboard/gym-owner/members" className="btn-ghost-v2 md">
            Back to members
          </Link>
        }
      />

      {forbidden ? (
        <DSCard className="p-5.5">
          <p className="text-[13.5px] text-fg-2">
            Only the owner of this workspace can see card renewals.
          </p>
        </DSCard>
      ) : (
        <DSCard className="overflow-hidden">
          <div role="group" aria-label="Show" className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
            {FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                aria-pressed={status === f.value}
                onClick={() => setStatus(f.value)}
                className={`min-h-9 rounded-(--r-full) px-3 text-[13px] font-medium ${
                  status === f.value ? "bg-ink text-bg" : "text-fg-2 hover:bg-bg-2"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(charges.isLoading || orgLoading) && (
            <p className="px-5 py-6 text-[13px] text-fg-2">Loading card renewals…</p>
          )}
          {charges.isError && !(charges.error instanceof ForbiddenError) && (
            <div className="flex flex-wrap items-center gap-3 px-5 py-6">
              <p className="text-[13px] text-fg-2">We couldn&apos;t load card renewals.</p>
              <button type="button" className="btn-ghost-v2 md" onClick={() => void charges.refetch()}>
                Try again
              </button>
            </div>
          )}
          {charges.isSuccess && rows.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-fg-2">
              Nothing here. Card renewals that are due, being retried or have failed will show up here.
            </p>
          )}
          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <caption className="sr-only">Card renewals</caption>
                <thead>
                  <tr className="border-b border-border font-mono text-[10.5px] uppercase tracking-[0.04em] text-fg-2">
                    <th scope="col" className="px-5 py-2.5 font-normal">Status</th>
                    <th scope="col" className="px-3 py-2.5 font-normal">Member</th>
                    <th scope="col" className="px-3 py-2.5 font-normal">Plan</th>
                    <th scope="col" className="px-3 py-2.5 font-normal text-right">Amount</th>
                    <th scope="col" className="px-3 py-2.5 font-normal">Attempt</th>
                    <th scope="col" className="px-5 py-2.5 font-normal">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const st = chargeStatusCopy(c.status);
                    const sub = subById.get(c.subscription_id);
                    return (
                      <tr key={c.id} className="border-b border-border last:border-b-0 align-top">
                        <td className="px-5 py-3"><StatusPill tone={st.tone} label={st.label} /></td>
                        <td className="px-3 py-3 text-ink">{memberName(sub)}</td>
                        <td className="px-3 py-3 text-fg-2">{planName(sub)}</td>
                        <td className="px-3 py-3 text-right font-mono text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatMinor(c.currency, c.amount_minor)}
                        </td>
                        <td className="px-3 py-3 text-fg-2">{attemptLine(c)}</td>
                        <td className="px-5 py-3 text-fg-2">{chargeFailureCopy(c) ?? "No problem reported"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DSCard>
      )}
    </GymDashboardShell>
  );
}
