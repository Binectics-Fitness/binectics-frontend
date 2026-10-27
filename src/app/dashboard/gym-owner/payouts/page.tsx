"use client";

import { useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { DSCard, PageHeader } from "@/components/ds";
import { AddBankAccountModal } from "@/components/ds/modals/AddBankAccountModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationDetails } from "@/lib/queries/teams";
import { PayoutHistory } from "./PayoutHistory";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { PAYOUT_WEEKDAYS } from "@/lib/constants/orgSettingsDefaults";
import { minorToMajor } from "@/lib/money/minorMoney";

/**
 * Payouts — the configured schedule (org payout_schedule), where money was
 * collected and the payouts sent, all read from real records. No balance is
 * shown: payout rules are not live. Adding a bank account is in the page actions.
 */
export default function GymPayoutsPage() {
  const [addBankOpen, setAddBankOpen] = useState(false);
  const { currentOrg } = useOrganization();
  const { data: org } = useOrganizationDetails(currentOrg?._id);
  const { fmtMoney } = useOrgFormat();

  const schedule = org?.payout_schedule;
  const scheduleLabel = schedule
    ? schedule.frequency === "daily"
      ? "Daily"
      : schedule.frequency === "weekly"
        ? `Weekly · every ${PAYOUT_WEEKDAYS.find((d) => d.value === (schedule.payout_day ?? 1))?.label ?? "Monday"}`
        : `Monthly · day ${schedule.payout_day ?? 1}`
    : null;

  return (
    <GymDashboardShell
      activeItem="Payouts"
      crumb="Payouts"
      actions={
        <button className="btn-primary-v2 sm" onClick={() => setAddBankOpen(true)}>+ New bank account</button>
      }
    >
      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader className="mb-0!" title="Payouts" subtitle="Where your money was collected and the payouts sent to your bank" />

      {/* Configured schedule — real data from org.payout_schedule */}
      <DSCard className="p-5.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Payout schedule</h2>
            {scheduleLabel ? (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                <strong style={{ color: "var(--ink)" }}>{scheduleLabel}</strong>
                {/* minimum_payout_amount_minor is MINOR units; fmtMoney takes major. */}
                {" · "}minimum {fmtMoney(minorToMajor(schedule?.minimum_payout_amount_minor ?? 0, org?.currency ?? ""), org?.currency)}
                {" · "}{schedule?.hold_period_days ?? 0}-day hold
              </p>
            ) : (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                No payout schedule configured yet, set how often earnings settle.
              </p>
            )}
          </div>
          <Link href="/dashboard/gym-owner/settings#payouts" className="btn-ghost-v2 sm shrink-0" style={{ textDecoration: "none" }}>
            Edit in Settings →
          </Link>
        </div>
      </DSCard>

      {currentOrg && <PayoutHistory orgId={currentOrg._id} />}

      <AddBankAccountModal open={addBankOpen} onClose={() => setAddBankOpen(false)} />
    </GymDashboardShell>
  );
}
