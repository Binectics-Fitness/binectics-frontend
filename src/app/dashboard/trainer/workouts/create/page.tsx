import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Plan builder — plan-builder.html prototype.
 * 4-column: sidebar (232px) / library (280px) / canvas (1fr) / inspector (320px).
 * Drag-from-library tiles, canvas with week/day structure, inspector with client context + AI suggestions.
 */

const EXERCISES = [
  { name: "Back squat", cat: "Squat", meta: "Barbell · bilateral" },
  { name: "Romanian deadlift", cat: "Hinge", meta: "Barbell · bilateral" },
  { name: "Bench press", cat: "Push", meta: "Barbell · horizontal" },
  { name: "Bent-over row", cat: "Pull", meta: "Barbell · horizontal" },
  { name: "Overhead press", cat: "Push", meta: "Barbell · vertical" },
  { name: "Pull-up", cat: "Pull", meta: "Bodyweight · vertical" },
  { name: "Hip thrust", cat: "Hinge", meta: "Barbell · bilateral" },
  { name: "Bulgarian split squat", cat: "Squat", meta: "Dumbbell · unilateral" },
  { name: "Face pull", cat: "Pull", meta: "Cable · horizontal" },
  { name: "Plank", cat: "Core", meta: "Bodyweight · isometric" },
];

const DAY_A = [
  { name: "Back squat", sets: "4 × 5", rpe: "8", rest: "3 min", pulled: true },
  { name: "Romanian deadlift", sets: "3 × 8", rpe: "7", rest: "2 min", pulled: true },
  { name: "Bulgarian split squat", sets: "3 × 10 ea", rpe: "7", rest: "90s" },
  { name: "Hip thrust", sets: "3 × 12", rpe: "7", rest: "90s" },
  { name: "Plank", sets: "3 × 45s", rpe: "–", rest: "60s" },
];

const DAY_B = [
  { name: "Bench press", sets: "4 × 5", rpe: "8", rest: "3 min", pulled: true },
  { name: "Bent-over row", sets: "4 × 6", rpe: "7.5", rest: "2 min", pulled: true },
  { name: "Overhead press", sets: "3 × 8", rpe: "7", rest: "2 min" },
  { name: "Pull-up", sets: "3 × AMRAP", rpe: "8", rest: "2 min" },
  { name: "Face pull", sets: "3 × 15", rpe: "6", rest: "60s" },
];

const AI_SUGGESTIONS = [
  { title: "Add rack pulls after RDL", desc: "Linda's deadlift groove improves with isometric work at the knee. Rack pulls at 110% 1RM for 3×3 with 5s holds.", primary: "Add to Day A", secondary: "Skip" },
  { title: "Reduce squat volume wk 4", desc: "Current trajectory hits 92.5kg by wk 4. Consider a mini-deload — 3×3 at 85% instead of 4×5.", primary: "Apply", secondary: "Ignore" },
];

function Grip() {
  return (
    <span className="flex flex-col gap-0.5 cursor-grab" style={{ color: "var(--fg-4)" }}>
      <span className="w-2.5 h-0.5 rounded-sm bg-current" />
      <span className="w-2.5 h-0.5 rounded-sm bg-current" />
    </span>
  );
}

