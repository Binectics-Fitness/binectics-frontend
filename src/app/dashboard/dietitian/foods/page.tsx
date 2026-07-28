"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  nutritionService,
  type CreateFoodItemRequest,
  type FoodItem,
} from "@/lib/api/nutrition";
import { toast } from "@/components/Toast";
import { buildFoodsCsv } from "./foods-csv";

/* ─── New-food modal ────────────────────────────────────────────────────── */

type FoodFormState = {
  name: string;
  category: string;
  servingLabel: string;
  caloriesKcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  sugarG: string;
  sodiumMg: string;
  notes: string;
};

const EMPTY_FORM: FoodFormState = {
  name: "",
  category: "",
  servingLabel: "",
  caloriesKcal: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fiberG: "",
  sugarG: "",
  sodiumMg: "",
  notes: "",
};

/** Parse the form into an API payload, or return an error message. */
function parseFoodForm(
  form: FoodFormState,
): { payload: CreateFoodItemRequest } | { error: string } {
  if (!form.name.trim()) return { error: "Name is required." };
  if (!form.servingLabel.trim()) return { error: "Serving label is required." };

  const required: [keyof FoodFormState, string][] = [
    ["caloriesKcal", "Calories"],
    ["proteinG", "Protein"],
    ["carbsG", "Carbs"],
    ["fatG", "Fat"],
  ];
  const nums: Partial<Record<keyof FoodFormState, number>> = {};
  for (const [key, label] of required) {
    const raw = form[key].trim();
    if (raw === "") return { error: `${label} is required.` };
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return { error: `${label} must be a number ≥ 0.` };
    nums[key] = n;
  }

  const optional: [keyof FoodFormState, string][] = [
    ["fiberG", "Fiber"],
    ["sugarG", "Sugar"],
    ["sodiumMg", "Sodium"],
  ];
  for (const [key, label] of optional) {
    const raw = form[key].trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return { error: `${label} must be a number ≥ 0.` };
    nums[key] = n;
  }

  return {
    payload: {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      servingLabel: form.servingLabel.trim(),
      caloriesKcal: nums.caloriesKcal!,
      proteinG: nums.proteinG!,
      carbsG: nums.carbsG!,
      fatG: nums.fatG!,
      fiberG: nums.fiberG,
      sugarG: nums.sugarG,
      sodiumMg: nums.sodiumMg,
      notes: form.notes.trim() || undefined,
    },
  };
}

