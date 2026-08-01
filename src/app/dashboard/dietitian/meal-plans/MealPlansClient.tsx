"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { DietPlanDeliveryType, PlanStatus, MealSlot } from "@/lib/types";
import {
  progressService,
  type ClientProfile,
  type CreateDietPlanRequest,
  type UpdateDietPlanRequest,
  type DietPlan,
} from "@/lib/api/progress";
import {
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ORDER,
  type MealFormRow,
  emptyMealRow,
  mealRowsToRequests,
  planToMealRows,
  templateToClientPlanPayload,
  planTotalCalories,
  isTemplatePlan,
} from "./_lib";

// ─── Shared bits ─────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
      {children}
    </label>
  );
}

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id !== null) {
    return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  }
  return "Client";
}

function planClientName(plan: DietPlan): string | null {
  if (typeof plan.client_id === "object" && plan.client_id !== null) {
    return `${plan.client_id.first_name} ${plan.client_id.last_name}`.trim();
  }
  return null;
}

// ─── Plan form modal (create + edit) ────────────────────────────────────────

type ModalMode = "create" | "edit";

interface PlanFormState {
  title: string;
  description: string;
  dietitian_notes: string;
  meals: MealFormRow[];
}

const EMPTY_FORM: PlanFormState = {
  title: "",
  description: "",
  dietitian_notes: "",
  meals: [emptyMealRow(MealSlot.BREAKFAST)],
};

