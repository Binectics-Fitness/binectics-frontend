"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { progressService, type ClientProfile, type DietPlan } from "@/lib/api/progress";
import type { ProgramsRoleConfig } from "./config";
import {
  programsService,
  type ProgramTemplate,
  type ProgramComponentType,
  type ProgramCadence,
  type GoalDirection,
  type ProgramInstance,
} from "@/lib/api/programs";
import {
  COMPONENT_TYPE_LABELS,
  COMPONENT_TYPE_ORDER,
  CADENCE_LABELS,
  CADENCE_ORDER,
  DIRECTION_LABELS,
  DIRECTION_ORDER,
  INTENSITY_OPTIONS,
  EMPTY_PROGRAM_FORM,
  emptyPhaseRow,
  emptyBlockRow,
  emptyGoalRow,
  formToPayload,
  versionToForm,
  type ProgramFormState,
  type PhaseFormRow,
  type BlockFormRow,
  type GoalFormRow,
} from "./mapper";

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

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-(--r-2) disabled:opacity-30"
      style={{ color: "var(--fg-3)", border: "1px solid var(--border)", background: "transparent" }}
    >
      {children}
    </button>
  );
}

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id !== null) {
    return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  }
  return "Client";
}

function instanceClientName(i: ProgramInstance): string {
  if (typeof i.client_id === "object" && i.client_id !== null) {
    return `${i.client_id.first_name} ${i.client_id.last_name}`.trim();
  }
  return "Client";
}

/** A template has editable, not-yet-published work when its draft is ahead. */
function hasUnpublishedDraft(t: ProgramTemplate): boolean {
  return t.status !== "archived" && t.latest_version_no > t.latest_published_version_no;
}

// ─── Builder modal (create + edit) ───────────────────────────────────────────

type ModalMode = "create" | "edit";

