"use client";

import { useState, useRef } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService, type EnrollMemberRequest } from "@/lib/api/marketplace";
import { useOrgMembershipPlans } from "@/lib/queries/marketplace";
import SearchableSelect from "@/components/SearchableSelect";

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
  amount_paid: "",
  payment_reference: "",
  status: "active" as "active" | "pending_payment",
  send_invite: true,
};

export function InviteClientModal({ open, onClose, onEnrolled }: InviteClientModalProps) {
  const { currentOrg } = useOrganization();
  const cancelledRef = useRef(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleClose = () => {
    cancelledRef.current = true;
    setForm(EMPTY_FORM);
    setError(null);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!currentOrg) return;
    cancelledRef.current = false;
    setError(null);
    setSubmitting(true);

    const data: EnrollMemberRequest = {
      email: form.email.trim(),
      plan_id: form.plan_id,
      status: form.status,
      send_invite: form.send_invite,
    };
    if (form.first_name.trim()) data.first_name = form.first_name.trim();
    if (form.last_name.trim()) data.last_name = form.last_name.trim();
    if (form.amount_paid !== "") data.amount_paid = Number(form.amount_paid);
    if (form.payment_reference.trim()) data.payment_reference = form.payment_reference.trim();

    try {
      const res = await marketplaceService.enrollMember(currentOrg._id, data);

      if (cancelledRef.current) return;

      if (!res.success) {
        setError(res.message ?? "Failed to enroll member. Please try again.");
        return;
      }

      const memberName =
        [form.first_name, form.last_name].filter(Boolean).join(" ") || form.email;
      toast.success(`${memberName} enrolled successfully`);
      setForm(EMPTY_FORM);
      setError(null);
      onEnrolled?.();
      onClose();
    } catch {
      if (!cancelledRef.current) setError("Failed to enroll member. Please try again.");
    } finally {
      if (!cancelledRef.current) setSubmitting(false);
    }
  };

  const canSubmit = form.email.trim() && form.plan_id && !submitting;

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      title="Add member"
      footer={
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
            {submitting ? "Enrolling…" : "Enroll member"}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        {/* Email */}
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Email address <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="member@example.com"
            className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
          />
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              First name
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="John"
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Last name
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder="Doe"
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Plan */}
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Membership plan <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          {loadingPlans ? (
            <div
              className="h-9 rounded-(--r-2) border border-border animate-pulse"
              style={{ background: "var(--bg-2)" }}
            />
          ) : planFetchError ? (
            <div className="flex items-center justify-between rounded-(--r-2) border border-border px-3 py-2" style={{ background: "var(--bg-2)" }}>
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
                  amount_paid: plan ? String(plan.price) : f.amount_paid,
                }));
              }}
              placeholder="Select a plan…"
              options={plans.map((p) => ({
                label: `${p.name} — ${p.currency} ${p.price.toLocaleString()}`,
                value: p._id,
              }))}
            />
          )}
        </div>

        {/* Amount + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Amount paid
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount_paid}
              onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))}
              placeholder={selectedPlan ? String(selectedPlan.price) : "0"}
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Status
            </label>
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
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Payment reference
          </label>
          <input
            type="text"
            value={form.payment_reference}
            onChange={(e) => setForm((f) => ({ ...f, payment_reference: e.target.value }))}
            placeholder="Bank transfer ref, receipt no…"
            className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
          />
        </div>

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
    </ActionModal>
  );
}
