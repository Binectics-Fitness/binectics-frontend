import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const PAGES = [1, 2, 3, 4];

export default function DietitianPdfPreviewPage() {
  return (
    <DietitianDashboardShell activeItem="Meal plans" crumb="PDF preview">
      <div className="flex flex-col lg:flex-row gap-4.5 max-w-[1100px]">
        {/* Main preview */}
        <div className="flex-1 rounded-(--r-3) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-center mb-3">
            <strong className="text-[14px]" style={{ color: "var(--ink)" }}>PDF preview &middot; 4 pages</strong>
            <div className="flex gap-2">
              <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Edit plan</button>
              <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Send to Folake</button>
            </div>
          </div>

          {/* PDF mock */}
          <div className="rounded-(--r-2) p-8 px-10" style={{ background: "oklch(0.97 0.005 75)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.04)" }}>
            {/* Header */}
            <div className="flex justify-between items-end pb-3.5 mb-6" style={{ borderBottom: "2px solid var(--ink)" }}>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--fg-3)" }}>Personalized for</div>
                <h2 className="text-[32px] font-medium tracking-[-0.022em] mt-1" style={{ color: "var(--ink)" }}>Folake Adebayo</h2>
              </div>
              <div className="text-right font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                <div>Dr Nadia Hassan, RD</div>
                <div>Issued 24 May 2026</div>
                <div>Plan v3 &middot; 12 weeks</div>
              </div>
            </div>

            {/* Daily targets */}
            <div className="mb-6">
              <h3 className="text-[14px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Daily targets</h3>
              <table className="w-full text-[14px]">
                <tbody>
                  <tr>
                    <td className="py-2 pr-3"><strong>Kcal</strong></td>
                    <td className="py-2 pr-6">1,650</td>
                    <td className="py-2 pr-3"><strong>Carbs</strong></td>
                    <td className="py-2">160 g &middot; 39%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3"><strong>Protein</strong></td>
                    <td className="py-2 pr-6">142 g &middot; 34%</td>
                    <td className="py-2 pr-3"><strong>Fat</strong></td>
                    <td className="py-2">52 g &middot; 27%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3"><strong>Fibre</strong></td>
                    <td className="py-2 pr-6">&ge; 35 g</td>
                    <td className="py-2 pr-3"><strong>Water</strong></td>
                    <td className="py-2">3 L</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Day 1 sample */}
            <div>
              <h3 className="text-[14px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Day 1 &middot; sample</h3>
              <p className="leading-[1.65] mb-2"><strong>06:00 &middot; Pre-training</strong> &middot; 1/2 cup oats with 1 banana, 20g whey, cinnamon</p>
              <p className="leading-[1.65] mb-2"><strong>09:00 &middot; Breakfast</strong> &middot; 2-egg omelette, 100g spinach, 1 slice rye, 1/4 avocado</p>
              <p className="leading-[1.65] mb-2"><strong>13:00 &middot; Lunch</strong> &middot; 150g chicken, 1/2 cup brown rice, 1 cup roast veg, 1 tbsp olive oil</p>
              <p className="leading-[1.65]"><strong>19:00 &middot; Dinner</strong> &middot; 1 cup jollof (low-oil), 120g grilled fish, side salad</p>
            </div>
          </div>
        </div>

        {/* Page thumbnails */}
        <div className="w-full lg:w-[240px] flex lg:flex-col gap-2">
          {PAGES.map((p) => (
            <div
              key={p}
              className="aspect-[3/4] rounded-[4px] p-4 flex flex-col gap-1 cursor-pointer"
              style={{
                background: "oklch(0.97 0.005 75)",
                border: p === 1 ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              <div className="text-[10px] font-medium mb-1" style={{ color: "var(--ink)" }}>Page {p}</div>
              <div className="h-2 rounded-[1px]" style={{ background: "var(--ink)", width: "60%" }} />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[2px] rounded-[1px]" style={{ background: "var(--bg-3)" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
