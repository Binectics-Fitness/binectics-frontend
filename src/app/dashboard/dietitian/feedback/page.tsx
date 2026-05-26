import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const MEALS = [
  { name: "Folake A.", day: "Day 12 · breakfast", meal: "High protein oats", status: "ok", statusText: "✓ on plan", time: "Today 07:42" },
  { name: "Adaora T.", day: "Day 8 · lunch", meal: "Jollof + chicken", status: "ok", statusText: "✓ on plan", time: "Today 13:18" },
  { name: "Bisi O.", day: "Day 22 · dinner", meal: "Egusi (homemade)", status: "warn", statusText: "? check macros", time: "Yesterday 19:42" },
  { name: "Kemi E.", day: "Day 4 · snack", meal: "Banana + nut butter", status: "ok", statusText: "✓ on plan", time: "Yesterday 15:12" },
  { name: "Samuel A.", day: "Day 1 · breakfast", meal: "Pap with milk + boiled egg", status: "ok", statusText: "✓ on plan", time: "2 days ago" },
  { name: "Chinedu O.", day: "Day 18 · dinner", meal: "Fish + plantain (deep fried)", status: "danger", statusText: "! not on plan", time: "2 days ago" },
];

function pillStyle(status: string) {
  if (status === "ok") return { background: "var(--signal-soft)", color: "var(--signal-ink)" };
  if (status === "warn") return { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" };
  return { background: "var(--danger-soft)", color: "var(--danger)" };
}

export default function DietitianFeedbackPage() {
  return (
    <DietitianDashboardShell activeItem="Settings" crumb="Meal feedback">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Meal feedback &middot; 22 awaiting review</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {MEALS.map((m, i) => (
          <div key={i} className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {/* Image placeholder */}
            <div className="aspect-[4/3]" style={{ background: "linear-gradient(135deg, oklch(0.85 0.05 80), oklch(0.72 0.08 60))" }} />
            <div className="p-5.5 pt-3.5">
              <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{m.name}</div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5 mb-2" style={{ color: "var(--fg-3)" }}>{m.day}</div>
              <div className="text-[13px] mb-3" style={{ color: "var(--fg-2)" }}>{m.meal}</div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={pillStyle(m.status)}>{m.statusText}</span>
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{m.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DietitianDashboardShell>
  );
}
