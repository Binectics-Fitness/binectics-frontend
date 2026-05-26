import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Database",
  description: "Manage your custom food database with macronutrient data.",
};

const FOODS = [
  { name: "Jollof rice · West African", meta: "Tomato base · long-grain rice", source: "custom" as const, serving: "1 cup · 200g", kcal: "320", protein: "6g", carbs: "62g", fat: "5g", logged: "214" },
  { name: "Egusi soup", meta: "Melon seed base · with spinach", source: "fcdb" as const, serving: "1 bowl · 350g", kcal: "480", protein: "28g", carbs: "14g", fat: "36g", logged: "142" },
  { name: "Plantain · fried", meta: "Ripe · sliced · sunflower oil", source: "fcdb" as const, serving: "1 cup · 150g", kcal: "288", protein: "2g", carbs: "58g", fat: "6g", logged: "118" },
  { name: "Chicken breast · grilled", meta: "Skinless · no oil", source: "usda" as const, serving: "100g cooked", kcal: "165", protein: "31g", carbs: "0g", fat: "4g", logged: "186" },
  { name: "Beans · brown · stewed", meta: "Honey beans · West African style", source: "custom" as const, serving: "1 cup · 180g", kcal: "242", protein: "14g", carbs: "38g", fat: "6g", logged: "98" },
  { name: "Yam · boiled", meta: "White yam · no salt", source: "fcdb" as const, serving: "1 cup · 150g", kcal: "177", protein: "2g", carbs: "42g", fat: "0g", logged: "82" },
  { name: "Egg · whole · scrambled", meta: "1 large · cooked in butter", source: "usda" as const, serving: "1 large · 50g", kcal: "100", protein: "7g", carbs: "1g", fat: "8g", logged: "156" },
  { name: "Suya · beef", meta: "Grilled · yaji spice · 100g portion", source: "custom" as const, serving: "100g", kcal: "208", protein: "26g", carbs: "4g", fat: "10g", logged: "74" },
  { name: "Oats · rolled · cooked", meta: "Plain · with water", source: "usda" as const, serving: "1 cup · 234g", kcal: "158", protein: "6g", carbs: "28g", fat: "3g", logged: "142" },
  { name: "Pap · maize porridge", meta: "Thin pap · breakfast staple", source: "fcdb" as const, serving: "1 cup · 240g", kcal: "112", protein: "3g", carbs: "22g", fat: "1g", logged: "62" },
  { name: "Pounded yam", meta: "Traditional · paired with soup", source: "fcdb" as const, serving: "1 cup · 240g", kcal: "285", protein: "3g", carbs: "68g", fat: "0g", logged: "54" },
  { name: "Avocado · sliced", meta: "Hass · medium", source: "usda" as const, serving: "½ avocado · 100g", kcal: "160", protein: "2g", carbs: "9g", fat: "15g", logged: "88" },
];

const SOURCE_STYLES: Record<string, React.CSSProperties> = {
  usda: { background: "var(--gym-soft)", color: "var(--gym)" },
  custom: { background: "var(--dietitian-soft)", color: "var(--dietitian)" },
  fcdb: { background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" },
};

const SOURCE_LABELS: Record<string, string> = {
  usda: "USDA",
  custom: "Custom",
  fcdb: "Nigerian FCDB",
};

export default function DietitianFoodsPage() {
  return (
    <DietitianDashboardShell
      activeItem="Food database"
      crumb="Food database"
      actions={
        <div className="flex gap-2">
          <button className="btn-ghost-v2 sm">Import CSV</button>
          <button className="btn-primary-v2 sm">+ Add food</button>
        </div>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Food database</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>12,842 foods · 9,148 from USDA · 1,840 from Nigerian FCDB · 1,854 custom · search by name or scan barcode</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total foods", value: "12,842", delta: "+ 142 this month" },
          { label: "Custom (yours)", value: "1,854", delta: "86 in shared plans" },
          { label: "Most logged", value: "Jollof rice", small: true, delta: "214 client logs" },
          { label: "Verified", value: "98%", delta: "USDA & FCDB sources" },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium mt-1.5 ${k.small ? "text-[17px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Search + filter toolbar */}
      <div className="rounded-(--r-3) flex flex-col sm:flex-row sm:items-center gap-3.5 px-3.5 py-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-0 sm:min-w-[280px]" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input placeholder="Search foods · paste barcode · scan with camera…" className="flex-1 border-0 bg-transparent text-[13px] outline-none" style={{ color: "var(--ink)" }} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Custom", "USDA", "Nigerian FCDB", "Verified"].map((pill, i) => (
            <span key={pill} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer" style={i === 0 ? { background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" } : { background: "var(--bg)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>{pill}</span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[900px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Food", "Source", "Serving", "Kcal", "Protein", "Carbs", "Fat", "Logs"].map((h, hi) => (
                  <th key={h} className={`px-4.5 py-2.5 font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] ${hi >= 3 ? "text-right" : "text-left"}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FOODS.map((f, i) => (
                <tr key={f.name} className="hover:bg-bg-2 cursor-pointer" style={{ borderBottom: i < FOODS.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4.5 py-3">
                    <div className="font-medium" style={{ color: "var(--ink)" }}>{f.name}</div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{f.meta}</div>
                  </td>
                  <td className="px-4.5 py-3">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-1.75 py-0.5 rounded-full" style={SOURCE_STYLES[f.source]}>{SOURCE_LABELS[f.source]}</span>
                  </td>
                  <td className="px-4.5 py-3" style={{ color: "var(--ink)" }}>{f.serving}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.kcal}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.protein}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.carbs}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.fat}</td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{f.logged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        <div className="flex justify-between items-center px-4.5 py-3 font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-3)" }}>
          <span>Showing <strong className="text-[13px] font-medium normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", letterSpacing: "-0.005em" }}>1–12</strong> of <strong className="text-[13px] font-medium normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", letterSpacing: "-0.005em" }}>12,842</strong> foods</span>
          <div className="flex gap-0.5">
            {["‹", "1", "2", "3", "4", "›"].map((n, i) => (
              <span key={n + i} className="w-7 h-7 flex items-center justify-center rounded-(--r-2) cursor-pointer text-[12px]" style={n === "1" ? { background: "var(--ink)", color: "var(--bg)" } : { color: "var(--fg-2)" }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