function ProgramFormModal({
  mode,
  initial,
  loading,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  initial: ProgramFormState;
  loading: boolean;
  onClose: () => void;
  onSave: (form: ProgramFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<ProgramFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [mealPlans, setMealPlans] = useState<{ label: string; value: string }[]>([]);
  const [mealPlansLoading, setMealPlansLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { requestClose, dirtyProps, confirmationModal } = useUnsavedChangesGuard(onClose);

  // Reusable meal-plan templates a meal_plan task can link to. Templates only
  // (no client copy) — filtered by having no client attached.
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await progressService.getProviderDietPlans();
      if (!active) return;
      if (res.success && res.data) {
        setMealPlans(
          res.data
            .filter((p: DietPlan) => !p.client_profile_id && !p.client_id)
            .map((p) => ({ label: p.title, value: p._id })),
        );
      }
      setMealPlansLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // ── Phase mutations ──
  const setPhase = (pi: number, patch: Partial<PhaseFormRow>) =>
    setForm((f) => ({ ...f, phases: f.phases.map((p, i) => (i === pi ? { ...p, ...patch } : p)) }));
  const addPhase = () => setForm((f) => ({ ...f, phases: [...f.phases, emptyPhaseRow()] }));
  const removePhase = (pi: number) =>
    setForm((f) => ({ ...f, phases: f.phases.filter((_, i) => i !== pi) }));
  const movePhase = (pi: number, dir: -1 | 1) =>
    setForm((f) => {
      const to = pi + dir;
      if (to < 0 || to >= f.phases.length) return f;
      const phases = [...f.phases];
      [phases[pi], phases[to]] = [phases[to], phases[pi]];
      return { ...f, phases };
    });

  // ── Block mutations ──
  const setBlock = (pi: number, bi: number, patch: Partial<BlockFormRow>) =>
    setForm((f) => ({
      ...f,
      phases: f.phases.map((p, i) =>
        i !== pi ? p : { ...p, blocks: p.blocks.map((b, j) => (j === bi ? { ...b, ...patch } : b)) },
      ),
    }));
  const addBlock = (pi: number) =>
    setForm((f) => ({
      ...f,
      phases: f.phases.map((p, i) => (i === pi ? { ...p, blocks: [...p.blocks, emptyBlockRow()] } : p)),
    }));
  const removeBlock = (pi: number, bi: number) =>
    setForm((f) => ({
      ...f,
      phases: f.phases.map((p, i) =>
        i !== pi ? p : { ...p, blocks: p.blocks.filter((_, j) => j !== bi) },
      ),
    }));

  // ── Goal mutations ──
  const setGoal = (gi: number, patch: Partial<GoalFormRow>) =>
    setForm((f) => ({ ...f, goals: f.goals.map((g, i) => (i === gi ? { ...g, ...patch } : g)) }));
  const addGoal = () => setForm((f) => ({ ...f, goals: [...f.goals, emptyGoalRow()] }));
  const removeGoal = (gi: number) =>
    setForm((f) => ({ ...f, goals: f.goals.filter((_, i) => i !== gi) }));

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
      onClick={(e) => e.target === overlayRef.current && requestClose()}
    >
      {confirmationModal}
      <div
        className="w-full max-w-3xl rounded-(--r-3) overflow-y-auto max-h-[92vh]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
        {...dirtyProps}
      >
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            {mode === "create" ? "New program" : "Edit program"}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="w-7 h-7 flex items-center justify-center rounded-(--r-2)"
            style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <AsyncSpinner size="page" label="Loading program" />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
            {/* Meta */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Program name <span style={{ color: "var(--danger)" }}>*</span></FieldLabel>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 12-week gut reset"
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={fieldStyle}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Category</FieldLabel>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Gut health"
                  className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                  style={fieldStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Intensity</FieldLabel>
                <SearchableSelect
                  value={form.intensity}
                  onChange={(v) => setForm((f) => ({ ...f, intensity: v }))}
                  options={INTENSITY_OPTIONS.map((o) => ({ label: o[0].toUpperCase() + o.slice(1), value: o }))}
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Total days</FieldLabel>
                <input
                  type="number"
                  min={1}
                  value={form.duration_days}
                  onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))}
                  placeholder="Optional"
                  className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                  style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Goal statement</FieldLabel>
              <textarea
                value={form.goal_statement}
                onChange={(e) => setForm((f) => ({ ...f, goal_statement: e.target.value }))}
                placeholder="What this program is designed to achieve"
                rows={2}
                className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
                style={fieldStyle}
              />
            </div>

            {/* Phases */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <FieldLabel>Phases</FieldLabel>
                <button
                  type="button"
                  onClick={addPhase}
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
                  style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                >
                  + Add phase
                </button>
              </div>

              {form.phases.map((phase, pi) => (
                <div key={pi} className="rounded-(--r-2) p-3.5 flex flex-col gap-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tabular-nums w-5 shrink-0" style={{ color: "var(--fg-4)" }}>{pi + 1}</span>
                    <input
                      value={phase.name}
                      onChange={(e) => setPhase(pi, { name: e.target.value })}
                      placeholder={`Phase name, e.g. Remove`}
                      className="h-9 flex-1 rounded-(--r-2) px-3 text-[13.5px]"
                      style={{ ...fieldStyle, background: "var(--bg)" }}
                    />
                    <input
                      type="number"
                      min={1}
                      value={phase.duration_days}
                      onChange={(e) => setPhase(pi, { duration_days: e.target.value })}
                      placeholder="days"
                      className="h-9 w-[76px] rounded-(--r-2) px-3 text-[13px]"
                      style={{ ...fieldStyle, background: "var(--bg)", fontVariantNumeric: "tabular-nums" }}
                    />
                    <IconButton label="Move phase up" onClick={() => movePhase(pi, -1)} disabled={pi === 0}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                    </IconButton>
                    <IconButton label="Move phase down" onClick={() => movePhase(pi, 1)} disabled={pi === form.phases.length - 1}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                    </IconButton>
                    <IconButton label="Remove phase" onClick={() => removePhase(pi)}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </IconButton>
                  </div>

                  {/* Blocks in this phase */}
                  <div className="flex flex-col gap-2 pl-7">
                    {phase.blocks.map((block, bi) => (
                      <div key={bi} className="rounded-(--r-2) p-3 flex flex-col gap-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-[130px] shrink-0">
                            <SearchableSelect
                              value={block.type}
                              onChange={(v) => setBlock(pi, bi, { type: v as ProgramComponentType })}
                              options={COMPONENT_TYPE_ORDER.map((t) => ({ label: COMPONENT_TYPE_LABELS[t], value: t }))}
                            />
                          </div>
                          <input
                            value={block.title}
                            onChange={(e) => setBlock(pi, bi, { title: e.target.value })}
                            placeholder="Task title"
                            className="h-9 flex-1 rounded-(--r-2) px-3 text-[13px]"
                            style={fieldStyle}
                          />
                          <IconButton label="Remove task" onClick={() => removeBlock(pi, bi)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                          </IconButton>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="flex flex-col gap-1">
                            <FieldLabel>Cadence</FieldLabel>
                            <SearchableSelect
                              value={block.cadence}
                              onChange={(v) => setBlock(pi, bi, { cadence: v as ProgramCadence })}
                              options={CADENCE_ORDER.map((c) => ({ label: CADENCE_LABELS[c], value: c }))}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <FieldLabel>Start day</FieldLabel>
                            <input
                              type="number" min={0}
                              value={block.start_offset_days}
                              onChange={(e) => setBlock(pi, bi, { start_offset_days: e.target.value })}
                              placeholder="0"
                              className="h-9 rounded-(--r-2) px-3 text-[13px]"
                              style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums" }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <FieldLabel>Lasts (days)</FieldLabel>
                            <input
                              type="number" min={1}
                              value={block.duration_days}
                              onChange={(e) => setBlock(pi, bi, { duration_days: e.target.value })}
                              placeholder="phase"
                              className="h-9 rounded-(--r-2) px-3 text-[13px]"
                              style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums" }}
                            />
                          </div>
                          {block.cadence === "n_per_week" ? (
                            <div className="flex flex-col gap-1">
                              <FieldLabel>Per week</FieldLabel>
                              <input
                                type="number" min={1} max={7}
                                value={block.times_per_week}
                                onChange={(e) => setBlock(pi, bi, { times_per_week: e.target.value })}
                                placeholder="3"
                                className="h-9 rounded-(--r-2) px-3 text-[13px]"
                                style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums" }}
                              />
                            </div>
                          ) : block.type === "measurement" ? (
                            <div className="flex flex-col gap-1">
                              <FieldLabel>Metric key</FieldLabel>
                              <input
                                value={block.metric}
                                onChange={(e) => setBlock(pi, bi, { metric: e.target.value })}
                                placeholder="weight_kg"
                                className="h-9 rounded-(--r-2) px-3 text-[13px]"
                                style={fieldStyle}
                              />
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>

                        {block.type === "measurement" && block.cadence === "n_per_week" && (
                          <div className="flex flex-col gap-1">
                            <FieldLabel>Metric key</FieldLabel>
                            <input
                              value={block.metric}
                              onChange={(e) => setBlock(pi, bi, { metric: e.target.value })}
                              placeholder="weight_kg (matches a goal metric)"
                              className="h-9 rounded-(--r-2) px-3 text-[13px]"
                              style={fieldStyle}
                            />
                          </div>
                        )}

                        {block.type === "meal_plan" && (
                          <div className="flex flex-col gap-1">
                            <FieldLabel>Linked meal plan</FieldLabel>
                            {!mealPlansLoading && mealPlans.length === 0 ? (
                              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                                No meal plan templates yet. Create one under Meal plans, then link it here.
                              </div>
                            ) : (
                              <SearchableSelect
                                value={block.meal_plan_id}
                                onChange={(v) => setBlock(pi, bi, { meal_plan_id: v })}
                                options={mealPlans}
                                placeholder={mealPlansLoading ? "Loading meal plans…" : "Pick a meal plan…"}
                                loading={mealPlansLoading}
                              />
                            )}
                          </div>
                        )}

                        <input
                          value={block.detail}
                          onChange={(e) => setBlock(pi, bi, { detail: e.target.value })}
                          placeholder="Details / instructions (optional)"
                          className="h-9 rounded-(--r-2) px-3 text-[13px]"
                          style={fieldStyle}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addBlock(pi)}
                      className="self-start font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
                      style={{ border: "1px dashed var(--border-2)", color: "var(--fg-3)", background: "transparent" }}
                    >
                      + Add task
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Goals */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <FieldLabel>Goals</FieldLabel>
                <button
                  type="button"
                  onClick={addGoal}
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
                  style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                >
                  + Add goal
                </button>
              </div>
              {form.goals.length === 0 && (
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  No goals yet. A measurement task with a matching metric key feeds its goal automatically.
                </div>
              )}
              {form.goals.map((goal, gi) => (
                <div key={gi} className="rounded-(--r-2) p-3 flex flex-col gap-2" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <input
                      value={goal.label}
                      onChange={(e) => setGoal(gi, { label: e.target.value })}
                      placeholder="Goal, e.g. Lose 4kg"
                      className="h-9 flex-1 rounded-(--r-2) px-3 text-[13px]"
                      style={{ ...fieldStyle, background: "var(--bg)" }}
                    />
                    <IconButton label="Remove goal" onClick={() => removeGoal(gi)}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </IconButton>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Direction</FieldLabel>
                      <SearchableSelect
                        value={goal.direction}
                        onChange={(v) => setGoal(gi, { direction: v as GoalDirection })}
                        options={DIRECTION_ORDER.map((d) => ({ label: DIRECTION_LABELS[d], value: d }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Metric key</FieldLabel>
                      <input
                        value={goal.metric}
                        onChange={(e) => setGoal(gi, { metric: e.target.value })}
                        placeholder="weight_kg"
                        className="h-9 rounded-(--r-2) px-3 text-[13px]"
                        style={{ ...fieldStyle, background: "var(--bg)" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Target</FieldLabel>
                      <input
                        type="number"
                        value={goal.target}
                        onChange={(e) => setGoal(gi, { target: e.target.value })}
                        placeholder="70"
                        className="h-9 rounded-(--r-2) px-3 text-[13px]"
                        style={{ ...fieldStyle, background: "var(--bg)", fontVariantNumeric: "tabular-nums" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel>By day</FieldLabel>
                      <input
                        type="number" min={0}
                        value={goal.target_offset_days}
                        onChange={(e) => setGoal(gi, { target_offset_days: e.target.value })}
                        placeholder="Optional"
                        className="h-9 rounded-(--r-2) px-3 text-[13px]"
                        style={{ ...fieldStyle, background: "var(--bg)", fontVariantNumeric: "tabular-nums" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Guidance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Indications</FieldLabel>
                <textarea
                  value={form.indications}
                  onChange={(e) => setForm((f) => ({ ...f, indications: e.target.value }))}
                  placeholder="Who this program suits"
                  rows={2}
                  className="rounded-(--r-2) px-3 py-2.5 text-[13px] resize-none"
                  style={fieldStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Cautions</FieldLabel>
                <textarea
                  value={form.cautions}
                  onChange={(e) => setForm((f) => ({ ...f, cautions: e.target.value }))}
                  placeholder="When not to use it"
                  rows={2}
                  className="rounded-(--r-2) px-3 py-2.5 text-[13px] resize-none"
                  style={fieldStyle}
                />
              </div>
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
                {saving ? "Saving..." : mode === "create" ? "Create draft" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Assign-to-client modal ──────────────────────────────────────────────────

function AssignProgramModal({
  template,
  onClose,
  onAssigned,
}: {
  template: ProgramTemplate;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [startDate, setStartDate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await progressService.getMyClientProfiles();
      if (!active) return;
      if (res.success && res.data) {
        setClients(res.data.filter((c) => c.is_active));
        setClientsError(null);
      } else {
        setClientsError(res.message || "We couldn't load your clients.");
      }
      setLoadingClients(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    const res = await programsService.assign(template._id, {
      client_profile_id: selected,
      start_date: startDate || undefined,
    });
    setAssigning(false);
    if (res.success && res.data) {
      const target = clients.find((c) => c._id === selected);
      toast.success(`"${template.name}" assigned to ${target ? clientName(target) : "client"}.`);
      onAssigned();
      onClose();
    } else {
      toast.error(res.message ?? "Failed to assign program.");
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
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>Assign program</h2>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            Gives the client their own copy of &ldquo;{template.name}&rdquo; with a schedule of tasks.
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <FieldLabel>Client</FieldLabel>
            {clientsError ? (
              <div className="rounded-(--r-2) px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
                {clientsError}
              </div>
            ) : !loadingClients && clients.length === 0 ? (
              <EmptySlate message="No active clients yet." hint="Add a client first, then assign programs." mt="mt-0" />
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
          <div className="flex flex-col gap-2">
            <FieldLabel>Start date</FieldLabel>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={fieldStyle}
            />
            <span className="text-[11.5px]" style={{ color: "var(--fg-4)" }}>Leave blank to start today.</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selected || assigning}
            className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            {assigning ? "Assigning..." : "Assign program"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assignments (clients) modal ─────────────────────────────────────────────

const INSTANCE_STATUS_TINT: Record<ProgramInstance["status"], string> = {
  active: "var(--signal-ink)",
  assigned: "var(--fg-2)",
  paused: "oklch(0.42 0.13 75)",
  completed: "var(--fg-3)",
  cancelled: "var(--fg-4)",
};

function AssignmentsModal({
  template,
  basePath,
  onClose,
}: {
  template: ProgramTemplate;
  basePath: string;
  onClose: () => void;
}) {
  const [instances, setInstances] = useState<ProgramInstance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await programsService.listAssignments(template._id);
      if (!active) return;
      if (res.success && res.data) setInstances(res.data);
      else setError(res.message || "We couldn't load assignments.");
    })();
    return () => {
      active = false;
    };
  }, [template._id]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            Clients on this program
          </h2>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-(--r-2)" style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {error ? (
            <div className="rounded-(--r-2) px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>{error}</div>
          ) : instances === null ? (
            <AsyncSpinner size="page" label="Loading clients" />
          ) : instances.length === 0 ? (
            <EmptySlate message="No clients on this program yet." hint="Use Assign to add one." mt="mt-0" />
          ) : (
            <div className="flex flex-col gap-2">
              {instances.map((i) => (
                <Link
                  key={i._id}
                  href={`${basePath}/instances/${i._id}`}
                  className="flex items-center justify-between gap-3 rounded-(--r-2) px-3.5 py-3"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{instanceClientName(i)}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                      {i.occurrences_done} / {i.occurrences_scheduled} tasks done
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: INSTANCE_STATUS_TINT[i.status] }}>{i.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Template card ───────────────────────────────────────────────────────────

function ProgramCard({
  template,
  accentInk,
  accentSoft,
  onEdit,
  onPublish,
  onAssign,
  onViewClients,
  onArchive,
  fmtDate,
}: {
  template: ProgramTemplate;
  accentInk: string;
  accentSoft: string;
  onEdit: () => void;
  onPublish: () => void;
  onAssign: () => void;
  onViewClients: () => void;
  onArchive: () => void;
  fmtDate: (d: string | Date) => string;
}) {
  const STATUS_BADGE: Record<ProgramTemplate["status"], { bg: string; color: string; label: string }> = {
    draft: { bg: "var(--bg-3)", color: "var(--fg-2)", label: "Draft" },
    published: { bg: accentSoft, color: accentInk, label: "Published" },
    archived: { bg: "var(--bg-3)", color: "var(--fg-4)", label: "Archived" },
  };
  const badge = STATUS_BADGE[template.status];
  const isPublished = template.latest_published_version_no >= 1;
  const draftAhead = hasUnpublishedDraft(template);

  return (
    <div className="rounded-(--r-3) flex flex-col overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="px-5.5 pt-5 pb-3.5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
          {draftAhead && isPublished && (
            // Neutral fill (not an accent) so it stays distinct from the
            // "Published" pill on every role, incl. the amber trainer accent.
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-2)", border: "1px solid var(--border-2)" }}>
              Unpublished changes
            </span>
          )}
          {template.category && (
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}>
              {template.category}
            </span>
          )}
        </div>
        <div className="text-[16px] font-medium mt-1.5 truncate" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>{template.name}</div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
          v{template.latest_version_no}
          {isPublished ? ` · published v${template.latest_published_version_no}` : " · never published"}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-5.5 py-3 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 flex-wrap">
          {template.status !== "archived" && (
            <button type="button" onClick={onEdit} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}>
              Edit
            </button>
          )}
          {template.status !== "archived" && (draftAhead || !isPublished) && (
            <button type="button" onClick={onPublish} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--signal-ink)", background: "transparent" }}>
              Publish
            </button>
          )}
          {isPublished && template.status !== "archived" && (
            <button type="button" onClick={onAssign} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: accentInk, background: "transparent" }}>
              Assign
            </button>
          )}
          <button type="button" onClick={onViewClients} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}>
            Clients
          </button>
          {template.status !== "archived" && (
            <button type="button" onClick={onArchive} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "transparent" }}>
              Archive
            </button>
          )}
        </div>
        <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>{fmtDate(template.updated_at)}</span>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Filter = "All" | "Draft" | "Published";

export default function ProgramsManager({
  config,
  initialCreateOpen = false,
}: {
  config: ProgramsRoleConfig;
  initialCreateOpen?: boolean;
}) {
  const { Shell, basePath, accentInk, accentSoft, navItem } = config;
  const { fmtDate } = useOrgFormat();
  const router = useRouter();
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  const [modal, setModal] = useState<{ mode: ModalMode; initial: ProgramFormState; loading: boolean; id?: string } | null>(
    initialCreateOpen ? { mode: "create", initial: EMPTY_PROGRAM_FORM, loading: false } : null,
  );
  const [assignTemplate, setAssignTemplate] = useState<ProgramTemplate | null>(null);
  const [clientsTemplate, setClientsTemplate] = useState<ProgramTemplate | null>(null);

  useEffect(() => {
    if (initialCreateOpen) router.replace(basePath, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await programsService.listTemplates();
      if (!active) return;
      if (res.success && res.data) {
        setTemplates(res.data);
        setError(null);
      } else {
        setError(res.message || "We couldn't load your programs. Try again shortly.");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      All: templates.length,
      Draft: templates.filter((t) => t.status === "draft").length,
      Published: templates.filter((t) => t.status === "published").length,
    }),
    [templates],
  );

  const filtered = useMemo(() => {
    if (filter === "Draft") return templates.filter((t) => t.status === "draft");
    if (filter === "Published") return templates.filter((t) => t.status === "published");
    return templates;
  }, [templates, filter]);

  const openCreate = () => setModal({ mode: "create", initial: EMPTY_PROGRAM_FORM, loading: false });

  const openEdit = async (t: ProgramTemplate) => {
    setModal({ mode: "edit", initial: EMPTY_PROGRAM_FORM, loading: true, id: t._id });
    const res = await programsService.getTemplate(t._id);
    if (res.success && res.data) {
      setModal({ mode: "edit", initial: versionToForm(res.data.version), loading: false, id: t._id });
    } else {
      toast.error(res.message ?? "Couldn't open this program.");
      setModal(null);
    }
  };

  const handleCreate = async (form: ProgramFormState) => {
    const res = await programsService.createTemplate(formToPayload(form));
    if (res.success && res.data) {
      setTemplates((t) => [res.data!.template, ...t]);
      setModal(null);
      toast.success("Program draft created.");
    } else {
      toast.error(res.message ?? "Failed to create program.");
    }
  };

  const handleEdit = async (form: ProgramFormState) => {
    const id = modal?.id;
    if (!id) return;
    const res = await programsService.updateTemplate(id, formToPayload(form));
    if (res.success && res.data) {
      setTemplates((list) => list.map((t) => (t._id === id ? res.data!.template : t)));
      setModal(null);
      toast.success("Program updated.");
    } else {
      toast.error(res.message ?? "Failed to update program.");
    }
  };

  const handlePublish = async (t: ProgramTemplate) => {
    if (!confirm(`Publish "${t.name}"? This freezes the current version so you can assign it. Later edits start a new draft.`)) return;
    const res = await programsService.publishTemplate(t._id);
    if (res.success && res.data) {
      setTemplates((list) => list.map((x) => (x._id === t._id ? res.data!.template : x)));
      toast.success("Program published.");
    } else {
      toast.error(res.message ?? "Failed to publish program.");
    }
  };

  const handleArchive = async (t: ProgramTemplate) => {
    if (!confirm(`Archive "${t.name}"? It will disappear from this list. Assigned clients keep their programs.`)) return;
    const res = await programsService.archiveTemplate(t._id);
    if (res.success) {
      setTemplates((list) => list.filter((x) => x._id !== t._id));
      toast.success("Program archived.");
    } else {
      toast.error(res.message ?? "Failed to archive program.");
    }
  };

  const FILTERS: Filter[] = ["All", "Draft", "Published"];

  return (
    <Shell activeItem={navItem} crumb={navItem}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Programs</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {loading ? "Loading..." : `${counts.Published} published · ${counts.Draft} draft`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-signal-v2 inline-flex items-center gap-2 self-start sm:self-auto"
          style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New program
        </button>
      </div>

      {error && (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load programs</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
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
        <AsyncSpinner size="page" label="Loading programs" />
      ) : !error && templates.length === 0 ? (
        <div className="rounded-(--r-3) flex flex-col items-center justify-center gap-3 py-16 mt-2" style={{ border: "1.5px dashed var(--border-2)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.3"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>No programs yet</div>
          <div className="text-[13px] text-center" style={{ color: "var(--fg-3)", maxWidth: "38ch", lineHeight: 1.5 }}>
            Build a versioned program of phases and tasks, publish it, then assign copies to clients and track their adherence.
          </div>
          <button type="button" onClick={openCreate} className="mt-1 h-9 px-5 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>
            Create first program
          </button>
        </div>
      ) : !error && filtered.length === 0 ? (
        <EmptySlate message={`No ${filter.toLowerCase()} programs.`} mt="mt-2" />
      ) : !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <ProgramCard
              key={t._id}
              template={t}
              accentInk={accentInk}
              accentSoft={accentSoft}
              fmtDate={fmtDate}
              onEdit={() => openEdit(t)}
              onPublish={() => handlePublish(t)}
              onAssign={() => setAssignTemplate(t)}
              onViewClients={() => setClientsTemplate(t)}
              onArchive={() => handleArchive(t)}
            />
          ))}
        </div>
      ) : null}

      {modal && (
        <ProgramFormModal
          // Remount once the async prefill lands so useState picks up `initial`.
          key={`${modal.mode}-${modal.id ?? "new"}-${modal.loading ? "loading" : "ready"}`}
          mode={modal.mode}
          initial={modal.initial}
          loading={modal.loading}
          onClose={() => setModal(null)}
          onSave={modal.mode === "create" ? handleCreate : handleEdit}
        />
      )}

      {assignTemplate && (
        <AssignProgramModal
          template={assignTemplate}
          onClose={() => setAssignTemplate(null)}
          onAssigned={() => setClientsTemplate(assignTemplate)}
        />
      )}

      {clientsTemplate && (
        <AssignmentsModal template={clientsTemplate} basePath={basePath} onClose={() => setClientsTemplate(null)} />
      )}
    </Shell>
  );
}