const labelCls = "font-mono text-[10.5px] uppercase tracking-[0.06em]";
const inputStyle = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
} as const;

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls} style={{ color: "var(--fg-3)" }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function NewFoodModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: CreateFoodItemRequest) => Promise<boolean>;
}) {
  const [form, setForm] = useState<FoodFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof FoodFormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFoodForm(form);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSave(parsed.payload);
    setSaving(false);
    if (!ok) return;
  };

  const macro = (key: keyof FoodFormState, label: string, required?: boolean) => (
    <Field label={label} required={required}>
      <input
        type="number"
        min={0}
        step="any"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
        style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
      />
    </Field>
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-(--r-3) overflow-y-auto max-h-[90vh]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>New food</h2>
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
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Jollof rice"
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={inputStyle}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Grains"
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={inputStyle}
              />
            </Field>
            <Field label="Serving label" required>
              <input
                value={form.servingLabel}
                onChange={(e) => set("servingLabel", e.target.value)}
                placeholder="e.g. 1 cup cooked (200 g)"
                className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
                style={inputStyle}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {macro("caloriesKcal", "Kcal", true)}
            {macro("proteinG", "Protein g", true)}
            {macro("carbsG", "Carbs g", true)}
            {macro("fatG", "Fat g", true)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {macro("fiberG", "Fiber g")}
            {macro("sugarG", "Sugar g")}
            {macro("sodiumMg", "Sodium mg")}
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Preparation assumptions, sourcing, client guidance..."
              rows={3}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={inputStyle}
            />
          </Field>

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
              {saving ? "Saving..." : "Create food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page — real provider food library (was derived from diet plans) ───── */

export default function DietitianFoodsPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [refreshTick, setRefreshTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await nutritionService.listFoods({
        search: debouncedQuery || undefined,
        limit: 200,
      });
      if (!mounted) return;
      if (res.success && res.data) {
        setItems(res.data.items);
      } else {
        setItems([]);
        setError(res.message ?? "Failed to load your food library.");
      }
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [debouncedQuery, refreshTick]);

  const refetch = () => setRefreshTick((t) => t + 1);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((f) => {
      if (f.category?.trim()) set.add(f.category.trim());
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return items;
    return items.filter((f) => f.category?.trim() === categoryFilter);
  }, [items, categoryFilter]);

  const kpis = useMemo(() => {
    const avgKcal =
      items.length > 0
        ? Math.round(items.reduce((s, f) => s + f.calories_kcal, 0) / items.length)
        : 0;
    return [
      { label: "Total foods", value: String(items.length), delta: "In your library" },
      { label: "Categories", value: String(categories.length - 1), delta: "Distinct groups" },
      { label: "Avg calories", value: items.length ? `${avgKcal} kcal` : "-", delta: "Per serving" },
      { label: "Visible rows", value: String(filtered.length), delta: "After filters" },
    ];
  }, [items, categories, filtered]);

  const handleCreate = async (payload: CreateFoodItemRequest): Promise<boolean> => {
    const res = await nutritionService.createFood(payload);
    if (res.success) {
      setModalOpen(false);
      toast.success(`"${payload.name}" added to your library.`);
      refetch();
      return true;
    }
    toast.error(res.message ?? "Failed to create food.");
    return false;
  };

  const handleDuplicate = async (food: FoodItem) => {
    setBusyId(food._id);
    const res = await nutritionService.duplicateFood(food._id);
    setBusyId(null);
    if (res.success) {
      toast.success(`Duplicated "${food.name}".`);
      refetch();
    } else {
      toast.error(res.message ?? "Failed to duplicate food.");
    }
  };

  const handleArchive = async (food: FoodItem) => {
    if (!confirm(`Archive "${food.name}"? It will be hidden from your library.`)) return;
    setBusyId(food._id);
    const res = await nutritionService.archiveFood(food._id);
    setBusyId(null);
    if (res.success) {
      toast.success(`Archived "${food.name}".`);
      refetch();
    } else {
      toast.error(res.message ?? "Failed to archive food.");
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("Nothing to export yet.");
      return;
    }
    const csv = buildFoodsCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "food-database.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} food${filtered.length === 1 ? "" : "s"}.`);
  };

  const emptyLibrary = !loading && !error && items.length === 0 && !debouncedQuery;

  return (
    <DietitianDashboardShell
      activeItem="Food database"
      crumb="Food database"
      actions={
        <div className="flex gap-2">
          <button type="button" className="btn-ghost-v2 sm" onClick={handleExport}>Export</button>
          <button type="button" className="btn-ghost-v2 sm" onClick={refetch}>Refresh</button>
          <button type="button" className="btn-primary-v2 sm" onClick={() => setModalOpen(true)}>New food</button>
        </div>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Food database</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {loading ? "Loading your food library..." : `${filtered.length} food${filtered.length === 1 ? "" : "s"} in your library`}
        </div>
      </div>

      {error && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}{" "}
          <button type="button" onClick={refetch} className="underline cursor-pointer" style={{ color: "inherit" }}>Retry</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="font-medium mt-1.5 text-[18px]" style={{ letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1.2 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="rounded-(--r-3) flex flex-col sm:flex-row sm:items-center gap-3.5 px-3.5 py-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-0 sm:min-w-[280px]" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input placeholder="Search foods..." className="flex-1 border-0 bg-transparent text-[13px] outline-none" style={{ color: "var(--ink)" }} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {categories.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {categories.map((pill) => (
              <span
                key={pill}
                onClick={() => setCategoryFilter(pill)}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer"
                style={categoryFilter === pill ? { background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" } : { background: "var(--bg)", color: "var(--fg-3)", border: "1px solid var(--border)" }}
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[860px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Food", "Category", "Serving", "Kcal", "Protein", "Carbs", "Fat", ""].map((h, hi) => (
                  <th key={`${h}-${hi}`} className={`px-4.5 py-2.5 font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] ${hi >= 3 && hi <= 6 ? "text-right" : "text-left"}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f._id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4.5 py-3">
                    <Link href={`/dashboard/dietitian/foods/${f._id}`} className="font-medium hover:underline" style={{ color: "var(--ink)" }}>{f.name}</Link>
                  </td>
                  <td className="px-4.5 py-3">
                    {f.category ? (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>{f.category}</span>
                    ) : (
                      <span style={{ color: "var(--fg-3)" }}>-</span>
                    )}
                  </td>
                  <td className="px-4.5 py-3" style={{ color: "var(--fg-2)" }}>{f.serving_label}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.calories_kcal}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.protein_g} g</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.carbs_g} g</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.fat_g} g</td>
                  <td className="px-4.5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === f._id}
                        onClick={() => handleDuplicate(f)}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer disabled:opacity-50"
                        style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        disabled={busyId === f._id}
                        onClick={() => handleArchive(f)}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer disabled:opacity-50"
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
                  <td colSpan={8} className="px-4.5 py-4"><AsyncSpinner label="Loading foods" /></td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !emptyLibrary && (
                <tr>
                  <td colSpan={8} className="px-4.5 py-4">
                    <EmptySlate message="No foods match the current search or filter." mt="mt-0" />
                  </td>
                </tr>
              )}
              {emptyLibrary && (
                <tr>
                  <td colSpan={8} className="px-4.5 py-10">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Your food library is empty</div>
                      <div className="text-[13px]" style={{ color: "var(--fg-3)", maxWidth: "36ch", lineHeight: 1.5 }}>
                        Build a personal database of foods with their macros to reuse across client plans.
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="mt-1 h-9 px-5 rounded-(--r-2) text-[13px] font-medium cursor-pointer"
                        style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
                      >
                        Add your first food
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <NewFoodModal onClose={() => setModalOpen(false)} onSave={handleCreate} />}
    </DietitianDashboardShell>
  );
}
