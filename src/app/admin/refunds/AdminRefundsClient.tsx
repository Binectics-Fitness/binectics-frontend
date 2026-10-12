"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { ActionModal } from "@/components/ds/ActionModal";
import { AsyncSpinner, EmptySlate, StatusPill } from "@/components/ds";
import { formatMinor } from "@/lib/currencies/helpers";
import { refundsService, type Refund, type RefundStatus } from "@/lib/api/refunds";
import { REFUND_ORIGIN_LABEL, REFUND_STATUS, adminRequestActions, refundErrorMessage } from "@/lib/refunds/refundUi";

type Filter = "requested" | "attention" | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "requested", label: "Requests" },
  { id: "attention", label: "Needs a person" },
  { id: "all", label: "All" },
];

function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function memberName(r: Refund): string {
  const m = r.member;
  return m ? [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "Member" : "Member";
}

/**
 * The admin refund queue. Admins act on money Binectics collected: approve
 * or decline requests, check a refund with Paystack, and release an
 * unanswered one after checking the dashboard. On a provider's own-key
 * money they may only decline a request, except one queued because
 * Binectics suspended that provider, which they may approve and send with
 * the provider's key (owner ruling, Oct 12 2026; the API enforces it).
 */
export function AdminRefundsClient() {
  const [filter, setFilter] = useState<Filter>("requested");
  const [items, setItems] = useState<Refund[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Refund | null>(null);
  const [releasing, setReleasing] = useState<Refund | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const fetchFor = useCallback(async (f: Filter) => {
    const status: RefundStatus | undefined = f === "requested" ? "requested" : f === "attention" ? "unknown" : undefined;
    const res = await refundsService.adminRefunds({ status });
    if (!res.success || !res.data) return { error: refundErrorMessage(res.code, res.message) } as const;
    let rows = res.data.items;
    if (f === "attention") {
      const na = await refundsService.adminRefunds({ status: "needs_attention" });
      rows = [...rows, ...(na.success && na.data ? na.data.items : [])];
    }
    return { rows } as const;
  }, []);

  const reload = useCallback(async () => {
    const out = await fetchFor(filter);
    if ("error" in out) setError(out.error ?? null);
    else {
      setItems(out.rows);
      setError(null);
    }
  }, [fetchFor, filter]);

  useEffect(() => {
    let active = true;
    fetchFor(filter).then((out) => {
      if (!active) return;
      if ("error" in out) setError(out.error ?? null);
      else {
        setItems(out.rows);
        setError(null);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchFor, filter]);

  const act = async (id: string, fn: () => Promise<{ success: boolean; code?: string; message?: string }>) => {
    setBusy(id);
    const res = await fn();
    setBusy(null);
    if (!res.success) setError(refundErrorMessage(res.code, res.message));
    await reload();
  };

  return (
    <AdminDashboardShell activeItem="Payments" crumb="Refunds">
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Refunds</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Binectics refunds only what it collected. To refund a platform payment directly, open it from{" "}
          <Link href="/admin/payments" className="underline">Payments</Link>.
        </p>
      </div>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Refund filters">
        {FILTERS.map((f) => (
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
        <EmptySlate message={filter === "requested" ? "No refund requests waiting." : "Nothing here."} />
      ) : (
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <ul>
            {items.map((r) => {
              const s = REFUND_STATUS[r.status];
              const platform = r.payment_rail === "platform";
              const req = adminRequestActions(r);
              // What an admin sent on a suspended provider's key, they also settle.
              const adminSent = platform || (r.origin === "provider_suspension" && !!r.decided_at);
              return (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }} data-testid="admin-refund-row">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {formatMinor(r.currency, r.amount_minor)} to {memberName(r)}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                      {r.organization?.name ?? "No workspace"} · {REFUND_ORIGIN_LABEL[r.origin]} · {when(r.created_at)} ·{" "}
                      {platform ? "Platform money" : "Provider's own account"}
                    </div>
                    {r.reason ? <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-2)" }}>{r.reason}</div> : null}
                    {r.last_error ? <div className="text-[12px] mt-0.5" style={{ color: "var(--danger)" }}>{r.last_error}</div> : null}
                    <Link href={`/admin/payments/${r.charge_transaction_id}`} className="text-[12px] underline" style={{ color: "var(--fg-2)" }}>
                      Open payment
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={s.label} tone={s.tone} title={s.help} />
                    {req.approve ? (
                      <button className="btn-primary-v2" disabled={busy === r.id} onClick={() => act(r.id, () => refundsService.approve(r.id))}>
                        {req.onProviderKey ? "Approve and send from the provider's account" : "Approve and send"}
                      </button>
                    ) : null}
                    {req.decline ? (
                      <button className="btn-ghost-v2" disabled={busy === r.id} onClick={() => setRejecting(r)}>Decline</button>
                    ) : null}
                    {r.status === "requested" && !platform && !req.approve ? (
                      <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                        Provider&rsquo;s own account: declining frees it for them to refund.
                      </span>
                    ) : null}
                    {adminSent && ["pending", "needs_attention", "unknown"].includes(r.status) ? (
                      <button className="btn-ghost-v2" disabled={busy === r.id} onClick={() => act(r.id, () => refundsService.check(r.id))}>
                        Check with Paystack
                      </button>
                    ) : null}
                    {adminSent && r.status === "unknown" && r.needs_review ? (
                      <button className="btn-ghost-v2" onClick={() => setReleasing(r)}>Mark as not sent</button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ActionModal
        open={!!rejecting || !!releasing}
        onClose={() => {
          setRejecting(null);
          setReleasing(null);
          setNote("");
        }}
        title={rejecting ? "Decline refund request" : "Mark refund as not sent"}
        description={
          rejecting
            ? "The provider sees this reason."
            : "Only after checking the platform Paystack dashboard: if the refund is there, it was sent."
        }
        footer={
          <button
            className="btn-primary-v2"
            disabled={!note.trim() || !!busy}
            onClick={async () => {
              const target = rejecting ?? releasing;
              if (!target) return;
              const text = note.trim();
              setRejecting(null);
              setReleasing(null);
              setNote("");
              await act(target.id, () =>
                rejecting ? refundsService.reject(target.id, text) : refundsService.adminMarkNotSent(target.id, text),
              );
            }}
          >
            {rejecting ? "Decline" : "Mark as not sent"}
          </button>
        }
      >
        <textarea
          aria-label="Note"
          value={note}
          maxLength={500}
          rows={3}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-(--r-2) px-3 py-2 text-[14px]"
          style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
        />
      </ActionModal>
    </AdminDashboardShell>
  );
}
