"use client";

import React from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

/**
 * Gym Single Location — Sea Point
 * Hardcoded to match gym-single-location.html prototype.
 * Dynamic route params are Promises in Next.js 16 — use React.use(params).
 */

const KPIS = [
  { label: "Members", value: "412", delta: "↑ 18 MoM" },
  { label: "Check-ins · today", value: "142", delta: "Currently 55 on floor" },
  { label: "Revenue · MTD", value: "R 348k", delta: "↑ 12% MoM" },
  { label: "Avg rating", value: "4.9", delta: "218 reviews" },
];

const AMENITIES = [
  "24/7 access", "Free parking · 32 bays", "Sauna · steam room", "Mat area · 220 m²",
  "Olympic platforms · 4", "Cable stack · 4", "Treadmills · 8", "Bikes · 6",
  "Rowers · 4", "Bench press · 4", "Squat racks · 6", "Glute drive · 2",
  "Recovery zone", "Showers · 12", "Lockers · 88", "Wifi · 1Gbps",
  "Aircon · individually zoned", "Music · curated daily",
];

const HOURS = [
  { day: "Mon–Fri", time: "5:30am – 22:00" },
  { day: "Sat", time: "6:00am – 20:00" },
  { day: "Sun", time: "7:00am – 18:00" },
  { day: "Holidays", time: "9:00am – 17:00" },
];

export default function SingleLocationPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = React.use(params);
  const locationName = locationId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <GymDashboardShell
      activeItem="Locations · 4"
      crumb="Locations"
      actions={<><button className="btn-ghost-v2 sm">Photos · 12</button><button className="btn-primary-v2 sm">Edit location</button></>}
    >
      {/* Breadcrumb override */}
      <div className="text-[13px] -mt-2 mb-1" style={{ color: "var(--fg-3)" }}>
        <Link href="/dashboard/gym-owner" className="hover:underline" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Iron Lab</Link>
        <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
        <Link href="/dashboard/gym-owner/locations" className="hover:underline" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Locations</Link>
        <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
        <span className="font-medium" style={{ color: "var(--ink)" }}>{locationName}</span>
      </div>

      {/* Page head */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>{locationName}</h1>
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>142 Main Road &middot; 8005 &middot; opens 5:30am &middot; capacity 60</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Amenities + Hours — 2fr 1fr */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Amenities */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Amenities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {AMENITIES.map((a) => (
              <div key={a} className="flex items-center gap-2 py-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--signal-ink)" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Opening hours */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Opening hours</h3>
          <table className="w-full border-collapse text-[13.5px]">
            <tbody>
              {HOURS.map((h) => (
                <tr key={h.day} className="hover:bg-bg-2">
                  <td className="py-3 px-3.5" style={{ borderBottom: "1px solid var(--border)" }}><strong className="font-medium" style={{ color: "var(--ink)" }}>{h.day}</strong></td>
                  <td className="py-3 px-3.5 text-right font-mono" style={{ borderBottom: "1px solid var(--border)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{h.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[12px] mt-3.5" style={{ color: "var(--fg-3)" }}>Members with 24/7 plan access any time via QR. Standard plans honor these hours.</p>
        </div>
      </div>
    </GymDashboardShell>
  );
}
