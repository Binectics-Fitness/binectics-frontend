"use client";

import { useEffect, useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { adminService, type AdminPlan, type UpdateAdminPlan } from "@/lib/api/admin";

type QuotaKey =
  | "max_active_members"
  | "max_membership_plans"
  | "max_staff_members"
  | "max_listings";

type FeatureKey =
  | "analytics_enabled"
  | "consultations_enabled"
  | "journals_enabled"
  | "qr_checkin_enabled"
  | "white_label_enabled"
  | "custom_domain_enabled"
  | "branded_email_enabled";

const QUOTAS: { key: QuotaKey; label: string }[] = [
  { key: "max_active_members", label: "Active members" },
  { key: "max_membership_plans", label: "Membership plans" },
  { key: "max_staff_members", label: "Staff seats" },
  { key: "max_listings", label: "Listings" },
];

const FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "analytics_enabled", label: "Analytics" },
  { key: "consultations_enabled", label: "Consultations" },
  { key: "journals_enabled", label: "Client journals" },
  { key: "qr_checkin_enabled", label: "QR check-in" },
  { key: "white_label_enabled", label: "White-label branding" },
  { key: "custom_domain_enabled", label: "Custom domain" },
  { key: "branded_email_enabled", label: "Branded email" },
];

const EDITABLE_KEYS: (keyof UpdateAdminPlan)[] = [
  "name",
  "is_active",
  ...QUOTAS.map((q) => q.key),
  ...FEATURES.map((f) => f.key),
];

const labelClass = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

function isDirty(draft: AdminPlan, original: AdminPlan): boolean {
  return EDITABLE_KEYS.some((k) => draft[k as keyof AdminPlan] !== original[k as keyof AdminPlan]);
}

function editablePatch(draft: AdminPlan): UpdateAdminPlan {
  const patch: UpdateAdminPlan = {};
  for (const k of EDITABLE_KEYS) {
    // @ts-expect-error — keys are a known subset of AdminPlan
    patch[k] = draft[k as keyof AdminPlan];
  }
  return patch;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AdminPlan>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await adminService.listPlans();
        if (!active) return;
        if (res.success && res.data) {
          const sorted = [...res.data].sort((a, b) => a.sort_order - b.sort_order);
          setPlans(sorted);
          setDrafts(Object.fromEntries(sorted.map((p) => [p._id, { ...p }])));
          setError(null);
        } else {
          setError(res.message || "We couldn't load the plans.");
        }
      } catch {
        if (active) setError("We couldn't load the plans. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  function patchDraft(id: string, partial: Partial<AdminPlan>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...partial } }));
  }

  async function save(plan: AdminPlan) {
    const draft = drafts[plan._id];
    if (!draft || savingId) return;
    setSavingId(plan._id);
    try {
      const res = await adminService.updatePlan(plan._id, editablePatch(draft));
      if (res.success && res.data) {
        setPlans((prev) => prev.map((p) => (p._id === plan._id ? res.data! : p)));
        setDrafts((prev) => ({ ...prev, [plan._id]: { ...res.data! } }));
        toast.success(`${res.data.name} saved.`);
      } else {
        toast.error(res.message || "Couldn't save the plan.");
      }
    } catch {
      toast.error("Couldn't save the plan.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminDashboardShell activeItem="Plans" crumb="Plans">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
          Plans &amp; billing
        </h1>
        <p className="text-[13.5px] mt-1.5 max-w-[64ch]" style={{ color: "var(--fg-3)" }}>
          Quotas and feature flags for each provider SaaS tier. Leave a quota blank for unlimited. Changes apply to future
          enforcement immediately; existing subscriptions keep their tier.
        </p>
      </div>

      {error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load plans</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading ? (
        <AsyncSpinner size="page" label="Loading plans" />
      ) : plans.length === 0 && !error ? (
        <div className="rounded-(--r-3) px-4.5 py-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <EmptySlate message="No plans configured." mt="mt-0" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => {
            const draft = drafts[plan._id] ?? plan;
            const dirty = isDirty(draft, plan);
            const saving = savingId === plan._id;
            return (
              <section
                key={plan._id}
                className="rounded-(--r-3) p-5"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      value={draft.name}
                      aria-label={`${plan.code} plan name`}
                      onChange={(e) => patchDraft(plan._id, { name: e.target.value })}
                      className="text-[18px] font-medium rounded-(--r-2) px-2 py-1"
                      style={{ color: "var(--ink)", background: "var(--bg)", border: "1px solid transparent" }}
                      onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--border-2)")}
                      onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-(--r-1) px-1.5 py-0.5" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>
                      {plan.code}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px]" style={{ color: "var(--fg-2)" }}>
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) => patchDraft(plan._id, { is_active: e.target.checked })}
                    />
                    Active (selectable by providers)
                  </label>
                </div>

                {/* Quotas */}
                <div className="mt-4">
                  <div className={labelClass} style={{ color: "var(--fg-3)" }}>Quotas</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {QUOTAS.map((q) => {
                      const val = draft[q.key];
                      return (
                        <div key={q.key} className="flex flex-col gap-1">
                          <label htmlFor={`${plan._id}-${q.key}`} className="text-[12px]" style={{ color: "var(--fg-2)" }}>{q.label}</label>
                          <input
                            id={`${plan._id}-${q.key}`}
                            type="number"
                            min={0}
                            value={val === null || val === undefined ? "" : val}
                            placeholder="Unlimited"
                            onChange={(e) =>
                              patchDraft(plan._id, {
                                // Round: the API's @IsInt() rejects decimals.
                                [q.key]: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value) || 0)),
                              } as Partial<AdminPlan>)
                            }
                            className="rounded-(--r-2) px-3 py-2 text-[14px]"
                            style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontVariantNumeric: "tabular-nums" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11.5px] mt-1.5" style={{ color: "var(--fg-4)" }}>Blank = unlimited.</p>
                </div>

                {/* Features */}
                <div className="mt-4">
                  <div className={labelClass} style={{ color: "var(--fg-3)" }}>Features</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {FEATURES.map((f) => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer text-[13.5px]" style={{ color: "var(--ink)" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(draft[f.key])}
                          onChange={(e) => patchDraft(plan._id, { [f.key]: e.target.checked } as Partial<AdminPlan>)}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-5">
                  {dirty && !saving && (
                    <button
                      type="button"
                      onClick={() => setDrafts((prev) => ({ ...prev, [plan._id]: { ...plan } }))}
                      className="btn-ghost-v2 sm"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void save(plan)}
                    disabled={!dirty || saving}
                    className="btn-primary-v2 sm disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminDashboardShell>
  );
}
