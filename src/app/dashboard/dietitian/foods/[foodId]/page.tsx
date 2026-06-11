"use client";

import React from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const NUTRITION = [
  { label: "Energy", value: "158 kcal", indent: false, bold: false },
  { label: "Carbohydrate", value: "32.4 g", indent: false, bold: true },
  { label: "of which sugars", value: "1.2 g", indent: true, bold: false },
  { label: "starch", value: "30.8 g", indent: true, bold: false },
  { label: "Protein", value: "3.1 g", indent: false, bold: true },
  { label: "Fat", value: "2.6 g", indent: false, bold: true },
  { label: "saturated", value: "0.4 g", indent: true, bold: false },
  { label: "Fibre", value: "0.8 g", indent: false, bold: false },
  { label: "Sodium", value: "412 mg", indent: false, bold: false },
];

const INGREDIENTS = [
  { name: "Long-grain rice", amount: "80 g raw" },
  { name: "Tomato puree", amount: "3 tbsp" },
  { name: "Vegetable oil", amount: "1 tbsp" },
  { name: "Onion · diced", amount: "1/4 medium" },
  { name: "Chicken stock", amount: "200 ml" },
  { name: "Bay leaf · thyme · curry", amount: "to taste" },
];

export default function DietitianSingleFoodPage({ params }: { params: Promise<{ foodId: string }> }) {
  const { foodId } = React.use(params);
  void foodId;

  return (
    <DietitianDashboardShell activeItem="Food database" crumb="Jollof rice">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Jollof rice</h1>
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
            West African &middot; staple &middot; custom entry &middot; used in <strong className="font-medium" style={{ color: "var(--ink)" }}>14 active plans</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Duplicate</button>
          <button className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Save changes</button>
        </div>
      </div>

      {/* Nutrition + Ingredients */}
      <div className="grid lg:grid-cols-2 gap-3.5">
        {/* Per 100g */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Per 100 g &middot; cooked</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[13.5px]">
              <tbody>
                {NUTRITION.map((n) => (
                  <tr key={n.label}>
                    <td
                      className="px-3.5 py-3"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        paddingLeft: n.indent ? 22 : undefined,
                        color: n.indent ? "var(--fg-3)" : undefined,
                        fontWeight: n.bold ? 600 : 400,
                      }}
                    >
                      {n.label}
                    </td>
                    <td
                      className="px-3.5 py-3 text-right font-mono"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        color: n.indent ? "var(--fg-3)" : undefined,
                        fontWeight: n.bold ? 500 : 400,
                      }}
                    >
                      {n.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Ingredients */}
          <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Ingredients &middot; per serving</h3>
            <div className="flex flex-col gap-1.5 text-[13.5px]">
              {INGREDIENTS.map((ing) => (
                <div key={ing.name} className="flex justify-between">
                  <span>{ing.name}</span>
                  <span className="font-mono">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Notes</h3>
            <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>
              Macros above assume <strong style={{ color: "var(--ink)" }}>low-oil method</strong> (1 tbsp instead of typical 2-3 tbsp). If your client cooks traditionally, add ~30 kcal and 3.5g fat per serving.
            </p>
          </div>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
