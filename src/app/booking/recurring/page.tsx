"use client";

import Link from "next/link";
import { useState } from "react";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import SearchableSelect from "@/components/SearchableSelect";

/**
 * Recurring Booking — set up a recurring session schedule.
 * Proto: recurring-booking.html
 * Topbar + centered 600px form card with cadence buttons, day/time selects,
 * start/end pickers, skip dates, schedule preview, total + CTA.
 */

const CADENCES = ["Every week", "Every 2 weeks", "Every month", "Custom"];

const SCHEDULE = [
  "Wed 27 May 08:30", "Wed 3 Jun 08:30", "Wed 10 Jun 08:30", "Wed 17 Jun 08:30",
  "Wed 24 Jun 08:30", "Wed 1 Jul 08:30", "Wed 8 Jul 08:30", "Wed 15 Jul 08:30",
  "Wed 22 Jul 08:30", "Wed 29 Jul 08:30", "Wed 5 Aug 08:30", "Wed 12 Aug 08:30",
];

const DAY_OPTIONS = [
  { label: "Wednesday", value: "Wednesday" },
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
];

const TIME_OPTIONS = [
  { label: "08:30 · 60 min", value: "08:30" },
  { label: "06:00 · 60 min", value: "06:00" },
  { label: "17:00 · 60 min", value: "17:00" },
];

const ENDS_OPTIONS = [
  { label: "After 12 sessions", value: "12" },
  { label: "After 24 sessions", value: "24" },
  { label: "End of month", value: "eom" },
  { label: "No end date", value: "none" },
];

export default function RecurringBookingPage() {
  const [cadence, setCadence] = useState(0);
  const [day, setDay] = useState("Wednesday");
  const [time, setTime] = useState("08:30");
  const [ends, setEnds] = useState("12");

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/login" className="btn-primary-v2 sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-150 px-5 sm:px-6 py-8">
        <div className="rounded-(--r-3) p-8 sm:p-9" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Recurring · with Sarah Okafor</div>
          <h1 className="text-[26px] sm:text-[28px] font-medium leading-[1.2] mb-3" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            Set up a <em className="font-serif font-normal italic">routine</em>.
          </h1>
          <p className="text-[15px] leading-[1.6] mb-7" style={{ color: "var(--fg-2)" }}>
            Lock in a regular slot. We&apos;ll auto-book each session 14 days in advance — you can skip or cancel any week.
          </p>

          <div className="flex flex-col gap-4">
            {/* Cadence */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Cadence</label>
              <div className="flex flex-wrap gap-1.5">
                {CADENCES.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => setCadence(i)}
                    className="px-3.5 py-2.25 rounded-(--r-2) text-[13px] font-medium cursor-pointer"
                    style={{
                      background: cadence === i ? "var(--ink)" : "var(--bg)",
                      color: cadence === i ? "var(--bg)" : "var(--ink)",
                      border: `1px solid ${cadence === i ? "var(--ink)" : "var(--border)"}`,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Day + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Day</label>
                <SearchableSelect value={day} onChange={setDay} options={DAY_OPTIONS} placeholder="Select day" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Time</label>
                <SearchableSelect value={time} onChange={setTime} options={TIME_OPTIONS} placeholder="Select time" />
              </div>
            </div>

            {/* Starts + Ends */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Starts</label>
                <input type="date" defaultValue="2026-05-27" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px] outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border-2)", font: "inherit" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Ends</label>
                <SearchableSelect value={ends} onChange={setEnds} options={ENDS_OPTIONS} placeholder="Select end condition" />
              </div>
            </div>

            {/* Skip dates */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Skip these dates (optional)</label>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.75 py-1.5 rounded-full text-[12px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>Wed 26 Aug · holiday &times;</span>
                <button className="px-2.75 py-1.5 rounded-full text-[12px] cursor-pointer" style={{ background: "var(--bg)", border: "1px dashed var(--border-2)", color: "var(--fg-3)" }}>+ Add skip date</button>
              </div>
            </div>

            {/* Schedule preview */}
            <div className="rounded-(--r-3) p-4.5 mt-2" style={{ background: "var(--bg-2)" }}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-2.5" style={{ color: "var(--fg-3)" }}>Schedule preview</div>
              {SCHEDULE.map((s, i) => (
                <div key={s} className="flex justify-between py-0.75 font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>
                  <span>{s}</span>
                  <span style={{ color: "var(--signal-ink)" }}>{i + 1} of 12</span>
                </div>
              ))}
            </div>

            {/* Total + CTA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3">
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                Total · <strong className="font-mono font-medium" style={{ color: "var(--ink)" }}>R 14,400</strong> (R 1,200 &times; 12, billed weekly)
              </div>
              <button className="btn-primary-v2 lg cursor-pointer">Lock it in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
