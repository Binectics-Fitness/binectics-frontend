"use client";

import { useQuery } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate } from "@/components/ds";
import { earningsService } from "@/lib/api/earnings";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { minorToMajor } from "@/lib/money/minorMoney";

class LoadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/**
 * Where this gym's money was collected, and the payouts Binectics has sent.
 * Both come from the settled ledger. There is deliberately no balance or
 * "owed" figure: payout rules (verification, hold period) are not live, so
 * the page only reports what the records hold.
 */
export function PayoutHistory({ orgId }: { orgId: string }) {
  const { fmtMoney, fmtDateTime } = useOrgFormat();
  const money = (minor: number, currency: string) => fmtMoney(minorToMajor(minor, currency), currency);

  const overview = useQuery({
    queryKey: ["earnings", "payoutOverview", orgId],
    queryFn: async () => {
      const res = await earningsService.getPayoutOverview(orgId);
      if (!res.success || !res.data) throw new LoadError(res.message ?? "Couldn't load", res.status);
      return res.data;
    },
  });
  const payouts = useQuery({
    queryKey: ["earnings", "payouts", orgId],
    queryFn: async () => {
      const res = await earningsService.getOrgTransactions(orgId, { type: "payout", status: "succeeded", limit: 25 });
      if (!res.success || !res.data) throw new LoadError(res.message ?? "Couldn't load", res.status);
      return res.data;
    },
  });

  const rows =
    overview.data?.currencies.flatMap((c) => [
      { key: `${c.currency}-own`, label: "Your own Paystack account", currency: c.currency, minor: c.provider_account_net_minor },
      { key: `${c.currency}-platform`, label: "Collected by Binectics for you", currency: c.currency, minor: c.platform_account_net_minor },
      { key: `${c.currency}-old`, label: "Earlier payments (account not recorded)", currency: c.currency, minor: c.unattributed_net_minor },
    ]).filter((r) => r.minor !== 0) ?? [];

  return (
    <>
      <DSCard>
        <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Where your money was collected</h2>
          <div className="text-[12.5px] mt-1 max-w-[70ch]" style={{ color: "var(--fg-3)" }}>
            Payments minus refunds, all time. Money collected on your own Paystack account settles to you through Paystack.
            Money collected by Binectics is held for you; this page does not show a balance.
          </div>
        </div>
        {overview.isLoading ? (
          <div className="px-5.5 py-2"><AsyncSpinner label="Loading" /></div>
        ) : overview.isError ? (
          <div className="px-5.5 py-5 text-[13px]" style={{ color: "var(--danger)" }}>
            {overview.error instanceof LoadError && overview.error.status === 403
              ? "Only the workspace owner can see payment records."
              : "We couldn\u2019t load this. Try again shortly."}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5.5 py-5"><EmptySlate message="No payments recorded yet." mt="mt-0" /></div>
        ) : (
          <table className="w-full text-[13.5px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="px-5.5 py-3" style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{r.label}</td>
                  <td className="px-5.5 py-3 text-right font-mono whitespace-nowrap" style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {money(r.minor, r.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DSCard>

      <DSCard>
        <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Payout history</h2>
          <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Payouts Binectics has sent to your bank account</div>
        </div>
        {payouts.isLoading ? (
          <div className="px-5.5 py-2"><AsyncSpinner label="Loading payouts" /></div>
        ) : payouts.isError ? (
          <div className="px-5.5 py-5 text-[13px]" style={{ color: "var(--danger)" }}>We couldn&rsquo;t load your payouts. Try again shortly.</div>
        ) : !payouts.data || payouts.data.items.length === 0 ? (
          <div className="px-5.5 py-5"><EmptySlate message="No payouts recorded yet." mt="mt-0" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <tbody>
                {payouts.data.items.map((p, i) => (
                  <tr key={p._id}>
                    <td className="px-5.5 py-3 font-mono text-[12px]" style={{ borderBottom: i < payouts.data!.items.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-2)" }}>{fmtDateTime(p.occurred_at)}</td>
                    <td className="px-5.5 py-3 text-right font-mono whitespace-nowrap" style={{ borderBottom: i < payouts.data!.items.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                      {money(p.amount_minor, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DSCard>
    </>
  );
}
