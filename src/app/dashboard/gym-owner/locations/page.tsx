import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddLocationButton } from "./_actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locations",
  description: "Manage your gym locations and branch settings.",
};

/**
 * Gym Locations — Iron Lab · 4 active across Cape Town
 * Hardcoded to match gym-locations.html prototype.
 */

const LOCATIONS = [
  {
    id: "sea-point",
    name: "Sea Point",
    addr: "12 Beach Rd · Sea Point · 8005",
    pill: "Flagship",
    featured: true,
    gradient: "linear-gradient(135deg, oklch(0.86 0.04 80), oklch(0.78 0.06 60))",
    stats: [
      { label: "Members", value: "380" },
      { label: "Floor m²", value: "1,240" },
      { label: "Staff", value: "8" },
      { label: "Rating", value: "4.9" },
    ],
    amenities: ["24/7", "Showers · 6", "Sauna", "Olympic · 4", "Cardio · 18", "Lockers · 80", "Parking"],
    hours: "5am–10pm",
  },
  {
    id: "foreshore",
    name: "Foreshore",
    addr: "88 Adderley St · Foreshore · 8001",
    pill: "CBD",
    featured: false,
    gradient: "linear-gradient(135deg, oklch(0.86 0.04 248), oklch(0.78 0.06 230))",
    stats: [
      { label: "Members", value: "312" },
      { label: "Floor m²", value: "920" },
      { label: "Staff", value: "6" },
      { label: "Rating", value: "4.8" },
    ],
    amenities: ["5:30am–10pm", "Showers · 4", "Cardio · 14", "Free weights", "Lockers · 60"],
    hours: "5:30am–10pm",
  },
  {
    id: "camps-bay",
    name: "Camps Bay",
    addr: "14 Victoria Rd · Camps Bay · 8005",
    pill: "Boutique",
    featured: false,
    gradient: "linear-gradient(135deg, oklch(0.86 0.04 120), oklch(0.78 0.06 100))",
    stats: [
      { label: "Members", value: "192" },
      { label: "Floor m²", value: "540" },
      { label: "Staff", value: "4" },
      { label: "Rating", value: "4.9" },
    ],
    amenities: ["6am–9pm", "Mobility studio", "Sauna", "Recovery room", "Lockers · 40"],
    hours: "6am–9pm",
  },
  {
    id: "woodstock",
    name: "Woodstock",
    addr: "132 Albert Rd · Woodstock · 7925",
    pill: "CrossFit affiliate",
    featured: false,
    gradient: "linear-gradient(135deg, oklch(0.86 0.04 300), oklch(0.78 0.06 280))",
    stats: [
      { label: "Members", value: "400" },
      { label: "Floor m²", value: "680" },
      { label: "Staff", value: "4" },
      { label: "Rating", value: "4.7" },
    ],
    amenities: ["5am–9pm", "CrossFit floor", "Olympic · 6", "Outdoor pull‑up", "Lockers · 50"],
    hours: "5am–9pm",
  },
];

export default function LocationsPage() {
  return (
    <GymDashboardShell
      activeItem="Locations · 4"
      crumb="Locations"
      actions={<AddLocationButton />}
    >
      {/* Page head */}
      <div className="flex justify-between items-end pb-1">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Locations</h1>
          <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>4 active across Cape Town &middot; 1 in Foreshore CBD &middot; 3 by the coast</div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {LOCATIONS.map((loc) => (
          <div key={loc.id} className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {/* Photo */}
            <div className="relative" style={{ aspectRatio: "16/7", background: loc.gradient }}>
              <span
                className="absolute top-3.5 left-3.5 font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-[0.05em]"
                style={{
                  background: loc.featured ? "var(--ink)" : "oklch(0.98 0 0 / 0.9)",
                  color: loc.featured ? "var(--bg)" : "var(--ink)",
                }}
              >
                {loc.pill}
              </span>
            </div>

            {/* Body */}
            <div className="px-5.5 py-4.5">
              <h3 className="text-[18px] font-medium" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>{loc.name}</h3>
              <div className="font-mono text-[11.5px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>{loc.addr}</div>

              {/* Stats */}
              <div className="grid grid-cols-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                {loc.stats.map((s, i) => (
                  <div key={s.label} className="px-3" style={{ borderRight: i < 3 ? "1px solid var(--border)" : "none", paddingLeft: i === 0 ? 0 : undefined, paddingRight: i === 3 ? 0 : undefined }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.label}</div>
                    <div className="text-[18px] font-medium mt-1 leading-none" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="flex gap-1.5 flex-wrap px-5.5 py-3.5" style={{ borderTop: "1px solid var(--border)" }}>
              {loc.amenities.map((a) => (
                <span key={a} className="font-mono text-[10px] px-2 py-[3px] rounded-(--r-1) uppercase tracking-[0.04em]" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "var(--bg-2)" }}>{a}</span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-5.5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Open &middot; <strong className="font-sans text-[13px] font-medium normal-case" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{loc.hours}</strong></span>
              <Link href={`/dashboard/gym-owner/locations/${loc.id}`} className="btn-ghost-v2 sm">Manage location</Link>
            </div>
          </div>
        ))}

        {/* Add new location card */}
        <div
          className="flex items-center justify-center gap-2.5 rounded-(--r-3) text-[14px] font-medium cursor-pointer"
          style={{ border: "1.5px dashed var(--border-2)", color: "var(--fg-3)", minHeight: "280px" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>
          Add a new location
        </div>
      </div>
    </GymDashboardShell>
  );
}
