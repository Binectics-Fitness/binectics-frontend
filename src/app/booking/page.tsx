"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Booking — 3-step wizard from booking.html prototype.
 * Step 1: Date & time (format, calendar, slots)
 * Step 2: Add-ons & questions
 * Step 3: Payment method
 * Right rail: provider card + summary receipt
 */

const STEPS = ["Date & time", "Add‑ons", "Payment"];

const SLOTS = [
  { time: "06:00", label: "60 min", dis: true },
  { time: "07:00", label: "60 min" },
  { time: "08:30", label: "60 min", on: true },
  { time: "10:00", label: "60 min" },
  { time: "11:30", label: "60 min", dis: true },
  { time: "15:00", label: "60 min" },
  { time: "17:00", label: "60 min" },
  { time: "18:30", label: "60 min" },
  { time: "19:30", label: "60 min", dis: true },
];

const CAL_DAYS = [
  [28,29,30,1,2,3,4],[5,6,7,8,9,10,11],[12,13,14,15,16,17,18],[19,20,21,22,23,24,25],[26,27,28,29,30,31,1],
];

const ADDONS = [
  { id: "programming", title: "Take‑home program · 4 weeks", desc: "Sarah builds a 4‑week strength block after your session, delivered as a PDF + in‑app.", price: "+ R 600", on: true },
  { id: "movement", title: "Movement screen · 15 min", desc: "Adds 15 minutes before the session — overhead squat, single‑leg, t‑spine.", price: "+ R 200" },
  { id: "video", title: "Session recording", desc: "Sarah films your main lifts and shares back via in‑app.", price: "Free", free: true },
];

