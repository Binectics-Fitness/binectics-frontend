"use client";

import { useState, useRef, useEffect } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  marketplaceService,
  type EnrollMemberRequest,
  type EnrollPaymentMode,
  type EnrollTransferAccount,
} from "@/lib/api/marketplace";
import { useOrgMembershipPlans } from "@/lib/queries/marketplace";
import SearchableSelect from "@/components/SearchableSelect";
import { MoneyInput } from "@/components/ds/MoneyInput";
import { formatMinorForInput } from "@/lib/money/moneyInput";
import { minorToMajor } from "@/lib/money/minorMoney";
import { formatCurrency } from "@/utils/format";

interface InviteClientModalProps {
  open: boolean;
  onClose: () => void;
  onEnrolled?: () => void;
}

const EMPTY_FORM = {
  email: "",
  first_name: "",
  last_name: "",
  plan_id: "",
  /** How payment is collected. */
  payment_mode: "manual" as EnrollPaymentMode,
  /** What the field shows, e.g. "₦5,000". Owned by <MoneyInput>. */
  amount_paid_display: "",
  /** The same amount in MINOR units, which is what goes on the wire. */
  amount_paid_minor: null as number | null,
  payment_reference: "",
  status: "active" as "active" | "pending_payment",
  send_invite: true,
};

/**
 * Live "mm:ss" remaining until `expiresAt`, or null when there is nothing to
 * count down (no expiry given), recomputed each second. Returns "0:00" once
 * the account has expired.
 */
