"use client";

import { useState } from "react";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

type Category = "all" | "cutting" | "clinical" | "sport" | "maintenance";

interface Template {
  name: string;
  meta: string;
  category: Category;
  pillLabel: string;
  pillClass: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  usedCount: string;
  updatedAgo: string;
}

const TEMPLATES: Template[] = [
  {
    name: "Cutting · West African staples",
    meta: "Halal · high‑P · 4‑week cycle",
    category: "cutting",
    pillLabel: "Cutting",
    pillClass: "cutting",
    kcal: "1,650",
    protein: "142g",
    carbs: "160g",
    fat: "52g",
    usedCount: "22 plans this year",
    updatedAgo: "Updated 2 weeks ago",
  },
  {
    name: "PCOS · low‑GI protocol",
    meta: "Inositol guidance · 12‑week protocol",
    category: "clinical",
    pillLabel: "PCOS",
    pillClass: "pcos",
    kcal: "1,800",
    protein: "130g",
    carbs: "180g",
    fat: "62g",
    usedCount: "9 plans this year",
    updatedAgo: "Updated 1 month ago",
  },
  {
    name: "Stepped carb · CGM‑aware",
    meta: "16‑week protocol · weekly carb step",
    category: "clinical",
    pillLabel: "T2 diabetes",
    pillClass: "diabetes",
    kcal: "1,950",
    protein: "148g",
    carbs: "170g",
    fat: "76g",
    usedCount: "14 plans this year",
    updatedAgo: "Updated 3 weeks ago",
  },
  {
    name: "Sport performance · contact",
    meta: "Periodised · creatine timing · 8‑week",
    category: "sport",
    pillLabel: "Sport",
    pillClass: "sport",
    kcal: "3,200",
    protein: "198g",
    carbs: "420g",
    fat: "88g",
    usedCount: "6 plans this year",
    updatedAgo: "Updated 5 weeks ago",
  },
  {
    name: "Gestational · 2nd / 3rd trim",
    meta: "Iron + folate · weekly weight check",
    category: "clinical",
    pillLabel: "Gestational",
    pillClass: "gestational",
    kcal: "2,300",
    protein: "142g",
    carbs: "280g",
    fat: "78g",
    usedCount: "4 plans this year",
    updatedAgo: "Updated 1 month ago",
  },
  {
    name: "Maintenance · West African",
    meta: "16‑week · balanced macros",
    category: "maintenance",
    pillLabel: "Maintenance",
    pillClass: "maintenance",
    kcal: "2,100",
    protein: "152g",
    carbs: "232g",
    fat: "72g",
    usedCount: "18 plans this year",
    updatedAgo: "Updated 1 week ago",
  },
  {
    name: "Cutting · vegetarian",
    meta: "High‑P from legumes · 4‑week cycle",
    category: "cutting",
    pillLabel: "Cutting",
    pillClass: "cutting",
    kcal: "1,700",
    protein: "128g",
    carbs: "180g",
    fat: "58g",
    usedCount: "8 plans this year",
    updatedAgo: "Updated 2 months ago",
  },
  {
    name: "Low FODMAP · 6‑week elim",
    meta: "Then 8‑week reintroduction",
    category: "maintenance",
    pillLabel: "IBS / FODMAP",
    pillClass: "maintenance",
    kcal: "1,850",
    protein: "128g",
    carbs: "190g",
    fat: "68g",
    usedCount: "5 plans this year",
    updatedAgo: "Updated 1 month ago",
  },
];

const PILL_STYLES: Record<string, React.CSSProperties> = {
  cutting: {
    background: "var(--gym-soft)",
    color: "var(--gym)",
    border: "1px solid oklch(0.88 0.04 248)",
  },
  pcos: {
    background: "var(--dietitian-soft)",
    color: "var(--dietitian)",
    border: "1px solid oklch(0.88 0.04 300)",
  },
  diabetes: {
    background: "oklch(0.94 0.06 75)",
    color: "oklch(0.42 0.13 75)",
    border: "1px solid oklch(0.88 0.07 75)",
  },
  sport: {
    background: "var(--signal-soft)",
    color: "var(--signal-ink)",
    border: "1px solid oklch(0.88 0.05 148)",
  },
  gestational: {
    background: "oklch(0.94 0.06 320)",
    color: "oklch(0.45 0.16 320)",
    border: "1px solid oklch(0.88 0.07 320)",
  },
  maintenance: {
    background: "var(--bg-2)",
    color: "var(--fg-2)",
    border: "1px solid var(--border)",
  },
};

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cutting", label: "Cutting" },
  { value: "clinical", label: "Clinical" },
  { value: "sport", label: "Sport" },
  { value: "maintenance", label: "Maintenance" },
];