const PAY_METHODS = [
  { id: "card", logo: "VISA", title: "Card · ending 4421", sub: "Saved · expires 04 / 28", default: true, on: true },
  { id: "paystack", logo: "Paystack", title: "Pay with Paystack", sub: "Card · transfer · USSD · ZAR settled directly to Sarah" },
  { id: "applepay", logo: " Pay", title: "Apple Pay", sub: "Touch ID confirm on this device" },
  { id: "new", logo: "+", title: "Add a new card", sub: "Visa, Mastercard, or Amex" },
];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const goNext = () => { if (step < 2) setStep(step + 1); else router.push("/booking/confirmed"); };
  const goBack = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_380px]" style={{ background: "var(--bg)" }}>
      {/* ═══ LEFT — Wizard stages ═══ */}
      <main className="flex flex-col min-w-0">
        <div className="flex flex-col gap-0 px-5 sm:px-8 lg:px-14 pt-8 pb-30 max-w-[820px]">
          {/* Topbar */}
          <div className="flex justify-between items-center pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/marketplace/iron-lab" className="font-mono text-[11.5px] uppercase tracking-[0.05em] flex items-center gap-2 hover:text-ink" style={{ color: "var(--fg-3)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Iron Lab
            </Link>
            <Link href="/"><BinecticsLockup /></Link>
          </div>

          {/* Stepper */}
          <div className="flex items-center my-9">
            {STEPS.map((s, i) => {
              const isDone = i < step;
              const isNow = i === step;
              return (
                <div key={s} className="flex items-center gap-2.5 flex-1" style={{ paddingRight: i < 2 ? "14px" : 0 }}>
                  <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px]" style={{ background: isDone || isNow ? "var(--ink)" : "var(--bg)", color: isDone || isNow ? "var(--bg)" : "var(--fg-3)", border: isDone || isNow ? "1px solid var(--ink)" : "1px solid var(--border-2)", fontVariantNumeric: "tabular-nums", transition: "all 200ms" }}>
                    {isDone ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg> : <span>{i + 1}</span>}
                  </div>
                  <span className="text-[12.5px] font-medium" style={{ color: isNow ? "var(--ink)" : "var(--fg-3)" }}>{s}</span>
                  {i < 2 && <div className="flex-1 h-px ml-1.5" style={{ background: "var(--border-2)" }} />}
                </div>
              );
            })}
          </div>

          {/* Step 1 — Date & time */}
          {step === 0 && (
            <div>
              <h1 className="text-[32px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>When would you like to train?</h1>
              <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>Sarah Okafor&apos;s open sessions for the next two weeks. Times shown in your timezone — Cape Town · SAST.</p>

              {/* Format */}
              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Format</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "In‑person · Iron Lab Sea Point", sub: "60 min · 1‑on‑1 · barbell + dumbbell focus", price: "R 1,200 / session", on: true },
                    { label: "Online · video call", sub: "45 min · programming review + form check", price: "R 850 / session" },
                  ].map((f) => (
                    <div key={f.label} className={`p-4 px-4.5 rounded-(--r-3) cursor-pointer ${f.on ? "bg-bg-2" : "bg-bg"}`} style={{ border: f.on ? "1px solid var(--ink)" : "1px solid var(--border)", transition: "border-color 120ms" }}>
                      <div className="text-[15px] font-medium flex items-center gap-2" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>
                        <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: f.on ? "var(--ink)" : "var(--border-2)", background: f.on ? "var(--ink)" : "var(--bg)" }}>
                          {f.on && <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--bg)" }} />}
                        </span>
                        {f.label}
                      </div>
                      <div className="text-[13px] mt-1.5 font-mono" style={{ color: "var(--fg-3)" }}>{f.sub}</div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>{f.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar + Slots */}
              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Date</div>
                <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
                  {/* Mini calendar */}
                  <div>
                    <div className="flex justify-between items-center mb-3.5">
                      <button className="w-9 h-9 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "var(--bg)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>May 2026</span>
                      <button className="w-9 h-9 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "var(--bg)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {["M","T","W","T","F","S","S"].map((d, i) => (
                        <span key={i} className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-center py-1" style={{ color: "var(--fg-4)" }}>{d}</span>
                      ))}
                      {CAL_DAYS.flat().map((d, i) => {
                        const isMuted = (i < 3) || (i === CAL_DAYS.flat().length - 1);
                        const isDis = d >= 1 && d <= 14 && !isMuted;
                        const isSel = d === 20 && !isMuted && !isDis;
                        const hasSlots = [15,16,19,20,21,22,23,26,27,28,29,30].includes(d) && !isMuted;
                        return (
                          <span key={i} className={`aspect-square flex items-center justify-center font-mono text-[12px] rounded-(--r-2) relative cursor-pointer ${isSel ? "bg-ink" : ""}`} style={{ color: isSel ? "var(--bg)" : isMuted ? "var(--fg-4)" : isDis ? "var(--fg-4)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                            {d}
                            {hasSlots && !isSel && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: "var(--ink)" }} />}
                            {hasSlots && isSel && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: "var(--bg)" }} />}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Available · Wed May 20</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SLOTS.map((s) => (
                        <div key={s.time} className={`px-2.5 py-3 rounded-(--r-2) text-center cursor-pointer ${s.dis ? "opacity-40 pointer-events-none" : ""}`} style={{ border: s.on ? "1px solid var(--ink)" : "1px solid var(--border)", background: s.on ? "var(--ink)" : "var(--bg)", color: s.on ? "var(--bg)" : "var(--ink)", transition: "border-color 120ms, background 120ms" }}>
                          <div className="font-mono text-[13px] font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{s.time}</div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.04em] mt-1" style={{ color: s.on ? "oklch(0.75 0.005 85)" : s.dis ? "var(--fg-4)" : "var(--fg-3)" }}>{s.dis ? "Booked" : s.label}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[12.5px] mt-3.5 leading-relaxed" style={{ color: "var(--fg-3)" }}>Sessions confirmed within 4h — usually faster. Free reschedule up to 24h before.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Add-ons */}
          {step === 1 && (
            <div>
              <h1 className="text-[32px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>Anything you&apos;d like to add?</h1>
              <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>Optional extras for your session on Wed May 20 at 08:30. Sarah will see your answers before you meet.</p>

              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Extras</div>
                <div className="flex flex-col gap-2">
                  {ADDONS.map((a) => (
                    <div key={a.id} className={`flex gap-3.5 p-4 px-4.5 rounded-(--r-3) cursor-pointer items-start ${a.on ? "bg-bg-2" : "bg-bg"}`} style={{ border: a.on ? "1px solid var(--ink)" : "1px solid var(--border)", transition: "border-color 120ms" }}>
                      <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 ${a.on ? "bg-ink border-ink" : "bg-bg border-border-2"}`}>
                        {a.on && <span className="w-[7px] h-1 border-l-[1.5px] border-b-[1.5px] -rotate-45 -translate-y-px" style={{ borderColor: "var(--bg)" }} />}
                      </span>
                      <div className="flex-1">
                        <div className="text-[14.5px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{a.title}</div>
                        <div className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>{a.desc}</div>
                      </div>
                      <span className="font-mono text-[13.5px] shrink-0 mt-0.5" style={{ color: a.free ? "var(--signal-ink)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{a.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>A few quick questions for Sarah</div>
                <div className="flex flex-col gap-4.5">
                  <div>
                    <label className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>What&apos;s your training history? <span className="font-mono text-[11px] uppercase tracking-[0.04em] font-normal ml-1.5" style={{ color: "var(--fg-3)" }}>Required</span></label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Never trained", "< 6 months", "1–3 years", "3+ years", "Competitive"].map((p, i) => (
                        <span key={p} className={`px-3 py-1.75 rounded-full text-[13px] cursor-pointer border ${i === 2 ? "bg-ink border-ink" : "bg-bg border-border-2 hover:border-ink"}`} style={{ color: i === 2 ? "var(--bg)" : "var(--fg-2)", transition: "all 120ms" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>What do you want to work on? <span className="font-mono text-[11px] uppercase tracking-[0.04em] font-normal ml-1.5" style={{ color: "var(--fg-3)" }}>Pick up to 3</span></label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Build strength", "Lose fat", "Technique", "Mobility", "Cardio / GPP", "Injury recovery", "Sport prep"].map((p, i) => (
                        <span key={p} className={`px-3 py-1.75 rounded-full text-[13px] cursor-pointer border ${[0,2].includes(i) ? "bg-ink border-ink" : "bg-bg border-border-2 hover:border-ink"}`} style={{ color: [0,2].includes(i) ? "var(--bg)" : "var(--fg-2)", transition: "all 120ms" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>Anything Sarah should know? <span className="font-mono text-[11px] uppercase tracking-[0.04em] font-normal ml-1.5" style={{ color: "var(--fg-3)" }}>Optional</span></label>
                    <textarea className="w-full rounded-(--r-2) px-3.5 py-3 text-[14px] mt-2 resize-y" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: "88px" }} placeholder="Past injuries, medications, training preferences…" />
                    <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: "var(--fg-3)" }}>She&apos;ll read this before your session. Anything sensitive is fine — it stays between you two.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step === 2 && (
            <div>
              <h1 className="text-[32px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>How would you like to pay?</h1>
              <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>You won&apos;t be charged until Sarah confirms — usually within 4 hours. Free cancellation up to 24h before the session.</p>

              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Payment method</div>
                <div className="flex flex-col gap-2">
                  {PAY_METHODS.map((m) => (
                    <div key={m.id} className={`flex items-center gap-3.5 p-4 px-4.5 rounded-(--r-3) cursor-pointer ${m.on ? "bg-bg-2" : "bg-bg"}`} style={{ border: m.on ? "1px solid var(--ink)" : "1px solid var(--border)", transition: "border-color 120ms" }}>
                      <span className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: m.on ? "var(--ink)" : "var(--border-2)" }}>
                        {m.on && <span className="w-1.75 h-1.75 rounded-full" style={{ background: "var(--ink)" }} />}
                      </span>
                      <span className="w-11 h-7 rounded-[3px] flex items-center justify-center font-mono text-[10px] tracking-[0.04em]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>{m.logo}</span>
                      <div className="flex-1">
                        <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{m.title}</div>
                        <div className="text-[12.5px] font-mono" style={{ color: "var(--fg-3)" }}>{m.sub}</div>
                      </div>
                      {m.default && <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>Default</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 flex items-center justify-between px-5 sm:px-8 lg:px-14 py-4.5" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div className="font-mono text-[11.5px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
            Step <strong style={{ color: "var(--ink)" }}>{step + 1}</strong> of 3
          </div>
          <div className="flex gap-2">
            {step > 0 && <button onClick={goBack} className="btn-ghost-v2">← Back</button>}
            <button onClick={goNext} className="btn-primary-v2 lg">{step === 2 ? "Confirm & pay → " : "Continue →"}</button>
          </div>
        </div>
      </main>

      {/* ═══ RIGHT — Summary rail ═══ */}
      <aside className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)", padding: "32px 28px" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Your booking</div>

        {/* Provider card */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="aspect-[5/3] relative" style={{ background: "linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)" }}>
            <span className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>Iron Lab · Sea Point</span>
          </div>
          <div className="p-4">
            <div className="text-[15px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Sarah Okafor · CSCS</div>
            <div className="flex items-center gap-2 mt-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              <span className="inline-flex items-center gap-1 px-1.75 py-0.5 rounded-full border border-border font-mono text-[10px] uppercase" style={{ color: "var(--ink)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />4.9
              </span>
              312 reviews
            </div>
          </div>
        </div>

        {/* Summary lines */}
        <div className="flex flex-col">
          {[
            { k: "Date", v: "Wed · 20 May 2026" },
            { k: "Time", v: "08:30 – 09:30 · SAST" },
            { k: "Format", v: "In-person · Iron Lab" },
            { k: "Duration", v: "60 min" },
          ].map((l) => (
            <div key={l.k} className="flex justify-between py-2.5 text-[13px] gap-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--fg-2)" }}>{l.k}</span>
              <span className="font-mono font-medium text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{l.v}</span>
            </div>
          ))}
        </div>

        {/* Receipt */}
        <div className="flex flex-col">
          <div className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--fg-2)" }}>Session · 60 min</span>
            <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>R 1,200.00</span>
          </div>
          <div className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--fg-2)" }}>Take‑home program</span>
            <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>R 600.00</span>
          </div>
          <div className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--fg-2)" }}>Session recording</span>
            <span className="font-mono" style={{ color: "var(--signal-ink)" }}>Free</span>
          </div>
          <div className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--fg-2)" }}>Platform fee · 5%</span>
            <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>R 90.00</span>
          </div>
          <div className="flex justify-between pt-3.5 font-medium">
            <span className="text-[14px]" style={{ color: "var(--ink)" }}>Due today</span>
            <span className="text-[17px]" style={{ color: "var(--ink)", letterSpacing: "-0.012em", fontVariantNumeric: "tabular-nums" }}>R 1,890.00</span>
          </div>
        </div>

        {/* Currency */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full self-start" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--ink)" }}>ZAR · R</span>
        </div>

        {/* Trust */}
        <div className="flex flex-col gap-3 text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          {["Free cancellation up to 24h before", "Not charged until Sarah confirms", "Receipts emailed instantly"].map((t) => (
            <div key={t} className="flex gap-2.5 items-start">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal-ink)" }}><path d="m5 12 5 5L20 7"/></svg>
              {t}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
