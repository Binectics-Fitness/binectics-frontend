"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { StatusPill } from "@/components/ds";
import { formatMinor } from "@/lib/currencies/helpers";
import { refundsService, type Refund } from "@/lib/api/refunds";
import { newIdempotencyKey, refundErrorMessage } from "@/lib/refunds/refundUi";

function memberName(r: Refund): string {
  const m = r.member;
  return [m?.first_name, m?.last_name].filter(Boolean).join(" ") || "A member";
}

function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * "Refund suggested" (owner ruling, Oct 13 2026). When Binectics suspends a
 * member, their paid sessions are cancelled and the refunds go to the admin
 * queue. Money paid to the provider's OWN Paystack account can only be
 * declined there, so the provider is asked to refund it themselves. This
 * lists those prompts with Refund and Dismiss until each is answered.
 *
 * Renders nothing when there are none. `highlightId` is the `?suggested=`
 * id a notification or email links to.
 */
export function SuggestedRefunds({
  orgId,
  highlightId,
  onChanged,
}: {
  orgId: string;
  highlightId?: string | null;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<Refund[] | null>(null);
  const [refunding, setRefunding] = useState<Refund | null>(null);
  const [dismissing, setDismissing] = useState<Refund | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  // One key per Refund dialog, reused for every retry of its submit.
  const keyRef = useRef<string>("");

  const load = useCallback(async () => {
    const res = await refundsService.orgRefunds(orgId, { provider_prompt: "open" });
    // A refusal here (not the owner, say) is shown by the rest of the page.
    setItems(res.success && res.data ? res.data.items : []);
  }, [orgId]);

  useEffect(() => {
    let active = true;
    refundsService.orgRefunds(orgId, { provider_prompt: "open" }).then((res) => {
      if (active) setItems(res.success && res.data ? res.data.items : []);
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  const after = async (message: string) => {
    setRefunding(null);
    setDismissing(null);
    setNote("");
    setDone(message);
    await load();
    onChanged?.();
  };

  if (!items || (items.length === 0 && !done)) return null;

  return (
    <section
      aria-labelledby="suggested-refunds-title"
      className="rounded-(--r-3) px-4.5 py-3.5 flex flex-col gap-2"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="suggested-refunds-title" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          Refunds to send yourself
        </h2>
        {items.length ? <StatusPill label={`${items.length} suggested`} tone="warn" /> : null}
      </div>
      <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
        Binectics suspended these members, so their paid sessions were cancelled. The money went to your own Paystack account, so
        Binectics couldn&apos;t refund it. Please refund it, or dismiss it if it isn&apos;t owed.
      </p>
      {done ? (
        <div role="status" className="text-[13px]" style={{ color: "var(--signal-ink)" }}>
          {done}
        </div>
      ) : null}
      {error && !refunding && !dismissing ? (
        <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      <ul>
        {items.map((r) => (
          <li
            key={r.id}
            data-highlighted={r.id === highlightId ? "true" : undefined}
            className="flex flex-wrap items-center justify-between gap-3 py-2.5"
            style={{
              borderTop: "1px solid var(--border)",
              ...(r.id === highlightId ? { boxShadow: "inset 3px 0 0 var(--ink)", paddingLeft: 10 } : {}),
            }}
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                {memberName(r)} · <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMinor(r.currency, r.amount_minor)}</span>
              </div>
              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                Session cancelled when the member was suspended · {when(r.provider_prompt?.prompted_at ?? r.decided_at)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-primary-v2"
                onClick={() => {
                  keyRef.current = newIdempotencyKey();
                  setError(null);
                  setDone(null);
                  setRefunding(r);
                }}
                aria-label={`Refund ${formatMinor(r.currency, r.amount_minor)} to ${memberName(r)}`}
              >
                Refund
              </button>
              <button
                className="btn-ghost-v2"
                onClick={() => {
                  setError(null);
                  setDone(null);
                  setDismissing(r);
                }}
                aria-label={`Dismiss the suggested refund to ${memberName(r)}`}
              >
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ActionModal
        open={!!refunding}
        onClose={() => setRefunding(null)}
        title="Refund this session"
        description="It goes back to the member's card from your own Paystack account."
        footer={
          <button
            className="btn-primary-v2"
            disabled={busy}
            onClick={async () => {
              if (!refunding) return;
              setBusy(true);
              const res = await refundsService.orgRefundSuggested(orgId, refunding.id, {
                idempotency_key: keyRef.current,
              });
              setBusy(false);
              if (res.success && res.data) {
                await after(
                  res.data.status === "failed"
                    ? "Paystack refused the refund. It is still listed here so you can try again."
                    : `Refund of ${formatMinor(res.data.currency, res.data.amount_minor)} started.`,
                );
              } else setError(refundErrorMessage(res.code, res.message));
            }}
          >
            {refunding ? `Refund ${formatMinor(refunding.currency, refunding.amount_minor)}` : "Refund"}
          </button>
        }
      >
        {refunding ? (
          <div className="flex flex-col gap-2 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
            <p>
              {memberName(refunding)} paid{" "}
              <strong style={{ color: "var(--ink)" }}>{formatMinor(refunding.currency, refunding.amount_minor)}</strong> for a session
              that was cancelled when Binectics suspended their account.
            </p>
            {error ? (
              <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
                {error}
              </div>
            ) : null}
          </div>
        ) : null}
      </ActionModal>

      <ActionModal
        open={!!dismissing}
        onClose={() => setDismissing(null)}
        title="Don't refund this session"
        description="Nothing is sent to the member. You can still refund the payment later from Payments."
        footer={
          <button
            className="btn-primary-v2"
            disabled={busy}
            onClick={async () => {
              if (!dismissing) return;
              setBusy(true);
              const res = await refundsService.orgDismissSuggested(orgId, dismissing.id, note.trim() || undefined);
              setBusy(false);
              if (res.success) await after("Dismissed. It won't be suggested again.");
              else setError(refundErrorMessage(res.code, res.message));
            }}
          >
            Dismiss
          </button>
        }
      >
        <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
          Why not? (optional, only you and Binectics see it)
          <textarea
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-(--r-2) px-3 py-2 text-[14px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          />
        </label>
        {error && dismissing ? (
          <div role="alert" className="text-[13px] mt-2" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        ) : null}
      </ActionModal>
    </section>
  );
}
