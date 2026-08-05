"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  earningsService,
  type OrgEarningsSummary,
  type RevenueTimeseriesPoint,
  type LedgerPage,
  type LedgerTransaction,
  type SessionEarnings,
} from "@/lib/api/earnings";
import { ConsultationBookingStatus } from "@/lib/api/consultations";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { minorToMajor, formatMinorMap, dominantCurrency } from "@/lib/money/minorMoney";

/**
 * Provider earnings, shared by the dietitian and trainer dashboards. Two
 * honestly-separated sections:
 *
 *  1. Settled revenue — real money off the org transactions ledger.
 *  2. Session activity — booking counts are real; the money figure is an
 *     ESTIMATE derived from consultation-type prices (bookings aren't paid
 *     through Binectics yet) and must stay labelled as one.
 *
 * Render it as the sole child of a provider dashboard shell; it returns a
 * fragment so the shell's own <main> flex gap still applies.
 */

const TX_PAGE_SIZE = 10;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(month: string): string {
  // month is "YYYY-MM"
  const idx = Number(month.slice(5, 7)) - 1;
  return `${MONTH_LABELS[idx] ?? month.slice(5)} ${month.slice(2, 4)}`;
}

function payerLabel(tx: LedgerTransaction): { name: string; email?: string } {
  if (typeof tx.user_id === "object" && tx.user_id !== null) {
    const name = [tx.user_id.first_name, tx.user_id.last_name].filter(Boolean).join(" ");
    return { name: name || tx.user_id.email || "—", email: name ? tx.user_id.email : undefined };
  }
  return { name: "—" };
}

function SectionCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{title}</h3>
        {sub && <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function ErrorBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
      <div className="font-medium">{title}</div>
      <div className="mt-1" style={{ color: "var(--ink)" }}>{body}</div>
    </div>
  );
}

export interface ProviderEarningsProps {
  /** Where "set prices" links to — the role's own settings page. */
  settingsHref: string;
  /** Noun for a booked session in body copy: "consultation" or "session". */
  sessionNoun: string;
}