export default function DietitianMealPlansPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const filtered = TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    const matchesSearch = search === "" || t.name.toLowerCase().includes(search.toLowerCase()) || t.meta.toLowerCase().includes(search.toLowerCase()) || t.pillLabel.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <DietitianDashboardShell
      activeItem="Meal plans"
      crumb="Meal plan library"
      actions={
        <Link
          href="/dashboard/dietitian/meal-plans/create"
          className="btn-primary-v2 sm"
        >
          + New template
        </Link>
      }
    >
      {/* Page header */}
      <div>
        <h1
          className="text-[30px] font-medium"
          style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
        >
          Meal plan library
        </h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          8 active templates &middot; used in 142 client plans &middot; drag a
          template to start a new plan in 30 seconds
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Templates", value: "8", delta: "+ 1 this month" },
          { label: "Plans built · MTD", value: "24", delta: "↑ 18% MoM" },
          { label: "Most picked", value: "Cutting · WA", small: true, delta: "22 plans this year" },
          { label: "Avg adherence", value: "76%", delta: "↑ 4 pts MoM" },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-(--r-3) px-4.5 py-4"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.04em]"
              style={{ color: "var(--fg-3)" }}
            >
              {k.label}
            </div>
            <div
              className={`font-medium mt-1.5 ${k.small ? "text-[17px]" : "text-[24px]"}`}
              style={{
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {k.value}
            </div>
            <div
              className="font-mono text-[11.5px] mt-1"
              style={{ color: "var(--signal-ink)" }}
            >
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter toolbar */}
      <div
        className="rounded-(--r-3) flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3.5 py-2.5"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-0 sm:min-w-[280px]"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-2)",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--fg-3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Search by condition, cuisine, or kcal range…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
            style={{ color: "var(--ink)" }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer"
              style={{
                border:
                  activeCategory === c.value
                    ? "1px solid var(--ink)"
                    : "1px solid var(--border)",
                background:
                  activeCategory === c.value ? "var(--ink)" : "var(--bg)",
                color:
                  activeCategory === c.value ? "var(--bg)" : "var(--fg-3)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((t) => (
          <div
            key={t.name}
            className="rounded-(--r-3) overflow-hidden cursor-pointer"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              transition: "border-color var(--motion-fast) var(--ease)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            {/* Head */}
            <div className="px-5.5 pt-4.5 pb-3.5">
              <span
                className="inline-block font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-(--r-1) mb-2"
                style={PILL_STYLES[t.pillClass]}
              >
                {t.pillLabel}
              </span>
              <div
                className="text-[16px] font-medium"
                style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}
              >
                {t.name}
              </div>
              <div
                className="font-mono text-[11px] uppercase tracking-[0.04em] mt-1"
                style={{ color: "var(--fg-3)" }}
              >
                {t.meta}
              </div>
            </div>

            {/* Macros row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 px-5.5 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {[
                { label: "Kcal", value: t.kcal },
                { label: "Protein", value: t.protein },
                { label: "Carbs", value: t.carbs },
                { label: "Fat", value: t.fat },
              ].map((m, i) => (
                <div
                  key={m.label}
                  className="px-2.5"
                  style={{
                    borderRight:
                      i < 3 ? "1px solid var(--border)" : "none",
                    paddingLeft: i === 0 ? "0" : undefined,
                    paddingRight: i === 3 ? "0" : undefined,
                  }}
                >
                  <div
                    className="font-mono text-[9.5px] uppercase tracking-[0.04em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    {m.label}
                  </div>
                  <div
                    className="text-[14px] font-medium mt-0.75"
                    style={{
                      color: "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-5.5 py-3 flex justify-between items-center"
              style={{
                background: "var(--bg-2)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span
                className="text-[12.5px] font-medium"
                style={{
                  color: "var(--ink)",
                  letterSpacing: "-0.005em",
                }}
              >
                {t.usedCount}
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.04em]"
                style={{ color: "var(--fg-3)" }}
              >
                {t.updatedAgo}
              </span>
            </div>
          </div>
        ))}

        {/* New template tile */}
        <div
          className="rounded-(--r-3) flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[220px]"
          style={{
            border: "1.5px dashed var(--border-2)",
            color: "var(--fg-3)",
            transition: "border-color var(--motion-fast) var(--ease), color var(--motion-fast) var(--ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--ink)";
            e.currentTarget.style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-2)";
            e.currentTarget.style.color = "var(--fg-3)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <div className="text-[14px] font-medium">New template</div>
          <div
            className="text-[12.5px] text-center"
            style={{ maxWidth: "28ch" }}
          >
            Build from scratch or duplicate an existing one
          </div>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
