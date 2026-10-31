"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AsyncSpinner, DSCard, DSCardHead, EmptySlate } from "@/components/ds";
import { MoneyBreakdown } from "./MoneyBreakdown";
import { RangeChips } from "./RangeChips";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { formatMinor } from "@/lib/currencies/helpers";
import { attributedRevenueService, type AttributedItem, type MyAttributedEarnings as Earnings } from "@/lib/api/attributedRevenue";
import { DEFAULT_RANGE, attributedTypeLabel, isRefund, utcShortDate, windowFor, windowLabel, type RangeKey } from "@/lib/attributedRevenue/helpers";

const LIMIT = 25;

/**
 * A gym's staff trainer sees the settled payments attributed to them (owner
 * decision D6; GET /transactions/me/attributed-earnings): sessions they
 * delivered, memberships a rule routed to them, programs and meal plans they
 * authored. A report only: the gym receives this money. Shown only to a
 * trainer who coaches at a gym, the only place attribution exists.
 *
 * Deliberately NOT behind the paid_content flag (owner decision): the report
 * also covers sessions and memberships, which exist without paid content.
 */
export function MyAttributedEarnings() {
  const gym = useCoachingGym();
  const inGym = !!gym;
  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE);
  const [data, setData] = useState<Earnings | null>(null);
  const [items, setItems] = useState<AttributedItem[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  // Bumped whenever the first page is (re)loaded for a range: a "Show more"
  // that returns after the range changed belongs to the old range and is dropped.
  const generation = useRef(0);
  // The window is worked out once per range (and per retry), so every page of
  // a range asks for the same from/to; "Show more" never moves it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const win = useMemo(() => windowFor(range), [range, attempt]);

  useEffect(() => {
    if (!inGym) return;
    let active = true;
    generation.current += 1;
    void (async () => {
      const res = await attributedRevenueService.myEarnings({ ...win, page: 1, limit: LIMIT });
      if (!active) return;
      if (res.success && res.data) {
        setData(res.data);
        setItems(res.data.items);
        setPage(1);
        setMore(res.data.items.length < res.data.total);
        setError(null);
      } else {
        setError(res.message || "Check your connection and try again.");
      }
    })();
    return () => {
      active = false;
    };
  }, [inGym, win]);

  if (!inGym) return null;

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const started = generation.current;
    const res = await attributedRevenueService.myEarnings({ ...win, page: page + 1, limit: LIMIT });
    setLoadingMore(false);
    if (generation.current !== started) return;
    if (!res.success || !res.data) return setError(res.message || "Couldn't load more. Try again.");
    const next = [...items, ...res.data.items];
    setItems(next);
    setPage(page + 1);
    setMore(next.length < res.data.total);
  };

  return (
    <DSCard>
      <DSCardHead
        title="Attributed to you"
        subtitle="Settled payments credited to you at your gym. The gym receives this money; this only shows which payments were yours."
      />
      <div className="p-4.5 flex flex-col gap-4">
        <RangeChips
          value={range}
          onChange={(k) => {
            setData(null);
            setRange(k);
          }}
        />
        {error && !data ? (
          <EmptySlate
            message="We couldn't load this."
            hint={error}
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
            <p className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
              {windowLabel(data.from, data.to)} · Dates are UTC
            </p>
            {data.currencies.length === 0 ? (
              <EmptySlate
                message="Nothing attributed to you in this range yet."
                hint="Settled payments for your sessions and members show here."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.byOrganization.length > 0
                    ? data.byOrganization.map((o) => (
                        <MoneyBreakdown key={`${o.organizationId}-${o.currency}`} money={o} title={`${o.organizationName || "Gym"} · ${o.currency}`} />
                      ))
                    : data.currencies.map((c) => <MoneyBreakdown key={c.currency} money={c} />)}
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>
                    Payments and refunds
                  </div>
                  <ul className="flex flex-col">
                    {items.map((i) => {
                      const debit = isRefund(i);
                      return (
                        <li key={i.id} className="flex items-center justify-between gap-3 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                          <div>
                            <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{attributedTypeLabel(i.type)}</div>
                            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{utcShortDate(i.occurredAt)}</div>
                          </div>
                          <div className="font-mono text-[13.5px]" style={{ color: debit ? "var(--danger-ink)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                            {debit ? "-" : ""}
                            {formatMinor(i.currency, i.amountMinor)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {more && (
                    <button type="button" className="btn-ghost-v2 mt-3" disabled={loadingMore} onClick={() => void loadMore()}>
                      {loadingMore ? "Loading..." : "Show more"}
                    </button>
                  )}
                  {error && <p role="alert" className="text-[13px] mt-2" style={{ color: "var(--danger-ink)" }}>{error}</p>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DSCard>
  );
}