export function ProviderEarnings({ settingsHref, sessionNoun }: ProviderEarningsProps) {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { fmtMoney, fmtDateTime, fmtNumber } = useOrgFormat();

  // ── Settled revenue (org ledger) ──────────────────────────────────────────
  const [summary, setSummary] = useState<OrgEarningsSummary | null>(null);
  const [series, setSeries] = useState<RevenueTimeseriesPoint[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const [txData, setTxData] = useState<LedgerPage | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // ── Session activity (org-independent) ────────────────────────────────────
  const [session, setSession] = useState<SessionEarnings | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    let active = true;
    const run = async () => {
      setLedgerLoading(true);
      const [summaryRes, seriesRes] = await Promise.allSettled([
        earningsService.getOrgSummary(currentOrg._id),
        earningsService.getOrgTimeseries(currentOrg._id, 90),
      ]);
      if (!active) return;
      let ok = false;
      if (summaryRes.status === "fulfilled" && summaryRes.value.success && summaryRes.value.data) {
        setSummary(summaryRes.value.data);
        ok = true;
      }
      if (seriesRes.status === "fulfilled" && seriesRes.value.success && seriesRes.value.data) {
        setSeries(seriesRes.value.data);
        ok = true;
      }
      setLedgerError(ok ? null : "We couldn't load settled revenue. Try again shortly.");
      setLedgerLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [currentOrg, orgLoading]);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    let active = true;
    const run = async () => {
      setTxLoading(true);
      try {
        const res = await earningsService.getOrgTransactions(currentOrg._id, { page: txPage, limit: TX_PAGE_SIZE });
        if (!active) return;
        if (res.success && res.data) {
          setTxData(res.data);
          setTxError(null);
        } else {
          setTxError(res.message ?? "Couldn't load transactions.");
        }
      } catch {
        if (active) setTxError("Couldn't load transactions.");
      }
      if (active) setTxLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [currentOrg, orgLoading, txPage]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setSessionLoading(true);
      try {
        const res = await earningsService.getSessionEarnings();
        if (!active) return;
        if (res.success && res.data) {
          setSession(res.data);
          setSessionError(null);
        } else {
          setSessionError(res.message ?? "We couldn't load session activity.");
        }
      } catch {
        if (active) setSessionError("We couldn't load session activity.");
      }
      if (active) setSessionLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const orgCurrency = currentOrg?.currency ?? "USD";
  const zero = fmtMoney(0, orgCurrency);

  const tiles = useMemo(() => {
    const w = summary?.windows;
    return [
      { label: "Today", value: formatMinorMap(w?.today, fmtMoney) ?? zero },
      { label: "This week", value: formatMinorMap(w?.week, fmtMoney) ?? zero },
      { label: "This month", value: formatMinorMap(w?.month, fmtMoney) ?? zero },
      { label: "All time", value: formatMinorMap(summary?.all_time.by_currency, fmtMoney) ?? zero },
    ];
  }, [summary, fmtMoney, zero]);

  const chart = useMemo(() => {
    if (series.length === 0) return null;
    const currency = dominantCurrency(summary?.all_time.by_currency, orgCurrency);
    const points = series.filter((p) => p.currency === currency);
    if (points.length === 0) return null;
    const max = Math.max(...points.map((p) => p.revenue_minor), 1);
    return { currency, points, max };
  }, [series, summary, orgCurrency]);

  const txTotalPages = txData ? Math.max(1, Math.ceil(txData.total / (txData.limit || TX_PAGE_SIZE))) : 1;

  const statusTiles = useMemo(() => {
    const counts = session?.counts ?? {};
    const upcoming =
      (counts[ConsultationBookingStatus.PENDING] ?? 0) +
      (counts[ConsultationBookingStatus.CONFIRMED] ?? 0);
    return [
      { label: "Completed", value: counts[ConsultationBookingStatus.COMPLETED] ?? 0 },
      { label: "Upcoming", value: upcoming },
      { label: "No-shows", value: counts[ConsultationBookingStatus.NO_SHOW] ?? 0 },
      { label: "Cancelled", value: counts[ConsultationBookingStatus.CANCELLED] ?? 0 },
    ];
  }, [session]);

  const monthlyMax = useMemo(
    () => Math.max(...(session?.monthly ?? []).map((m) => m.completed), 1),
    [session],
  );

  const estimatedEntries = useMemo(() => {
    const by = session?.estimated.by_currency ?? {};
    return Object.entries(by).sort((a, b) => b[1] - a[1]);
  }, [session]);

  return (
    <>
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Earnings</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Settled revenue from your organization&rsquo;s ledger, plus your {sessionNoun} activity
        </p>
      </div>

      {/* ── Settled revenue ─────────────────────────────────────────────── */}
      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Settled revenue</div>

        {orgLoading || (currentOrg && ledgerLoading && !summary) ? (
          <div className="rounded-(--r-3) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <AsyncSpinner label="Loading settled revenue" />
          </div>
        ) : !currentOrg ? (
          <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
            <div className="font-medium" style={{ color: "var(--ink)" }}>No organization yet</div>
            <div className="mt-1">
              Settled revenue is read from an organization&rsquo;s payment ledger. Once you run plans or memberships
              through an organization, its revenue will appear here. Your session activity below doesn&rsquo;t need one.
            </div>
          </div>
        ) : ledgerError ? (
          <ErrorBanner title="Couldn't load settled revenue" body={ledgerError} />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Summary tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{t.label}</div>
                  <div className="text-[20px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{t.value}</div>
                </div>
              ))}
            </div>

            {/* Timeseries */}
            <SectionCard title="Daily revenue · 90d" sub={chart ? `Settled transactions in ${chart.currency}` : "Settled transactions"}>
              {chart ? (
                <div className="px-4.5 py-4">
                  <div className="flex items-end gap-[2px] h-20">
                    {chart.points.map((p) => (
                      <div
                        key={p.date}
                        title={`${p.date}: ${fmtMoney(minorToMajor(p.revenue_minor), p.currency)}`}
                        className="flex-1 rounded-t-[2px] min-h-[2px]"
                        style={{ height: `${Math.max(2, (p.revenue_minor / chart.max) * 80)}px`, background: "var(--signal)" }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5 font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>
                    <span>{chart.points[0]?.date}</span>
                    <span>{chart.points[chart.points.length - 1]?.date}</span>
                  </div>
                </div>
              ) : (
                <div className="px-4.5 py-4"><EmptySlate message="No settled revenue in the last 90 days." mt="mt-0" /></div>
              )}
            </SectionCard>

            {/* Transactions */}
            <SectionCard title="Transactions" sub="Most recent first">
              {txError && (
                <div className="mx-4.5 mt-3 rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
                  {txError}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Date", "Payer", "Type", "Method", "Amount"].map((h) => (
                        <th key={h} className="font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 text-left" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontWeight: 500 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txLoading && !txData ? (
                      <tr><td colSpan={5} className="px-4.5 py-6"><AsyncSpinner label="Loading transactions" /></td></tr>
                    ) : !txData || txData.items.length === 0 ? (
                      <tr><td colSpan={5} className="px-4.5 py-6"><EmptySlate message="No transactions yet." mt="mt-0" /></td></tr>
                    ) : (
                      txData.items.map((tx) => {
                        const payer = payerLabel(tx);
                        const debit = tx.direction === "debit";
                        return (
                          <tr key={tx._id}>
                            <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                              <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{fmtDateTime(tx.occurred_at)}</span>
                            </td>
                            <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                              <div className="font-medium" style={{ color: "var(--ink)" }}>{payer.name}</div>
                              {payer.email && <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{payer.email}</div>}
                            </td>
                            <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-2)" }}>{tx.type.replace(/_/g, " ").toLowerCase()}</span>
                            </td>
                            <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{tx.method.replace(/_/g, " ").toLowerCase()}</span>
                            </td>
                            <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                              <span className="font-mono text-[12px]" style={{ color: debit ? "var(--danger)" : "var(--signal-ink)", fontVariantNumeric: "tabular-nums" }}>
                                {debit ? "−" : "+"}{fmtMoney(minorToMajor(tx.amount_minor), tx.currency)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {txData && txTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <button className="btn-ghost-v2 sm" disabled={txPage <= 1 || txLoading} onClick={() => setTxPage((p) => p - 1)}>← Prev</button>
                  <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{txPage} / {txTotalPages}</span>
                  <button className="btn-ghost-v2 sm" disabled={txPage >= txTotalPages || txLoading} onClick={() => setTxPage((p) => p + 1)}>Next →</button>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>

      {/* ── Session activity ─────────────────────────────────────────────── */}
      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Session activity</div>

        {sessionLoading ? (
          <div className="rounded-(--r-3) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <AsyncSpinner label="Loading session activity" />
          </div>
        ) : sessionError ? (
          <ErrorBanner title="Couldn't load session activity" body={sessionError} />
        ) : session ? (
          <div className="flex flex-col gap-3">
            {/* Status counts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {statusTiles.map((t) => (
                <div key={t.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{t.label}</div>
                  <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{fmtNumber(t.value)}</div>
                </div>
              ))}
            </div>

            {/* Monthly completed */}
            <SectionCard title="Completed sessions by month">
              {session.monthly.length === 0 ? (
                <div className="px-4.5 py-4"><EmptySlate message="No completed sessions yet." mt="mt-0" /></div>
              ) : (
                <div className="px-4.5 py-4">
                  <div className="flex items-end gap-2 h-24">
                    {session.monthly.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{m.completed}</span>
                        <div
                          title={`${m.month}: ${m.completed} completed`}
                          className="w-full rounded-t-[2px] min-h-[2px]"
                          style={{ height: `${Math.max(2, (m.completed / monthlyMax) * 64)}px`, background: "var(--ink)" }}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-[0.04em] truncate" style={{ color: "var(--fg-3)" }}>{monthLabel(m.month)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Estimated value */}
            <SectionCard
              title="Estimated session value"
              sub="Estimated from your session prices — bookings aren't paid through Binectics yet"
            >
              <div className="px-4.5 py-4 flex flex-col gap-2.5">
                {estimatedEntries.length === 0 ? (
                  <EmptySlate
                    message="No estimate available yet."
                    hint={`Set prices on your ${sessionNoun} types to see an estimated value for completed sessions.`}
                    mt="mt-0"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {estimatedEntries.map(([currency, minor]) => (
                      <div key={currency} className="rounded-(--r-2) px-3.5 py-2.5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                        <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>~ estimate · {currency}</div>
                        <div className="text-[18px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(minorToMajor(minor), currency)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                  {fmtNumber(session.estimated.priced_sessions)} priced session{session.estimated.priced_sessions === 1 ? "" : "s"} counted
                </div>
                {session.estimated.unpriced_sessions > 0 && (
                  <div className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                    {fmtNumber(session.estimated.unpriced_sessions)} session{session.estimated.unpriced_sessions === 1 ? " has" : "s have"} no price set —{" "}
                    <Link href={settingsHref} className="underline" style={{ color: "var(--ink)" }}>
                      set prices on your {sessionNoun} types
                    </Link>{" "}
                    to include them.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}
      </div>
    </>
  );
}
