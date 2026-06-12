"use client";

import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddBankAccountModal } from "@/components/ds/modals/AddBankAccountModal";

/**
 * Payouts — awaiting backend.
 * There is no payouts API yet (no schedule/history/balance endpoints), so
 * rather than show fabricated figures this page surfaces an honest pending
 * state. Adding a bank account is available so providers can get set up.
 */
export default function GymPayoutsPage() {
  const [addBankOpen, setAddBankOpen] = useState(false);

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
