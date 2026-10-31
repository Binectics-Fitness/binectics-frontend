"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  AsyncSpinner,
  DSCard,
  DSStatCard,
  EmptySlate,
  Eyebrow,
  FilterPill,
  PageHeader,
  StatusPill,
} from "@/components/ds";
import {
  memberPaymentsService,
  type CurrencyTotal,
  type MemberPayment,
  type OwedList,
  type PaymentKind,
} from "@/lib/api/memberPayments";
import { formatMinor } from "@/lib/currencies/helpers";
import { KIND_LABEL, paymentStatus, payMembershipPath, renewHrefFor } from "@/lib/memberPayments/helpers";
import { formatDate } from "@/utils/format";
import { ReceiptDrawer } from "./ReceiptDrawer";

const PAGE = 20;
const KIND_FILTERS: { label: string; value: PaymentKind | "" }[] = [
  { label: "All", value: "" },
  { label: "Memberships", value: "membership" },
  { label: "Sessions", value: "session" },
  { label: "Content", value: "content" },
  { label: "Refunds", value: "refund" },
];

/**
 * The member's own money: what they owe, what they have paid (per currency,
 * never added across currencies), and a receipt for each payment. Everything
 * shown is the API's; nothing is computed here.
 */
export default function PaymentsClient() {
  const [owed, setOwed] = useState<OwedList | null>(null);
  const [totals, setTotals] = useState<CurrencyTotal[] | null>(null);
  const [rows, setRows] = useState<MemberPayment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [kind, setKind] = useState<PaymentKind | "">("");
  const [currency, setCurrency] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [receiptId, setReceiptId] = useState<string | null>(null);

  // The summary and the owed list do not depend on the filters.
  useEffect(() => {
    let active = true;
    void (async () => {
      const [o, s] = await Promise.all([memberPaymentsService.owed(), memberPaymentsService.summary()]);
      if (!active) return;
      // A balance that failed to load is not "you owe nothing": leave it out
      // rather than show a clean slate (the history list carries the error).
      setOwed(o.success && o.data ? o.data : null);
      setTotals(s.success && s.data ? s.data : null);
    })();
    return () => {
      active = false;
    };
  }, [attempt]);

  const query = useCallback(
    (c: string | null) => ({
      limit: PAGE,
      cursor: c,
      kind,
      currency,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    }),
    [kind, currency, from, to],
  );

  // A newer filter supersedes an older response still in flight.
  const seq = useRef(0);
  useEffect(() => {
    const mine = ++seq.current;
    void (async () => {
      const res = await memberPaymentsService.list(query(null));
      if (mine !== seq.current) return;
      if (!res.success || !res.data) {
        setError(res.message || "Check your connection and try again.");
        return;
      }
      setRows(res.data.items);
      setCursor(res.data.nextCursor);
      setError(null);
    })();
  }, [query, attempt]);

  const showMore = async () => {
    if (!cursor || more) return;
    const mine = seq.current;
    setMore(true);
    setMoreError(false);
    const res = await memberPaymentsService.list(query(cursor));
    setMore(false);
    if (mine !== seq.current) return;
    if (!res.success || !res.data) return setMoreError(true);
    setRows((cur) => [...(cur ?? []), ...res.data!.items]);
    setCursor(res.data.nextCursor);
  };

  const currencies = (totals ?? []).map((t) => t.currency);
  const filtered = !!(kind || currency || from || to);
  const reset = () => {
    setRows(null);
    setCursor(null);
  };

  return (
    <MemberDashboardShell activeLabel="Payments">
      <PageHeader title="Payments" subtitle="What you owe, what you have paid, and a receipt for each payment." />

      {owed && owed.items.length > 0 && (
        <section aria-labelledby="owed-title" data-testid="owed-card" className="mb-6">
          <DSCard>
            <div className="px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <Eyebrow>Balance due</Eyebrow>
              <h2 id="owed-title" className="sr-only">
                What you owe
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1">
                {owed.totalsByCurrency.map((t) => (
                  <span
                    key={t.currency}
                    data-testid={`owed-total-${t.currency}`}
                    className="text-[24px] font-medium"
                    style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}
                  >
                    {formatMinor(t.currency, t.amountMinor)}
                  </span>
                ))}
              </div>
            </div>
            <ul>
              {owed.items.map((c, i) => {
                const href = c.payVia === "checkout" ? payMembershipPath(c.id) : renewHrefFor(c);
                return (
                  <li
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5.5 py-3.5"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink)" }}>
                        {c.description}
                      </div>
                      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                        {[
                          c.provider.name,
                          c.kind === "renewal" ? "Renewal" : "Joining payment",
                          c.lapsesAt ? `access until ${formatDate(c.lapsesAt)}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span
                      className="font-mono text-[13.5px] shrink-0"
                      style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatMinor(c.currency, c.amountMinor)}
                    </span>
                    <Link
                      href={href ?? "/dashboard/member/billing"}
                      className="btn-primary-v2 md shrink-0"
                      aria-label={`${c.kind === "renewal" ? "Renew" : "Pay"} ${c.description}`}
                    >
                      {c.kind === "renewal" ? "Renew" : "Pay now"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </DSCard>
        </section>
      )}

      {totals && totals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6" data-testid="totals">
          {totals.map((t) => (
            <DSStatCard
              key={t.currency}
              label={`Paid in ${t.currency}`}
              value={formatMinor(t.currency, t.netMinor)}
              delta={
                t.refundedMinor > 0
                  ? `${formatMinor(t.currency, t.paidMinor)} paid, ${formatMinor(t.currency, t.refundedMinor)} refunded`
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filter payments">
        {KIND_FILTERS.map((f) => (
          <FilterPill
            key={f.label}
            label={f.label}
            active={kind === f.value}
            onClick={() => {
              reset();
              setKind(f.value);
            }}
          />
        ))}
        {currencies.length > 1 &&
          currencies.map((c) => (
            <FilterPill
              key={c}
              label={c}
              active={currency === c}
              onClick={() => {
                reset();
                setCurrency(currency === c ? "" : c);
              }}
            />
          ))}
        <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          From
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              reset();
              setFrom(e.target.value);
            }}
            className="h-7 px-2 rounded-(--r-2) text-[12.5px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          />
        </label>
        <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          To
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              reset();
              setTo(e.target.value);
            }}
            className="h-7 px-2 rounded-(--r-2) text-[12.5px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          />
        </label>
        {filtered && (
          <button
            type="button"
            className="btn-ghost-v2 sm"
            onClick={() => {
              reset();
              setKind("");
              setCurrency("");
              setFrom("");
              setTo("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <EmptySlate
          message="We couldn't load your payments."
          hint={error}
          action={
            <button
              type="button"
              className="btn-ghost-v2"
              onClick={() => {
                setError(null);
                reset();
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </button>
          }
        />
      ) : rows === null ? (
        <AsyncSpinner />
      ) : rows.length === 0 ? (
        <EmptySlate
          message={filtered ? "No payments match these filters." : "No payments yet."}
          hint={
            filtered
              ? "Try a different filter."
              : "Memberships, sessions and programs you pay for show up here, each with a receipt."
          }
        />
      ) : (
        <DSCard>
          <ul data-testid="payment-rows">
            {rows.map((p, i) => {
              const status = paymentStatus(p);
              const isRefund = p.status === "refund";
              return (
                <li
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5.5 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                >
                  <div className="font-mono text-[11.5px] shrink-0 sm:w-28" style={{ color: "var(--fg-3)" }}>
                    {formatDate(p.paidAt)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink)" }}>
                      {p.description}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {[KIND_LABEL[p.kind], p.provider.name].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span
                    className="font-mono text-[13.5px] shrink-0"
                    style={{
                      color: isRefund ? "var(--signal-ink)" : "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {isRefund ? "+" : ""}
                    {formatMinor(p.currency, p.amountMinor)}
                  </span>
                  <StatusPill label={status.label} tone={status.tone} />
                  {p.receiptAvailable ? (
                    <button
                      type="button"
                      className="btn-ghost-v2 sm shrink-0"
                      aria-label={`Receipt for ${p.description}, ${formatDate(p.paidAt)}`}
                      onClick={() => setReceiptId(p.id)}
                    >
                      Receipt
                    </button>
                  ) : (
                    <span className="sm:w-[68px] shrink-0" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        </DSCard>
      )}
      {cursor && rows && rows.length > 0 && (
        <div className="flex flex-col items-start gap-2 mt-3">
          {moreError && (
            <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              Couldn&apos;t load more. Try again.
            </p>
          )}
          <button type="button" className="btn-ghost-v2" disabled={more} onClick={() => void showMore()}>
            {more ? "Loading..." : "Show more"}
          </button>
        </div>
      )}

      <ReceiptDrawer paymentId={receiptId} onClose={() => setReceiptId(null)} />
    </MemberDashboardShell>
  );
}
