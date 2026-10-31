"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, DSCard, DSCardHead, EmptySlate, PageHeader } from "@/components/ds";
import { MoneyBreakdown } from "@/components/attributed/MoneyBreakdown";
import { RangeChips } from "@/components/attributed/RangeChips";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatMinor } from "@/lib/currencies/helpers";
import { attributedRevenueService, type RevenueByTrainer } from "@/lib/api/attributedRevenue";
import { DEFAULT_RANGE, groupByTrainer, windowFor, windowLabel, type RangeKey } from "@/lib/attributedRevenue/helpers";

const LIMIT = 25;

/**
 * Settled revenue attributed to each trainer for a UTC date window (owner
 * decision D6; GET /transactions/organizations/:id/revenue-by-trainer). A
 * report only: the gym keeps the money and any commission is settled outside
 * Binectics, so there are no shares, payouts or balances here. One block per
 * trainer and currency; currencies are never summed. Owner only: anyone else
 * gets 404 from the API.
 *
 * Deliberately NOT behind the paid_content flag (owner decision): the report
 * also covers sessions and memberships, which exist without paid content, so
 * gating it would hide existing session/membership reporting.
 */
export default function TrainerRevenueClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrg?._id ?? null;
  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RevenueByTrainer | null>(null);
  const [error, setError] = useState<{ message: string; notOwner: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orgId) return;
    let active = true;
    void (async () => {
      const res = await attributedRevenueService.revenueByTrainer(orgId, { ...windowFor(range), page, limit: LIMIT });
      if (!active) return;
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError({
          notOwner: res.status === 404,
          message: res.message || "Check your connection and try again.",
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [orgId, range, page, attempt]);

  const groups = useMemo(() => groupByTrainer(data?.items ?? []), [data]);
  const pages = data ? Math.max(1, Math.ceil(data.total / (data.limit || LIMIT))) : 1;

  const changeRange = (key: RangeKey) => {
    setRange(key);
    setPage(1);
    setData(null);
  };

  return (
    <GymDashboardShell activeItem="Revenue" crumb="Revenue by trainer">
      <PageHeader
        className="mb-0!"
        title="Revenue by trainer"
        subtitle="Settled payments attributed to each trainer. The gym keeps this money; this report only shows whose work it came from."
        actions={
          <Link href="/dashboard/gym-owner/revenue" className="btn-ghost-v2">
            Back to revenue
          </Link>
        }
      />
      <RangeChips value={range} onChange={changeRange} />
      {data && (
        <p className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
          {windowLabel(data.from, data.to)} · Dates are UTC
        </p>
      )}

      {!orgId && !orgLoading ? (
        <EmptySlate message="Select an organization to see its revenue by trainer." />
      ) : error?.notOwner && !data ? (
        <EmptySlate
          message="Only the gym's owner can see revenue by trainer."
          hint="Ask the gym's owner for this report."
        />
      ) : error && !data ? (
        <EmptySlate
          message="We couldn't load this report."
          hint={error.message}
          action={
            <button type="button" className="btn-ghost-v2" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </button>
          }
        />
      ) : !data ? (
        <AsyncSpinner />
      ) : (
        <>
          {data.totals.length > 0 && (
            <DSCard>
              <DSCardHead
                title="This window"
                subtitle="Net member payments to the gym, and the part of them attributed to a trainer. Per currency."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4.5">
                {data.totals.map((t) => (
                  <div key={t.currency} className="rounded-(--r-2) p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>{t.currency}</div>
                    <div className="text-[13px] mt-2 flex justify-between gap-3">
                      <span style={{ color: "var(--fg-2)" }}>Member payments net</span>
                      <span className="font-mono" style={{ color: "var(--ink)" }}>{formatMinor(t.currency, t.organizationNetMinor)}</span>
                    </div>
                    <div className="text-[13px] mt-1 flex justify-between gap-3">
                      <span style={{ color: "var(--fg-2)" }}>Attributed to trainers</span>
                      <span className="font-mono" style={{ color: "var(--ink)" }}>{formatMinor(t.currency, t.attributedNetMinor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DSCard>
          )}

          {groups.length === 0 ? (
            <EmptySlate
              message="Nothing attributed in this range yet."
              hint="Settled payments for a trainer's sessions, memberships a rule routed to them, and programs or meal plans they authored show here."
            />
          ) : (
            groups.map((g) => (
              <DSCard key={g.userId}>
                <DSCardHead title={g.name} subtitle={`${g.rows.length} ${g.rows.length === 1 ? "currency" : "currencies"}`} />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4.5">
                  {g.rows.map((r) => (
                    <MoneyBreakdown key={r.currency} money={r} />
                  ))}
                </div>
              </DSCard>
            ))
          )}

          {pages > 1 && (
            <div className="flex items-center gap-3">
              <button type="button" className="btn-ghost-v2" disabled={page <= 1} onClick={() => { setData(null); setPage((p) => p - 1); }}>
                Previous
              </button>
              <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                Page {page} of {pages}
              </span>
              <button type="button" className="btn-ghost-v2" disabled={page >= pages} onClick={() => { setData(null); setPage((p) => p + 1); }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </GymDashboardShell>
  );
}
