"use client";

import React, { useEffect, useRef, useState } from "react";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import {
  progressService,
  type ClientProfile,
  type DietPlan,
  type ProgressSummary,
  type Recommendation,
} from "@/lib/api/progress";
import { DietPlanDeliveryType, PlanStatus, RecommendationCategory } from "@/lib/types";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { templateToClientPlanPayload, isTemplatePlan } from "@/app/dashboard/dietitian/meal-plans/_lib";

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id !== null) {
    return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  }
  return "Client";
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  [RecommendationCategory.RECOVERY]: "Recovery",
  [RecommendationCategory.HYDRATION]: "Hydration",
  [RecommendationCategory.NUTRITION]: "Nutrition",
  [RecommendationCategory.LIFESTYLE]: "Lifestyle",
  [RecommendationCategory.EXERCISE]: "Exercise",
  [RecommendationCategory.GENERAL]: "General",
};

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

// ─── New plan from template modal ────────────────────────────────────────────

function TemplatePickerModal({
  profileId,
  onClose,
  onCreated,
}: {
  profileId: string;
  onClose: () => void;
  onCreated: (plan: DietPlan) => void;
}) {
  const [templates, setTemplates] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await progressService.getProviderDietPlans();
      if (!active) return;
      if (res.success && res.data) {
        // Only unassigned platform plans carry copyable content.
        setTemplates(
          res.data.filter(
            (p) =>
              isTemplatePlan(p) &&
              p.delivery_type === DietPlanDeliveryType.PLATFORM &&
              p.status === PlanStatus.ACTIVE,
          ),
        );
        setError(null);
      } else {
        setError(res.message || "We couldn't load your templates.");
      }
      setLoading(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async () => {
    const template = templates.find((t) => t._id === selected);
    if (!template) return;
    setCreating(true);
    const res = await progressService.createDietPlan(profileId, templateToClientPlanPayload(template));
    setCreating(false);
    if (res.success && res.data) {
      toast.success(`Plan "${template.title}" created for this client.`);
      onCreated(res.data);
      onClose();
    } else {
      toast.error(res.message ?? "Failed to create plan.");
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>New plan from template</h2>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            The client gets their own copy, later edits to the template won&apos;t affect it.
          </p>
        </div>
        <div className="p-6 flex flex-col gap-2">
          <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Template</label>
          {error ? (
            <div className="rounded-(--r-2) px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              {error}
            </div>
          ) : !loading && templates.length === 0 ? (
            <EmptySlate message="No templates yet." hint="Create one under Meal plans first." mt="mt-0" />
          ) : (
            <SearchableSelect
              value={selected}
              onChange={setSelected}
              options={templates.map((t) => ({
                label: `${t.title} · ${t.meals.length} meal${t.meals.length === 1 ? "" : "s"}`,
                value: t._id,
              }))}
              placeholder={loading ? "Loading templates…" : "Pick a template…"}
              loading={loading}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!selected || creating}
            className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            {creating ? "Creating..." : "Create plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New recommendation modal ────────────────────────────────────────────────

function NewRecommendationModal({
  profileId,
  onClose,
  onCreated,
}: {
  profileId: string;
  onClose: () => void;
  onCreated: (rec: Recommendation) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<RecommendationCategory>(RecommendationCategory.NUTRITION);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const res = await progressService.createRecommendation(profileId, {
      title: title.trim(),
      content: content.trim(),
      category,
    });
    setSaving(false);
    if (res.success && res.data) {
      toast.success("Recommendation sent.");
      onCreated(res.data);
      onClose();
    } else {
      toast.error(res.message ?? "Failed to create recommendation.");
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>New recommendation</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Title <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Increase daily protein"
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={fieldStyle}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Category</label>
            <SearchableSelect
              value={category}
              onChange={(v) => setCategory(v as RecommendationCategory)}
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ label, value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Recommendation <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should the client do, and why?"
              rows={4}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={fieldStyle}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !content.trim()}
              className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
            >
              {saving ? "Sending..." : "Send recommendation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DietitianSingleClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = React.use(params);
  const { fmtDate } = useOrgFormat();

  // Single-client summary (profile + weight + meals + activities in one call —
  // replaces the old fetch-all-summaries-and-find-one approach).
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-section state: diet plans + recommendations each load independently.
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [templateModal, setTemplateModal] = useState(false);
  const [recModal, setRecModal] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const [summaryRes, plansRes, recsRes] = await Promise.allSettled([
        progressService.getProgressSummary(clientId),
        progressService.getDietPlans(clientId),
        progressService.getRecommendations(clientId),
      ]);
      if (!active) return;

      if (summaryRes.status === "fulfilled" && summaryRes.value.success && summaryRes.value.data) {
        setSummary(summaryRes.value.data);
        setError(null);
      } else {
        setError(
          (summaryRes.status === "fulfilled" && summaryRes.value.message) ||
            "We couldn't load this client. Try again shortly.",
        );
      }
      setLoading(false);

      if (plansRes.status === "fulfilled" && plansRes.value.success && plansRes.value.data) {
        setPlans(plansRes.value.data);
        setPlansError(null);
      } else {
        setPlansError(
          (plansRes.status === "fulfilled" && plansRes.value.message) || "Couldn't load diet plans.",
        );
      }
      setPlansLoading(false);

      if (recsRes.status === "fulfilled" && recsRes.value.success && recsRes.value.data) {
        setRecs(recsRes.value.data);
        setRecsError(null);
      } else {
        setRecsError(
          (recsRes.status === "fulfilled" && recsRes.value.message) || "Couldn't load recommendations.",
        );
      }
      setRecsLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [clientId]);

  const client = summary?.profile ?? null;
  const name = client ? clientName(client) : "Client";

  const latestWeight = summary?.weight.latest_kg ?? null;
  const startWeight = summary?.weight.starting_kg ?? client?.starting_weight_kg ?? null;
  const targetWeight = summary?.weight.target_kg ?? client?.target_weight_kg ?? null;
  const weightDelta = summary?.weight.change_kg ?? null;
  const activePlans = plans.filter((p) => p.status === PlanStatus.ACTIVE).length;

  const kpis = summary
    ? [
        {
          label: "Current weight",
          value: latestWeight != null ? `${latestWeight} kg` : "-",
          delta: startWeight != null ? `from ${startWeight} kg` : "No baseline",
        },
        {
          label: "Weight change",
          value: weightDelta != null ? `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg` : "-",
          delta: targetWeight != null ? `target ${targetWeight} kg` : "No target set",
        },
        {
          label: `Meals · ${summary.period_days}d`,
          value: String(summary.meals.total_count),
          delta: `${summary.activities.total_count} activities`,
        },
        {
          label: "Diet plans",
          value: plansLoading ? "-" : String(plans.length),
          delta: plansLoading ? "Loading…" : `${activePlans} active`,
        },
      ]
    : [];

  return (
    <DietitianDashboardShell activeItem="Clients" crumb={client ? name : "Client"}>
      {loading && !client ? (
        <AsyncSpinner size="page" label="Loading client" />
      ) : error || !client ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load client</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error ?? "Client not found."}</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
            <span className="w-[64px] h-[64px] rounded-(--r-3) flex-shrink-0 flex items-center justify-center text-[20px] font-semibold" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>{initials(name)}</span>
            <div className="flex-1">
              <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>{name}</h1>
              <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
                {client.is_active ? "Active client" : "Paused"} &middot; joined {fmtDate(client.created_at)}
              </p>
            </div>
            {typeof client.client_id === "object" && client.client_id?._id && (
              <StartConversationButton
                recipientUserId={client.client_id._id}
                messagesHref="/dashboard/dietitian/messages"
                label="Message"
                className="btn-primary-v2 sm"
              />
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
                <div className="text-[24px] font-medium tracking-[-0.02em] tabular-nums mt-1" style={{ color: "var(--ink)" }}>{k.value}</div>
                <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Goals + Notes */}
          <div className="grid lg:grid-cols-[1fr_1fr] gap-3.5">
            <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Goals</h3>
              {client.goals.length === 0 ? (
                <EmptySlate message="No goals recorded." mt="mt-0" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {client.goals.map((g) => (
                    <span key={g} className="inline-flex items-center px-2.5 py-1 rounded-(--r-1) text-[12.5px]" style={{ background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--border)" }}>{g}</span>
                  ))}
                </div>
              )}
              {client.height_cm != null && (
                <div className="mt-4 font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>Height · {client.height_cm} cm</div>
              )}
            </div>

            <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Notes</h3>
              {client.notes ? (
                <div className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{client.notes}</div>
              ) : (
                <EmptySlate message="No notes yet." mt="mt-0" />
              )}
            </div>
          </div>

          {/* Diet plans */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Diet plans</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                  {plansLoading ? "Loading…" : `${plans.length} plan${plans.length === 1 ? "" : "s"} · ${activePlans} active`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModal(true)}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.5 rounded-(--r-1)"
                style={{ border: "1px solid var(--border)", color: "var(--dietitian)", background: "transparent" }}
              >
                + New plan from template
              </button>
            </div>
            {plansLoading ? (
              <div className="px-5.5 py-5"><AsyncSpinner label="Loading diet plans" /></div>
            ) : plansError ? (
              <div className="px-5.5 py-4 text-[13px]" style={{ color: "var(--danger)" }}>{plansError}</div>
            ) : plans.length === 0 ? (
              <div className="px-5.5 py-4"><EmptySlate message="No diet plans yet." hint="Create one from a template above." mt="mt-0" /></div>
            ) : (
              plans.map((p, i, arr) => (
                <div key={p._id} className="flex items-center gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{p.title}</div>
                    <div className="font-mono text-[11.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {p.delivery_type === DietPlanDeliveryType.DOCUMENT
                        ? `Document${p.document_file_name ? ` · ${p.document_file_name}` : ""}`
                        : `${p.meals.length} meal${p.meals.length === 1 ? "" : "s"}`}
                      {" · "}assigned {fmtDate(p.assigned_at)}
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full"
                    style={{
                      background: p.status === PlanStatus.ACTIVE ? "var(--signal-soft)" : "var(--bg-2)",
                      color: p.status === PlanStatus.ACTIVE ? "var(--signal-ink)" : "var(--fg-3)",
                    }}
                  >
                    {p.status === PlanStatus.ACTIVE ? "Active" : "Paused"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Recommendations */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Recommendations</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                  {recsLoading ? "Loading…" : `${recs.length} sent`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecModal(true)}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.5 rounded-(--r-1)"
                style={{ border: "1px solid var(--border)", color: "var(--dietitian)", background: "transparent" }}
              >
                + New recommendation
              </button>
            </div>
            {recsLoading ? (
              <div className="px-5.5 py-5"><AsyncSpinner label="Loading recommendations" /></div>
            ) : recsError ? (
              <div className="px-5.5 py-4 text-[13px]" style={{ color: "var(--danger)" }}>{recsError}</div>
            ) : recs.length === 0 ? (
              <div className="px-5.5 py-4"><EmptySlate message="No recommendations yet." hint="Send targeted guidance the client sees in their app." mt="mt-0" /></div>
            ) : (
              recs.map((r, i, arr) => (
                <div key={r._id} className="px-5.5 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{r.title}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>
                      {CATEGORY_LABELS[r.category] ?? r.category}
                    </span>
                    {!r.is_active && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}>Inactive</span>
                    )}
                  </div>
                  <div className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>{r.content}</div>
                  <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>{fmtDate(r.created_at)}</div>
                </div>
              ))
            )}
          </div>

          {templateModal && (
            <TemplatePickerModal
              profileId={clientId}
              onClose={() => setTemplateModal(false)}
              onCreated={(plan) => setPlans((p) => [plan, ...p])}
            />
          )}
          {recModal && (
            <NewRecommendationModal
              profileId={clientId}
              onClose={() => setRecModal(false)}
              onCreated={(rec) => setRecs((r) => [rec, ...r])}
            />
          )}
        </>
      )}
    </DietitianDashboardShell>
  );
}
