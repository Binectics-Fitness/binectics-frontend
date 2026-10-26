"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import { FilterPill } from "@/components/ds/FilterPill";
import { earningsService, type IncomeSummary } from "@/lib/api/earnings";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { minorToMajor } from "@/lib/money/minorMoney";
import Link from "next/link";
import { incomeSummaryCsv, incomeTaxNote } from "@/lib/money/incomeSummaryCsv";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(month: string): string {
  const idx = Number(month.slice(5, 7)) - 1;
  return `${MONTH_LABELS[idx] ?? month.slice(5)} ${month.slice(0, 4)}`;
}

function downloadCsv(summary: IncomeSummary) {
  const blob = new Blob([incomeSummaryCsv(summary)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `income-summary-${summary.year}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Informational income summary for a trainer's or dietitian's workspace: the
 * money recorded through Binectics by year, month and currency, with an
 * ESTIMATE of tax from the provider's own saved rate, label and inclusive
 * setting (none when no rate is saved). Not tax advice; nothing is filed.
 * Render as the sole child of a provider dashboard shell.
 */
export function ProviderIncomeSummary({ settingsHref }: { settingsHref: string }) {
  const coachingGym = useCoachingGym();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { fmtMoney, fmtNumber } = useOrgFormat();
  const [year, setYear] = useState<number | undefined>(undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["earnings", "incomeSummary", currentOrg?._id ?? "", year ?? "current"],
    queryFn: async () => {
      const res = await earningsService.getIncomeSummary(currentOrg!._id, year);
      if (!res.success || !res.data) throw new Error(res.message ?? "Couldn't load the summary");
      return res.data;
    },
    enabled: !!currentOrg && !coachingGym,
  });

  const money = (minor: number, currency: string) => fmtMoney(minorToMajor(minor, currency), currency);
  const hasRows = !!data && data.currencies.some((c) => c.transaction_count > 0);

  return (
    <>
      <PageHeader
        className="mb-0!"
        title="Tax"
        subtitle={
          <span className="block max-w-[62ch]">
            Money recorded through Binectics, by month. An informational summary only, not tax advice. Any tax figure is an
            estimate from the rate you set; Binectics does not file tax for you.
          </span>
        }
        actions={
          data && hasRows ? (
            <button type="button" className="btn-ghost-v2 sm" onClick={() => downloadCsv(data)}>
              Download CSV
            </button>
          ) : undefined
        }
      />

      {coachingGym ? (
        <DSCard className="p-5.5">
          <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
            Your sessions are paid through {coachingGym.name}, so their payments are in the gym&rsquo;s records, not a
            workspace of your own. Ask the gym for a summary.
          </p>
        </DSCard>
      ) : orgLoading || isLoading ? (
        <DSCard className="p-4"><AsyncSpinner label="Loading summary" /></DSCard>
      ) : !currentOrg ? (
        <DSCard className="p-5.5">
          <EmptySlate message="No workspace yet." hint="Payments are summarised once you take them through a workspace." mt="mt-0" />
        </DSCard>
      ) : isError || !data ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          We couldn&rsquo;t load your summary. Try again shortly.
        </div>
      ) : (
        <>
          {data.years.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>Year</Eyebrow>
              {data.years.map((y) => (
                <FilterPill key={y} label={String(y)} active={y === data.year} onClick={() => setYear(y)} />
              ))}
            </div>
          )}

          {!hasRows ? (
            <DSCard className="p-5.5">
              <EmptySlate message={`Nothing recorded in ${data.year}.`} hint="Payments, refunds and adjustments appear here as they settle." mt="mt-0" />
            </DSCard>
          ) : (
            data.currencies.map((c) => (
              <DSCard key={c.currency}>
                <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                    {c.currency} · {data.year}
                  </h2>
                  <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                    Net {money(c.net_minor, c.currency)} from {fmtNumber(c.transaction_count)} transaction
                    {c.transaction_count === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Month", "Payments received", "Refunds", "Adjustments", "Net", ...(data.tax ? [`Estimated ${data.tax.label}`] : [])].map((h, i) => (
                          <th
                            key={h}
                            className={`font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}
                            style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontWeight: 500 }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {c.months.map((m) => (
                        <tr key={m.month}>
                          <td className="py-3 px-4.5 whitespace-nowrap" style={{ borderBottom: "1px solid var(--border)", color: "var(--ink)" }}>{monthLabel(m.month)}</td>
                          {[m.gross_minor, m.refunds_minor, m.adjustments_minor, m.net_minor, ...(data.tax ? [m.estimated_tax_minor ?? 0] : [])].map((v, i) => (
                            <td
                              key={i}
                              className="py-3 px-4.5 text-right font-mono whitespace-nowrap"
                              style={{ borderBottom: "1px solid var(--border)", color: "var(--ink)", fontVariantNumeric: "tabular-nums", fontWeight: i === 3 ? 600 : 400 }}
                            >
                              {money(v, c.currency)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <td className="py-3 px-4.5 font-medium" style={{ color: "var(--ink)" }}>Year total</td>
                        {[c.gross_minor, c.refunds_minor, c.adjustments_minor, c.net_minor, ...(data.tax ? [c.estimated_tax_minor ?? 0] : [])].map((v, i) => (
                          <td key={i} className="py-3 px-4.5 text-right font-mono font-semibold whitespace-nowrap" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                            {money(v, c.currency)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DSCard>
            ))
          )}

          {data.tax ? (
            <p className="text-[12.5px] max-w-[70ch]" style={{ color: "var(--fg-2)" }}>
              {incomeTaxNote(data.tax)}{" "}
              <Link href={`${settingsHref}#tax`} className="underline" style={{ color: "var(--ink)" }}>Change tax settings</Link>
            </p>
          ) : (
            <DSCard className="p-4.5">
              <p className="text-[13px] max-w-[70ch]" style={{ color: "var(--fg-2)" }}>
                No tax estimate yet. Set the tax rate that applies to you to see an estimate beside each month.{" "}
                <Link href={`${settingsHref}#tax`} className="underline" style={{ color: "var(--ink)" }}>Set your tax rate</Link>
              </p>
            </DSCard>
          )}

          <p className="text-[12.5px] max-w-[70ch]" style={{ color: "var(--fg-3)" }}>
            Includes card and transfer payments, refunds and manual adjustments recorded in Binectics. Cash and payments made
            outside Binectics are not included. Months and years are in UTC. Payouts are not counted as income or as a deduction.
          </p>
        </>
      )}
    </>
  );
}
