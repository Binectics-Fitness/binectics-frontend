"use client";

import { useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { ActionModal, AsyncSpinner, DSCard, PageHeader, StatusPill } from "@/components/ds";
import { AddBankAccountModal } from "@/components/ds/modals/AddBankAccountModal";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useGymViewer } from "@/hooks/useGymViewer";
import { useOrganizationDetails } from "@/lib/queries/teams";
import { usePayoutAccount, useRemovePayoutAccount } from "@/lib/queries/payoutAccount";
import { payoutAccountErrorMessage } from "@/lib/api/payoutAccount";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { PAYOUT_WEEKDAYS } from "@/lib/constants/orgSettingsDefaults";
import { minorToMajor } from "@/lib/money/minorMoney";

/**
 * Payouts — the configured schedule is real (org payout_schedule) and so is
 * the payout bank account (verified with Paystack, shown masked; owner only
 * on the API). Payout HISTORY still awaits the payouts execution service,
 * and nothing is paid out before KYC verification (Oct 4 ruling).
 */
export default function GymPayoutsPage() {
  const [addBankOpen, setAddBankOpen] = useState(false);
  const { currentOrg } = useOrganization();
  const { data: org } = useOrganizationDetails(currentOrg?._id);
  const { fmtMoney } = useOrgFormat();
  // Every payout-account route is the owner's; staff never reach this page.
  const { isOwner } = useGymViewer();
  const payoutAccount = usePayoutAccount(currentOrg?._id, isOwner);
  const removeAccount = useRemovePayoutAccount(currentOrg?._id);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const account = payoutAccount.data?.account ?? null;

  const onRemove = async () => {
    const res = await removeAccount.mutateAsync();
    setConfirmRemove(false);
    if (res.success) toast.success("Bank account removed.");
    else toast.error(payoutAccountErrorMessage(res));
  };

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
    >
      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader className="mb-0!" title="Payouts" subtitle="Funds settle directly to your bank · Binectics never holds money" />

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

      {/* Payout bank account — verified with Paystack, shown masked */}
      <DSCard className="p-5.5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="payout-account-title" className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Payout bank account</h2>
            {payoutAccount.isLoading ? (
              <div className="mt-2"><AsyncSpinner label="Loading your payout account" /></div>
            ) : payoutAccount.isError ? (
              <p role="alert" className="text-[13px] mt-1.5" style={{ color: "var(--danger)" }}>
                {payoutAccount.error instanceof Error ? payoutAccount.error.message : "Couldn't load your payout account."}
              </p>
            ) : account ? (
              <div className="mt-2" data-testid="payout-account">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{account.account_name}</span>
                  <StatusPill label="Verified with your bank" tone="success" />
                </div>
                <div className="text-[13px] mt-1" style={{ color: "var(--fg-3)" }}>
                  {account.bank_name} · <span className="font-mono">{account.account_number_masked}</span>
                </div>
              </div>
            ) : (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                No bank account yet. Add the account your payouts should go to.
              </p>
            )}
          </div>
          {account ? (
            <div className="flex gap-2 shrink-0">
              <button className="btn-ghost-v2 sm" onClick={() => setAddBankOpen(true)}>Replace</button>
              <button className="btn-ghost-v2 sm" style={{ color: "var(--danger)" }} onClick={() => setConfirmRemove(true)}>Remove</button>
            </div>
          ) : payoutAccount.isSuccess ? (
            <button className="btn-ghost-v2 sm shrink-0" onClick={() => setAddBankOpen(true)}>Add bank account</button>
          ) : null}
        </div>
        <p className="text-[12.5px] mt-3.5" style={{ color: "var(--fg-2)" }}>
          Payouts need your business to pass KYC verification first. Nothing is paid out to this account before then.
        </p>
      </DSCard>

      <DSCard className="flex flex-col items-center text-center px-6 py-14">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></svg>
        </div>
        <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Payout history is coming soon</h2>
        <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
          Your scheduled and completed payouts will appear here once the payouts service is live.
        </p>
      </DSCard>

      <AddBankAccountModal
        open={addBankOpen}
        onClose={() => setAddBankOpen(false)}
        organizationId={currentOrg?._id ?? null}
        replacing={!!account}
      />

      <ActionModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this bank account?"
        description="Payouts will have nowhere to go until you add another account."
        footer={
          <>
            <button type="button" className="btn-ghost-v2" onClick={() => setConfirmRemove(false)}>Keep it</button>
            <button
              type="button"
              className="btn-primary-v2"
              disabled={removeAccount.isPending}
              onClick={() => void onRemove()}
            >
              {removeAccount.isPending ? "Removing…" : "Remove account"}
            </button>
          </>
        }
      >
        {account ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink)" }}>
            {account.account_name} · {account.bank_name} · <span className="font-mono">{account.account_number_masked}</span>
          </p>
        ) : null}
      </ActionModal>
    </GymDashboardShell>
  );
}
