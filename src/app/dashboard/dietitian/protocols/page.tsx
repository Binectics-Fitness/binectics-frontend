"use client";

import { useEffect, useRef, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  nutritionService,
  type CreateProtocolRequest,
  type Protocol,
  type ProtocolStep,
} from "@/lib/api/nutrition";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { buildProtocolRecommendation } from "./protocol-recommendation";

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object") {
    return `${c.client_id.first_name} ${c.client_id.last_name}`;
  }
  return c.client_id;
}

const labelCls = "font-mono text-[10.5px] uppercase tracking-[0.06em]";
const inputStyle = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
} as const;

/* ─── Protocol editor modal ─────────────────────────────────────────────── */

type EditorState = {
  name: string;
  category: string;
  durationWeeks: string;
  description: string;
  steps: ProtocolStep[];
};

function toEditorState(p?: Protocol): EditorState {
  return {
    name: p?.name ?? "",
    category: p?.category ?? "",
    durationWeeks: p?.duration_weeks != null ? String(p.duration_weeks) : "",
    description: p?.description ?? "",
    steps: p?.steps.map((s) => ({ title: s.title, detail: s.detail })) ?? [],
  };
}

function ProtocolModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: EditorState;
  onClose: () => void;
  onSave: (payload: CreateProtocolRequest) => Promise<boolean>;
}) {
  const [form, setForm] = useState<EditorState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const setStep = (i: number, patch: Partial<ProtocolStep>) =>
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  const addStep = () => setForm((f) => ({ ...f, steps: [...f.steps, { title: "", detail: "" }] }));

  const removeStep = (i: number) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));

  const moveStep = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const j = i + dir;
      if (j < 0 || j >= f.steps.length) return f;
      const steps = [...f.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...f, steps };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (form.durationWeeks.trim() !== "") {
      const weeks = Number(form.durationWeeks);
      if (!Number.isFinite(weeks) || weeks <= 0) {
        setError("Duration must be a positive number of weeks.");
        return;
      }
    }
    if (form.steps.some((s) => !s.title.trim())) {
      setError("Every step needs a title, remove empty steps or fill them in.");
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSave({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      durationWeeks: form.durationWeeks.trim() === "" ? undefined : Number(form.durationWeeks),
      steps: form.steps.map((s) => ({
        title: s.title.trim(),
        detail: s.detail?.trim() || undefined,
      })),
    });
    setSaving(false);
    if (!ok) return;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-(--r-3) overflow-y-auto max-h-[90vh]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            {mode === "create" ? "New protocol" : "Edit protocol"}
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
            <label className={labelCls} style={{ color: "var(--fg-3)" }}>
              Name <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 12-week gut reset"
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ color: "var(--fg-3)" }}>Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Gut health"
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ color: "var(--fg-3)" }}>Duration (weeks)</label>
              <input
                type="number"
                min={1}
                value={form.durationWeeks}
                onChange={(e) => setForm((f) => ({ ...f, durationWeeks: e.target.value }))}
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "var(--fg-3)" }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What this protocol is for and who it suits"
              rows={3}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={inputStyle}
            />
          </div>

          {/* Steps editor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className={labelCls} style={{ color: "var(--fg-3)" }}>Steps</label>
              <button
                type="button"
                onClick={addStep}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer"
                style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "transparent" }}
              >
                + Add step
              </button>
            </div>
            {form.steps.length === 0 && (
              <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                No steps yet, add the phases or actions of this protocol in order.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {form.steps.map((step, i) => (
                <div key={i} className="rounded-(--r-2) p-3 flex flex-col gap-2" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-3)" }}>{i + 1}.</span>
                    <input
                      value={step.title}
                      onChange={(e) => setStep(i, { title: e.target.value })}
                      placeholder="Step title (required)"
                      className="h-8 flex-1 rounded-(--r-2) px-2.5 text-[13px]"
                      style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveStep(i, -1)}
                        disabled={i === 0}
                        aria-label="Move step up"
                        className="w-7 h-7 flex items-center justify-center rounded-(--r-1) cursor-pointer disabled:opacity-30"
                        style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(i, 1)}
                        disabled={i === form.steps.length - 1}
                        aria-label="Move step down"
                        className="w-7 h-7 flex items-center justify-center rounded-(--r-1) cursor-pointer disabled:opacity-30"
                        style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(i)}
                        aria-label="Remove step"
                        className="w-7 h-7 flex items-center justify-center rounded-(--r-1) cursor-pointer"
                        style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "transparent" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <input
                    value={step.detail ?? ""}
                    onChange={(e) => setStep(i, { detail: e.target.value })}
                    placeholder="Optional detail"
                    className="h-8 rounded-(--r-2) px-2.5 text-[12.5px]"
                    style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--fg-2)" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-(--r-2) px-3 py-2 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              {error}
            </div>
          )}

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
              {saving ? "Saving..." : mode === "create" ? "Create protocol" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Apply-to-client modal ─────────────────────────────────────────────── */

function ApplyModal({
  protocol,
  onClose,
  onApplied,
}: {
  protocol: Protocol;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await progressService.getMyClientProfiles();
      if (!mounted) return;
      if (res.success && res.data) {
        setClients(res.data.filter((c) => c.is_active));
      } else {
        setLoadError(true);
      }
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = clients.filter(
    (c) => search === "" || clientName(c).toLowerCase().includes(search.toLowerCase()),
  );

  const handleApply = async (profile: ClientProfile) => {
    setApplyingId(profile._id);
    const res = await progressService.createRecommendation(
      profile._id,
      buildProtocolRecommendation(protocol),
    );
    setApplyingId(null);
    if (res.success) {
      toast.success(`"${protocol.name}" sent to ${clientName(profile)} as a recommendation.`);
      onApplied();
    } else {
      toast.error(res.message ?? "Failed to apply protocol.");
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
        className="w-full max-w-md rounded-(--r-3) overflow-y-auto max-h-[80vh]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium truncate" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>Apply to client</h2>
            <p className="text-[12.5px] mt-0.5 truncate" style={{ color: "var(--fg-3)" }}>
              Sends &ldquo;{protocol.name}&rdquo; as a nutrition recommendation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-(--r-2) shrink-0"
            style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              placeholder="Search clients..."
              className="flex-1 border-0 bg-transparent text-[13px] outline-none"
              style={{ color: "var(--ink)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <AsyncSpinner label="Loading clients" />}
          {loadError && (
            <div className="rounded-(--r-2) px-3 py-2 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              Failed to load your clients.
            </div>
          )}
          {!loading && !loadError && filtered.length === 0 && (
            <EmptySlate message={clients.length === 0 ? "You have no active clients yet." : "No clients match your search."} mt="mt-0" />
          )}

          <div className="flex flex-col gap-1.5">
            {filtered.map((c) => (
              <button
                key={c._id}
                type="button"
                disabled={applyingId !== null}
                onClick={() => handleApply(c)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-(--r-2) text-left cursor-pointer disabled:opacity-50"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
              >
                <span className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{clientName(c)}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] shrink-0" style={{ color: applyingId === c._id ? "var(--fg-3)" : "var(--signal-ink)" }}>
                  {applyingId === c._id ? "Sending..." : "Apply"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page — real protocol CRUD (was a FeaturePending stub) ────────────── */

export default function DietitianProtocolsPage() {
  const { fmtDate } = useOrgFormat();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; protocol?: Protocol } | null>(null);
  const [applyTarget, setApplyTarget] = useState<Protocol | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await nutritionService.listProtocols({
        search: debouncedQuery || undefined,
        limit: 200,
      });
      if (!mounted) return;
      if (res.success && res.data) {
        setProtocols(res.data.items);
        setTotal(res.data.total);
      } else {
        setProtocols([]);
        setTotal(0);
        setError(res.message ?? "Failed to load protocols.");
      }
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [debouncedQuery, refreshTick]);

  const refetch = () => setRefreshTick((t) => t + 1);

  const handleCreate = async (payload: CreateProtocolRequest): Promise<boolean> => {
    const res = await nutritionService.createProtocol(payload);
    if (res.success) {
      setModal(null);
      toast.success(`Protocol "${payload.name}" created.`);
      refetch();
      return true;
    }
    toast.error(res.message ?? "Failed to create protocol.");
    return false;
  };

  const handleEdit = async (payload: CreateProtocolRequest): Promise<boolean> => {
    if (!modal?.protocol) return false;
    const res = await nutritionService.updateProtocol(modal.protocol._id, payload);
    if (res.success) {
      setModal(null);
      toast.success("Protocol updated.");
      refetch();
      return true;
    }
    toast.error(res.message ?? "Failed to update protocol.");
    return false;
  };

  const handleArchive = async (protocol: Protocol) => {
    if (!confirm(`Archive "${protocol.name}"? It will be hidden from your protocols.`)) return;
    const res = await nutritionService.archiveProtocol(protocol._id);
    if (res.success) {
      toast.success(`Archived "${protocol.name}".`);
      refetch();
    } else {
      toast.error(res.message ?? "Failed to archive protocol.");
    }
  };

  const emptyLibrary = !loading && !error && protocols.length === 0 && !debouncedQuery;

  return (
    <DietitianDashboardShell
      activeItem="Protocols"
      crumb="Protocols"
      actions={
        <div className="flex gap-2">
          <button type="button" className="btn-ghost-v2 sm" onClick={refetch}>Refresh</button>
          <button type="button" className="btn-primary-v2 sm" onClick={() => setModal({ mode: "create" })}>New protocol</button>
        </div>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Protocols</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {loading ? "Loading protocols..." : `${total} reusable protocol${total === 1 ? "" : "s"}${total > protocols.length ? `, showing first ${protocols.length}` : ""}`}
        </div>
      </div>

      {error && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}{" "}
          <button type="button" onClick={refetch} className="underline cursor-pointer" style={{ color: "inherit" }}>Retry</button>
        </div>
      )}

      <div className="rounded-(--r-3) flex items-center gap-3.5 px-3.5 py-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-0" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input placeholder="Search protocols..." className="flex-1 border-0 bg-transparent text-[13px] outline-none" style={{ color: "var(--ink)" }} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[860px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Protocol", "Category", "Duration", "Steps", "Updated", ""].map((h, hi) => (
                  <th key={`${h}-${hi}`} className={`px-4.5 py-2.5 font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] ${hi === 2 || hi === 3 ? "text-right" : "text-left"}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {protocols.map((p, i) => (
                <tr key={p._id} style={{ borderBottom: i < protocols.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4.5 py-3">
                    <div className="font-medium" style={{ color: "var(--ink)" }}>{p.name}</div>
                    {p.description && (
                      <div className="text-[12.5px] mt-0.5 line-clamp-1" style={{ color: "var(--fg-3)" }}>{p.description}</div>
                    )}
                  </td>
                  <td className="px-4.5 py-3">
                    {p.category ? (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>{p.category}</span>
                    ) : (
                      <span style={{ color: "var(--fg-3)" }}>-</span>
                    )}
                  </td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>
                    {p.duration_weeks != null ? `${p.duration_weeks} wk` : "-"}
                  </td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{p.steps.length}</td>
                  <td className="px-4.5 py-3" style={{ color: "var(--fg-2)" }}>{fmtDate(p.updated_at)}</td>
                  <td className="px-4.5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setApplyTarget(p)}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer"
                        style={{ border: "1px solid var(--border)", color: "var(--signal-ink)", background: "transparent" }}
                      >
                        Apply to client
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", protocol: p })}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer"
                        style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(p)}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer"
                        style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "transparent" }}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4.5 py-4"><AsyncSpinner label="Loading protocols" /></td>
                </tr>
              )}
              {!loading && protocols.length === 0 && !emptyLibrary && (
                <tr>
                  <td colSpan={6} className="px-4.5 py-4">
                    <EmptySlate message="No protocols match your search." mt="mt-0" />
                  </td>
                </tr>
              )}
              {emptyLibrary && (
                <tr>
                  <td colSpan={6} className="px-4.5 py-10">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>No protocols yet</div>
                      <div className="text-[13px]" style={{ color: "var(--fg-3)", maxWidth: "38ch", lineHeight: 1.5 }}>
                        Build reusable, step-by-step nutrition protocols and apply them to clients as recommendations.
                      </div>
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "create" })}
                        className="mt-1 h-9 px-5 rounded-(--r-2) text-[13px] font-medium cursor-pointer"
                        style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
                      >
                        Create your first protocol
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ProtocolModal
          mode={modal.mode}
          initial={toEditorState(modal.protocol)}
          onClose={() => setModal(null)}
          onSave={modal.mode === "create" ? handleCreate : handleEdit}
        />
      )}

      {applyTarget && (
        <ApplyModal
          protocol={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={() => setApplyTarget(null)}
        />
      )}
    </DietitianDashboardShell>
  );
}
