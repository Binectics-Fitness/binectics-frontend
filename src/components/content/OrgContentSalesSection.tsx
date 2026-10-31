"use client";

import { useEffect, useState } from "react";
import { DSCard, DSCardHead, EmptySlate, AsyncSpinner, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatMinor } from "@/lib/currencies/helpers";
import { paidContentService, type OrgContentSale } from "@/lib/api/paidContent";
import { utcShortDate } from "@/lib/attributedRevenue/helpers";
import { kindLabel, paidContentOn } from "@/lib/paidContent/helpers";

const PAGE = 25;

type StatusFilter = "all" | "paid" | "refunded";
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "refunded", label: "Refunded" },
];

/**
 * A gym's program and meal plan sales (GET /content/organizations/:id/sales),
 * for the owner and staff holding marketplace:manage_listing (Admin, Manager);
 * the caller decides who sees it, the API refuses everyone else with a 404.
 * Each row keeps its own currency: amounts are never added across currencies.
 * Dates are UTC. Refunds are not made here: they stay with the gym owner's
 * existing refund flow for content sales. Shown only while `paid_content` is
 * on for this gym (the shared paidContentOn rule).
 */
export function OrgContentSalesSection({ orgId }: { orgId: string }) {
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const on = paidContentOn(isEnabled, orgId);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<OrgContentSale[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{ message: string; noAccess: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!on) return;
    let active = true;
    void (async () => {
      const res = await paidContentService.orgSales(orgId, {
        status: status === "all" ? undefined : status,
        limit: PAGE,
        skip: 0,
      });
      if (!active) return;
      if (res.success && res.data) {
        setRows(res.data.items);
        setTotal(res.data.total);
        setError(null);
      } else {
        setError({ noAccess: res.status === 404, message: res.message || "Check your connection and try again." });
      }
    })();
    return () => {
      active = false;
    };
  }, [on, orgId, status, attempt]);

  if (flagsLoading || !on) return null;

  const changeStatus = (key: StatusFilter) => {
    setStatus(key);
    setRows(null);
    setError(null);
  };

  const showMore = async () => {
    if (!rows || loadingMore) return;
    setLoadingMore(true);
    const res = await paidContentService.orgSales(orgId, {
      status: status === "all" ? undefined : status,
      limit: PAGE,
      skip: rows.length,
    });
    setLoadingMore(false);
    if (!res.success || !res.data) return toast.error(res.message || "Couldn't load more. Try again.");
    const next = res.data;
    setRows((cur) => [...(cur ?? rows), ...next.items]);
    setTotal(next.total);
  };

  return (
    <DSCard>
      <DSCardHead title="Programs & meal plan sales" subtitle="What people bought from this gym on its own price. Dates are UTC." />
      <div className="px-4.5 pb-4.5">
        <div role="radiogroup" aria-label="Sale status" className="flex flex-wrap gap-2 mb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={status === f.key}
              className="btn-ghost-v2"
              style={status === f.key ? { background: "var(--ink)", color: "var(--bg)" } : undefined}
              onClick={() => changeStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {error && rows === null ? (
          error.noAccess ? (
            <EmptySlate message="You don't have access to these sales." hint="Ask the gym's owner or an admin." />
          ) : (
            <EmptySlate
              message="We couldn't load these sales."
              hint={error.message}
              action={
                <button type="button" className="btn-ghost-v2" onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </button>
              }
            />
          )
        ) : rows === null ? (
          <AsyncSpinner />
        ) : rows.length === 0 ? (
          <EmptySlate
            message={status === "all" ? "No sales yet." : `No ${status} sales.`}
            hint="When someone buys a program or meal plan from this gym, it shows up here."
          />
        ) : (
          <>
            <ul className="flex flex-col">
              {rows.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink)" }}>
                      {s.itemName || kindLabel(s.itemKind)}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {[
                        s.buyerName || "A buyer",
                        kindLabel(s.itemKind),
                        s.trainerName ? `By ${s.trainerName}` : "",
                        utcShortDate(s.paidAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {s.paymentRail === "platform" ? " · Held by Binectics" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                      {formatMinor(s.currency, s.amountMinor)}
                    </span>
                    {s.status === "refunded" ? <StatusPill label="Refunded" tone="neutral" /> : null}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[12.5px] mt-3" style={{ color: "var(--fg-3)" }}>
              Showing {rows.length} of {total}.
            </p>
            {rows.length < total && (
              <button type="button" className="btn-ghost-v2 mt-2" disabled={loadingMore} onClick={() => void showMore()}>
                {loadingMore ? "Loading..." : "Show more"}
              </button>
            )}
            <p className="text-[12.5px] mt-3" style={{ color: "var(--fg-3)" }}>
              Refunds are the gym owner&apos;s decision and use the existing refund flow for content sales. Nothing is refunded from this list.
            </p>
          </>
        )}
      </div>
    </DSCard>
  );
}
