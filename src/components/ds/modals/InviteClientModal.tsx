"use client";

import { useState, useEffect, useRef } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService, type EnrollMemberRequest } from "@/lib/api/marketplace";
import type { MarketplaceMembershipPlan } from "@/lib/types";

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
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planFetchError, setPlanFetchError] = useState(false);
  const [planRetryKey, setPlanRetryKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !currentOrg) return;
    cancelledRef.current = false;
    setLoadingPlans(true);
    setPlans([]);
    setPlanFetchError(false);
    marketplaceService
      .getOrgMembershipPlans(currentOrg._id)
      .then((res) => {
        if (res.success && res.data) setPlans(res.data.filter((p) => p.is_active));
        else setPlanFetchError(true);
      })
      .catch(() => setPlanFetchError(true))
      .finally(() => setLoadingPlans(false));
  }, [open, currentOrg, planRetryKey]);

  // Auto-fill amount when plan selection changes.
  useEffect(() => {
    const plan = plans.find((p) => p._id === form.plan_id);
    if (plan) setForm((f) => ({ ...f, amount_paid: String(plan.price) }));
  }, [form.plan_id, plans]);

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

    const res = await marketplaceService.enrollMember(currentOrg._id, data);

    if (cancelledRef.current) return;
    setSubmitting(false);

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
                onClick={() => setPlanRetryKey((k) => k + 1)}
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
            <select
              value={form.plan_id}
              onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
            >
              <option value="">Select a plan…</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.currency} {p.price.toLocaleString()}
                </option>
              ))}
            </select>
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
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as "active" | "pending_payment",
                }))
              }
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="pending_payment">Pending payment</option>
            </select>
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
