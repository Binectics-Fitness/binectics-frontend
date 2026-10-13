"use client";

import { useEffect, useRef, useState } from "react";
import { StatusPill } from "@/components/ds/StatusPill";

const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

/** Which Paystack webhook field the keys belong to, from the public key. */
export function paystackKeyMode(publicKey: string): "Test" | "Live" | null {
  const pk = publicKey.trim().toLowerCase();
  if (pk.startsWith("pk_test_")) return "Test";
  if (pk.startsWith("pk_live_")) return "Live";
  return null;
}

/** "13 Oct 2026, 14:05" in the viewer's locale, or null for a bad value. */
export function webhookReceivedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** How long without a webhook before the panel stops saying "Receiving". */
export const WEBHOOK_STALE_DAYS = 30;

/**
 * True when the last webhook is more than WEBHOOK_STALE_DAYS old. Display
 * only, from the field the API already sends: a quiet account may simply
 * have taken no payments, so the panel suggests a check, nothing more.
 * Never true without a valid time ("Not received yet" covers that).
 */
export function webhookIsStale(iso: string | null | undefined, now: Date = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return now.getTime() - t > WEBHOOK_STALE_DAYS * 86_400_000;
}

/**
 * "Webhook" inside a connected Paystack gateway card (Settings → Payments).
 *
 * Card renewals, bookings and refunds on a provider's OWN keys are reported
 * by Paystack to the webhook URL set in the provider's own Paystack
 * dashboard, not ours. Without it they still settle, through our checks, but
 * up to about 25 minutes later. This panel gives the exact URL (from the
 * API, never built here), the steps to paste it, and when a webhook signed
 * with their key last reached us.
 */
export function PaystackWebhookPanel({
  publicKey,
  webhookUrl,
  lastReceivedAt,
}: {
  publicKey: string;
  /** From GET .../payment-config; null when the API has no public address. */
  webhookUrl: string | null;
  lastReceivedAt: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const mode = paystackKeyMode(publicKey);
  const field = mode ? `${mode} Webhook URL` : "Test or Live Webhook URL";
  const received = webhookReceivedLabel(lastReceivedAt);
  const stale = webhookIsStale(lastReceivedAt);

  const onCopy = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopyFailed(false);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the URL is on screen to select and copy.
      setCopied(false);
      setCopyFailed(true);
    }
  };

  return (
    <section
      aria-label="Paystack webhook"
      className="flex flex-col gap-3 pt-3 mt-3"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            Webhook
          </div>
          <p className="text-[12px] mt-0.5 max-w-[60ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
            Paystack tells us about payments on your account through a webhook you set in your own Paystack
            dashboard. With it, renewals and refunds confirm instantly. Without it they still go through, but can
            take up to about 25 minutes to show.
          </p>
        </div>
        {received && stale ? (
          <StatusPill tone="neutral" label="Quiet for 30 days" />
        ) : received ? (
          <StatusPill tone="success" label="Receiving" />
        ) : (
          <StatusPill tone="warn" label="Not received yet" />
        )}
      </div>

      {webhookUrl ? (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>
            Your webhook URL
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <code
              data-testid="paystack-webhook-url"
              className="flex-1 min-w-0 font-mono text-[12.5px] px-3 py-2 rounded-(--r-2) break-all select-all"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
            >
              {webhookUrl}
            </code>
            <button type="button" className="btn-ghost-v2 sm shrink-0" onClick={() => void onCopy()}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <span role="status" className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>
            {copied
              ? "Webhook URL copied."
              : copyFailed
                ? "We couldn’t copy it. Select the URL and copy it yourself."
                : ""}
          </span>
        </div>
      ) : (
        <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          We can&rsquo;t show your webhook URL right now. Try again later, or contact support.
        </p>
      )}

      <ol className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed list-decimal pl-5" style={{ color: "var(--fg-2)" }}>
        <li>Open your Paystack dashboard and go to Settings, then API Keys &amp; Webhooks.</li>
        <li>
          Paste the URL above into the <strong style={{ color: "var(--ink)" }}>{field}</strong> field
          {mode
            ? `, the one that matches the ${mode.toLowerCase()} keys you saved here.`
            : ", whichever matches the keys you saved here."}
        </li>
        <li>Save your changes in Paystack.</li>
      </ol>

      {stale && (
        <p
          data-testid="paystack-webhook-stale"
          className="text-[12.5px] leading-relaxed px-3 py-2 rounded-(--r-2)"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}
        >
          No payment notifications from Paystack in 30 days. If you take payments, check the webhook is still set
          in your Paystack dashboard.
        </p>
      )}

      <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>
        {received
          ? `Last received ${received}.`
          : "Not received yet. Paystack sends one with the next payment, renewal or refund on your account."}
      </p>
    </section>
  );
}
