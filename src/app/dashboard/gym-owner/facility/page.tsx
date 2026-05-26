import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const LOCATIONS = [
  { name: "Sea Point", badge: "Flagship", addr: "12 Beach Rd · Sea Point · 8005", members: "380", floor: "1,240", staff: "8", rating: "4.9", amenities: ["24/7", "Showers · 6", "Sauna", "Olympic · 4", "Cardio · 18", "Lockers · 80", "Parking"], hours: "5am–10pm" },
  { name: "Foreshore", badge: "CBD", addr: "88 Adderley St · Foreshore · 8001", members: "312", floor: "920", staff: "6", rating: "4.8", amenities: ["5:30am–10pm", "Showers · 4", "Cardio · 14", "Free weights", "Lockers · 60"], hours: "5:30am–10pm" },
  { name: "Camps Bay", badge: "Boutique", addr: "14 Victoria Rd · Camps Bay · 8005", members: "192", floor: "540", staff: "4", rating: "4.9", amenities: ["Showers · 3", "Ocean view", "Free weights", "Cardio · 8"], hours: "6am–9pm" },
  { name: "Woodstock", badge: "CrossFit", addr: "22 Albert Rd · Woodstock · 7915", members: "400", floor: "1,680", staff: "4", rating: "4.6", amenities: ["24/7", "Rigs · 6", "Ropes", "Open floor", "Lockers · 40"], hours: "24/7 · Pro plan" },
];

export default function GymLocationsPage() {
  return (
    <GymDashboardShell
      activeItem="Locations · 4"
      crumb="Locations"
      actions={<button className="btn-primary-v2 sm">+ Add location</button>}
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Locations</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>4 active across Cape Town · 1 in Foreshore CBD · 3 by the coast</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {LOCATIONS.map((l) => (
          <div key={l.name} className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {/* Photo placeholder */}
            <div className="relative h-[140px]" style={{ background: "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 10px, oklch(0.93 0.012 248) 10px 20px)", borderBottom: "1px solid var(--border)" }}>
              <span className="absolute top-2.5 left-2.5 inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg border border-border" style={{ color: "var(--ink)" }}>{l.badge}</span>
            </div>

            {/* Body */}
            <div className="px-4.5 py-4">
              <h3 className="text-[18px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>{l.name}</h3>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>{l.addr}</div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { k: "Members", v: l.members },
                  { k: "Floor m²", v: l.floor },
                  { k: "Staff", v: l.staff },
                  { k: "Rating", v: l.rating },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.k}</div>
                    <div className="text-[16px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-1.5 px-4.5 pb-3">
              {l.amenities.map((a) => (
                <span key={a} className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[11.5px] bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{a}</span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Open · <strong style={{ color: "var(--ink)" }}>{l.hours}</strong></span>
              <Link href={`/dashboard/gym-owner/facility/${l.name.toLowerCase().replace(/\s/g, "-")}`} className="btn-ghost-v2 sm">Manage location</Link>
            </div>
          </div>
        ))}
      </div>
    </GymDashboardShell>
  );
}
