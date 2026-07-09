"use client";

import { useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddBankAccountModal } from "@/components/ds/modals/AddBankAccountModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationDetails } from "@/lib/queries/teams";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { PAYOUT_WEEKDAYS } from "@/lib/constants/orgSettingsDefaults";

/**
 * Payouts — the configured schedule is real (org payout_schedule); payout
 * HISTORY still awaits the payouts execution service, so that section keeps
 * an honest pending state. Adding a bank account is available.
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
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Payouts</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Funds settle directly to your bank · Binectics never holds money</div>
      </div>

      {/* Configured schedule — real data from org.payout_schedule */}
      <section className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Payout schedule</h2>
            {scheduleLabel ? (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                <strong style={{ color: "var(--ink)" }}>{scheduleLabel}</strong>
                {" · "}minimum {fmtMoney(schedule?.minimum_payout_amount ?? 0, org?.currency)}
                {" · "}{schedule?.hold_period_days ?? 0}-day hold
              </p>
            ) : (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                No payout schedule configured yet — set how often earnings settle.
              </p>
            )}
          </div>
          <Link href="/dashboard/gym-owner/settings#payouts" className="btn-ghost-v2 sm shrink-0" style={{ textDecoration: "none" }}>
            Edit in Settings →
          </Link>
        </div>
      </section>

      <div className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-14" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></svg>
        </div>
        <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Payout history is coming soon</h2>
        <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
          Your scheduled and completed payouts will appear here once the payouts service is live. In the meantime you can add the bank account funds should settle to.
        </p>
        <button className="btn-ghost-v2 sm mt-5" onClick={() => setAddBankOpen(true)}>Add bank account</button>
      </div>

      <AddBankAccountModal open={addBankOpen} onClose={() => setAddBankOpen(false)} />
    </GymDashboardShell>
  );
}