function useCountdown(expiresAt: string | null | undefined): string | null {
  // Tick a clock rather than the remaining seconds, so the effect only ever
  // sets state from inside the interval callback (never synchronously in its
  // body); remaining is derived during render.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function InviteClientModal({ open, onClose, onEnrolled }: InviteClientModalProps) {
  const { currentOrg } = useOrganization();
  const cancelledRef = useRef(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set after a successful transfer enrolment: switches the modal to the
  // account-details view so staff can read the number to the member.
  const [transfer, setTransfer] = useState<EnrollTransferAccount | null>(null);
  const [copied, setCopied] = useState(false);

  // Plans load via react-query, gated on the modal being open. Deriving the
  // active list (and the amount auto-fill, see the plan onChange) keeps this
  // effect-free.
  const {
    data: allPlans = [],
    isLoading: loadingPlans,
    isError: planFetchError,
    refetch: refetchPlans,
  } = useOrgMembershipPlans(currentOrg?._id, open);
  const plans = allPlans.filter((p) => p.is_active);

  const selectedPlan = plans.find((p) => p._id === form.plan_id);
  const isTransfer = form.payment_mode === "paystack_transfer";
  const countdown = useCountdown(transfer?.expires_at);

  const resetAll = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setSubmitting(false);
    setTransfer(null);
    setCopied(false);
  };

  const handleClose = () => {
    cancelledRef.current = true;
    // If a transfer account was generated, the pending member already exists,
    // so any close (ESC / overlay / X, not just Done) must refresh the list.
    const enrolled = transfer !== null;
    resetAll();
    if (enrolled) onEnrolled?.();
    onClose();
  };

  // Close after a transfer account was generated: the enrolment already
  // happened (pending), so refresh the list on the way out.
  const handleDone = () => {
    cancelledRef.current = true;
    resetAll();
    onEnrolled?.();
    onClose();
  };

  const handleCopy = async () => {
    if (!transfer) return;
    try {
      await navigator.clipboard.writeText(transfer.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the number is on screen to read regardless.
    }
  };

  const handleSubmit = async () => {
    if (!currentOrg) return;
    cancelledRef.current = false;
    setError(null);
    setSubmitting(true);

    const data: EnrollMemberRequest = {
      email: form.email.trim(),
      plan_id: form.plan_id,
      payment_mode: form.payment_mode,
      send_invite: form.send_invite,
    };
    if (form.first_name.trim()) data.first_name = form.first_name.trim();
    if (form.last_name.trim()) data.last_name = form.last_name.trim();

    // A transfer is always collected at the plan price and starts pending, so
    // the manual amount / status / reference fields do not apply to it.
    if (!isTransfer) {
      data.status = form.status;
      // MINOR units, straight from <MoneyInput>. Null means "not stated",
      // distinct from 0, which comps the member, so it is omitted entirely and
      // the API falls back to the plan's own price.
      if (form.amount_paid_minor !== null) data.amount_paid_minor = form.amount_paid_minor;
      if (form.payment_reference.trim()) data.payment_reference = form.payment_reference.trim();
    }

    try {
      const res = await marketplaceService.enrollMember(currentOrg._id, data);

      if (cancelledRef.current) return;

      if (!res.success) {
        setError(res.message ?? "Failed to enroll member. Please try again.");
        return;
      }

      const memberName =
        [form.first_name, form.last_name].filter(Boolean).join(" ") || form.email;

      if (isTransfer) {
        const account = res.data?.transfer_account;
        if (!account) {
          setError(
            "The member was enrolled but no transfer account was returned. Check the members list.",
          );
          return;
        }
        // Stay open on the account view; the enrolment is pending until paid.
        setTransfer(account);
        setError(null);
        return;
      }

      toast.success(`${memberName} enrolled successfully`);
      resetAll();
      onEnrolled?.();
      onClose();
    } catch {
      if (!cancelledRef.current) setError("Failed to enroll member. Please try again.");
    } finally {
      if (!cancelledRef.current) setSubmitting(false);
    }
  };

  const canSubmit = Boolean(form.email.trim() && form.plan_id && !submitting);
  const inputClass =
    "w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none";
  const labelClass =
    "mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3";

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      title={transfer ? "Transfer to activate" : "Add member"}
      footer={
        transfer ? (
          <button type="button" onClick={handleDone} className="btn-signal-v2">
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={handleClose} className="btn-ghost-v2">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-signal-v2 disabled:opacity-40"
            >
              {submitting
                ? isTransfer
                  ? "Generating…"
                  : "Enrolling…"
                : isTransfer
                  ? "Generate account"
                  : "Enroll member"}
            </button>
          </>
        )
      }
    >
      {transfer ? (
        <TransferDetails
          transfer={transfer}
          countdown={countdown}
          copied={copied}
          onCopy={handleCopy}
          email={form.email.trim()}
        />
      ) : (
        <div className="space-y-3.5">
          {/* Email */}
          <div>
            <label className={labelClass}>
              Email address <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="member@example.com"
              className={inputClass}
            />
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="John"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Doe"
                className={inputClass}
              />
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className={labelClass}>
              Membership plan <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            {loadingPlans ? (
              <div
                className="h-9 rounded-(--r-2) border border-border animate-pulse"
                style={{ background: "var(--bg-2)" }}
              />
            ) : planFetchError ? (
              <div
                className="flex items-center justify-between rounded-(--r-2) border border-border px-3 py-2"
                style={{ background: "var(--bg-2)" }}
              >
                <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>
                  Failed to load plans.
                </p>
                <button
                  type="button"
                  onClick={() => void refetchPlans()}
                  className="text-[12.5px] font-medium"
                  style={{ color: "var(--signal-ink)" }}
                >
                  Retry
                </button>
              </div>
            ) : plans.length === 0 ? (
              <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                No active plans. Create a membership plan first.
              </p>
            ) : (
              <SearchableSelect
                value={form.plan_id}
                onChange={(v) => {
                  const plan = plans.find((p) => p._id === v);
                  setForm((f) => ({
                    ...f,
                    plan_id: v,
                    // Auto-fill from the plan in MINOR units, keeping the exact
                    // stored value; the display string is derived from it rather
                    // than the other way round.
                    amount_paid_display: plan
                      ? formatMinorForInput(plan.price_minor, { currency: plan.currency })
                      : f.amount_paid_display,
                    amount_paid_minor: plan ? plan.price_minor : f.amount_paid_minor,
                  }));
                }}
                placeholder="Select a plan…"
                options={plans.map((p) => ({
                  label: `${p.name}, ${formatCurrency(minorToMajor(p.price_minor), p.currency)}`,
                  value: p._id,
                }))}
              />
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className={labelClass}>Payment method</label>
            <div className="grid grid-cols-2 gap-2">
              <PaymentModeTab
                active={!isTransfer}
                label="Record manually"
                hint="Cash or an offline transfer"
                onClick={() => setForm((f) => ({ ...f, payment_mode: "manual" }))}
              />
              <PaymentModeTab
                active={isTransfer}
                label="Bank transfer"
                hint="Generate an account to pay into"
                onClick={() => setForm((f) => ({ ...f, payment_mode: "paystack_transfer" }))}
              />
            </div>
          </div>

          {isTransfer ? (
            <p
              className="rounded-(--r-2) border border-border px-3 py-2.5 text-[12.5px]"
              style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}
            >
              {selectedPlan ? (
                <>
                  We&apos;ll generate a one-time account for{" "}
                  <span style={{ color: "var(--fg-2)" }}>
                    {formatCurrency(minorToMajor(selectedPlan.price_minor), selectedPlan.currency)}
                  </span>
                  . The membership activates automatically once the member transfers.
                </>
              ) : (
                "Select a plan to generate a one-time account for its price. The membership activates automatically once the member transfers."
              )}
            </p>
          ) : (
            <>
              {/* Amount + Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Amount paid</label>
                  <MoneyInput
                    value={form.amount_paid_display}
                    currency={selectedPlan?.currency ?? currentOrg?.currency ?? "USD"}
                    aria-label="Amount paid"
                    onChange={(display, minor) =>
                      setForm((f) => ({
                        ...f,
                        amount_paid_display: display,
                        amount_paid_minor: minor,
                      }))
                    }
                    placeholder={
                      selectedPlan
                        ? formatMinorForInput(selectedPlan.price_minor, {
                            currency: selectedPlan.currency,
                          })
                        : "0"
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <SearchableSelect
                    value={form.status}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        status: v as "active" | "pending_payment",
                      }))
                    }
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Pending payment", value: "pending_payment" },
                    ]}
                  />
                </div>
              </div>

              {/* Payment reference */}
              <div>
                <label className={labelClass}>Payment reference</label>
                <input
                  type="text"
                  value={form.payment_reference}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_reference: e.target.value }))
                  }
                  placeholder="Bank transfer ref, receipt no…"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Send invite */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.send_invite}
              onChange={(e) => setForm((f) => ({ ...f, send_invite: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
              Send welcome email to member
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </ActionModal>
  );
}

function PaymentModeTab({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-(--r-2) border px-3 py-2 text-left transition-colors"
      style={{
        borderColor: active ? "var(--border-2)" : "var(--border)",
        background: active ? "var(--bg-2)" : "transparent",
      }}
    >
      <span
        className="block text-[13px] font-medium"
        style={{ color: active ? "var(--ink)" : "var(--fg-2)" }}
      >
        {label}
      </span>
      <span className="block text-[11px]" style={{ color: "var(--fg-4)" }}>
        {hint}
      </span>
    </button>
  );
}

function TransferDetails({
  transfer,
  countdown,
  copied,
  onCopy,
  email,
}: {
  transfer: EnrollTransferAccount;
  countdown: string | null;
  copied: boolean;
  onCopy: () => void;
  email: string;
}) {
  const expired = countdown === "0:00";
  const rowLabel = "font-mono text-[10.5px] uppercase tracking-wide text-fg-3";

  return (
    <div className="space-y-3.5">
      <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
        Ask {email || "the member"} to transfer{" "}
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>
          {formatCurrency(minorToMajor(transfer.amount_minor), transfer.currency)}
        </span>{" "}
        into this account. The membership activates automatically once the payment
        arrives.
      </p>

      <div
        className="rounded-(--r-2) border border-border px-4 py-3.5"
        style={{ background: "var(--bg-2)" }}
      >
        {/* Account number + copy */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className={rowLabel}>Account number</span>
            <span
              className="mt-1 block font-mono text-[22px] tracking-wider"
              style={{ color: "var(--ink)" }}
            >
              {transfer.account_number}
            </span>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-(--r-2) border border-border px-3 py-1.5 text-[12px] font-medium"
            style={{ color: "var(--signal-ink)" }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {transfer.bank_name && (
            <div>
              <span className={rowLabel}>Bank</span>
              <span className="mt-1 block text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                {transfer.bank_name}
              </span>
            </div>
          )}
          <div>
            <span className={rowLabel}>Amount</span>
            <span className="mt-1 block text-[13.5px]" style={{ color: "var(--fg-2)" }}>
              {formatCurrency(minorToMajor(transfer.amount_minor), transfer.currency)}
            </span>
          </div>
          {transfer.account_name && (
            <div className="col-span-2">
              <span className={rowLabel}>Account name</span>
              <span className="mt-1 block text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                {transfer.account_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {countdown && (
        <p
          className="text-[12.5px]"
          style={{ color: expired ? "var(--danger)" : "var(--fg-3)" }}
        >
          {expired ? (
            "This account has expired. Close and start a new transfer enrolment."
          ) : (
            <>
              Account expires in{" "}
              <span className="font-mono" style={{ color: "var(--fg-2)" }}>
                {countdown}
              </span>
              .
            </>
          )}
        </p>
      )}

      <p className="text-[12px]" style={{ color: "var(--fg-4)" }}>
        The member appears under <span style={{ color: "var(--fg-3)" }}>Pending payment</span>{" "}
        until the transfer is confirmed. You can safely close this; it moves to
        Active on its own.
      </p>
    </div>
  );
}
