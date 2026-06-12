"use client";

import { useEffect, useRef, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { marketplaceService } from "@/lib/api/marketplace";
import { utilityService } from "@/lib/api/utility";
import type {
  CreateOrgMembershipPlanRequest,
  UpdateOrgMembershipPlanRequest,
} from "@/lib/api/marketplace";
import { MembershipPlanType, type MarketplaceMembershipPlan } from "@/lib/types";
import { toast } from "@/components/Toast";

// ─── Plan modal ─────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit";

const FALLBACK_CURRENCIES = ["USD", "GBP", "EUR", "ZAR", "NGN", "KES", "GHS"];
const EMPTY_FORM: CreateOrgMembershipPlanRequest = {
  name: "",
  description: "",
  plan_type: MembershipPlanType.SUBSCRIPTION,
  duration_days: 30,
  price: 0,
  currency: "USD",
  features: [],
  is_active: true,
  is_public: true,
};

function PlanModal({
  mode,
  initial,
  currencies,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  initial: CreateOrgMembershipPlanRequest;
  currencies: string[];
  onClose: () => void;
  onSave: (data: CreateOrgMembershipPlanRequest) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateOrgMembershipPlanRequest>(initial);
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof CreateOrgMembershipPlanRequest>(
    key: K,
    value: CreateOrgMembershipPlanRequest[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    set("features", [...(form.features ?? []), trimmed]);
    setFeatureInput("");
  };

  const removeFeature = (i: number) =>
    set("features", (form.features ?? []).filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-(--r-3) overflow-y-auto max-h-[90vh]"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(3,20,30,0.2)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            {mode === "create" ? "New plan" : "Edit plan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-(--r-2)"
            style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Plan name <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Monthly nutrition consultation"
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description shown on your profile"
              rows={3}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Type</label>
              <select
                value={form.plan_type}
                onChange={(e) => set("plan_type", e.target.value as MembershipPlanType)}
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
              >
                <option value={MembershipPlanType.SUBSCRIPTION}>Subscription</option>
                <option value={MembershipPlanType.ONE_TIME}>One-time</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Duration (days)</label>
              <input
                type="number"
                min={1}
                required
                value={form.duration_days}
                onChange={(e) => set("duration_days", Number(e.target.value))}
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Price <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Currency</label>
              <select
                value={form.currency ?? "USD"}
                onChange={(e) => set("currency", e.target.value)}
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
              >
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Features</label>
            <div className="flex gap-2">
              <input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                placeholder="Add a feature, press Enter"
                className="h-9 flex-1 rounded-(--r-2) px-3 text-[13.5px]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
              />
              <button
                type="button"
                onClick={addFeature}
                className="h-9 px-3 rounded-(--r-2) text-[13px] font-medium"
                style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--ink)" }}
              >
                Add
              </button>
            </div>
            {(form.features ?? []).length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {(form.features ?? []).map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-(--r-2)" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                    <span className="text-[13px]" style={{ color: "var(--ink)" }}>{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} style={{ color: "var(--fg-3)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-5">
            {(["is_active", "is_public"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <span
                  onClick={() => set(key, !form[key])}
                  className="w-[30px] h-[18px] rounded-full relative"
                  style={{ background: form[key] ? "var(--ink)" : "var(--border-2)", cursor: "pointer" }}
                >
                  <span
                    className="absolute w-3.5 h-3.5 rounded-full top-0.5"
                    style={{ background: "var(--bg)", left: form[key] ? "14px" : "2px", transition: "left 120ms" }}
                  />
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                  {key === "is_active" ? "Active" : "Public"}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
            >
              {saving ? "Saving..." : mode === "create" ? "Create plan" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onToggle,
  onDelete,
}: {
  plan: MarketplaceMembershipPlan;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-(--r-3) flex flex-col overflow-hidden"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="px-5.5 pt-5 pb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: plan.plan_type === MembershipPlanType.SUBSCRIPTION ? "var(--dietitian-soft)" : "var(--trainer-soft)", color: plan.plan_type === MembershipPlanType.SUBSCRIPTION ? "var(--dietitian)" : "oklch(0.42 0.13 75)" }}>
              {plan.plan_type === MembershipPlanType.SUBSCRIPTION ? "Subscription" : "One-time"}
            </span>
            {!plan.is_public && (
              <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}>Private</span>
            )}
          </div>
          <div className="text-[16px] font-medium mt-1.5 truncate" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>{plan.name}</div>
          {plan.description && (
            <div className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>{plan.description}</div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[22px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
            {plan.currency} {plan.price.toLocaleString()}
          </div>
          <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
            {plan.duration_days}d
          </div>
        </div>
      </div>

      {(plan.features ?? []).length > 0 && (
        <div className="px-5.5 pb-3.5 flex-1">
          <ul className="flex flex-col gap-1.5">
            {plan.features.slice(0, 4).map((f, i) => (
              <li key={i} className="text-[13px] pl-4.5 relative" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>
                <span className="absolute left-0 top-[7px] w-2 h-1 border-l-[1.5px] border-b-[1.5px] -rotate-45" style={{ borderColor: "var(--ink)" }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div className="py-3.5 px-5.5" style={{ borderRight: "1px solid var(--border)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Subscribers</div>
          <div className="text-[15px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{plan.active_members}</div>
        </div>
        <div className="py-3.5 px-5.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Status</div>
          <div className="text-[13px] font-medium mt-0.5" style={{ color: plan.is_active ? "var(--signal-ink)" : "var(--fg-3)" }}>
            {plan.is_active ? "Live" : "Paused"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
            style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
            style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "transparent" }}
          >
            Delete
          </button>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="w-[30px] h-[18px] rounded-full relative cursor-pointer"
          aria-label={plan.is_active ? "Pause plan" : "Activate plan"}
          style={{ background: plan.is_active ? "var(--ink)" : "var(--border-2)" }}
        >
          <span
            className="absolute w-3.5 h-3.5 rounded-full top-0.5"
            style={{ background: "var(--bg)", left: plan.is_active ? "14px" : "2px", transition: "left 120ms" }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DietitianPlansClient() {
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<string[]>(FALLBACK_CURRENCIES);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: ModalMode; plan?: MarketplaceMembershipPlan } | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCurrencies = async () => {
      const configRes = await utilityService.getPlatformConfig();
      if (!mounted || !configRes.success || !configRes.data) return;

      const supported = configRes.data.currencies
        .filter((currency) => currency.is_active)
        .map((currency) => currency.code.toUpperCase());

      if (supported.length > 0 && mounted) {
        setCurrencies(supported);
      }
    };

    void loadCurrencies();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const listingRes = await marketplaceService.getMyListing();
      if (!listingRes.success || !listingRes.data || !mounted) {
        if (mounted) setLoading(false);
        return;
      }
      const listing = listingRes.data;
      const oid =
        typeof listing.organization_id === "string"
          ? listing.organization_id
          : (listing.organization_id as { _id: string } | undefined)?._id ?? null;
      if (!oid) {
        if (mounted) setLoading(false);
        return;
      }
      if (mounted) setOrgId(oid);
      const plansRes = await marketplaceService.getOrgMembershipPlans(oid);
      if (!mounted) return;
      if (plansRes.success && plansRes.data) setPlans(plansRes.data);
      if (mounted) setLoading(false);
    };

    void load();
    return () => { mounted = false; };
  }, []);
  const handleCreate = async (data: CreateOrgMembershipPlanRequest) => {
    if (!orgId) return;
    const res = await marketplaceService.createOrgMembershipPlan(orgId, data);
    if (res.success && res.data) {
      setPlans((p) => [res.data!, ...p]);
      setModal(null);
      toast.success("Plan created.");
    } else {
      toast.error(res.message ?? "Failed to create plan.");
    }
  };

  const handleEdit = async (data: UpdateOrgMembershipPlanRequest) => {
    if (!orgId || !modal?.plan) return;
    const res = await marketplaceService.updateOrgMembershipPlan(orgId, modal.plan._id, data);
    if (res.success && res.data) {
      setPlans((p) => p.map((pl) => (pl._id === res.data!._id ? res.data! : pl)));
      setModal(null);
      toast.success("Plan updated.");
    } else {
      toast.error(res.message ?? "Failed to update plan.");
    }
  };

  const handleToggle = async (plan: MarketplaceMembershipPlan) => {
    if (!orgId) return;
    const res = plan.is_active
      ? await marketplaceService.deactivateOrgMembershipPlan(orgId, plan._id)
      : await marketplaceService.activateOrgMembershipPlan(orgId, plan._id);
    if (res.success && res.data) {
      setPlans((p) => p.map((pl) => (pl._id === res.data!._id ? res.data! : pl)));
    } else {
      toast.error(res.message ?? "Failed to update plan status.");
    }
  };

  const handleDelete = async (plan: MarketplaceMembershipPlan) => {
    if (!orgId) return;
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    const res = await marketplaceService.deleteOrgMembershipPlan(orgId, plan._id);
    if (res.success) {
      setPlans((p) => p.filter((pl) => pl._id !== plan._id));
      toast.success("Plan deleted.");
    } else {
      toast.error(res.message ?? "Failed to delete plan.");
    }
  };

  const activeCount = plans.filter((p) => p.is_active).length;

  return (
    <DietitianDashboardShell activeItem="Plans" crumb="Plans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Plans</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {loading ? "Loading..." : `${plans.length} plan${plans.length === 1 ? "" : "s"} · ${activeCount} live`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="btn-signal-v2 inline-flex items-center gap-2 self-start sm:self-auto"
          style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New plan
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-(--r-3) h-[280px] animate-pulse" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div
          className="rounded-(--r-3) flex flex-col items-center justify-center gap-3 py-16 mt-4"
          style={{ border: "1.5px dashed var(--border-2)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
          <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>No plans yet</div>
          <div className="text-[13px] text-center" style={{ color: "var(--fg-3)", maxWidth: "30ch", lineHeight: 1.5 }}>
            Create your first plan to start accepting subscribers.
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="mt-1 h-9 px-5 rounded-(--r-2) text-[13px] font-medium"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            Create first plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => setModal({ mode: "edit", plan })}
              onToggle={() => handleToggle(plan)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="rounded-(--r-3) flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[240px]"
            style={{ border: "1.5px dashed var(--border-2)", color: "var(--fg-3)", background: "transparent" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            <span className="text-[14px] font-medium">New plan</span>
          </button>
        </div>
      )}

      {modal && (
        <PlanModal
          mode={modal.mode}
          currencies={currencies}
          initial={
            modal.plan
              ? {
                  name: modal.plan.name,
                  description: modal.plan.description ?? "",
                  plan_type: modal.plan.plan_type,
                  duration_days: modal.plan.duration_days,
                  price: modal.plan.price,
                  currency: modal.plan.currency,
                  features: modal.plan.features ?? [],
                  is_active: modal.plan.is_active,
                  is_public: modal.plan.is_public,
                }
              : EMPTY_FORM
          }
          onClose={() => setModal(null)}
          onSave={modal.mode === "create" ? handleCreate : handleEdit}
        />
      )}
    </DietitianDashboardShell>
  );
}
