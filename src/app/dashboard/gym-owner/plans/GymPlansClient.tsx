"use client";

import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgMembershipPlans,
  useCreateOrgMembershipPlan,
  useUpdateOrgMembershipPlan,
  useSetOrgMembershipPlanActive,
  useDeleteOrgMembershipPlan,
} from "@/lib/queries/marketplace";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  MembershipPlanType,
  type MarketplaceMembershipPlan,
} from "@/lib/types";
import type { CreateOrgMembershipPlanRequest } from "@/lib/api/marketplace";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "h-9 rounded-(--r-2) px-3 text-[13.5px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

/** "/ month" for 30d subscriptions, "/ year" for 365d, "once" for one-time. */
function perLabel(plan: Pick<MarketplaceMembershipPlan, "plan_type" | "duration_days">): string {
  if (plan.plan_type === MembershipPlanType.ONE_TIME) return "once";
  if (plan.duration_days === 30 || plan.duration_days === 31) return "/ month";
  if (plan.duration_days === 365 || plan.duration_days === 366) return "/ year";
  if (plan.duration_days === 7) return "/ week";
  return `/ ${plan.duration_days} days`;
}

/**
 * Membership plans backed by the org plans CRUD. Replaces the static
 * "Studio · monthly / R 850" mockup with real plans, member counts, and
 * working create/edit/activate/delete.
 */
