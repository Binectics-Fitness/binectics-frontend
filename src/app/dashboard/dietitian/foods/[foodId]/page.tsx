"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  nutritionService,
  type FoodItem,
  type UpdateFoodItemRequest,
} from "@/lib/api/nutrition";
import { toast } from "@/components/Toast";

/* ─── Form model ────────────────────────────────────────────────────────── */

type FoodForm = {
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

function toForm(f: FoodItem): FoodForm {
  const num = (n: number | undefined | null) => (n === undefined || n === null ? "" : String(n));
  return {
    name: f.name,
    category: f.category ?? "",
    servingLabel: f.serving_label,
    caloriesKcal: num(f.calories_kcal),
    proteinG: num(f.protein_g),
    carbsG: num(f.carbs_g),
    fatG: num(f.fat_g),
    fiberG: num(f.fiber_g),
    sugarG: num(f.sugar_g),
    sodiumMg: num(f.sodium_mg),
    notes: f.notes ?? "",
  };
}

function parseForm(form: FoodForm): { payload: UpdateFoodItemRequest } | { error: string } {
  if (!form.name.trim()) return { error: "Name is required." };
  if (!form.servingLabel.trim()) return { error: "Serving label is required." };

  const parse = (raw: string, label: string, required: boolean): number | undefined | { error: string } => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      return required ? { error: `${label} is required.` } : undefined;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) return { error: `${label} must be a number ≥ 0.` };
    return n;
  };

  const fields: [keyof FoodForm, string, boolean][] = [
    ["caloriesKcal", "Calories", true],
    ["proteinG", "Protein", true],
    ["carbsG", "Carbs", true],
    ["fatG", "Fat", true],
    ["fiberG", "Fiber", false],
    ["sugarG", "Sugar", false],
    ["sodiumMg", "Sodium", false],
  ];
  const nums: Partial<Record<keyof FoodForm, number | undefined>> = {};
  for (const [key, label, required] of fields) {
    const result = parse(form[key], label, required);
    if (typeof result === "object" && result !== null) return result;
    nums[key] = result;
  }

  return {
    payload: {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      servingLabel: form.servingLabel.trim(),
      caloriesKcal: nums.caloriesKcal as number,
      proteinG: nums.proteinG as number,
      carbsG: nums.carbsG as number,
      fatG: nums.fatG as number,
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

/* ─── Page — real food detail (was a hardcoded "Jollof rice" mock) ─────── */

export default function DietitianSingleFoodPage({ params }: { params: Promise<{ foodId: string }> }) {
  const { foodId } = use(params);
  const router = useRouter();

  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FoodForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setFood(null);
      setForm(null);
      const res = await nutritionService.getFood(foodId);
      if (!mounted) return;
      if (res.success && res.data) {
        setFood(res.data);
        setForm(toForm(res.data));
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [foodId]);

  const dirty = useMemo(() => {
    if (!food || !form) return false;
    const baseline = toForm(food);
    return (Object.keys(baseline) as (keyof FoodForm)[]).some((k) => baseline[k] !== form[k]);
  }, [food, form]);

  const set = (key: keyof FoodForm, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const handleSave = async () => {
    if (!form || !food) return;
    const parsed = parseForm(form);
    if ("error" in parsed) {
      toast.error(parsed.error);
      return;
    }
    setSaving(true);
    const res = await nutritionService.updateFood(food._id, parsed.payload);
    setSaving(false);
    if (res.success && res.data) {
      setFood(res.data);
      setForm(toForm(res.data));
      toast.success("Changes saved.");
    } else {
      toast.error(res.message ?? "Failed to save changes.");
    }
  };

  const handleDuplicate = async () => {
    if (!food) return;
    setDuplicating(true);
    const res = await nutritionService.duplicateFood(food._id);
    setDuplicating(false);
    if (res.success && res.data) {
      toast.success(`Duplicated "${food.name}".`);
      router.push(`/dashboard/dietitian/foods/${res.data._id}`);
    } else {
      toast.error(res.message ?? "Failed to duplicate food.");
    }
  };

  const handleArchive = async () => {
    if (!food) return;
    if (!confirm(`Archive "${food.name}"? It will be hidden from your library.`)) return;
    setArchiving(true);
    const res = await nutritionService.archiveFood(food._id);
    setArchiving(false);
    if (res.success) {
      toast.success(`Archived "${food.name}".`);
      router.push("/dashboard/dietitian/foods");
    } else {
      toast.error(res.message ?? "Failed to archive food.");
    }
  };

  if (loading) {
    return (
      <DietitianDashboardShell activeItem="Food database" crumb="Food">
        <AsyncSpinner size="page" label="Loading food" />
      </DietitianDashboardShell>
    );
  }

  if (notFound || !food || !form) {
    return (
      <DietitianDashboardShell activeItem="Food database" crumb="Not found">
        <EmptySlate
          message="This food could not be found."
          hint="It may have been archived or removed."
        />
        <Link
          href="/dashboard/dietitian/foods"
          className="inline-flex h-9 items-center px-4 rounded-(--r-2) text-[13px] font-medium self-start"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          Back to food database
        </Link>
      </DietitianDashboardShell>
    );
  }

  const textField = (key: keyof FoodForm, label: string, required?: boolean, placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls} style={{ color: "var(--fg-3)" }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      <input
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
        style={inputStyle}
      />
    </div>
  );

  const macroField = (key: keyof FoodForm, label: string, required?: boolean) => (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls} style={{ color: "var(--fg-3)" }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      <input
        type="number"
        min={0}
        step="any"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
        style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
      />
    </div>
  );

  return (
    <DietitianDashboardShell activeItem="Food database" crumb={food.name}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>{food.name}</h1>
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
            {food.category ? `${food.category} · ` : ""}{food.serving_label}
            {dirty && <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.04em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" }}>Unsaved changes</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleArchive}
            disabled={archiving}
            className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer disabled:opacity-50"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--danger)" }}
          >
            {archiving ? "Archiving..." : "Archive"}
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer disabled:opacity-50"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}
          >
            {duplicating ? "Duplicating..." : "Duplicate"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Details + macros */}
      <div className="grid lg:grid-cols-2 gap-3.5">
        <div className="rounded-(--r-3) p-5.5 flex flex-col gap-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Details</h3>
          {textField("name", "Name", true)}
          <div className="grid grid-cols-2 gap-3">
            {textField("category", "Category", false, "e.g. Grains")}
            {textField("servingLabel", "Serving label", true, "e.g. 1 cup cooked (200 g)")}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "var(--fg-3)" }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Preparation assumptions, sourcing, client guidance..."
              rows={4}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="rounded-(--r-3) p-5.5 flex flex-col gap-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Nutrition · per serving</h3>
          <div className="grid grid-cols-2 gap-3">
            {macroField("caloriesKcal", "Calories (kcal)", true)}
            {macroField("proteinG", "Protein (g)", true)}
            {macroField("carbsG", "Carbs (g)", true)}
            {macroField("fatG", "Fat (g)", true)}
            {macroField("fiberG", "Fiber (g)")}
            {macroField("sugarG", "Sugar (g)")}
            {macroField("sodiumMg", "Sodium (mg)")}
          </div>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
