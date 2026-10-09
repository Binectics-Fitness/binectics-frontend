"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { AutoRenewConsentBox } from "@/components/billing/AutoRenewConsentBox";
import {
  memberBillingService,
  type OfferedConsent,
} from "@/lib/api/memberBilling";
import {
  autoRenewUnavailableCopy,
  consentFromError,
  isOfferedConsent,
  reasonFromError,
} from "@/lib/billing/autoRenew";
import type { ApiResponse, MembershipSubscription } from "@/lib/types";

type Problem =
  | { kind: "needs_card" }
  | { kind: "message"; text: string };

const TERMS_CHANGED =
  "The renewal terms changed since you opened this. Read them again and tick the box if you agree.";

/**
 * The auto-renew switch for one membership. NOT optimistic: the switch shows
 * what the server last returned, and a refusal leaves it where it was with
 * the reason underneath.
 *
 * Turning it off is always allowed. Turning it on for a paid plan needs a
 * card saved with this provider (AUTO_RENEW_NEEDS_CARD: the way to save one
 * is to pay the next term by card with "Renew automatically" ticked) and an
 * accepted consent text (CONSENT_REQUIRED: shown in a dialog, then sent back
 * with the PATCH).
 */
export function AutoRenewControl({
  sub,
  renewHref,
  onChanged,
  offOnly = false,
}: {
  sub: MembershipSubscription;
  /** The checkout that pays the next term (and can save a card), if any. */
  renewHref: string | null;
  onChanged: (updated: MembershipSubscription) => void;
  /**
   * Past due: auto-renew can only be turned off (api #206 turns it on for
   * active or paused memberships only), and turning it off ends the grace
   * period, so it asks first.
   */
  offOnly?: boolean;
}) {
  const hintId = useId();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [consent, setConsent] = useState<OfferedConsent | null>(null);
  const [ticked, setTicked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);

  const on = !!sub.auto_renew;
  const planName = typeof sub.plan_id === "object" ? sub.plan_id.name : "membership";

  const fetchConsent = async (): Promise<OfferedConsent | null> => {
    const res = await memberBillingService.getSubscriptionAutoRenewConsent(sub._id);
    if (res.success && isOfferedConsent(res.data)) return res.data;
    if (res.success && res.data && !res.data.offered) {
      setProblem({ kind: "message", text: autoRenewUnavailableCopy(res.data.reason) });
    }
    return null;
  };

  const explain = (res: ApiResponse<unknown>): Problem => {
    if (res.code === "AUTO_RENEW_NEEDS_CARD") return { kind: "needs_card" };
    if (res.code === "AUTO_RENEW_NOT_AVAILABLE") {
      const reason = reasonFromError(res);
      return {
        kind: "message",
        text: reason ? autoRenewUnavailableCopy(reason) : (res.message ?? autoRenewUnavailableCopy(null)),
      };
    }
    return { kind: "message", text: res.message ?? "We couldn't change auto-renew. Please try again." };
  };

  const applied = (updated: MembershipSubscription) => {
    onChanged(updated);
    setStatus(
      updated.auto_renew
        ? "Auto-renew is on. We'll remind you before each charge."
        : "Auto-renew is off. Your card stays saved and won't be used for future renewals of this membership. A payment already being processed may still go through.",
    );
  };

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    setStatus(null);
    try {
      const res = await memberBillingService.setAutoRenew(sub._id, undefined, !on);
      if (res.success && res.data) {
        applied(res.data);
        return;
      }
      if (res.code === "CONSENT_REQUIRED") {
        const fresh = consentFromError(res) ?? (await fetchConsent());
        if (fresh) {
          setConsent(fresh);
          setTicked(false);
          setNotice(null);
          setDialogError(null);
        }
        return;
      }
      setProblem(explain(res));
    } finally {
      setBusy(false);
    }
  };

  const closeDialog = () => {
    setConsent(null);
    setTicked(false);
    setNotice(null);
    setDialogError(null);
  };

  const confirm = async () => {
    if (!consent || !ticked || busy) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await memberBillingService.setAutoRenew(
        sub._id,
        {
          text_version: consent.text_version,
          text_sha256: consent.text_sha256,
          channel: "web",
        },
        true,
      );
      if (res.success && res.data) {
        closeDialog();
        applied(res.data);
        return;
      }
      if (res.code === "CONSENT_TEXT_CHANGED") {
        const fresh = consentFromError(res) ?? (await fetchConsent());
        if (fresh) {
          setConsent(fresh);
          setTicked(false);
          setNotice(TERMS_CHANGED);
        } else {
          closeDialog();
        }
        return;
      }
      const p = explain(res);
      if (p.kind === "needs_card") {
        closeDialog();
        setProblem(p);
      } else setDialogError(p.text);
    } finally {
      setBusy(false);
    }
  };

  /** Past due: turn off after the member confirms, then render the server's answer. */
  const turnOffPastDue = async () => {
    if (busy) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await memberBillingService.setAutoRenew(sub._id, undefined, false);
      if (res.success && res.data) {
        setConfirmOff(false);
        onChanged(res.data);
        setStatus("Auto-renew is off. You can renew any time from Billing.");
        return;
      }
      setDialogError(res.message ?? "We couldn't turn off auto-renew. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (offOnly) {
    if (!on) return null;
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          className="btn-ghost-v2 md self-start"
          onClick={() => {
            setDialogError(null);
            setConfirmOff(true);
          }}
          disabled={busy}
          aria-label={`Turn off auto-renew for ${planName}`}
        >
          Turn off auto-renew
        </button>
        <div aria-live="polite">{status && <p className="text-[12.5px] text-fg-2">{status}</p>}</div>
        <Modal
          open={confirmOff}
          onClose={() => !busy && setConfirmOff(false)}
          title="Turn off auto-renew?"
          size="sm"
          disableCloseGuard
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost-v2 md" onClick={() => setConfirmOff(false)} disabled={busy}>
                Keep it on
              </button>
              <button
                type="button"
                className="btn-primary-v2 md"
                style={{ background: "var(--danger-ink)", borderColor: "var(--danger-ink)", color: "var(--bg)" }}
                onClick={() => void turnOffPastDue()}
                disabled={busy}
              >
                {busy ? "Turning off…" : "Turn off"}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 text-[13.5px] text-fg-2">
            <p>
              Turning off auto-renew ends your grace period and access now. A payment already in progress may still go
              through. You can renew any time from Billing.
            </p>
            {dialogError && (
              <p role="alert" className="text-danger-ink">
                {dialogError}
              </p>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-describedby={problem || status ? hintId : undefined}
          aria-busy={busy}
          disabled={busy}
          onClick={() => void toggle()}
          className="inline-flex min-h-11 items-center gap-2.5 rounded-(--r-full) pr-1 text-[13px] font-medium text-ink disabled:opacity-60"
        >
          <span
            aria-hidden="true"
            className="relative inline-block h-[22px] w-[38px] rounded-(--r-full) transition-colors"
            style={{
              background: on ? "var(--ink)" : "var(--border-2)",
              transitionDuration: "var(--motion-fast)",
            }}
          >
            <span
              className="absolute top-[3px] h-4 w-4 rounded-(--r-full) bg-bg transition-[left]"
              style={{ left: on ? 19 : 3, transitionDuration: "var(--motion-fast)" }}
            />
          </span>
          Auto-renew
          <span className="sr-only">{` for ${planName}${busy ? " (saving)" : ""}`}</span>
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-fg-2">
          {busy ? "Saving…" : on ? "On" : "Off"}
        </span>
      </div>

      <div id={hintId} aria-live="polite">
        {status && <p className="text-[12.5px] text-fg-2">{status}</p>}
        {problem?.kind === "needs_card" && (
          <div className="text-[12.5px] text-fg-2">
            <p>
              Auto-renew needs a working card saved with this provider, and there isn&apos;t one (it may
              have expired or been retired). Pay your next term by card and tick &ldquo;Renew
              automatically&rdquo; to save one.
            </p>
            {renewHref && (
              <Link
                href={renewHref}
                className="btn-ghost-v2 md mt-2 inline-flex"
                aria-label={`Pay the next ${planName} term by card`}
              >
                Pay next term by card
              </Link>
            )}
          </div>
        )}
        {problem?.kind === "message" && (
          <p className="text-[12.5px] text-danger-ink">{problem.text}</p>
        )}
      </div>

      <Modal
        open={!!consent}
        onClose={closeDialog}
        title="Turn on auto-renew"
        size="md"
        disableCloseGuard
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2 md" onClick={closeDialog} disabled={busy}>
              Not now
            </button>
            <button
              type="button"
              className="btn-primary-v2 md"
              onClick={() => void confirm()}
              disabled={!ticked || busy}
            >
              {busy ? "Turning on…" : "Turn on auto-renew"}
            </button>
          </div>
        }
      >
        {consent && (
          <div className="flex flex-col gap-3">
            <p className="text-[13.5px] text-fg-2">
              Read the terms below. Tick the box to agree, then turn auto-renew on.
            </p>
            <AutoRenewConsentBox
              consent={consent}
              checked={ticked}
              onChange={(next) => {
                setTicked(next);
                setNotice(null);
              }}
              notice={notice}
              disabled={busy}
            />
            {dialogError && (
              <p role="alert" className="text-[13px] text-danger-ink">
                {dialogError}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