export function GymPlansClient() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: plans = [], isLoading } = useOrgMembershipPlans(orgId);
  const create = useCreateOrgMembershipPlan(orgId);
  const setActive = useSetOrgMembershipPlanActive(orgId);
  const remove = useDeleteOrgMembershipPlan(orgId);
  const { fmtMoney, fmtNumber } = useOrgFormat();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePlans = plans.filter((p) => p.is_active);
  const totalMembers = plans.reduce((s, p) => s + (p.active_members ?? 0), 0);
  const mostPicked = [...plans].sort((a, b) => (b.active_members ?? 0) - (a.active_members ?? 0))[0];

  const kpis = [
    { label: "Active subscribers", value: fmtNumber(totalMembers), delta: "across all plans" },
    { label: "Active plans", value: String(activePlans.length), delta: `${plans.length} total` },
    { label: "Most picked", value: mostPicked && (mostPicked.active_members ?? 0) > 0 ? mostPicked.name : "—", small: true, delta: mostPicked && (mostPicked.active_members ?? 0) > 0 ? `${fmtNumber(mostPicked.active_members)} members` : "no subscribers yet" },
  ];

  const onCreate = async (data: CreateOrgMembershipPlanRequest) => {
    setError(null);
    const res = await create.mutateAsync(data);
    if (res.success) setAdding(false);
    else setError(res.message || "Couldn't create the plan.");
  };

  const onDelete = (plan: MarketplaceMembershipPlan) => {
    const hasMembers = (plan.active_members ?? 0) > 0;
    if (hasMembers) {
      window.alert(`"${plan.name}" has ${plan.active_members} active member${plan.active_members === 1 ? "" : "s"} — deactivate it instead so existing subscriptions keep working.`);
      return;
    }
    if (window.confirm(`Delete "${plan.name}"? This can't be undone.`)) {
      void remove.mutateAsync(plan._id);
    }
  };

  return (
    <GymDashboardShell
      activeItem="Plans & pricing"
      crumb="Plans & pricing"
      actions={<button className="btn-primary-v2 sm" disabled={!orgId} onClick={() => { setAdding(true); setEditingId(null); }}>+ New plan</button>}
    >
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Plans & pricing</h1>
        <div className="text-[13.5px] mt-1.5 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>
          The memberships members can buy on your listing. Deactivated plans stay valid for existing subscribers.
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium ${k.small ? "text-[17px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {adding && (
        <section className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>New plan</h2>
          <PlanForm saving={create.isPending} error={error} defaultCurrency={currentOrg?.currency ?? "USD"} onSubmit={(d) => void onCreate(d)} onCancel={() => setAdding(false)} submitLabel="Create plan" />
        </section>
      )}

      {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading plans…</p>}

      {!isLoading && plans.length === 0 && !adding && (
        <div className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-14" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>No plans yet</h2>
          <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
            Create your first membership plan — it becomes purchasable on your marketplace listing.
          </p>
          <button className="btn-primary-v2 sm mt-5" disabled={!orgId} onClick={() => setAdding(true)}>+ New plan</button>
        </div>
      )}

      {plans.length > 0 && (
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          {plans.map((p, i) => (
            <div key={p._id} style={{ borderBottom: i < plans.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5.5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>{p.name}</span>
                    {!p.is_active && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>Inactive</span>
                    )}
                    {!p.is_public && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>Hidden</span>
                    )}
                  </div>
                  {(p.description || p.features.length > 0) && (
                    <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>
                      {p.description}
                      {p.description && p.features.length > 0 ? " · " : ""}
                      {p.features.join(" · ")}
                    </div>
                  )}
                  <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>
                    {fmtNumber(p.active_members ?? 0)} active member{(p.active_members ?? 0) === 1 ? "" : "s"}
                  </div>
                </div>
                <span className="font-mono text-[15px] shrink-0" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                  {fmtMoney(p.price, p.currency)} <small className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>{perLabel(p)}</small>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="btn-ghost-v2 sm" onClick={() => { setEditingId(editingId === p._id ? null : p._id); setAdding(false); }}>
                    {editingId === p._id ? "Close" : "Edit"}
                  </button>
                  <button className="btn-ghost-v2 sm" disabled={setActive.isPending} onClick={() => void setActive.mutateAsync({ planId: p._id, active: !p.is_active })}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn-ghost-v2 sm" disabled={remove.isPending} onClick={() => onDelete(p)}>Delete</button>
                </div>
              </div>
              {editingId === p._id && (
                <div className="px-5.5 pb-4">
                  <EditPlanForm plan={p} orgId={orgId} onDone={() => setEditingId(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </GymDashboardShell>
  );
}

function EditPlanForm({ plan, orgId, onDone }: { plan: MarketplaceMembershipPlan; orgId: string | undefined; onDone: () => void }) {
  const update = useUpdateOrgMembershipPlan(orgId);
  const [error, setError] = useState<string | null>(null);
  const onSave = async (data: CreateOrgMembershipPlanRequest) => {
    setError(null);
    const res = await update.mutateAsync({ planId: plan._id, data });
    if (res.success) onDone();
    else setError(res.message || "Couldn't save the plan.");
  };
  return <PlanForm initial={plan} saving={update.isPending} error={error} defaultCurrency={plan.currency} onSubmit={(d) => void onSave(d)} onCancel={onDone} />;
}

function PlanForm({ initial, saving, error, defaultCurrency, onSubmit, onCancel, submitLabel = "Save plan" }: {
  initial?: MarketplaceMembershipPlan;
  saving: boolean;
  error?: string | null;
  defaultCurrency: string;
  onSubmit: (data: CreateOrgMembershipPlanRequest) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [planType, setPlanType] = useState<MembershipPlanType>(initial?.plan_type ?? MembershipPlanType.SUBSCRIPTION);
  const [duration, setDuration] = useState(initial?.duration_days ?? 30);
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [features, setFeatures] = useState((initial?.features ?? []).join(", "));
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const parsedPrice = Number(price);
    if (!name.trim()) return setLocalError("Give the plan a name.");
    if (price === "" || Number.isNaN(parsedPrice) || parsedPrice < 0) return setLocalError("Enter a valid price.");
    if (!Number.isInteger(duration) || duration < 1) return setLocalError("Duration must be at least 1 day.");
    setLocalError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      plan_type: planType,
      duration_days: duration,
      price: parsedPrice,
      currency: defaultCurrency,
      features: features.split(",").map((f) => f.trim()).filter(Boolean),
      is_public: isPublic,
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Plan name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="optional" className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Type</span>
          <select value={planType} onChange={(e) => setPlanType(e.target.value as MembershipPlanType)} className={INPUT_CLASS} style={INPUT_STYLE}>
            <option value={MembershipPlanType.SUBSCRIPTION}>Subscription</option>
            <option value={MembershipPlanType.ONE_TIME}>One-time</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Duration (days)</span>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 0)} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Price ({defaultCurrency})</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Visible on listing</span>
          <div className="flex items-center h-9">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          </div>
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Features (comma-separated)</span>
        <input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="24/7 access, group classes, guest passes" className={INPUT_CLASS} style={INPUT_STYLE} />
      </label>
      {(localError || error) && <p className="text-[12.5px]" style={{ color: "var(--danger, #b00020)" }}>{localError || error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary-v2 sm" disabled={saving} onClick={submit}>{saving ? "Saving…" : submitLabel}</button>
        <button className="btn-ghost-v2 sm" disabled={saving} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
