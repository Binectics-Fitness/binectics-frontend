"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { progressService, type DietPlan } from "@/lib/api/progress";

type FoodSource = "Diet plans" | "Client meal logs";

type FoodRow = {
  name: string;
  source: FoodSource;
  plansCount: number;
  totalMentions: number;
};

const SOURCE_STYLES: Record<FoodSource, CSSProperties> = {
  "Diet plans": { background: "var(--dietitian-soft)", color: "var(--dietitian)" },
  "Client meal logs": { background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" },
};

const SOURCE_FILTERS = ["All", "Diet plans", "Client meal logs"] as const;

export default function DietitianFoodsPage() {
  const [allFoods, setAllFoods] = useState<FoodRow[]>([]);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<(typeof SOURCE_FILTERS)[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const plansRes = await progressService.getProviderDietPlans(100);

      if (!mounted) return;

      if (!plansRes.success || !plansRes.data) {
        setAllFoods([]);
        setLoading(false);
        return;
      }

      const foodMap = new Map<string, FoodRow>();

      plansRes.data.forEach((plan: DietPlan) => {
        plan.meals.forEach((meal) => {
          meal.foods.forEach((food) => {
            const key = food.trim().toLowerCase();
            if (!key) return;

            const existing = foodMap.get(key);
            if (!existing) {
              foodMap.set(key, {
                name: food.trim(),
                source: "Diet plans",
                plansCount: 1,
                totalMentions: 1,
              });
              return;
            }

            existing.totalMentions += 1;
            existing.plansCount += 1;
          });
        });
      });

      const sorted = Array.from(foodMap.values()).sort(
        (a, b) => b.totalMentions - a.totalMentions,
      );

      setAllFoods(sorted);
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter((food) => {
      if (sourceFilter !== "All" && food.source !== sourceFilter) {
        return false;
      }

      if (!q) return true;
      return food.name.toLowerCase().includes(q);
    });
  }, [allFoods, query, sourceFilter]);

  const kpis = useMemo(
    () => [
      { label: "Total foods", value: String(allFoods.length), delta: "Unique foods in plans" },
      {
        label: "Most used food",
        value: allFoods[0]?.name ?? "-",
        delta: allFoods[0] ? `${allFoods[0].totalMentions} mentions` : "No data",
      },
      {
        label: "Mentions",
        value: String(allFoods.reduce((sum, f) => sum + f.totalMentions, 0)),
        delta: "Across all diet plans",
      },
      {
        label: "Visible rows",
        value: String(filteredFoods.length),
        delta: "After filters",
      },
    ],
    [allFoods, filteredFoods],
  );

  return (
    <DietitianDashboardShell
      activeItem="Food database"
      crumb="Food database"
      actions={
        <div className="flex gap-2">
          <button className="btn-ghost-v2 sm">Export</button>
          <button className="btn-primary-v2 sm">Refresh</button>
        </div>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Food database</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>{loading ? "Loading foods from diet plans..." : `${filteredFoods.length} foods found`}</div>
      </div>

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
        <div className="flex gap-1 flex-wrap">
          {SOURCE_FILTERS.map((pill) => (
            <span key={pill} onClick={() => setSourceFilter(pill)} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer" style={sourceFilter === pill ? { background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" } : { background: "var(--bg)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>{pill}</span>
          ))}
        </div>
      </div>

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[760px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Food", "Source", "Plans", "Mentions"].map((h, hi) => (
                  <th key={h} className={`px-4.5 py-2.5 font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] ${hi >= 2 ? "text-right" : "text-left"}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map((f, i) => (
                <tr key={`${f.name}-${i}`} style={{ borderBottom: i < filteredFoods.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4.5 py-3">
                    <div className="font-medium" style={{ color: "var(--ink)" }}>{f.name}</div>
                  </td>
                  <td className="px-4.5 py-3">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-1.75 py-0.5 rounded-full" style={SOURCE_STYLES[f.source]}>{f.source}</span>
                  </td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.plansCount}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.totalMentions}</td>
                </tr>
              ))}
              {!loading && filteredFoods.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4.5 py-6 text-center text-[13px]" style={{ color: "var(--fg-3)" }}>
                    No foods found for the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