function PlanFormModal({
  mode,
  initial,
  isDocumentPlan,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  initial: PlanFormState;
  /** Document-based plans keep their content in the attached file — no meal builder. */
  isDocumentPlan: boolean;
  onClose: () => void;
  onSave: (form: PlanFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<PlanFormState>(initial);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const setMeal = (index: number, patch: Partial<MealFormRow>) =>
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));

  const addMeal = () =>
    setForm((f) => ({
      ...f,
      meals: [
        ...f.meals,
        emptyMealRow(MEAL_SLOT_ORDER[Math.min(f.meals.length, MEAL_SLOT_ORDER.length - 1)]),
      ],
    }));

  const removeMeal = (index: number) =>
    setForm((f) => ({ ...f, meals: f.meals.filter((_, i) => i !== index) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
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
        className="w-full max-w-2xl rounded-(--r-3) overflow-y-auto max-h-[90vh]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            {mode === "create" ? "New meal plan" : "Edit meal plan"}
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
            <FieldLabel>
              Plan title <span style={{ color: "var(--danger)" }}>*</span>
            </FieldLabel>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 1,800 kcal Mediterranean week"
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={fieldStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What this plan is for and who it suits"
              rows={2}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={fieldStyle}
            />
          </div>

          {isDocumentPlan ? (
            <div
              className="rounded-(--r-2) px-3.5 py-3 text-[12.5px]"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-3)", lineHeight: 1.5 }}
            >
              This is a document-based plan — its meal content lives in the attached file, so only the details above and notes below can be edited here.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <FieldLabel>Meals</FieldLabel>
                <button
                  type="button"
                  onClick={addMeal}
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
                  style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                >
                  + Add meal
                </button>
              </div>
              {form.meals.length === 0 && (
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  No meals yet — you can add them now or later.
                </div>
              )}
              {form.meals.map((meal, i) => (
                <div key={i} className="rounded-(--r-2) p-3.5 flex flex-col gap-2.5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-[160px] shrink-0">
                      <SearchableSelect
                        value={meal.meal_type}
                        onChange={(v) => setMeal(i, { meal_type: v as MealSlot })}
                        options={MEAL_SLOT_ORDER.map((s) => ({ label: MEAL_SLOT_LABELS[s], value: s }))}
                      />
                    </div>
                    <input
                      value={meal.title}
                      onChange={(e) => setMeal(i, { title: e.target.value })}
                      placeholder="Meal title, e.g. Greek yogurt bowl"
                      className="h-9 flex-1 rounded-(--r-2) px-3 text-[13.5px]"
                      style={{ ...fieldStyle, background: "var(--bg)" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeMeal(i)}
                      aria-label="Remove meal"
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-(--r-2)"
                      style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_110px] gap-2">
                    <input
                      value={meal.foods}
                      onChange={(e) => setMeal(i, { foods: e.target.value })}
                      placeholder="Foods, comma-separated — oats, banana, almond milk"
                      className="h-9 rounded-(--r-2) px-3 text-[13px]"
                      style={{ ...fieldStyle, background: "var(--bg)" }}
                    />
                    <input
                      type="number"
                      min={0}
                      value={meal.calories}
                      onChange={(e) => setMeal(i, { calories: e.target.value })}
                      placeholder="kcal"
                      className="h-9 rounded-(--r-2) px-3 text-[13px]"
                      style={{ ...fieldStyle, background: "var(--bg)", fontVariantNumeric: "tabular-nums" }}
                    />
                  </div>
                  <input
                    value={meal.notes}
                    onChange={(e) => setMeal(i, { notes: e.target.value })}
                    placeholder="Notes (optional)"
                    className="h-9 rounded-(--r-2) px-3 text-[13px]"
                    style={{ ...fieldStyle, background: "var(--bg)" }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Dietitian notes</FieldLabel>
            <textarea
              value={form.dietitian_notes}
              onChange={(e) => setForm((f) => ({ ...f, dietitian_notes: e.target.value }))}
              placeholder="Guidance shown alongside the plan"
              rows={2}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={fieldStyle}
            />
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

// ─── Assign-to-client modal ──────────────────────────────────────────────────

export function AssignPlanModal({
  plan,
  onClose,
  onAssigned,
}: {
  plan: DietPlan;
  onClose: () => void;
  onAssigned?: (created: DietPlan) => void;
}) {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [assigning, setAssigning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await progressService.getMyClientProfiles();
      if (!active) return;
      if (res.success && res.data) {
        setClients(res.data.filter((c) => c.is_active));
        setClientsError(null);
      } else {
        setClientsError(res.message || "We couldn't load your clients.");
      }
      setLoadingClients(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    const res = await progressService.createDietPlan(selected, templateToClientPlanPayload(plan));
    setAssigning(false);
    if (res.success && res.data) {
      const target = clients.find((c) => c._id === selected);
      toast.success(`"${plan.title}" assigned to ${target ? clientName(target) : "client"}.`);
      onAssigned?.(res.data);
      onClose();
    } else {
      toast.error(res.message ?? "Failed to assign plan.");
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="w-full max-w-md rounded-(--r-3)"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>Assign to client</h2>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            Creates a copy of &ldquo;{plan.title}&rdquo; as the client&apos;s own plan.
          </p>
        </div>
        <div className="p-6 flex flex-col gap-2">
          <FieldLabel>Client</FieldLabel>
          {clientsError ? (
            <div className="rounded-(--r-2) px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              {clientsError}
            </div>
          ) : !loadingClients && clients.length === 0 ? (
            <EmptySlate message="No active clients yet." hint="Add a client first, then assign plans." mt="mt-0" />
          ) : (
            <SearchableSelect
              value={selected}
              onChange={setSelected}
              options={clients.map((c) => ({ label: clientName(c), value: c._id }))}
              placeholder={loadingClients ? "Loading clients…" : "Pick a client…"}
              loading={loadingClients}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selected || assigning}
            className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            {assigning ? "Assigning..." : "Assign plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan card ───────────────────────────────────────────────────────────────

function MealPlanCard({
  plan,
  onEdit,
  onAssign,
  onArchive,
  onToggle,
  fmtDate,
}: {
  plan: DietPlan;
  onEdit: () => void;
  onAssign: () => void;
  onArchive: () => void;
  onToggle: () => void;
  fmtDate: (d: string | Date) => string;
}) {
  const template = isTemplatePlan(plan);
  const isDocument = plan.delivery_type === DietPlanDeliveryType.DOCUMENT;
  const calories = planTotalCalories(plan);
  const assignedName = planClientName(plan);

  return (
    <div className="rounded-(--r-3) flex flex-col overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="px-5.5 pt-5 pb-3.5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full"
            style={{
              background: template ? "var(--dietitian-soft)" : "var(--trainer-soft)",
              color: template ? "var(--dietitian)" : "oklch(0.42 0.13 75)",
            }}
          >
            {template ? "Template" : assignedName ? `Assigned · ${assignedName}` : "Assigned"}
          </span>
          {isDocument && (
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}>
              Document
            </span>
          )}
        </div>
        <div className="text-[16px] font-medium mt-1.5 truncate" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>{plan.title}</div>
        {plan.description && (
          <div className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>{plan.description}</div>
        )}
      </div>

      <div className="grid grid-cols-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div className="py-3 px-5.5" style={{ borderRight: "1px solid var(--border)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Meals</div>
          <div className="text-[15px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {isDocument ? "—" : plan.meals.length}
          </div>
        </div>
        <div className="py-3 px-5.5" style={{ borderRight: "1px solid var(--border)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Calories</div>
          <div className="text-[15px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {calories != null ? calories.toLocaleString() : "—"}
          </div>
        </div>
        <div className="py-3 px-5.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Status</div>
          <div className="text-[13px] font-medium mt-0.5" style={{ color: plan.status === PlanStatus.ACTIVE ? "var(--signal-ink)" : "var(--fg-3)" }}>
            {plan.status === PlanStatus.ACTIVE ? "Live" : "Paused"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-5.5 py-3 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={onEdit}
            className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
            style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
          >
            Edit
          </button>
          {!isDocument && (
            <button
              type="button"
              onClick={onAssign}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
              style={{ border: "1px solid var(--border)", color: "var(--dietitian)", background: "transparent" }}
            >
              Assign
            </button>
          )}
          <button
            type="button"
            onClick={onArchive}
            className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
            style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "transparent" }}
          >
            Archive
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>{fmtDate(plan.updated_at)}</span>
          <button
            type="button"
            onClick={onToggle}
            className="w-[30px] h-[18px] rounded-full relative cursor-pointer"
            aria-label={plan.status === PlanStatus.ACTIVE ? "Pause plan" : "Activate plan"}
            style={{ background: plan.status === PlanStatus.ACTIVE ? "var(--ink)" : "var(--border-2)" }}
          >
            <span
              className="absolute w-3.5 h-3.5 rounded-full top-0.5"
              style={{ background: "var(--bg)", left: plan.status === PlanStatus.ACTIVE ? "14px" : "2px", transition: "left 120ms" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Filter = "All" | "Templates" | "Assigned";

export default function MealPlansClient({ initialCreateOpen = false }: { initialCreateOpen?: boolean }) {
  const { fmtDate } = useOrgFormat();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [modal, setModal] = useState<{ mode: ModalMode; plan?: DietPlan } | null>(
    initialCreateOpen ? { mode: "create" } : null,
  );
  const [assignPlan, setAssignPlan] = useState<DietPlan | null>(null);
  const router = useRouter();

  // ?new=1 opened the create modal once; drop it from the URL so a
  // refresh or a shared link doesn't reopen an empty form.
  useEffect(() => {
    if (initialCreateOpen) router.replace("/dashboard/dietitian/meal-plans", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const res = await progressService.getProviderDietPlans();
      if (!active) return;
      if (res.success && res.data) {
        setPlans(res.data);
        setError(null);
      } else {
        setError(res.message || "We couldn't load your meal plans. Try again shortly.");
      }
      setLoading(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      All: plans.length,
      Templates: plans.filter(isTemplatePlan).length,
      Assigned: plans.filter((p) => !isTemplatePlan(p)).length,
    }),
    [plans],
  );

  const filtered = useMemo(() => {
    if (filter === "Templates") return plans.filter(isTemplatePlan);
    if (filter === "Assigned") return plans.filter((p) => !isTemplatePlan(p));
    return plans;
  }, [plans, filter]);

  const buildPayload = (form: PlanFormState): CreateDietPlanRequest => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    delivery_type: DietPlanDeliveryType.PLATFORM,
    meals: mealRowsToRequests(form.meals),
    dietitian_notes: form.dietitian_notes.trim() || undefined,
  });

  const handleCreate = async (form: PlanFormState) => {
    const res = await progressService.createStandaloneDietPlan(buildPayload(form));
    if (res.success && res.data) {
      setPlans((p) => [res.data!, ...p]);
      setModal(null);
      toast.success("Meal plan created.");
    } else {
      toast.error(res.message ?? "Failed to create meal plan.");
    }
  };

  const handleEdit = async (form: PlanFormState) => {
    const plan = modal?.plan;
    if (!plan) return;
    const isDocument = plan.delivery_type === DietPlanDeliveryType.DOCUMENT;
    const data: UpdateDietPlanRequest = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      dietitian_notes: form.dietitian_notes.trim() || undefined,
      // Document plans keep their content in the file — never overwrite meals.
      ...(isDocument ? {} : { meals: mealRowsToRequests(form.meals) }),
    };
    const res = await progressService.updateStandaloneDietPlan(plan._id, data);
    if (res.success && res.data) {
      // Merge over the existing item: the PATCH response does not populate
      // client_id, so a wholesale replace drops the "Assigned · Name" badge.
      setPlans((p) =>
        p.map((pl) =>
          pl._id === res.data!._id ? { ...pl, ...res.data!, client_id: pl.client_id } : pl,
        ),
      );
      setModal(null);
      toast.success("Meal plan updated.");
    } else {
      toast.error(res.message ?? "Failed to update meal plan.");
    }
  };

  const handleToggle = async (plan: DietPlan) => {
    const nextStatus = plan.status === PlanStatus.ACTIVE ? PlanStatus.INACTIVE : PlanStatus.ACTIVE;
    const res = await progressService.updateStandaloneDietPlan(plan._id, { status: nextStatus });
    if (res.success && res.data) {
      setPlans((p) =>
        p.map((pl) =>
          pl._id === res.data!._id ? { ...pl, ...res.data!, client_id: pl.client_id } : pl,
        ),
      );
    } else {
      toast.error(res.message ?? "Failed to update plan status.");
    }
  };

  const handleArchive = async (plan: DietPlan) => {
    if (!confirm(`Archive "${plan.title}"? It will disappear from this list.`)) return;
    const res = await progressService.archiveStandaloneDietPlan(plan._id);
    if (res.success) {
      setPlans((p) => p.filter((pl) => pl._id !== plan._id));
      toast.success("Meal plan archived.");
    } else {
      toast.error(res.message ?? "Failed to archive meal plan.");
    }
  };

  const FILTERS: Filter[] = ["All", "Templates", "Assigned"];

  return (
    <DietitianDashboardShell activeItem="Meal plans" crumb="Meal plans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Meal plans</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {loading
              ? "Loading..."
              : `${counts.Templates} template${counts.Templates === 1 ? "" : "s"} · ${counts.Assigned} assigned`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="btn-signal-v2 inline-flex items-center gap-2 self-start sm:self-auto"
          style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New meal plan
        </button>
      </div>

      {error && (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load meal plans</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: filter === f ? "var(--ink)" : "var(--bg)",
                color: filter === f ? "var(--bg)" : "var(--fg-3)",
                border: filter === f ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f} <span style={{ color: filter === f ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <AsyncSpinner size="page" label="Loading meal plans" />
      ) : !error && plans.length === 0 ? (
        <div className="rounded-(--r-3) flex flex-col items-center justify-center gap-3 py-16 mt-2" style={{ border: "1.5px dashed var(--border-2)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
          <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>No meal plans yet</div>
          <div className="text-[13px] text-center" style={{ color: "var(--fg-3)", maxWidth: "34ch", lineHeight: 1.5 }}>
            Build a reusable template, then assign copies to your clients from here or from a client&apos;s page.
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="mt-1 h-9 px-5 rounded-(--r-2) text-[13px] font-medium"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            Create first meal plan
          </button>
        </div>
      ) : !error && filtered.length === 0 ? (
        <EmptySlate message={`No ${filter.toLowerCase()} plans.`} mt="mt-2" />
      ) : !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((plan) => (
            <MealPlanCard
              key={plan._id}
              plan={plan}
              fmtDate={fmtDate}
              onEdit={() => setModal({ mode: "edit", plan })}
              onAssign={() => setAssignPlan(plan)}
              onArchive={() => handleArchive(plan)}
              onToggle={() => handleToggle(plan)}
            />
          ))}
        </div>
      ) : null}

      {!loading && !error && counts.Assigned > 0 && (
        <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          Assigned plans belong to a client — open the client from{" "}
          <Link href="/dashboard/dietitian/clients" className="underline" style={{ color: "var(--ink)" }}>Clients</Link>{" "}
          to manage them in context.
        </p>
      )}

      {modal && (
        <PlanFormModal
          mode={modal.mode}
          isDocumentPlan={modal.plan?.delivery_type === DietPlanDeliveryType.DOCUMENT}
          initial={
            modal.plan
              ? {
                  title: modal.plan.title,
                  description: modal.plan.description ?? "",
                  dietitian_notes: modal.plan.dietitian_notes ?? "",
                  meals: planToMealRows(modal.plan),
                }
              : EMPTY_FORM
          }
          onClose={() => setModal(null)}
          onSave={modal.mode === "create" ? handleCreate : handleEdit}
        />
      )}

      {assignPlan && (
        <AssignPlanModal
          plan={assignPlan}
          onClose={() => setAssignPlan(null)}
          onAssigned={(created) => setPlans((p) => [created, ...p])}
        />
      )}
    </DietitianDashboardShell>
  );
}