export default function PlanBuilderPage() {
  return (
    <>
    {/* Mobile: show desktop message */}
    <div className="lg:hidden min-h-screen flex items-center justify-center px-8" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-xs">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="mx-auto mb-4" style={{ color: "var(--fg-3)" }}><path d="M 32 6 A 18 18 0 1 0 32 42"/><path d="M 28 16 A 8 8 0 1 0 28 32"/></svg>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Plan builder</div>
        <h1 className="text-[22px] font-medium mb-2" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Use a desktop for the best experience</h1>
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-3)" }}>The plan builder needs a wider screen to show the exercise library, canvas, and inspector side by side.</p>
        <Link href="/dashboard/trainer" className="btn-primary-v2 mt-6">← Back to dashboard</Link>
      </div>
    </div>
    {/* Desktop: full 4-column layout */}
    <div className="hidden lg:grid min-h-screen" style={{ gridTemplateColumns: "232px 280px 1fr 320px", background: "var(--bg)" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", padding: "18px 14px" }}>
        <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1"><BinecticsLockup /></Link>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
          <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "oklch(0.95 0.04 75)", color: "oklch(0.45 0.12 75)" }}>SO</span>
          <div className="flex-1">
            <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Sarah Okafor</div>
            <div className="text-[11px]" style={{ color: "var(--fg-3)" }}>Trainer · Cape Town</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2 py-1 mb-1" style={{ color: "var(--fg-4)" }}>Programming</div>
          <Link href="/dashboard/trainer/workouts/create" className="flex items-center gap-2.5 py-1.75 px-2 rounded-(--r-2) text-[13.5px] bg-bg-3 font-medium" style={{ color: "var(--ink)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="flex-1">Plans</span>
            <span className="font-mono text-[11px] px-1.5 py-px rounded-full bg-bg-2" style={{ color: "var(--fg-3)" }}>18</span>
          </Link>
          <Link href="#" className="flex items-center gap-2.5 py-1.75 px-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>
            Exercise library
          </Link>
          <Link href="#" className="flex items-center gap-2.5 py-1.75 px-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            <span className="flex-1">Templates</span>
            <span className="font-mono text-[11px] px-1.5 py-px rounded-full bg-bg-2" style={{ color: "var(--fg-3)" }}>9</span>
          </Link>
        </nav>
      </aside>

      {/* ═══ LIBRARY ═══ */}
      <aside className="flex flex-col sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Library</h2>
          <div className="flex items-center gap-2 h-8 px-2.5 rounded-(--r-2) mt-3" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-3)" }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Search 412 exercises…</span>
          </div>
        </div>
        <div className="flex gap-0 px-4 mb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          {["Exercises", "Blocks", "Templates"].map((t, i) => (
            <span key={t} className={`px-3 py-2.5 text-[12.5px] -mb-px cursor-pointer ${i === 0 ? "border-b-[1.5px] border-ink font-medium" : ""}`} style={{ color: i === 0 ? "var(--ink)" : "var(--fg-3)" }}>{t}</span>
          ))}
        </div>
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {["All", "Squat", "Hinge", "Push", "Pull", "Core"].map((f, i) => (
            <span key={f} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.04em] cursor-pointer shrink-0 border ${i === 0 ? "bg-ink border-ink" : "bg-bg border-border"}`} style={{ color: i === 0 ? "var(--bg)" : "var(--fg-3)" }}>{f}</span>
          ))}
        </div>
        <div className="flex flex-col">
          {EXERCISES.map((e) => (
            <div key={e.name} className="flex items-center gap-3 px-4 py-3 cursor-grab hover:bg-bg-3" style={{ borderBottom: "1px solid var(--border)", transition: "background 60ms" }}>
              <Grip />
              <div className="w-8 h-8 rounded-(--r-2) flex items-center justify-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-2)" }}><path d="M3 3h18v18H3z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{e.name}</div>
                <div className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{e.meta}</div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-(--r-1)" style={{ color: "var(--fg-3)", background: "var(--bg)" }}>{e.cat}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ═══ CANVAS ═══ */}
      <main className="flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <h1 className="text-[18px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>
              Strength block II <span className="text-[14px] font-normal ml-2" style={{ color: "var(--fg-3)" }}>for Linda Mokoena</span>
            </h1>
            <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>12 weeks · linear progression · deload wk 9 · target squat 100 kg by wk 10</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--signal-ink)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />Saved · 14:32
            </span>
            <button className="btn-ghost-v2 sm">Preview</button>
            <button className="btn-primary-v2 sm">Send to Linda</button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Week tabs */}
          <div className="flex gap-1 mb-5 overflow-x-auto">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-(--r-2) text-[12px] font-mono cursor-pointer shrink-0 ${i === 0 ? "bg-ink" : "hover:bg-bg-2"}`} style={{ color: i === 0 ? "var(--bg)" : "var(--fg-2)", border: i === 0 ? "1px solid var(--ink)" : "1px solid var(--border)" }}>
                Wk {i + 1}{i === 8 ? " · deload" : ""}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-2 gap-4">
            {/* Day A */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Day A · lower</span>
                  <span className="font-mono text-[11px] ml-2" style={{ color: "var(--fg-3)" }}>Mon / Thu</span>
                </div>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>5 exercises · ~55 min</span>
              </div>
              {DAY_A.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-2" style={{ borderBottom: i < DAY_A.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                  <Grip />
                  <span className="font-mono text-[11px] w-5 text-right" style={{ color: "var(--fg-4)" }}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{e.name}</div>
                  </div>
                  <span className="font-mono text-[12px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{e.sets}</span>
                  <span className="font-mono text-[11px] w-8 text-center" style={{ color: "var(--fg-3)" }}>@{e.rpe}</span>
                  <span className="font-mono text-[11px] w-10 text-right" style={{ color: "var(--fg-3)" }}>{e.rest}</span>
                </div>
              ))}
            </div>

            {/* Day B */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Day B · upper</span>
                  <span className="font-mono text-[11px] ml-2" style={{ color: "var(--fg-3)" }}>Tue / Fri</span>
                </div>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>5 exercises · ~50 min</span>
              </div>
              {DAY_B.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-2" style={{ borderBottom: i < DAY_B.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                  <Grip />
                  <span className="font-mono text-[11px] w-5 text-right" style={{ color: "var(--fg-4)" }}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{e.name}</div>
                  </div>
                  <span className="font-mono text-[12px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{e.sets}</span>
                  <span className="font-mono text-[11px] w-8 text-center" style={{ color: "var(--fg-3)" }}>@{e.rpe}</span>
                  <span className="font-mono text-[11px] w-10 text-right" style={{ color: "var(--fg-3)" }}>{e.rest}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ═══ INSPECTOR ═══ */}
      <aside className="flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto p-5" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)" }}>
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Plan for</div>
          <div className="flex items-center gap-3 p-3 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>LM</span>
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Linda Mokoena</div>
              <div className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>She / her · 38 · CPT</div>
            </div>
            <Link href="/dashboard/trainer/clients/linda-mokoena" className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-2)" }}>Open →</Link>
          </div>
        </div>

        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Goals · this block</div>
          <div className="flex flex-col gap-2 p-3 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {["Squat 100 kg by wk 10", "Improve hip shift pattern", "Maintain bodyweight at 76 kg"].map((g) => (
              <div key={g} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink)" }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--signal)" }} />
                {g}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>AI suggestions</div>
          <div className="flex flex-col gap-3">
            {AI_SUGGESTIONS.map((s) => (
              <div key={s.title} className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="p-3.5">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{s.title}</div>
                  <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>{s.desc}</div>
                </div>
                <div className="flex gap-2 px-3.5 pb-3">
                  <button className="btn-primary-v2 sm flex-1">{s.primary}</button>
                  <button className="btn-ghost-v2 sm">{s.secondary}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Week summary</div>
          <div className="flex flex-col gap-2 p-3 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {[
              { k: "Total volume", v: "42 sets" },
              { k: "Estimated time", v: "~105 min" },
              { k: "Squat load", v: "90 kg · +2.5 vs wk prev" },
              { k: "RPE target", v: "7–8 average" },
            ].map((s) => (
              <div key={s.k} className="flex justify-between text-[12.5px]">
                <span style={{ color: "var(--fg-3)" }}>{s.k}</span>
                <span className="font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
    </>
  );
}
