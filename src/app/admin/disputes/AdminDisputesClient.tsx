"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { AsyncSpinner, EmptySlate, StatusPill } from "@/components/ds";
import { formatMinor } from "@/lib/currencies/helpers";
import { refundsService, type Dispute } from "@/lib/api/refunds";
import { disputeTone, refundErrorMessage } from "@/lib/refunds/refundUi";

type Filter = "platform" | "provider";

/**
 * Disputes follow the money: Binectics handles disputes on payments it
 * collected and asks the provider for evidence; disputes on a provider's
 * own Paystack money are theirs (listed here for oversight only).
 */
export function AdminDisputesClient() {
  const [filter, setFilter] = useState<Filter>("platform");
  const [items, setItems] = useState<Dispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    refundsService.adminDisputes({ handled_by: filter }).then((res) => {
      if (!active) return;
      if (res.success && res.data) setItems(res.data.items);
      else setError(refundErrorMessage(res.code, res.message));
    });
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <AdminDashboardShell activeItem="Disputes" crumb="Disputes">
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Disputes</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Answer platform disputes in the Binectics Paystack dashboard; gather the provider&apos;s evidence here.
        </p>
      </div>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Dispute filters">
        {(
          [
            { id: "platform", label: "Binectics handles" },
            { id: "provider", label: "Providers handle" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => {
              setItems(null);
              setFilter(f.id);
            }}
            className={`font-mono text-[11px] uppercase tracking-[0.04em] px-3 py-1.5 rounded-full ${filter === f.id ? "text-bg" : ""}`}
            style={{
              background: filter === f.id ? "var(--ink)" : "var(--bg)",
              color: filter === f.id ? "var(--bg)" : "var(--fg-3)",
              border: filter === f.id ? "1px solid var(--ink)" : "1px solid var(--border)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error ? <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div> : null}
      {!items ? (
        <AsyncSpinner />
      ) : items.length === 0 ? (
        <EmptySlate message="No disputes." />
      ) : (
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <ul>
            {items.map((d) => {
              const t = disputeTone(d);
              return (
                <li key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <Link href={`/admin/disputes/${d.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3">
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                        {d.refund_amount_minor !== null ? formatMinor(d.currency, d.refund_amount_minor) : d.currency} · {d.category ?? "dispute"}
                      </span>
                      <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                        Paystack #{d.gateway_dispute_id}
                        {d.evidence.length ? ` · ${d.evidence.length} evidence item(s)` : ""}
                      </span>
                    </span>
                    <StatusPill label={t.label} tone={t.tone} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AdminDashboardShell>
  );
}
