"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AsyncSpinner, StatusPill } from "@/components/ds";
import { MoneyInput } from "@/components/ds/MoneyInput";
import { formatMinorForInput } from "@/lib/money/moneyInput";
import { formatMinor } from "@/lib/currencies/helpers";
import {
  refundsService,
  type ChargeRefundQuote,
  type Refund,
} from "@/lib/api/refunds";
import {
  REFUND_ORIGIN_LABEL,
  REFUND_STATUS,
  newIdempotencyKey,
  promptPill,
  refundAmountError,
  refundErrorMessage,
} from "@/lib/refunds/refundUi";

export type ChargeRefundPanelProps =
  | { mode: "provider"; orgId: string; chargeId: string; onChanged?: () => void }
  | { mode: "admin"; chargeId: string; onChanged?: () => void };

function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function RefundRow({ refund }: { refund: Refund }) {
  // A declined request put to the provider reads as the prompt, not "Declined".
  const s = promptPill(refund) ?? REFUND_STATUS[refund.status];
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
          {formatMinor(refund.currency, refund.amount_minor)}
        </div>
        <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
          {REFUND_ORIGIN_LABEL[refund.origin]} · {when(refund.created_at)}
        </div>
        {refund.reason ? (
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-2)" }}>{refund.reason}</div>
        ) : null}
        {refund.decision_note ? (
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-2)" }}>Binectics: {refund.decision_note}</div>
        ) : null}
      </div>
      <StatusPill label={s.label} tone={s.tone} title={s.help} />
    </li>
  );
}

/**
 * One payment's refunds: who refunds it (the account that collected it),
 * how much is left, and the form to refund or to ask Binectics to.
 *
 * The API decides authority; this only follows `quote.action`. Each open
 * form carries one idempotency key, kept across retries of that submit, so
 * a double-click or a dropped response never makes two refunds.
 */
export function ChargeRefundPanel(props: ChargeRefundPanelProps) {
  const { chargeId, mode } = props;
  const orgId = props.mode === "provider" ? props.orgId : null;
  const [quote, setQuote] = useState<ChargeRefundQuote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [display, setDisplay] = useState("");
  const [minor, setMinor] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const keyRef = useRef<string>(newIdempotencyKey());

  const load = useCallback(async () => {
    const res = orgId
      ? await refundsService.orgQuote(orgId, chargeId)
      : await refundsService.adminQuote(chargeId);
    if (res.success && res.data) {
      setQuote(res.data);
      setLoadError(null);
    } else {
      setLoadError(refundErrorMessage(res.code, res.message));
    }
  }, [chargeId, orgId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = orgId
        ? await refundsService.orgQuote(orgId, chargeId)
        : await refundsService.adminQuote(chargeId);
      if (!active) return;
      if (res.success && res.data) setQuote(res.data);
      else setLoadError(refundErrorMessage(res.code, res.message));
    })();
    return () => {
      active = false;
    };
  }, [chargeId, orgId]);

  if (loadError) {
    return (
      <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
        {loadError}
      </div>
    );
  }
  if (!quote) return <AsyncSpinner />;

  const cur = quote.charge.currency;
  const isRequest = quote.action === "request";
  const railNote =
    quote.payment_rail === "provider"
      ? mode === "admin"
        ? "Collected on the provider's own Paystack account. Only the provider can refund it."
        : "Collected on your own Paystack account. You refund it, from your account."
      : mode === "admin"
        ? "Collected by Binectics on the platform account. Binectics refunds it."
        : "Collected by Binectics for you. Binectics sends the refund; you can ask for one.";

  const submit = async () => {
    const err = refundAmountError(minor, quote.refundable_minor);
    if (err) {
      setFormError(err);
      return;
    }
    if (isRequest && !reason.trim()) {
      setFormError("Say why the member should be refunded.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const input = {
      amount_minor: minor!,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
      idempotency_key: keyRef.current,
    };
    const res = orgId
      ? isRequest
        ? await refundsService.orgRequest(orgId, chargeId, input)
        : await refundsService.orgRefund(orgId, chargeId, input)
      : await refundsService.adminRefund(chargeId, input);
    setSubmitting(false);
    if (!res.success || !res.data) {
      // A network failure keeps the same key, so trying again is safe.
      setFormError(refundErrorMessage(res.code, res.message));
      return;
    }
    setDone(
      isRequest
        ? "Request sent. Binectics will review it."
        : `${formatMinor(cur, res.data.amount_minor)}: ${REFUND_STATUS[res.data.status].help}`,
    );
    keyRef.current = newIdempotencyKey();
    setDisplay("");
    setMinor(null);
    setReason("");
    await load();
    props.onChanged?.();
  };

  return (
    <div className="flex flex-col gap-4" data-testid="charge-refund-panel">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Paid", value: formatMinor(cur, quote.charge.amount_minor) },
          // Includes money a bank took back in a lost dispute (api #219).
          { label: "Refunded", value: formatMinor(cur, quote.refunded_minor) },
          { label: "Can still refund", value: formatMinor(cur, quote.refundable_minor) },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-2) p-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[16px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>
      <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>{railNote}</p>

      {quote.action !== "none" ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitting) void submit();
          }}
        >
          <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
            Amount
            <div className="flex gap-2 items-center">
              <MoneyInput
                aria-label="Refund amount"
                className="flex-1 min-w-0 rounded-(--r-2) px-3 py-2 text-[14px]"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                value={display}
                currency={cur}
                onChange={(d, m) => {
                  setDisplay(d);
                  setMinor(m);
                  setFormError(null);
                }}
              />
              <button
                type="button"
                className="btn-ghost-v2"
                onClick={() => {
                  setMinor(quote.refundable_minor);
                  setDisplay(formatMinorForInput(quote.refundable_minor, { currency: cur }));
                  setFormError(null);
                }}
              >
                Full amount
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
            {isRequest ? "Why should Binectics refund it?" : "Reason (shown to the member)"}
            <textarea
              value={reason}
              maxLength={500}
              rows={2}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-(--r-2) px-3 py-2 text-[14px]"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
            />
          </label>
          {formError ? (
            <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{formError}</div>
          ) : null}
          {done ? (
            <div role="status" className="text-[13px]" style={{ color: "var(--signal-ink)" }}>{done}</div>
          ) : null}
          <div>
            <button type="submit" className="btn-primary-v2" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Sending…" : isRequest ? "Ask Binectics to refund" : "Refund"}
            </button>
          </div>
        </form>
      ) : quote.refundable_minor <= 0 ? (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Nothing left to refund on this payment.</p>
      ) : null}

      {quote.refunds.length > 0 ? (
        <div>
          <h4 className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Refunds on this payment</h4>
          <ul className="mt-1">
            {quote.refunds.map((r) => (
              <RefundRow key={r.id} refund={r} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
