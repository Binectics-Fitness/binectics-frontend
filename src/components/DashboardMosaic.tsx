"use client";

import { useState, useCallback, useEffect, useRef } from "react";

function useVisibleOnTouch(
  ref: React.RefObject<HTMLDivElement | null>,
  onEnter: () => void,
  onLeave: () => void,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: hover)").matches) return;
    const obs = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? onEnter() : onLeave(); },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, onEnter, onLeave]);
}

// ─── Constants ──────────────────────────────────────────────────────

const PHONE_W = 402;
const PHONE_H = 874;
const PHONE_SCALE = 0.50;
const PHONE_RADIUS = 48;
const DI_W = 126;
const DI_H = 37;
const DI_TOP = 11;
const DI_RADIUS = 24;
const HOME_IND_W = 139;
const HOME_IND_H = 5;

const PARTICLE_COUNT = 350;
const SHAPE_CX = 400;
const SHAPE_CY = 400;
const WEIGHT_R = 130;
const BAR_HALF = 260;

function sr(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const PCOLORS = [
  "oklch(0.14 0.008 80 / 0.06)",
  "oklch(0.14 0.008 80 / 0.08)",
  "oklch(0.14 0.008 80 / 0.10)",
  "oklch(0.14 0.008 80 / 0.07)",
  "oklch(0.14 0.008 80 / 0.09)",
];

const SLANT = -25 * (Math.PI / 180); // -25° tilt
const COS_S = Math.cos(SLANT);
const SIN_S = Math.sin(SLANT);

function dumbbellPoint(t: number, jx: number, jy: number): [number, number] {
  const leftCx = -BAR_HALF;
  const rightCx = BAR_HALF;
  let lx: number, ly: number;
  if (t < 0.35) {
    const a = (t / 0.35) * Math.PI * 2;
    lx = leftCx + Math.cos(a) * (WEIGHT_R + jx);
    ly = Math.sin(a) * (WEIGHT_R + jy);
  } else if (t < 0.70) {
    const a = ((t - 0.35) / 0.35) * Math.PI * 2;
    lx = rightCx + Math.cos(a) * (WEIGHT_R + jx);
    ly = Math.sin(a) * (WEIGHT_R + jy);
  } else {
    const p = (t - 0.70) / 0.30;
    lx = leftCx + WEIGHT_R + p * (BAR_HALF * 2 - WEIGHT_R * 2) + jx * 0.5;
    ly = jy * 0.4;
  }
  return [
    SHAPE_CX + lx * COS_S - ly * SIN_S,
    SHAPE_CY + lx * SIN_S + ly * COS_S,
  ];
}

function blobRadius(seed: number): string {
  const a = 30 + sr(seed) * 40;
  const b = 30 + sr(seed + 1) * 40;
  const c = 30 + sr(seed + 2) * 40;
  const d = 30 + sr(seed + 3) * 40;
  const e = 30 + sr(seed + 4) * 40;
  const f = 30 + sr(seed + 5) * 40;
  const g = 30 + sr(seed + 6) * 40;
  const h = 30 + sr(seed + 7) * 40;
  return `${a}% ${100 - a}% ${b}% ${100 - b}% / ${c}% ${d}% ${100 - d}% ${100 - c}%`;
}

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const sx = 15 + sr(i * 7 + 1) * 770;
  const sy = 15 + sr(i * 7 + 2) * 770;
  const t = i / PARTICLE_COUNT;
  const jx = (sr(i * 7 + 3) - 0.5) * 36;
  const jy = (sr(i * 7 + 9) - 0.5) * 36;
  const [rx, ry] = dumbbellPoint(t, jx, jy);
  const isBlob = i % 5 === 0;
  const size = isBlob ? 12 + sr(i * 7 + 4) * 20 : 1 + sr(i * 7 + 4) * 1.5;
  const delay = sr(i * 7 + 5) * 2;
  const color = isBlob
    ? `oklch(0.14 0.008 80 / ${(0.04 + sr(i * 7 + 10) * 0.05).toFixed(3)})`
    : PCOLORS[i % PCOLORS.length];
  const dx = (sr(i * 7 + 6) - 0.5) * 40;
  const dy = (sr(i * 7 + 7) - 0.5) * 40;
  const driftDur = 8 + sr(i * 7 + 8) * 12;
  const radius = isBlob ? blobRadius(i * 11) : "50%";
  return { sx, sy, rx, ry, size, delay, color, dx, dy, driftDur, radius, isBlob };
});

const CHART_LINE = "M 0 160 L 22 158 L 44 142 L 66 144 L 88 128 L 110 120 L 132 110 L 154 108 L 176 92 L 198 100 L 220 84 L 242 76 L 264 80 L 286 68 L 308 62 L 330 70 L 352 54 L 374 48 L 396 56 L 418 42 L 440 38 L 462 46 L 484 32 L 506 28 L 528 36 L 550 22 L 572 30 L 600 18";
const CHART_FILL = CHART_LINE + " L 600 220 L 0 220 Z";
const CHART_PREV = "M 0 130 L 22 138 L 44 124 L 66 132 L 88 118 L 110 122 L 132 110 L 154 116 L 176 100 L 198 104 L 220 96 L 242 102 L 264 90 L 286 94 L 308 86 L 330 92 L 352 78 L 374 82 L 396 74 L 418 70 L 440 66 L 462 72 L 484 60 L 506 64 L 528 56 L 550 60 L 572 50 L 600 56";

// ─── Shared atoms ───────────────────────────────────────────────────

const TAB_ITEMS: [string, string, string][] = [
  ["home", "Home", "M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"],
  ["browse", "Browse", "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"],
  ["book", "Bookings", "M3 4h18v17H3zM3 9h18M8 2v4M16 2v4"],
  ["log", "Log", "M12 5v14M5 12h14"],
  ["me", "Me", "M16 14a4 4 0 1 0-8 0M5 21a8 8 0 0 1 14 0M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"],
];

function TabBarStrip({ active }: { active: string }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
      padding: "8px 8px 28px",
      background: "rgba(246,244,239,0.92)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(0,0,0,0.05)",
    }}>
      {TAB_ITEMS.map(([id, label, d]) => (
        <div key={id} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          color: id === active ? "#1a1814" : "#a09c95",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
          <span style={{ fontSize: 9.5, fontFamily: "ui-monospace, monospace", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Flow B Screen: Home ────────────────────────────────────────────

function FlowBHome() {
  return (
    <div style={{ background: "#f6f4ef", width: PHONE_W, height: PHONE_H, position: "relative", overflow: "hidden" }}>
      <div style={{ height: 59 }} />
      <div style={{ padding: "8px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0 18px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>Sunday · 25 May</div>
            <div style={{ fontSize: 32, letterSpacing: "-0.024em", fontWeight: 500, marginTop: 4, color: "#1a1814" }}>
              Hey, <em style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>Tunde</em>.
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg, oklch(0.85 0.04 120), oklch(0.72 0.06 100))" }} />
        </div>

        <div style={{ background: "#1a1814", color: "#f6f4ef", borderRadius: 18, padding: "20px 22px", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a09c95" }}>Current streak</div>
          <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.026em", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>32 days</div>
          <div style={{ fontSize: 12, color: "#c8c4bd", marginTop: 2 }}>Personal best · 18 days to milestone</div>
          <div style={{ height: 6, background: "#2a2724", borderRadius: 3, marginTop: 14 }}>
            <div style={{ height: "100%", width: "64%", background: "#7bbf52", borderRadius: 3 }} />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>Next up</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40))", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: "#1a1814" }}>Sarah Okafor</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#75716b", marginTop: 2 }}>Wed 28 May · 08:30 · Iron Lab</div>
            </div>
            <div className="tap-target" style={{ padding: "6px 12px", background: "#1a1814", color: "#f6f4ef", borderRadius: 999, fontSize: 12 }}>View</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>This week</div>
            <div style={{ fontSize: 24, fontWeight: 500, marginTop: 4, color: "#1a1814" }}>4 / 5</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#2d5028", marginTop: 2 }}>1 to goal</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>Weight</div>
            <div style={{ fontSize: 24, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums", color: "#1a1814" }}>73.4 kg</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#2d5028", marginTop: 2 }}>↓ 1.8 · 30d</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b", marginBottom: 12 }}>This week</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
              const done = [0, 1, 2, 4].includes(i);
              const today = i === 6;
              return (
                <div key={i} style={{
                  aspectRatio: "1", borderRadius: 8,
                  background: done ? "#d9efd5" : today ? "#1a1814" : "#f4f0e9",
                  color: today ? "#f6f4ef" : done ? "#2d5028" : "#a09c95",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 9, opacity: 0.7, fontFamily: "ui-monospace" }}>{d}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{20 + i}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <TabBarStrip active="home" />
    </div>
  );
}

// ─── Flow B Screen: Check-in ────────────────────────────────────────

function FlowBCheckin() {
  return (
    <div style={{ background: "#1a1814", color: "#f6f4ef", width: PHONE_W, height: PHONE_H, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 59 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, flex: 1 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 999, background: "#7bbf52",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1a1814" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7bbf52" }}>● Checked in · 14:42</div>
        <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.024em", marginTop: 10, textAlign: "center" }}>
          You&apos;re <em style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>in</em>, Tunde.
        </div>
        <p style={{ fontSize: 14, color: "#c8c4bd", marginTop: 8, textAlign: "center", maxWidth: "32ch", lineHeight: 1.5 }}>
          Iron Lab Sea Point · welcome back.
        </p>
        <div style={{ marginTop: 32, padding: "24px 32px", background: "#2a2724", borderRadius: 18, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a09c95" }}>Streak</div>
          <div style={{ fontSize: 52, fontWeight: 500, letterSpacing: "-0.028em", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            33 <span style={{ fontSize: 14, color: "#a09c95", fontWeight: 400, marginLeft: 4 }}>days</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7bbf52", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>
            New personal best
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px 28px" }}>
        <div className="tap-target" style={{
          width: "100%", padding: 14, borderRadius: 12, background: "#f6f4ef", color: "#1a1814",
          textAlign: "center", fontSize: 15, fontWeight: 500,
        }}>Done</div>
      </div>
    </div>
  );
}

// ─── Flow B Screen: Workout Log ─────────────────────────────────────

function FlowBWorkout() {
  return (
    <div style={{ background: "#f6f4ef", width: PHONE_W, height: PHONE_H, position: "relative", overflow: "hidden" }}>
      <div style={{ height: 59 }} />
      <div style={{ padding: "8px 20px 100px" }}>
        <div style={{ fontSize: 28, letterSpacing: "-0.022em", fontWeight: 500, color: "#1a1814" }}>
          Workout <em style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>log</em>
        </div>
        <p style={{ fontSize: 13, color: "#75716b", marginTop: 4 }}>Sarah&apos;s program · 32-day streak</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>Top set · squat</div>
            <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums", color: "#1a1814" }}>92.5 kg</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#2d5028", marginTop: 2 }}>↑ PR · from 87.5</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>Volume · week</div>
            <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums", color: "#1a1814" }}>14.8t</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#2d5028", marginTop: 2 }}>↑ above avg</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginTop: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b", marginBottom: 10 }}>Last 30 days</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3 }}>
            {Array.from({ length: 30 }, (_, i) => {
              const intensity = [0.1, 0.3, 0.6, 0.9, 0.6, 0.3][i % 6];
              return (
                <div key={i} style={{
                  aspectRatio: "1",
                  background: intensity < 0.2 ? "#f4f0e9" : intensity < 0.5 ? "#d9efd5" : intensity < 0.8 ? "#7bbf52" : "#2d5028",
                  borderRadius: 3,
                }} />
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b", margin: "4px 4px 10px" }}>Recent sessions</div>
          {[
            ["Wed 21 May", "PR day · 92.5 squat", "strength"],
            ["Mon 19 May", "Upper body · 62.5 bench", "strength"],
            ["Sat 17 May", "Row 5k 22:14", "conditioning"],
          ].map((s, i) => (
            <div key={i} className={i === 0 ? "tap-target" : undefined} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1a1814" }}>{s[1]}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#75716b", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>{s[0]} · {s[2]}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a09c95" strokeWidth="1.8"><path d="M9 6l6 6-6 6" /></svg>
            </div>
          ))}
        </div>
      </div>
      <TabBarStrip active="log" />
    </div>
  );
}

// ─── Flow B Screen: Review ──────────────────────────────────────────

function FlowBReview() {
  return (
    <div style={{ background: "#f6f4ef", width: PHONE_W, height: PHONE_H, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 59 }} />
      <div style={{ padding: "8px 20px 12px", borderBottom: "1px solid #ebe7e1" }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: "#fff", border: "1px solid #ebe7e1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1814" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b" }}>Review · BIN-2026-040112</div>
      </div>
      <div style={{ padding: "20px 20px 12px", flex: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#1a1814" }}>
          How was your session with <em style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>Sarah</em>?
        </div>
        <p style={{ fontSize: 13, color: "#75716b", marginTop: 8, lineHeight: 1.5 }}>Wed 20 May · 08:30 · Iron Lab Sea Point</p>

        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", marginTop: 16, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} width="36" height="36" viewBox="0 0 24 24" fill="#dca548" stroke="#b08328" strokeWidth="0.5">
                <path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" />
              </svg>
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#75716b", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 8 }}>5 of 5 · Excellent</div>
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b", margin: "20px 4px 10px" }}>What stood out?</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {([["On time", true], ["Clear cues", true], ["Personalised", true], ["Pushed me", false], ["Great vibe", false]] as const).map(([t, sel]) => (
            <span key={t} style={{
              padding: "7px 12px", borderRadius: 999,
              background: sel ? "#1a1814" : "#fff", color: sel ? "#f6f4ef" : "#1a1814",
              border: sel ? "none" : "1px solid #ebe7e1", fontSize: 12.5,
            }}>+ {t}</span>
          ))}
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#75716b", margin: "20px 4px 8px" }}>Your review</div>
        <div style={{ background: "#fff", border: "1px solid #ebe7e1", borderRadius: 12, padding: 14, minHeight: 70, fontSize: 13.5, color: "#54504a", lineHeight: 1.5 }}>
          Sarah&apos;s programming is the reason I hit 92.5 on squat. She pays attention to recovery, sleep — not just the lift.
        </div>
      </div>
      <div style={{ padding: "12px 20px 28px", borderTop: "1px solid #ebe7e1" }}>
        <div className="tap-target" style={{
          width: "100%", padding: 14, borderRadius: 12, background: "#1a1814", color: "#f6f4ef",
          textAlign: "center", fontSize: 15, fontWeight: 500,
        }}>Post review</div>
      </div>
    </div>
  );
}

// ─── Flow B Screen Switcher ─────────────────────────────────────────

function FlowBScreen({ step, tapping }: { step: number; tapping: boolean }) {
  return (
    <>
      <div className={`flow-screen${step === 0 ? " flow-active" : ""}${step === 0 && tapping ? " flow-tapping" : ""}`}><FlowBHome /></div>
      <div className={`flow-screen${step === 1 ? " flow-active" : ""}${step === 1 && tapping ? " flow-tapping" : ""}`}><FlowBCheckin /></div>
      <div className={`flow-screen${step === 2 ? " flow-active" : ""}${step === 2 && tapping ? " flow-tapping" : ""}`}><FlowBWorkout /></div>
      <div className={`flow-screen${step === 3 ? " flow-active" : ""}${step === 3 && tapping ? " flow-tapping" : ""}`}><FlowBReview /></div>
    </>
  );
}

// ─── iPhone 16 Pro Frame ────────────────────────────────────────────

function PhoneFrame({ step, tapping }: { step: number; tapping: boolean }) {
  const sw = Math.round(PHONE_W * PHONE_SCALE);
  const sh = Math.round(PHONE_H * PHONE_SCALE);

  return (
    <div className="phone-frame" style={{
      width: sw, height: sh, position: "relative",
      borderRadius: Math.round(PHONE_RADIUS * PHONE_SCALE),
      overflow: "hidden",
      boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)",
      background: "#f6f4ef", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: Math.round(DI_TOP * PHONE_SCALE), left: "50%",
        transform: "translateX(-50%)", width: Math.round(DI_W * PHONE_SCALE),
        height: Math.round(DI_H * PHONE_SCALE), borderRadius: Math.round(DI_RADIUS * PHONE_SCALE),
        background: "#000", zIndex: 10,
      }} />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{
          transform: `scale(${PHONE_SCALE})`, transformOrigin: "top left",
          width: PHONE_W, height: PHONE_H, position: "relative",
        }}>
          <FlowBScreen step={step} tapping={tapping} />
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: Math.round(8 * PHONE_SCALE), left: "50%",
        transform: "translateX(-50%)", width: Math.round(HOME_IND_W * PHONE_SCALE),
        height: Math.max(2, Math.round(HOME_IND_H * PHONE_SCALE)),
        borderRadius: Math.round(HOME_IND_H * PHONE_SCALE),
        background: "oklch(0 0 0 / 0.2)", zIndex: 10,
      }} />
    </div>
  );
}

// ─── Particle Field ─────────────────────────────────────────────────

function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`particle${p.isBlob ? " particle-blob" : ""}`}
          style={{
            "--sx": `${p.sx}px`,
            "--sy": `${p.sy}px`,
            "--rx": `${p.rx}px`,
            "--ry": `${p.ry}px`,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--drift-dur": `${p.driftDur}s`,
            left: `${p.sx}px`,
            top: `${p.sy}px`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.radius,
            transitionDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Dashboard Preview ──────────────────────────────────────────────

const TRAINER_STATS = [
  { label: "Sessions · this week", value: "28", unit: "/ 32 slots", delta: "88% utilization" },
  { label: "Active clients", value: "42", delta: "+ 3 this month" },
  { label: "Earnings · MTD", value: "R 38,400", delta: "↑ 14% vs apr" },
  { label: "Rating · last 30d", value: "4.9", delta: "No change", steady: true },
];

const SESSIONS: Array<{ time: string; initials: string; name: string; meta: string; tag?: string; tagColor?: string; streak?: number; cancelled?: boolean }> = [
  { time: "06:30", initials: "JC", name: "Jamal Chen", meta: "Intake + assessment · 60 min · Iron Lab Sea Point", tag: "First session", tagColor: "var(--signal)" },
  { time: "08:00", initials: "LM", name: "Linda Mokoena", meta: "Session 14 / 24 · Strength upper · 60 min", streak: 32 },
  { time: "09:30", initials: "WC", name: "Wei Chen", meta: "Session 8 / 12 · Olympic basics · 90 min" },
  { time: "11:30", initials: "AA", name: "Aisha Adams", meta: "Programming review · Dubai (GMT+4) · 30 min · Zoom", tag: "Online", tagColor: "var(--gym)" },
  { time: "13:00", initials: "PB", name: "Pier Botha", meta: "Refund issued · slot reopened for booking", tag: "Cancelled · 06:42", tagColor: "var(--fg-4)", cancelled: true },
  { time: "15:30", initials: "TN", name: "Thandi Nkosi", meta: "Session 6 / 12 · Postnatal strength · 60 min", streak: 18 },
  { time: "17:00", initials: "MK", name: "Mike Khumalo", meta: "Session 22 / 24 · Conditioning · 60 min" },
];

function DashboardPreview() {
  return (
    <div className="dash-preview" aria-hidden="true">
      <div className="dash-shell">
        {/* Sidebar */}
        <div className="dash-side">
          <div className="dash-el" style={{ transitionDelay: "0ms" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px" }}>
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                <path d="M 32 6 A 18 18 0 1 0 32 42" /><path d="M 28 16 A 8 8 0 1 0 28 32" />
              </svg>
              <span style={{ fontSize: 17, fontWeight: 600 }}>Binectics</span>
            </div>
          </div>
          <div className="dash-el" style={{ marginTop: 12, transitionDelay: "40ms" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-2)", padding: "8px 10px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--trainer)", color: "oklch(0.2 0.05 75)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11 }}>SO</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Sarah Okafor</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Trainer · Cape Town</div>
              </div>
            </div>
          </div>
          <div className="dash-el" style={{ marginTop: 16, transitionDelay: "80ms" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-4)", padding: "4px 8px", marginBottom: 4 }}>Work</div>
            {["Today", "Calendar", "Clients", "Inbox"].map((item, i) => (
              <div key={item} style={{
                padding: "7px 8px", borderRadius: "var(--r-2)", fontSize: 13.5,
                color: i === 0 ? "var(--ink)" : "var(--fg-2)",
                background: i === 0 ? "var(--bg-3)" : "transparent",
                fontWeight: i === 0 ? 500 : 400, marginBottom: 1,
              }}>
                {item}
                {i === 2 && <span style={{ float: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", background: "var(--bg-2)", padding: "1px 6px", borderRadius: 999 }}>42</span>}
                {i === 3 && <span style={{ float: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", background: "var(--bg-2)", padding: "1px 6px", borderRadius: 999 }}>7</span>}
              </div>
            ))}
          </div>
          <div className="dash-el" style={{ marginTop: 12, transitionDelay: "120ms" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-4)", padding: "4px 8px", marginBottom: 4 }}>Practice</div>
            {["Earnings", "Packages", "My profile", "Settings"].map(item => (
              <div key={item} style={{ padding: "7px 8px", borderRadius: "var(--r-2)", fontSize: 13.5, color: "var(--fg-2)", marginBottom: 1 }}>{item}</div>
            ))}
          </div>
          <div className="dash-el" style={{ marginTop: "auto", transitionDelay: "160ms" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-2)", padding: 12, background: "var(--bg)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Accepting clients</span>
                <span style={{ width: 30, height: 18, background: "var(--signal)", borderRadius: 10, position: "relative", display: "inline-block" }}>
                  <span style={{ position: "absolute", width: 14, height: 14, background: "var(--bg)", borderRadius: "50%", top: 2, left: 14 }} />
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, marginTop: 8 }}>3 free slots / week</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>Shown on your profile</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="dash-main">
          <div className="dash-el" style={{
            height: 56, padding: "0 28px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)", transitionDelay: "60ms",
          }}>
            <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Trainer <span style={{ color: "var(--fg-4)", margin: "0 6px" }}>/</span> <span style={{ color: "var(--ink)", fontWeight: 500 }}>Today</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-2)", fontSize: 13, color: "var(--fg-2)", background: "var(--bg)" }}>View public profile →</div>
              <div style={{ padding: "6px 12px", borderRadius: "var(--r-2)", fontSize: 13, fontWeight: 500, background: "var(--ink)", color: "var(--bg)" }}>+ Book session</div>
            </div>
          </div>

          <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="dash-el" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", transitionDelay: "100ms" }}>
              <div>
                <div style={{ fontSize: 30, letterSpacing: "-0.02em", fontWeight: 500 }}>Today, Sarah</div>
                <div style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 6 }}>Mon · May 11 · 6 sessions · R 7,200 forecast</div>
              </div>
            </div>

            <div className="dash-el" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, transitionDelay: "160ms" }}>
              {TRAINER_STATS.map((stat, i) => (
                <div key={i} style={{
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)",
                  padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)" }}>{stat.label}</div>
                  <div style={{ fontSize: 28, letterSpacing: "-0.02em", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {stat.value}
                    {stat.unit && <small style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)", fontWeight: 400, marginLeft: 4 }}>{stat.unit}</small>}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: stat.steady ? "var(--fg-3)" : "var(--signal-ink)" }}>{stat.delta}</div>
                </div>
              ))}
            </div>

            <div className="dash-el" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", overflow: "hidden", transitionDelay: "220ms" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Today&apos;s schedule</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>6 confirmed · 1 cancellation · gap 14:00–15:30</div>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--fg-2)" }}>Open calendar →</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", padding: "8px 0" }}>
                {SESSIONS.map((s, i) => (
                  <div key={i} style={{ display: "contents" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", textAlign: "right", padding: "14px 12px 0 18px", borderRight: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{s.time}</div>
                    <div style={{ padding: "10px 18px" }}>
                      <div style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${s.tagColor || "var(--ink)"}`, borderRadius: "var(--r-2)", padding: "12px 14px", background: "var(--bg)", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: s.cancelled ? 0.5 : 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.name === "Aisha Adams" ? "var(--gym)" : "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: s.name === "Aisha Adams" ? "oklch(0.95 0 0)" : "var(--ink)" }}>{s.initials}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                              {s.name}
                              {s.tag && <span style={{ marginLeft: 6, fontSize: 11, padding: "2px 8px", borderRadius: 999, border: `1px solid ${s.tagColor}`, color: s.tagColor }}>{s.tag}</span>}
                              {s.streak && <span style={{ marginLeft: 6, fontSize: 12, fontFamily: "var(--font-mono)", padding: "2px 8px", background: "var(--bg-2)", borderRadius: 999 }}>🔥 {s.streak}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{s.meta}</div>
                          </div>
                        </div>
                        {!s.cancelled && (
                          <div style={{ padding: "5px 10px", borderRadius: "var(--r-2)", fontSize: 12, fontWeight: 500, background: "var(--ink)", color: "var(--bg)" }}>
                            {s.tag === "Online" ? "Join" : "Check‑in"}
                          </div>
                        )}
                      </div>
                    </div>
                    {s.cancelled && (
                      <div style={{ display: "contents" }}>
                        <div style={{ borderRight: "1px solid var(--border)" }} />
                        <div style={{ padding: "6px 18px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ height: 1, background: "var(--border)", flex: 1 }} />
                          14:00 – 15:30 · 90 min open
                          <span style={{ height: 1, background: "var(--border)", flex: 1 }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row 1: Big Card ────────────────────────────────────────────────

function Row1BigCard() {
  const [flowStep, setFlowStep] = useState(0);
  const [tapping, setTapping] = useState(false);
  const timerIds = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
  }, []);

  const scheduleLoop = useCallback(() => {
    clearTimers();
    let elapsed = 0;
    const steps = [1, 2, 3, 0];
    for (const ns of steps) {
      elapsed += 2200;
      const tapAt = elapsed;
      timerIds.current.push(window.setTimeout(() => setTapping(true), tapAt));
      elapsed += 800;
      const stepAt = elapsed;
      timerIds.current.push(window.setTimeout(() => {
        setTapping(false);
        setFlowStep(ns);
        if (ns === 0) scheduleLoop();
      }, stepAt));
    }
  }, [clearTimers]);

  const handleMouseEnter = useCallback(() => {
    scheduleLoop();
  }, [scheduleLoop]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    setTapping(false);
    setFlowStep(0);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const bigRef = useRef<HTMLDivElement>(null);
  useVisibleOnTouch(bigRef, handleMouseEnter, handleMouseLeave);

  return (
    <div
      ref={bigRef}
      className="bento-card bento-big"
      role="img"
      aria-label="Product showcase: member app with check-in flow and trainer dashboard preview"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-green" />
        <div className="mesh-blob mesh-blob-blue" />
        <div className="mesh-blob mesh-blob-gold" />
      </div>
      <ParticleField />
      <div className="bento-big-content">
        <PhoneFrame step={flowStep} tapping={tapping} />
      </div>
      <DashboardPreview />
      <div className="bento-big-headline">
        <h3>Train, track, <em>repeat</em>.</h3>
      </div>
    </div>
  );
}

// ─── Row 1: Small Card ──────────────────────────────────────────────

const CAL_DAYS: { d: number; m?: boolean; t?: boolean; h?: boolean }[] = [
  { d: 28, m: true }, { d: 29, m: true }, { d: 30, m: true }, { d: 1, h: true }, { d: 2, h: true }, { d: 3 }, { d: 4 },
  { d: 5, h: true }, { d: 6, h: true }, { d: 7, h: true }, { d: 8, h: true }, { d: 9, h: true }, { d: 10 }, { d: 11, t: true, h: true },
  { d: 12, h: true }, { d: 13, h: true }, { d: 14, h: true }, { d: 15, h: true }, { d: 16, h: true }, { d: 17 }, { d: 18 },
  { d: 19, h: true }, { d: 20, h: true }, { d: 21, h: true }, { d: 22 }, { d: 23, h: true }, { d: 24 }, { d: 25 },
  { d: 26, h: true }, { d: 27, h: true }, { d: 28, h: true }, { d: 29, h: true }, { d: 30, h: true }, { d: 31 }, { d: 1, m: true },
];

const SESSION_DAY_INDICES = CAL_DAYS.map((day, i) => (day.h && !day.m) ? i : -1).filter(i => i !== -1);
const TODAY_INDEX = CAL_DAYS.findIndex(day => day.t);

function Row1SmallCard() {
  const [selectedIdx, setSelectedIdx] = useState<number>(TODAY_INDEX);
  const [tapping, setTapping] = useState(false);
  const timerIds = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
  }, []);

  const scheduleCalLoop = useCallback(() => {
    clearTimers();
    let elapsed = 0;
    for (const dayIdx of SESSION_DAY_INDICES) {
      if (dayIdx === TODAY_INDEX) continue;
      elapsed += 1200;
      const tapAt = elapsed;
      timerIds.current.push(window.setTimeout(() => setTapping(true), tapAt));
      elapsed += 400;
      const selectAt = elapsed;
      timerIds.current.push(window.setTimeout(() => {
        setTapping(false);
        setSelectedIdx(dayIdx);
      }, selectAt));
    }
    elapsed += 1200;
    timerIds.current.push(window.setTimeout(() => setTapping(true), elapsed));
    elapsed += 400;
    timerIds.current.push(window.setTimeout(() => {
      setTapping(false);
      setSelectedIdx(TODAY_INDEX);
      scheduleCalLoop();
    }, elapsed));
  }, [clearTimers]);

  const handleMouseEnter = useCallback(() => {
    scheduleCalLoop();
  }, [scheduleCalLoop]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    setTapping(false);
    setSelectedIdx(TODAY_INDEX);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const smallRef = useRef<HTMLDivElement>(null);
  useVisibleOnTouch(smallRef, handleMouseEnter, handleMouseLeave);

  return (
    <div
      ref={smallRef}
      className="bento-card bento-small"
      role="img"
      aria-label="Weekly session calendar with streak tracking"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="r3-breath-bg" aria-hidden="true">
        <svg className="r3-breath-svg" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="sm-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d991" />
              <stop offset="50%" stopColor="#0267f2" />
              <stop offset="100%" stopColor="#00d991" />
            </linearGradient>
          </defs>
          <path className="r3-wave r3-wave-4" d="M0 440C200 410,400 390,600 420C800 450,1000 400,1200 430L1200 560L0 560Z" fill="url(#sm-grad)" opacity="0.08" />
          <path className="r3-wave r3-wave-1" d="M0 400C150 360,300 340,450 375C600 410,750 355,900 370C1050 385,1150 350,1200 375L1200 560L0 560Z" fill="url(#sm-grad)" opacity="0.10" />
          <path className="r3-wave r3-wave-3" d="M0 340C80 310,180 290,300 320C420 350,520 290,600 305C680 320,820 280,900 310C980 340,1080 300,1200 325L1200 560L0 560Z" fill="url(#sm-grad)" opacity="0.09" />
          <path className="r3-wave r3-wave-2" d="M0 370C100 330,220 310,350 345C480 380,580 315,700 325C820 335,920 300,1050 335C1130 355,1180 340,1200 350L1200 560L0 560Z" fill="url(#sm-grad)" opacity="0.12" />
        </svg>
      </div>
      <div className="bento-small-headline">
        <h3>Never miss a <em>day</em>.</h3>
      </div>
      <div className="small-card-content" style={{ position: "relative", padding: "0 8%", paddingTop: 170, display: "flex", flexDirection: "column", justifyContent: "flex-start", height: "100%", gap: 16 }}>
        {/* Stat tile */}
        <div className="small-card-inner" style={{
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)",
          padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6,
          boxShadow: "0 4px 16px oklch(0 0 0 / 0.06)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)" }}>Sessions · this week</div>
          <div style={{ fontSize: 36, letterSpacing: "-0.02em", fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
            28<small style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--fg-3)", fontWeight: 400, marginLeft: 4 }}>/ 32 slots</small>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2d5028" }}>88% utilization</div>
        </div>

        {/* Monthly calendar */}
        <div className="small-card-inner" style={{
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)",
          overflow: "hidden", boxShadow: "0 4px 16px oklch(0 0 0 / 0.06)",
        }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>May 2026</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>Mon, May 11 · 6 sessions</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ width: 28, height: 28, border: "1px solid var(--border)", borderRadius: "var(--r-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 18-6-6 6-6" /></svg>
              </div>
              <div style={{ width: 28, height: 28, border: "1px solid var(--border)", borderRadius: "var(--r-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 18 6-6-6-6" /></svg>
              </div>
            </div>
          </div>
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 12, color: "var(--fg-2)" }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 10, textAlign: "center", color: "var(--fg-4)", padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
            ))}
            {CAL_DAYS.map((day, i) => {
              const isSelected = i === selectedIdx;
              const isToday = !!day.t;
              const isTapping = tapping && isSelected;
              return (
                <div key={i} className={isTapping ? "cal-tapping" : ""} style={{
                  aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                  fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)",
                  borderRadius: "var(--r-2)", position: "relative", cursor: "pointer",
                  color: day.m ? "var(--fg-4)" : (isSelected || isToday) ? "var(--bg)" : "var(--fg-2)",
                  background: (isSelected || isToday) ? "var(--ink)" : "transparent",
                  transition: "background 0.3s ease, color 0.3s ease",
                }}>
                  {day.d}
                  {day.h && !isSelected && !isToday && <span style={{ position: "absolute", width: 4, height: 4, background: "var(--ink)", borderRadius: "50%", bottom: 4 }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row 2 Constants ───────────────────────────────────────────────

const KIOSK_W2 = 360;
const KIOSK_H2 = 720;
const KIOSK_SC = 0.48;

const QR_CELLS = (() => {
  let s = 7;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: 169 }, () => rnd() <= 0.55);
})();

const CIPHER_CHARS = (() => {
  const pool = "A7X#✓K9M2✓R5✓P8✓3W6✓J4✓1N0✓B✓";
  return Array.from({ length: 40 }, (_, i) => ({
    ch: pool[i % pool.length],
    isCheck: pool[i % pool.length] === "✓",
    x: 5 + sr(i * 13 + 1) * 90,
    y: 5 + sr(i * 13 + 2) * 90,
    dur: 12 + sr(i * 13 + 3) * 18,
    delay: -(sr(i * 13 + 4) * 20),
    size: 12 + sr(i * 13 + 5) * 8,
  }));
})();

const R2_COUNTRIES = [
  { code: "NG", x: 42, y: 32 }, { code: "ZA", x: 48, y: 72 },
  { code: "AE", x: 68, y: 28 }, { code: "GB", x: 32, y: 15 },
  { code: "US", x: 15, y: 28 }, { code: "KE", x: 58, y: 48 },
  { code: "GH", x: 28, y: 45 }, { code: "IN", x: 78, y: 42 },
];

// ─── Row 2: QR Check-in Kiosk ──────────────────────────────────────

interface KioskMember {
  name: string; initials: string; bg: string; type: string;
  streak: number | null; nextTime: string; nextLine: string;
  nextSub: string; welcome: string;
}

const KIOSK_MEMBERS: KioskMember[] = [
  { name: "Lerato Mokoena", initials: "LM", bg: "oklch(0.86 0.04 80)", type: "Iron Lab Member · 2 years", streak: 24, nextTime: "6:30", nextLine: "Strength", nextSub: "with Sarah Okafor", welcome: "Welcome back" },
  { name: "Marcus Chen", initials: "MC", bg: "oklch(0.84 0.05 60)", type: "Iron Lab Member · 4 years", streak: 48, nextTime: "7:00", nextLine: "5×5 Powerlifting", nextSub: "one rep from a PR", welcome: "A personal record kind of day" },
  { name: "Aisha Patel", initials: "AP", bg: "oklch(0.86 0.04 120)", type: "Iron Lab Member · day 1", streak: 1, nextTime: "6:00", nextLine: "Beginner Strength", nextSub: "with Sarah · she’s expecting you", welcome: "Welcome to Iron Lab" },
  { name: "Daniel Kovač", initials: "DK", bg: "oklch(0.84 0.03 240)", type: "Iron Lab Member · 3 years", streak: null, nextTime: "now", nextLine: "Open gym", nextSub: "drop in any time today", welcome: "Missed you these 14 days." },
];

function KioskFrame({ playing, member, playKey }: { playing: boolean; member: KioskMember; playKey: number }) {
  const sw = Math.round(KIOSK_W2 * KIOSK_SC);
  const sh = Math.round(KIOSK_H2 * KIOSK_SC);
  return (
    <div style={{
      width: sw, height: sh, position: "relative",
      background: "oklch(0.10 0.005 80)", borderRadius: Math.round(32 * KIOSK_SC),
      padding: Math.round(12 * KIOSK_SC),
      boxShadow: "0 30px 50px -22px oklch(0 0 0 / 0.35), 0 2px 0 0 oklch(0 0 0 / 0.06) inset, 0 -2px 0 0 oklch(1 0 0 / 0.04) inset",
    }}>
      <div style={{ position: "absolute", top: Math.round(24 * KIOSK_SC), left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "oklch(0.20 0.01 240)", zIndex: 3 }} />
      <div style={{ width: "100%", height: "100%", background: "var(--bg)", borderRadius: Math.round(22 * KIOSK_SC), overflow: "hidden", position: "relative" }}>
        <div className={playing ? "kiosk-playing" : ""} style={{ transform: `scale(${KIOSK_SC})`, transformOrigin: "top left", width: KIOSK_W2, height: KIOSK_H2, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 8px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M 8 1.5 A 4.5 4.5 0 1 0 8 10.5" /><path d="M 7 4 A 2 2 0 1 0 7 8" /></svg>
              Iron Lab · Sea Point
            </div>
            <span>16:24</span>
          </div>
          <div style={{ position: "relative", overflow: "hidden", height: KIOSK_H2 - 36 }}>
            {/* IDLE */}
            <div className="kiosk-idle" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 28px 32px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Scan to enter</div>
              <div style={{ fontSize: 26, letterSpacing: "-0.02em", fontWeight: 500, lineHeight: 1.1, textAlign: "center", marginBottom: 32, maxWidth: "14ch" }}>
                Hold your <em style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontStyle: "italic" }}>Binectics</em> code up to the camera
              </div>
              <div style={{ width: 200, height: 200, position: "relative", marginBottom: 28 }}>
                <span style={{ position: "absolute", top: 0, left: 0, width: 28, height: 28, borderTop: "2px solid var(--ink)", borderLeft: "2px solid var(--ink)" }} />
                <span style={{ position: "absolute", top: 0, right: 0, width: 28, height: 28, borderTop: "2px solid var(--ink)", borderRight: "2px solid var(--ink)" }} />
                <span style={{ position: "absolute", bottom: 0, left: 0, width: 28, height: 28, borderBottom: "2px solid var(--ink)", borderLeft: "2px solid var(--ink)" }} />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderBottom: "2px solid var(--ink)", borderRight: "2px solid var(--ink)" }} />
                <div style={{ position: "absolute", inset: 28, display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gridTemplateRows: "repeat(13, 1fr)", gap: 1.5, opacity: 0.10 }}>
                  {QR_CELLS.map((v, i) => <span key={i} style={{ background: v ? "var(--ink)" : "transparent" }} />)}
                </div>
                <div className="kiosk-scanline" />
              </div>
              <div style={{ fontSize: 13.5, color: "var(--fg-3)", textAlign: "center", lineHeight: 1.45, maxWidth: "22ch" }}>
                Camera unlocks the door · checks you in · counts your streak.
              </div>
              <div style={{ marginTop: "auto", width: "100%", borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>Today · <span style={{ color: "var(--ink)" }}>216 checked in</span></span>
                <span>Door ✓</span>
              </div>
            </div>
            {/* SUCCESS — keyed to force animation restart */}
            <div key={playKey} className="kiosk-success" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "36px 28px 24px" }}>
              <div className="k-flash" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 36, background: "var(--signal-soft)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--signal-ink)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M 2.5 6 L 5 8.5 L 9.5 4" /></svg>
                Checked in · 16:24
              </div>
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 36, marginBottom: 22 }}>
                <div className="k-ring" style={{ width: 140, height: 140, borderRadius: "50%", position: "relative", background: "var(--signal)" }}>
                  <div className="k-tick" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="oklch(0.985 0.005 85)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M 5 12 L 10 17 L 19 7" /></svg>
                  </div>
                  <div className="k-photo" style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 56, color: "var(--ink)", background: member.bg }}>{member.initials}</div>
                </div>
              </div>
              <div className="k-name" style={{ textAlign: "center", fontSize: 26, letterSpacing: "-0.025em", fontWeight: 500, lineHeight: 1.1, marginBottom: 4 }}>{member.name}</div>
              <div className="k-type" style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>{member.type}</div>
              <div className="k-nextcard" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", width: 44, fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.1 }}>
                  <span style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 19, fontWeight: 500, letterSpacing: "-0.02em" }}>{member.nextTime}</span>
                  {member.nextTime !== "now" && <span>PM</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{member.nextLine}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{member.nextSub}</div>
                </div>
              </div>
              {member.streak !== null && (
                <div className="k-streak" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", padding: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{member.streak}</div>
                  <div>
                    <div style={{ color: "var(--ink)", fontSize: 13, marginBottom: 2 }}>{member.streak === 1 ? "Your streak begins" : "Day streak"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{member.streak === 1 ? "first day" : "day streak"}</div>
                  </div>
                  <div className="k-plus" style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal-ink)", background: "var(--signal-soft)", padding: "4px 8px", borderRadius: "var(--r-1)" }}>+1</div>
                </div>
              )}
              <div className="k-welcome" style={{ marginTop: "auto", textAlign: "center", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, color: "var(--fg-2)", letterSpacing: "-0.01em", paddingTop: 12 }}>{member.welcome}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row2QRCard() {
  const [memberIdx, setMemberIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const timerIds = useRef<number[]>([]);
  const hoveringRef = useRef(false);

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
  }, []);

  const scheduleLoop = useCallback(() => {
    clearTimers();
    timerIds.current.push(window.setTimeout(() => {
      setPlayKey(k => k + 1);
      setPlaying(true);
    }, 800));
    timerIds.current.push(window.setTimeout(() => {
      setPlaying(false);
      timerIds.current.push(window.setTimeout(() => {
        if (hoveringRef.current) {
          setMemberIdx(idx => (idx + 1) % KIOSK_MEMBERS.length);
          scheduleLoop();
        }
      }, 300));
    }, 800 + 2100 + 2500));
  }, [clearTimers]);

  const handleMouseEnter = useCallback(() => {
    hoveringRef.current = true;
    scheduleLoop();
  }, [scheduleLoop]);

  const handleMouseLeave = useCallback(() => {
    hoveringRef.current = false;
    clearTimers();
    setPlaying(false);
    setMemberIdx(0);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const qrRef = useRef<HTMLDivElement>(null);
  useVisibleOnTouch(qrRef, handleMouseEnter, handleMouseLeave);

  return (
    <div ref={qrRef} className="bento-card bento-r2 bento-r2-qr" role="img" aria-label="QR check-in kiosk scanning members into the gym" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="r3-breath-bg" aria-hidden="true">
        <svg className="r3-breath-svg" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="qr-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0267f2" />
              <stop offset="60%" stopColor="#00d991" />
              <stop offset="100%" stopColor="#0267f2" />
            </linearGradient>
          </defs>
          <path className="r3-wave r3-wave-4" d="M0 440C200 410,400 390,600 420C800 450,1000 400,1200 430L1200 560L0 560Z" fill="url(#qr-grad)" opacity="0.08" />
          <path className="r3-wave r3-wave-1" d="M0 400C150 360,300 340,450 375C600 410,750 355,900 370C1050 385,1150 350,1200 375L1200 560L0 560Z" fill="url(#qr-grad)" opacity="0.10" />
          <path className="r3-wave r3-wave-3" d="M0 340C80 310,180 290,300 320C420 350,520 290,600 305C680 320,820 280,900 310C980 340,1080 300,1200 325L1200 560L0 560Z" fill="url(#qr-grad)" opacity="0.09" />
          <path className="r3-wave r3-wave-2" d="M0 370C100 330,220 310,350 345C480 380,580 315,700 325C820 335,920 300,1050 335C1130 355,1180 340,1200 350L1200 560L0 560Z" fill="url(#qr-grad)" opacity="0.12" />
        </svg>
      </div>
      <div className="radar-bg" aria-hidden="true">
        {[1, 2, 3, 4].map(i => <div key={i} className="radar-circle" style={{ width: 100 + i * 120, height: 100 + i * 120 }} />)}
        <div className="radar-sweep" />
      </div>
      <div className="r2-headline"><h3>Walk in, you&apos;re <em>in</em>.</h3></div>
      <div className="r2-content"><KioskFrame playing={playing} member={KIOSK_MEMBERS[memberIdx]} playKey={playKey} /></div>
    </div>
  );
}

// ─── Row 2: Verified Professionals ─────────────────────────────────

const VERIFY_STEPS = [
  { icon: "M4 4h16v16H4zM4 8h16M8 4v4", label: "ID Verification", sub: "Government-issued photo ID" },
  { icon: "M12 2L3 7v9c0 5.25 3.82 10.15 9 11 5.18-.85 9-5.75 9-11V7z", label: "Credentials Check", sub: "Certifications & qualifications" },
  { icon: "M9 12l2 2 4-4m6 2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z", label: "Background Review", sub: "Professional background verified" },
];

function Row2VerifyCard() {
  return (
    <div className="bento-card bento-r2 bento-r2-verify" role="img" aria-label="Three-step provider verification process">
      <div className="r3-breath-bg" aria-hidden="true">
        <svg className="r3-breath-svg" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="vr-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#0267f2" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path className="r3-wave r3-wave-4" d="M0 440C200 410,400 390,600 420C800 450,1000 400,1200 430L1200 560L0 560Z" fill="url(#vr-grad)" opacity="0.08" />
          <path className="r3-wave r3-wave-1" d="M0 400C150 360,300 340,450 375C600 410,750 355,900 370C1050 385,1150 350,1200 375L1200 560L0 560Z" fill="url(#vr-grad)" opacity="0.10" />
          <path className="r3-wave r3-wave-3" d="M0 340C80 310,180 290,300 320C420 350,520 290,600 305C680 320,820 280,900 310C980 340,1080 300,1200 325L1200 560L0 560Z" fill="url(#vr-grad)" opacity="0.09" />
          <path className="r3-wave r3-wave-2" d="M0 370C100 330,220 310,350 345C480 380,580 315,700 325C820 335,920 300,1050 335C1130 355,1180 340,1200 350L1200 560L0 560Z" fill="url(#vr-grad)" opacity="0.12" />
        </svg>
      </div>
      <div className="cipher-bg" aria-hidden="true">
        {CIPHER_CHARS.map((c, i) => (
          <span key={i} className={`cipher-char${c.isCheck ? " cipher-check" : ""}`} style={{
            left: `${c.x}%`, top: `${c.y}%`, fontSize: c.size,
            "--drift-dur": `${c.dur}s`, animationDelay: `${c.delay}s`,
          } as React.CSSProperties}>{c.ch}</span>
        ))}
      </div>
      <div className="r2-headline"><h3>Trust, <em>verified</em>.</h3></div>
      <div className="r2-content">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%", maxWidth: 300 }}>
          <div className="verify-shield" style={{ flexShrink: 0, padding: 8 }}>
            <svg width="48" height="52" viewBox="-1 -1 26 26" fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" overflow="visible">
              <path d="M12 2L3 7v9c0 5.25 3.82 10.15 9 11 5.18-.85 9-5.75 9-11V7z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            {VERIFY_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div className="verify-step" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" overflow="visible"><path d={step.icon} /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{step.sub}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--signal-ink)", background: "var(--signal-soft)", padding: "3px 8px", borderRadius: "var(--r-1)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, whiteSpace: "nowrap" }}>Complete</div>
                </div>
                {i < 2 && <div style={{ width: 1, height: 8, marginLeft: 34, background: "var(--border)" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row 2: Global Reach ───────────────────────────────────────────

function Row2GlobalCard() {
  return (
    <div className="bento-card bento-r2 bento-r2-global" role="img" aria-label="Global reach across 50+ countries with multiple payment rails">
      <div className="r3-breath-bg" aria-hidden="true">
        <svg className="r3-breath-svg" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="gl-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fdb90e" />
              <stop offset="50%" stopColor="#00d991" />
              <stop offset="100%" stopColor="#fdb90e" />
            </linearGradient>
          </defs>
          <path className="r3-wave r3-wave-4" d="M0 440C200 410,400 390,600 420C800 450,1000 400,1200 430L1200 560L0 560Z" fill="url(#gl-grad)" opacity="0.08" />
          <path className="r3-wave r3-wave-1" d="M0 400C150 360,300 340,450 375C600 410,750 355,900 370C1050 385,1150 350,1200 375L1200 560L0 560Z" fill="url(#gl-grad)" opacity="0.10" />
          <path className="r3-wave r3-wave-3" d="M0 340C80 310,180 290,300 320C420 350,520 290,600 305C680 320,820 280,900 310C980 340,1080 300,1200 325L1200 560L0 560Z" fill="url(#gl-grad)" opacity="0.09" />
          <path className="r3-wave r3-wave-2" d="M0 370C100 330,220 310,350 345C480 380,580 315,700 325C820 335,920 300,1050 335C1130 355,1180 340,1200 350L1200 560L0 560Z" fill="url(#gl-grad)" opacity="0.12" />
        </svg>
      </div>
      <svg className="meridian-bg" viewBox="0 0 400 600" fill="none" aria-hidden="true">
        {[60, 120, 180, 220, 280, 340].map((x, i) => (
          <path key={i} className="meridian-long" d={`M ${x} 0 Q ${x + (i % 2 ? 25 : -25)} 300 ${x} 600`} stroke="oklch(0.14 0.008 80 / 0.06)" strokeWidth="1" style={{ animationDelay: `${i * 1.2}s` }} />
        ))}
        {[120, 210, 300, 390, 480].map((y, i) => (
          <path key={`lat-${i}`} className="meridian-lat" d={`M 0 ${y} Q 200 ${y + 15} 400 ${y}`} stroke="oklch(0.14 0.008 80 / 0.06)" strokeWidth="1" style={{ transitionDelay: `${i * 80}ms` }} />
        ))}
      </svg>
      <div className="r2-headline"><h3>Everywhere <em>you</em> train.</h3></div>
      <div className="r2-content">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%" }}>
          <div className="globe-cluster">
            {R2_COUNTRIES.map((c, i) => (
              <div key={c.code} className="globe-dot" style={{ left: `${c.x}%`, top: `${c.y}%`, animationDelay: `${i * 0.15}s` }}>
                <div className="globe-dot-circle" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.code}</span>
              </div>
            ))}
            <div className="globe-more">+42 more</div>
          </div>
          <div className="globe-stats" style={{ display: "flex", gap: 32, justifyContent: "center" }}>
            {[["50+", "Countries"], ["12", "Currencies"], ["3", "Payment rails"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{val}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row 3: Gym Owner Analytics ───────────────────────────────────────

const R3_KPIS = [
  { label: "Revenue · 30d", value: "R 1,084,200", suffix: " ZAR", delta: "↑ 12.4% vs prev", down: false, spark: [30,45,38,60,52,64,70,58,72,80,68,90] },
  { label: "Active members", value: "1,284", delta: "↑ 38 net new", down: false, spark: [50,55,60,58,64,68,72,75,78,80,82,86] },
  { label: "Check‑ins · today", value: "412", suffix: "/ 1,284", delta: "32% attendance", down: false, spark: [12,28,48,70,88,96,78,60,38,28,18,8] },
  { label: "Churn · 30d", value: "2.1", suffix: "%", delta: "↓ 0.4 pts", down: true, spark: [60,52,58,48,44,50,42,38,32,36,28,22] },
];

const R3_LIVE = [
  { dot: "signal", name: "Sarah O.", text: "checked in via QR at Sea Point", ts: "just now" },
  { dot: "signal", name: "", text: "New subscription · Studio monthly · Jamal S.", ts: "2m" },
  { dot: "warn", name: "Coach Themba", text: "running 4m late · 18:00 class", ts: "4m" },
  { dot: "signal", name: "", text: "Class booked · Olympic basics · Tue 19:00", ts: "8m" },
  { dot: "danger", name: "", text: "Refund request · R 850 · Pier B. · awaiting review", ts: "14m" },
  { dot: "signal", name: "", text: "14 members checked in at Foreshore in last 20m", ts: "22m" },
  { dot: "signal", name: "", text: "Auto‑payout posted · R 84,200 → ABSA •••2241", ts: "1h" },
];

const R3_MEMBERS = [
  { init: "JS", name: "Jamal Sutherland", plan: "Studio · monthly", loc: "Sea Point", joined: "May 02 · 09:14", status: "Active", sType: "signal", ltv: "R 850" },
  { init: "LM", name: "Linda Mokoena", plan: "Pro · annual", loc: "Foreshore", joined: "May 01 · 18:22", status: "Active", sType: "signal", ltv: "R 9,200" },
  { init: "WC", name: "Wei Chen", plan: "Studio · monthly", loc: "Sea Point", joined: "Apr 30 · 12:08", status: "Active", sType: "signal", ltv: "R 1,700" },
  { init: "PB", name: "Pier Botha", plan: "Day pass", loc: "Woodstock", joined: "Apr 28 · 07:42", status: "Refund req.", sType: "danger", ltv: "R 180" },
  { init: "TN", name: "Thandi Nkosi", plan: "Studio · monthly", loc: "Camps Bay", joined: "Apr 27 · 16:30", status: "Active", sType: "signal", ltv: "R 2,550" },
  { init: "AA", name: "Aisha Adams", plan: "Pro · annual", loc: "Sea Point", joined: "Apr 26 · 14:11", status: "Active", sType: "signal", ltv: "R 9,200" },
  { init: "MK", name: "Mike Khumalo", plan: "Studio · monthly", loc: "Foreshore", joined: "Apr 25 · 19:48", status: "Payment retry", sType: "warn", ltv: "R 0" },
];

const R3_CLASSES = [
  { time: "06:00", name: "Strength · Lower", coach: "Coach K · 60 min", cap: "14/14", capType: "full" },
  { time: "07:30", name: "HIIT · Full body", coach: "Coach Themba · 45 min", cap: "11/14", capType: "" },
  { time: "12:15", name: "Mobility flow", coach: "Marcus B. · 30 min", cap: "4/12", capType: "open" },
  { time: "17:00", name: "Strength · Upper", coach: "Coach K · 60 min", cap: "12/14", capType: "" },
  { time: "18:00", name: "Olympic basics", coach: "Coach Themba · 60 min", cap: "12/12", capType: "full" },
  { time: "19:15", name: "Conditioning", coach: "Sarah O. · 45 min", cap: "7/16", capType: "open" },
];

const R3_DOT: Record<string, React.CSSProperties> = {
  signal: { background: "var(--signal)", boxShadow: "0 0 0 4px var(--signal-soft)" },
  warn:   { background: "var(--warn)",   boxShadow: "0 0 0 4px oklch(0.96 0.05 75)" },
  danger: { background: "var(--danger)", boxShadow: "0 0 0 4px var(--danger-soft)" },
};

const R3_STATUS: Record<string, React.CSSProperties> = {
  signal: { color: "var(--signal-ink)", borderColor: "oklch(0.88 0.05 148)", background: "var(--signal-soft)" },
  danger: { color: "var(--danger)", borderColor: "var(--danger)", background: "var(--danger-soft)" },
  warn:   { color: "var(--warn)", borderColor: "var(--warn)", background: "oklch(0.95 0.04 75)" },
};

function R3CheckoutCard({ step }: { step: number }) {
  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      {/* Screen 0: Plan Selection */}
      <div className="r3-screen" style={{ opacity: step === 0 ? 1 : 0, transform: step === 0 ? "translateY(0)" : "translateY(8px)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)" }}>Iron Lab · Sea Point</div>
        <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 6 }}>Choose a plan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {[
            { name: "Studio Monthly", price: "₦ 12,500", per: "/ 30d", active: true, features: ["All equipment", "Group classes", "Locker access"] },
            { name: "Pro Annual", price: "₦ 108,000", per: "/ 365d", active: false, features: ["Everything in Studio", "PT 2×/wk"] },
          ].map((p) => (
            <div key={p.name} style={{ border: p.active ? "1.5px solid var(--ink)" : "1px solid var(--border)", borderRadius: "var(--r-3)", padding: "12px 14px", background: p.active ? "var(--bg-2)" : "var(--bg)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em", color: "var(--ink)", marginTop: 2 }}>
                {p.price} <small style={{ fontSize: 10.5, color: "var(--fg-3)", fontWeight: 400 }}>{p.per}</small>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ fontSize: 11, color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 4, borderLeft: "1.5px solid var(--signal-ink)", borderBottom: "1.5px solid var(--signal-ink)", transform: "rotate(-45deg)", flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 36, borderRadius: "var(--r-2)", background: "var(--signal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 500, color: "var(--ink)", marginTop: 12 }}>Subscribe →</div>
      </div>

      {/* Screen 1: Checkout */}
      <div className="r3-screen" style={{ opacity: step === 1 ? 1 : 0, transform: step === 1 ? "translateY(0)" : "translateY(8px)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)" }}>← Back</div>
        <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 6 }}>Checkout</div>
        <div style={{ borderRadius: "var(--r-3)", border: "1px solid var(--border)", overflow: "hidden", marginTop: 14 }}>
          {[["Plan", "Studio Monthly"], ["Provider", "Iron Lab"], ["Location", "Sea Point"], ["Duration", "30 days"]].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 12, borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--fg-3)" }}>{label}</span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: "var(--ink)" }}>Due today</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>₦ 12,500</span>
          </div>
        </div>
        <div style={{ borderRadius: "var(--r-3)", border: "1px solid var(--border)", padding: "10px 12px", marginTop: 10 }}>
          <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)", marginBottom: 8 }}>Payment method</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink)" }}>
            <div style={{ width: 32, height: 20, borderRadius: 3, background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-2)" }}>VISA</div>
            •••• 4242
          </div>
        </div>
        <div style={{ height: 36, borderRadius: "var(--r-2)", background: "var(--signal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 500, color: "var(--ink)", marginTop: 12 }}>Pay ₦ 12,500</div>
        <div style={{ textAlign: "center", fontSize: 10, color: "var(--fg-3)", marginTop: 6 }}>Cancel any time · 24‑hr review window</div>
      </div>

      {/* Screen 2: Processing */}
      <div className="r3-screen" style={{ opacity: step === 2 ? 1 : 0, transform: step === 2 ? "translateY(0)" : "translateY(8px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 16 }}>
          <div className="r3-spinner" />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Processing payment…</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>This will only take a moment</div>
        </div>
      </div>

      {/* Screen 3: Success */}
      <div className="r3-screen" style={{ opacity: step === 3 ? 1 : 0, transform: step === 3 ? "translateY(0)" : "translateY(8px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--signal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", textAlign: "center" }}>Subscription Activated!</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", textAlign: "center" }}>You now have access to all included services.</div>
          <div style={{ width: "100%", borderRadius: "var(--r-3)", background: "var(--bg-2)", padding: "12px 14px", marginTop: 4 }}>
            {[["Plan", "Studio Monthly"], ["Amount", "₦ 12,500"], ["Duration", "30 days"]].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 11.5 }}>
                <span style={{ color: "var(--fg-3)" }}>{label}</span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 36, width: "100%", borderRadius: "var(--r-2)", background: "var(--signal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 500, color: "var(--ink)", marginTop: 8 }}>View Subscriptions</div>
        </div>
      </div>
    </div>
  );
}

function Row3DashCard() {
  const [step, setStep] = useState(0);
  const timerIds = useRef<number[]>([]);
  const hoveringRef = useRef(false);

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
  }, []);

  const scheduleLoop = useCallback(() => {
    clearTimers();
    const delays = [2000, 2000, 1800, 3000];
    let elapsed = 0;
    for (let i = 1; i <= 3; i++) {
      elapsed += delays[i - 1];
      const nextStep = i;
      timerIds.current.push(window.setTimeout(() => setStep(nextStep), elapsed));
    }
    elapsed += delays[3];
    timerIds.current.push(window.setTimeout(() => {
      if (hoveringRef.current) {
        setStep(0);
        timerIds.current.push(window.setTimeout(() => {
          if (hoveringRef.current) scheduleLoop();
        }, 400));
      }
    }, elapsed));
  }, [clearTimers]);

  const handleMouseEnter = useCallback(() => {
    hoveringRef.current = true;
    setStep(0);
    timerIds.current.push(window.setTimeout(() => scheduleLoop(), 600));
  }, [scheduleLoop]);

  const handleMouseLeave = useCallback(() => {
    hoveringRef.current = false;
    clearTimers();
    setStep(0);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const r3Ref = useRef<HTMLDivElement>(null);
  useVisibleOnTouch(r3Ref, handleMouseEnter, handleMouseLeave);

  return (
    <div ref={r3Ref} className="bento-card bento-r3" role="img" aria-label="Gym owner analytics dashboard preview" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="r3-mob-headline">
        <h3>Gym owner analytics, <em>live</em>.</h3>
      </div>
      {/* Breathing wave background */}
      <div className="r3-breath-bg" aria-hidden="true">
        <svg className="r3-breath-svg" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="r3-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0267f2" />
              <stop offset="30%" stopColor="#8b5cf6" />
              <stop offset="60%" stopColor="#00d991" />
              <stop offset="100%" stopColor="#fdb90e" />
            </linearGradient>
          </defs>
          <path className="r3-wave r3-wave-4" d="M0 440C200 410,400 390,600 420C800 450,1000 400,1200 430L1200 560L0 560Z" fill="url(#r3-grad)" opacity="0.08" />
          <path className="r3-wave r3-wave-1" d="M0 400C150 360,300 340,450 375C600 410,750 355,900 370C1050 385,1150 350,1200 375L1200 560L0 560Z" fill="url(#r3-grad)" opacity="0.10" />
          <path className="r3-wave r3-wave-3" d="M0 340C80 310,180 290,300 320C420 350,520 290,600 305C680 320,820 280,900 310C980 340,1080 300,1200 325L1200 560L0 560Z" fill="url(#r3-grad)" opacity="0.09" />
          <path className="r3-wave r3-wave-2" d="M0 370C100 330,220 310,350 345C480 380,580 315,700 325C820 335,920 300,1050 335C1130 355,1180 340,1200 350L1200 560L0 560Z" fill="url(#r3-grad)" opacity="0.12" />
        </svg>
      </div>
      <div className="r3-window">
            <div className="r3-titlebar">
              <div className="r3-dots"><span /><span /><span /></div>
              <div className="r3-breadcrumb">
                <span style={{ color: "var(--fg-3)" }}>Iron Lab</span>
                <span style={{ color: "var(--fg-3)", margin: "0 6px" }}>/</span>
                <span style={{ color: "var(--ink)" }}>Overview</span>
              </div>
            </div>
            <div className="r3-viewport">
              <div className="r3-dash">

                {/* Page head */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, paddingBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>Good morning, Lerato</div>
                    <div style={{ fontSize: 13.5, marginTop: 6, color: "var(--fg-3)" }}>Here&apos;s how Iron Lab is doing — all 4 locations · ZAR</div>
                  </div>
                  <div className="r3-time-filter">
                    {["1D", "7D", "30D", "QTD", "YTD", "Custom"].map((t, i) => (
                      <span key={t} style={{ padding: "7px 12px", fontSize: 12.5, fontFamily: "var(--font-mono)", cursor: "default", color: t === "30D" ? "var(--ink)" : "var(--fg-2)", background: t === "30D" ? "var(--bg-3)" : "transparent", borderRight: i < 5 ? "1px solid var(--border)" : "none" }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {R3_KPIS.map((kpi) => (
                    <div key={kpi.label} className="r3-el" style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 110, borderRadius: "var(--r-3)", padding: "16px 18px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)" }}>{kpi.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.022em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                        {kpi.value}{kpi.suffix && <small style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 400, marginLeft: 4, color: "var(--fg-3)" }}>{kpi.suffix}</small>}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: kpi.down ? "var(--danger)" : "var(--signal-ink)" }}>{kpi.delta}</div>
                      <div className="r3-spark" style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 28 }}>
                        {kpi.spark.map((h, i) => (
                          <span key={i} style={{ flex: 1, borderRadius: 1, height: `${h}%`, background: i === kpi.spark.length - 1 ? "var(--ink)" : "var(--bg-3)" }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + Live */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  {/* Revenue chart */}
                  <div className="r3-el" style={{ borderRadius: "var(--r-3)", overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em", color: "var(--ink)" }}>Revenue · last 30 days</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>ZAR · all locations</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 8px", borderRadius: "var(--r-1)", fontSize: 12, fontWeight: 500, background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>All locations</span>
                        <span style={{ fontSize: 12.5, color: "var(--fg-2)", cursor: "default" }}>View report →</span>
                      </div>
                    </div>
                    <div style={{ padding: "18px 18px 14px" }}>
                      <div style={{ position: "relative", height: 220 }}>
                        <svg viewBox="0 0 600 220" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
                          <g stroke="oklch(0.91 0.006 85)" strokeWidth="1"><line x1="0" y1="20" x2="600" y2="20"/><line x1="0" y1="70" x2="600" y2="70"/><line x1="0" y1="120" x2="600" y2="120"/><line x1="0" y1="170" x2="600" y2="170"/></g>
                          <path d="M 0 130 L 22 138 L 44 124 L 66 132 L 88 118 L 110 122 L 132 110 L 154 116 L 176 100 L 198 104 L 220 96 L 242 102 L 264 90 L 286 94 L 308 86 L 330 92 L 352 78 L 374 82 L 396 74 L 418 70 L 440 66 L 462 72 L 484 60 L 506 64 L 528 56 L 550 60 L 572 50 L 600 56" fill="none" stroke="oklch(0.72 0.008 80)" strokeWidth="1.4" strokeDasharray="4 4" />
                          <path className="r3-chart-fill" d="M 0 160 L 22 158 L 44 142 L 66 144 L 88 128 L 110 120 L 132 110 L 154 108 L 176 92 L 198 100 L 220 84 L 242 76 L 264 80 L 286 68 L 308 62 L 330 70 L 352 54 L 374 48 L 396 56 L 418 42 L 440 38 L 462 46 L 484 32 L 506 28 L 528 36 L 550 22 L 572 30 L 600 18 L 600 220 L 0 220 Z" fill="oklch(0.94 0.04 148)" />
                          <path className="r3-chart-line" d="M 0 160 L 22 158 L 44 142 L 66 144 L 88 128 L 110 120 L 132 110 L 154 108 L 176 92 L 198 100 L 220 84 L 242 76 L 264 80 L 286 68 L 308 62 L 330 70 L 352 54 L 374 48 L 396 56 L 418 42 L 440 38 L 462 46 L 484 32 L 506 28 L 528 36 L 550 22 L 572 30 L 600 18" fill="none" stroke="oklch(0.55 0.16 148)" strokeWidth="2" />
                          <circle cx="600" cy="18" r="4" fill="oklch(0.55 0.16 148)" />
                          <g fontFamily="var(--font-mono)" fontSize="10" fill="oklch(0.55 0.008 80)"><text x="6" y="14">R 50k</text><text x="6" y="64">R 38k</text><text x="6" y="114">R 26k</text><text x="6" y="164">R 14k</text></g>
                          <g fontFamily="var(--font-mono)" fontSize="10" fill="oklch(0.55 0.008 80)" textAnchor="middle"><text x="50" y="212">Apr 14</text><text x="200" y="212">Apr 21</text><text x="350" y="212">Apr 28</text><text x="500" y="212">May 05</text><text x="580" y="212">today</text></g>
                        </svg>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, padding: "0 18px 14px", fontSize: 12, color: "var(--fg-2)" }}>
                      <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 6, verticalAlign: "middle", background: "oklch(0.55 0.16 148)" }} />This period · R 1.08M</span>
                      <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 6, verticalAlign: "middle", background: "oklch(0.72 0.008 80)" }} />Previous · R 964k</span>
                    </div>
                  </div>

                  {/* Live activity */}
                  <div className="r3-el" style={{ borderRadius: "var(--r-3)", overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em", color: "var(--ink)" }}>Live activity</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Auto‑updating · all locations</div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 8px", borderRadius: "var(--r-1)", fontSize: 12, fontWeight: 500, background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)", color: "var(--signal-ink)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />Live
                      </span>
                    </div>
                    <div style={{ padding: "4px 0" }}>
                      {R3_LIVE.map((row, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "10px 18px", alignItems: "flex-start" }}>
                          <span className="r3-live-dot" style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 7, ...R3_DOT[row.dot] }} />
                          <span style={{ fontSize: 13, flex: 1, color: "var(--ink)" }}>{row.name && <strong style={{ fontWeight: 500 }}>{row.name}</strong>}{row.name ? " " : ""}{row.text}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, flexShrink: 0, color: "var(--fg-3)" }}>{row.ts}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Members + Classes */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  {/* Members table */}
                  <div className="r3-el" style={{ borderRadius: "var(--r-3)", overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em", color: "var(--ink)" }}>Recent members</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Joined or upgraded in last 30 days</div>
                      </div>
                      <span style={{ fontSize: 12.5, color: "var(--fg-2)", cursor: "default" }}>All members →</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                      <thead>
                        <tr>
                          {["Member", "Plan", "Location", "Joined", "Status", "LTV"].map((h, i) => (
                            <th key={h} style={{ textAlign: i === 5 ? "right" : "left", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "12px 18px", color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {R3_MEMBERS.map((m, idx) => (
                          <tr key={m.init} className="r3-member-row" style={{ transitionDelay: `${idx * 0.06}s` }}>
                            <td style={{ padding: "12px 18px", borderBottom: idx < R3_MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0, background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span>
                                {m.name}
                              </div>
                            </td>
                            <td style={{ padding: "12px 18px", borderBottom: idx < R3_MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{m.plan}</td>
                            <td style={{ padding: "12px 18px", borderBottom: idx < R3_MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{m.loc}</td>
                            <td style={{ padding: "12px 18px", borderBottom: idx < R3_MEMBERS.length - 1 ? "1px solid var(--border)" : "none", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{m.joined}</td>
                            <td style={{ padding: "12px 18px", borderBottom: idx < R3_MEMBERS.length - 1 ? "1px solid var(--border)" : "none" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 8px", borderRadius: "var(--r-1)", fontSize: 12, fontWeight: 500, ...R3_STATUS[m.sType], border: `1px solid ${R3_STATUS[m.sType].borderColor}` }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />{m.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 18px", textAlign: "right", borderBottom: idx < R3_MEMBERS.length - 1 ? "1px solid var(--border)" : "none", fontFamily: "var(--font-mono)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.ltv}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Today's classes */}
                  <div className="r3-el" style={{ borderRadius: "var(--r-3)", overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em", color: "var(--ink)" }}>Today&apos;s classes</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Mon · May 11 · Sea Point</div>
                      </div>
                      <span style={{ fontSize: 12.5, color: "var(--fg-2)", cursor: "default" }}>Full schedule →</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "12px 18px 6px", color: "var(--fg-3)" }}>Today · Mon May 11</div>
                    {R3_CLASSES.map((c) => (
                      <div key={c.time} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 12, padding: "8px 18px", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.time}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{c.coach}</div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: c.capType === "full" ? "var(--danger)" : c.capType === "open" ? "var(--signal-ink)" : "var(--fg-2)" }}>{c.cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              <div className="r3-fade" />
            </div>
          </div>

      {/* ── Floating checkout flow card ── */}
      <div className="r3-float">
        <R3CheckoutCard step={step} />
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────

export default function DashboardMosaic() {
  return (
    <>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .bento-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--r-3);
          position: relative;
          overflow: hidden;
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-big:hover {
            border-color: oklch(0.68 0.16 148 / 0.35);
            box-shadow: 0 0 0 1px oklch(0.68 0.16 148 / 0.10), 0 8px 40px oklch(0.68 0.16 148 / 0.08);
          }
          .bento-small:hover {
            border-color: oklch(0.68 0.16 148 / 0.30);
            box-shadow: 0 0 0 1px oklch(0.68 0.16 148 / 0.08), 0 8px 32px oklch(0.68 0.16 148 / 0.06);
          }
          .bento-r2-qr:hover {
            border-color: oklch(0.55 0.18 250 / 0.30);
            box-shadow: 0 0 0 1px oklch(0.55 0.18 250 / 0.08), 0 8px 32px oklch(0.55 0.18 250 / 0.06);
          }
          .bento-r2-verify:hover {
            border-color: oklch(0.55 0.20 290 / 0.30);
            box-shadow: 0 0 0 1px oklch(0.55 0.20 290 / 0.08), 0 8px 32px oklch(0.55 0.20 290 / 0.06);
          }
          .bento-r2-global:hover {
            border-color: oklch(0.75 0.16 75 / 0.35);
            box-shadow: 0 0 0 1px oklch(0.75 0.16 75 / 0.10), 0 8px 32px oklch(0.75 0.16 75 / 0.08);
          }
          .bento-r3:hover {
            border-color: oklch(0.55 0.18 250 / 0.25);
            box-shadow: 0 0 0 1px oklch(0.55 0.18 250 / 0.06), 0 8px 40px oklch(0.55 0.18 250 / 0.06);
          }
        }
        .bento-big {
          grid-column: span 2;
          min-height: 800px;
          cursor: default;
        }
        .mesh-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .mesh-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        .mesh-blob-green {
          width: 500px; height: 500px;
          background: oklch(0.72 0.18 145 / 0.12);
          animation: blob-a 14s ease-in-out infinite;
        }
        .mesh-blob-blue {
          width: 450px; height: 450px;
          background: oklch(0.58 0.20 250 / 0.10);
          animation: blob-b 18s ease-in-out infinite;
        }
        .mesh-blob-gold {
          width: 480px; height: 480px;
          background: oklch(0.70 0.16 75 / 0.11);
          animation: blob-c 16s ease-in-out infinite;
        }
        @keyframes blob-a {
          0%   { top: -10%; left: -5%; }
          33%  { top: 15%; left: 20%; }
          66%  { top: -5%; left: 35%; }
          100% { top: -10%; left: -5%; }
        }
        @keyframes blob-b {
          0%   { bottom: -15%; right: -10%; }
          33%  { bottom: 10%; right: 15%; }
          66%  { bottom: 20%; right: -5%; }
          100% { bottom: -15%; right: -10%; }
        }
        @keyframes blob-c {
          0%   { top: 30%; left: 30%; }
          33%  { top: 10%; left: 50%; }
          66%  { top: 40%; left: 20%; }
          100% { top: 30%; left: 30%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mesh-blob { animation: none; }
        }
        .bento-small {
          grid-column: span 1;
          min-height: 800px;
        }

        /* ── Particles ─────────────────────────── */
        .particle-field {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          transition: transform 1.5s ease;
        }
        @keyframes shape-float {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-60px); }
          100% { transform: translateY(0); }
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-big:hover .particle-field {
            animation: shape-float 8s ease-in-out infinite;
          }
        }
        .particle {
          position: absolute;
          will-change: transform, translate;
          animation: particle-drift var(--drift-dur) ease-in-out infinite alternate;
          transition: translate 3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes particle-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(var(--dx), var(--dy)); }
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-big:hover .particle {
            translate: calc(var(--rx) - var(--sx)) calc(var(--ry) - var(--sy));
          }
        }

        /* ── Big card content ──────────────────── */
        .bento-big-content {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 40px 28px 64px;
          padding-left: 8%;
          min-height: 800px;
        }
        .phone-frame { z-index: 3; }

        /* ── Flow B transitions ────────────────── */
        .flow-screen {
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }
        .flow-screen.flow-active {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        /* ── Tap-to-navigate pulse ─────────────── */
        @keyframes tap-pulse {
          0%   { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
          25%  { transform: scale(0.90); box-shadow: 0 0 0 4px rgba(123,191,82,0.35); }
          55%  { transform: scale(0.90); box-shadow: 0 0 0 4px rgba(123,191,82,0.25); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
        }
        .tap-target {
          will-change: transform;
          border-radius: inherit;
        }
        .flow-tapping .tap-target {
          animation: tap-pulse 700ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Dashboard preview ─────────────────── */
        .dash-preview {
          position: absolute;
          top: 170px;
          left: 42%;
          width: 1100px;
          transform: scale(0.56);
          transform-origin: top left;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px oklch(0 0 0 / 0.08);
          border: 1px solid var(--border);
          z-index: 2;
        }
        .dash-shell {
          display: grid;
          grid-template-columns: 232px 1fr;
          min-height: 100%;
          background: var(--bg-2);
        }
        .dash-side {
          background: var(--bg);
          border-right: 1px solid var(--border);
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
        }
        .dash-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .dash-el {
          opacity: 1;
          transform: none;
        }

        /* ── Big card headline ─────────────────── */
        .bento-big-headline {
          position: absolute;
          top: 28px;
          left: 28px;
          z-index: 5;
        }
        .bento-big-headline h3 {
          font-size: 30px;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0;
        }
        .bento-big-headline em {
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 400;
        }

        /* ── Small card headline ────────────────── */
        .bento-small-headline {
          position: absolute;
          top: 28px;
          left: 28px;
          z-index: 5;
        }
        .bento-small-headline h3 {
          font-size: 26px;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0;
        }
        .bento-small-headline em {
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 400;
        }

        .small-card-inner {
          position: relative;
          z-index: 2;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-small:hover .small-card-inner:first-of-type { transform: translateY(-4px); }
          .bento-small:hover .small-card-inner:last-of-type { transform: translateY(-2px); }
        }
        /* ── Big card blob fade ─────────────────── */
        .particle-blob {
          opacity: 0;
          transition: translate 3s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 1.5s ease;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-big:hover .particle-blob {
            opacity: 1;
          }
        }
        /* ── Calendar date tap ─────────────────── */
        @keyframes cal-tap {
          0%   { transform: scale(1); }
          30%  { transform: scale(0.85); }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .cal-tapping {
          animation: cal-tap 350ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .small-card-inner { transition: none; }
        }

        /* ── Reduced motion ────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .particle { animation: none; transition: none; }
          .flow-screen { transition: none; }
        }



        /* ══ ROW 2 ════════════════════════════════ */

        .bento-r2 { grid-column: span 1; min-height: 800px; cursor: default; }
        .r2-headline { position: absolute; top: 28px; left: 28px; z-index: 5; }
        .r2-headline h3 { font-size: 26px; font-weight: 500; letter-spacing: -0.02em; color: var(--ink); margin: 0; }
        .r2-headline em { font-family: var(--font-serif); font-style: italic; font-weight: 400; }
        .r2-content { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; min-height: 100%; padding: 80px 24px 32px; box-sizing: border-box; }

        /* ── Radar sweep (QR card) ─────────────── */
        .radar-bg {
          position: absolute; inset: 0; z-index: 0;
          pointer-events: none; display: flex;
          align-items: center; justify-content: center;
        }
        .radar-circle { position: absolute; border: 1px solid oklch(0.14 0.008 80 / 0.06); border-radius: 50%; }
        .radar-sweep {
          position: absolute;
          width: 280px; height: 280px; border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0deg, oklch(0.68 0.16 148 / 0.12) 30deg, transparent 60deg);
          animation: radar-spin 6s linear infinite;
        }
        @keyframes radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r2-qr:hover .radar-sweep { animation-duration: 2s; }
          .bento-r2-qr:hover .radar-circle { border-color: oklch(0.14 0.008 80 / 0.10); }
        }

        /* ── Kiosk states ──────────────────────── */
        .kiosk-idle { opacity: 1; transition: opacity 200ms ease; }
        .kiosk-playing .kiosk-idle { opacity: 0; pointer-events: none; }
        .kiosk-success { opacity: 0; pointer-events: none; transition: opacity 200ms ease; }
        .kiosk-playing .kiosk-success { opacity: 1; pointer-events: auto; }

        .kiosk-scanline {
          position: absolute; left: 8px; right: 8px; height: 2px;
          background: linear-gradient(to right, transparent, var(--signal), transparent);
          box-shadow: 0 0 12px var(--signal);
          animation: kiosk-scan 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        @keyframes kiosk-scan {
          0%   { top: 8px; opacity: 0.5; }
          50%  { top: calc(100% - 10px); opacity: 1; }
          100% { top: 8px; opacity: 0.5; }
        }

        /* ── Kiosk success animations ──────────── */
        @keyframes k-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes k-flash-in { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes k-ring-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes k-ring-fade { to { background: transparent; box-shadow: inset 0 0 0 1.5px var(--border-2); } }
        @keyframes k-photo-in { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes k-tickdraw { to { stroke-dashoffset: 0; } }
        @keyframes k-tickfade { to { opacity: 0; transform: scale(0.7); } }

        .k-flash { transform: translateY(-100%); }
        .kiosk-playing .k-flash { animation: k-flash-in 800ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards; }
        .k-ring { transform: scale(0); opacity: 0; }
        .kiosk-playing .k-ring { animation: k-ring-in 500ms cubic-bezier(0.34, 1.4, 0.64, 1) 50ms forwards, k-ring-fade 400ms ease-out 800ms forwards; }
        .k-tick svg path { stroke-dasharray: 60; stroke-dashoffset: 60; }
        .kiosk-playing .k-tick svg path { animation: k-tickdraw 320ms cubic-bezier(0.16, 1, 0.3, 1) 350ms forwards; }
        .kiosk-playing .k-tick { animation: k-tickfade 300ms ease-out 850ms forwards; }
        .k-photo { opacity: 0; transform: scale(0.85); }
        .kiosk-playing .k-photo { animation: k-photo-in 500ms cubic-bezier(0.16, 1, 0.3, 1) 800ms forwards; }
        .k-name, .k-type, .k-nextcard, .k-streak, .k-welcome { opacity: 0; transform: translateY(8px); }
        .kiosk-playing .k-name { animation: k-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 950ms forwards; }
        .kiosk-playing .k-type { animation: k-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 1040ms forwards; }
        .kiosk-playing .k-nextcard { animation: k-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 1180ms forwards; }
        .kiosk-playing .k-streak { animation: k-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 1300ms forwards; }
        .kiosk-playing .k-welcome { animation: k-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 1600ms forwards; }
        .k-plus { opacity: 0; transform: translateY(-4px); }
        .kiosk-playing .k-plus { animation: k-rise 400ms cubic-bezier(0.16, 1, 0.3, 1) 1700ms forwards; }

        /* ── Cipher drift (Verify card) ────────── */
        .cipher-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .cipher-char {
          position: absolute;
          font-family: var(--font-mono);
          color: var(--ink);
          opacity: 0.04;
          animation: cipher-drift var(--drift-dur) ease-in-out infinite alternate;
          transition: opacity 0.4s ease;
        }
        @keyframes cipher-drift { 0% { transform: translateY(0); } 100% { transform: translateY(-30px); } }
        .bento-r2-verify:hover .cipher-char { opacity: 0; }
        .bento-r2-verify:hover .cipher-char.cipher-check { opacity: 0.2; color: var(--signal); transition-delay: 0.3s; }

        .verify-shield { opacity: 0.8; transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r2-verify:hover .verify-shield { opacity: 1; transform: scale(1.1); }
        }

        .verify-step {
          display: flex; align-items: center; gap: 12;
          padding: 14px 16px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--r-3);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r2-verify:hover .verify-step {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px oklch(0 0 0 / 0.06);
          }
        }

        /* ── Meridian lines (Global card) ─────── */
        .meridian-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; width: 100%; height: 100%; }
        .meridian-long { animation: meridian-sway 8s ease-in-out infinite alternate; }
        @keyframes meridian-sway { 0% { transform: translateX(-5px); } 100% { transform: translateX(5px); } }
        .meridian-lat { opacity: 0; transition: opacity 0.6s ease; }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r2-global:hover .meridian-lat { opacity: 1; }
        }

        .globe-cluster { position: relative; width: 100%; height: 220px; }
        .globe-dot {
          position: absolute; display: flex; flex-direction: column; align-items: center; gap: 4;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .globe-dot-circle {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--ink); opacity: 0.5;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r2-global:hover .globe-dot-circle { opacity: 1; transform: scale(1.3); }
          .bento-r2-global:hover .globe-dot { animation: globe-pulse 2s ease-in-out infinite; }
        }
        @keyframes globe-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }

        .globe-more {
          position: absolute; bottom: 8px; right: 8px;
          font-family: var(--font-mono); font-size: 12px;
          color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.04em;
          opacity: 0; transform: translateY(4px);
          transition: opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r2-global:hover .globe-more { opacity: 1; transform: translateY(0); }
        }

        /* ── Breathing wave background (shared) ──── */
        .r3-breath-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .r3-breath-svg {
          position: absolute;
          bottom: 0;
          left: -5%;
          width: 110%;
          height: 90%;
        }
        .r3-wave {
          transform-origin: center bottom;
          will-change: transform;
        }
        .r3-wave-1 { animation: breath-1 8s ease-in-out infinite; }
        .r3-wave-2 { animation: breath-2 11s ease-in-out infinite; }
        .r3-wave-3 { animation: breath-3 14s ease-in-out infinite; }
        .r3-wave-4 { animation: breath-4 9s ease-in-out infinite; }
        @keyframes breath-1 {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50%      { transform: translateY(-20px) scaleY(1.10); }
        }
        @keyframes breath-2 {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50%      { transform: translateY(-30px) scaleY(1.16); }
        }
        @keyframes breath-3 {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50%      { transform: translateY(-14px) scaleY(1.06); }
        }
        @keyframes breath-4 {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50%      { transform: translateY(-24px) scaleY(1.12); }
        }

        /* ── Row 3: Gym Dashboard ──────────────── */
        .bento-r3 {
          grid-column: span 3;
          min-height: 560px;
          cursor: default;
        }
        .r3-window {
          position: absolute;
          top: 72px;
          right: 40px;
          transform: scale(0.55);
          transform-origin: top right;
          width: 1400px;
          display: flex;
          flex-direction: column;
          border-radius: var(--r-3);
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: 0 12px 48px oklch(0 0 0 / 0.08), 0 0 0 1px oklch(0 0 0 / 0.04);
          z-index: 1;
        }
        .r3-titlebar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-2);
          flex-shrink: 0;
        }
        .r3-dots {
          display: flex; gap: 6px;
        }
        .r3-dots span {
          width: 10px; height: 10px; border-radius: 50%; background: var(--bg-3); border: 1px solid var(--border);
        }
        .r3-breadcrumb {
          font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.02em;
        }
        .r3-viewport {
          position: relative;
          flex: 1;
          overflow: hidden;
        }
        .r3-dash {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px 24px;
        }
        .r3-fade {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 100px;
          background: linear-gradient(to bottom, transparent, var(--bg));
          pointer-events: none;
          z-index: 2;
        }
        .r3-time-filter {
          display: inline-flex;
          border-radius: var(--r-2);
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
        }
        .r3-el {
          opacity: 0.6;
          transform: translateY(6px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .r3-el:nth-child(1) { transition-delay: 0s; }
        .r3-el:nth-child(2) { transition-delay: 0.08s; }
        .r3-el:nth-child(3) { transition-delay: 0.16s; }
        .r3-el:nth-child(4) { transition-delay: 0.24s; }
        .r3-el:nth-child(5) { transition-delay: 0.32s; }
        .r3-el:nth-child(6) { transition-delay: 0.40s; }
        .r3-el:nth-child(7) { transition-delay: 0.48s; }
        .r3-el:nth-child(8) { transition-delay: 0.56s; }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r3:hover .r3-el {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* KPI spark bars animate on hover */
        .r3-spark span {
          transform: scaleY(0.4);
          transform-origin: bottom;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r3:hover .r3-spark span {
            transform: scaleY(1);
          }
          .bento-r3:hover .r3-spark span:last-child {
            background: var(--signal) !important;
          }
        }

        /* Chart line draw on hover */
        .r3-chart-line {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          transition: stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }
        .r3-chart-fill {
          opacity: 0;
          transition: opacity 0.8s ease 0.6s;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r3:hover .r3-chart-line { stroke-dashoffset: 0; }
          .bento-r3:hover .r3-chart-fill { opacity: 1; }
        }

        /* Live dot pulse on hover */
        .r3-live-dot {
          transition: box-shadow 0.4s ease;
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r3:hover .r3-live-dot { animation: r3-dot-pulse 1.5s ease-in-out infinite; }
        }
        @keyframes r3-dot-pulse {
          0%, 100% { box-shadow: 0 0 0 4px var(--signal-soft); }
          50% { box-shadow: 0 0 0 8px var(--signal-soft); }
        }

        /* Members table rows slide in */
        .r3-member-row {
          opacity: 0.5;
          transform: translateX(8px);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-r3:hover .r3-member-row {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Floating stats card */
        .r3-float {
          position: absolute;
          top: 55%;
          left: 300px;
          transform: translateY(-50%) scale(0.92);
          transform-origin: left center;
          width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 28px 24px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--r-3);
          box-shadow: 0 12px 48px oklch(0 0 0 / 0.1), 0 0 0 1px oklch(0 0 0 / 0.04);
          z-index: 3;
        }
        /* Checkout flow screens */
        .r3-screen {
          position: absolute;
          top: 0; left: 0; right: 0;
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }
        .r3-screen:first-child {
          position: relative;
        }
        .r3-spinner {
          width: 32px; height: 32px;
          border: 3px solid var(--bg-3);
          border-top-color: var(--ink);
          border-radius: 50%;
          animation: r3-spin 0.8s linear infinite;
        }
        @keyframes r3-spin { to { transform: rotate(360deg); } }

        /* Row 3 reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .r3-spinner { animation: none; }
          .r3-el { opacity: 1; }
          .r3-screen { transition: none; }
          .r3-wave { animation: none; }
        }

        /* ── Row 2 reduced motion ──────────────── */
        @media (prefers-reduced-motion: reduce) {
          .radar-sweep, .kiosk-scanline, .cipher-char, .meridian-long { animation: none; }
          .kiosk-playing .k-flash, .kiosk-playing .k-ring, .kiosk-playing .k-tick,
          .kiosk-playing .k-photo, .kiosk-playing .k-name, .kiosk-playing .k-type,
          .kiosk-playing .k-nextcard, .kiosk-playing .k-streak, .kiosk-playing .k-plus,
          .kiosk-playing .k-welcome {
            animation: none; opacity: 1; transform: none;
          }
          .kiosk-playing .k-tick svg path { animation: none; stroke-dashoffset: 0; }
        }

        /* ── Row 3 headline ── */
        .r3-mob-headline {
          position: absolute;
          top: 28px; left: 28px;
          z-index: 5;
        }
        .r3-mob-headline h3 {
          font-size: 26px; font-weight: 500; letter-spacing: -0.02em; color: var(--ink); margin: 0;
        }
        .r3-mob-headline em {
          font-family: var(--font-serif); font-style: italic; font-weight: 400;
        }

        /* ── Tablet (769–1024px) ───────────────── */
        @media (max-width: 1024px) and (min-width: 769px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-big { grid-column: span 2; min-height: 640px; }
          .bento-small { min-height: 600px; }
          .bento-r2 { min-height: 600px; }
          .bento-r3 { grid-column: span 2; min-height: 480px; }
          .r3-window { transform: scale(0.42); width: 1400px; right: 20px; top: 64px; }
          .r3-float { left: 180px; }
          .mesh-blob-green, .mesh-blob-blue, .mesh-blob-gold {
            width: 350px; height: 350px;
          }
          .radar-circle { transform: scale(0.8); }
          .globe-cluster { height: 180px; }
        }

        /* ── Phone (≤768px) ────────────────────── */
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; gap: 16px; }

          /* Row 1 Big */
          .bento-big { grid-column: span 1; min-height: 520px; }
          .bento-big-content { padding: 28px 20px 48px; padding-left: 20px; min-height: 520px; justify-content: center; }
          .bento-big-headline h3 { font-size: 22px; }
          .particle-field { display: none; }
          .dash-preview { display: none; }
          .mesh-blob-green, .mesh-blob-blue, .mesh-blob-gold {
            width: 280px; height: 280px;
          }

          /* Row 1 Small */
          .bento-small { min-height: 440px; }
          .bento-small-headline h3 { font-size: 22px; }
          .small-card-content { padding-top: 100px !important; }

          /* Row 2 */
          .bento-r2 { min-height: 460px; }
          .r2-headline h3 { font-size: 22px; }
          .radar-circle { transform: scale(0.65); }
          .radar-sweep { width: 200px; height: 200px; }
          .globe-cluster { height: 160px; }
          .globe-dot-circle { width: 8px; height: 8px; }

          /* Row 3 */
          .bento-r3 { grid-column: span 1; min-height: 400px; }
          .r3-mob-headline h3 { font-size: 22px; }
          .r3-window { display: none; }
          .r3-float {
            position: relative; top: auto; left: auto;
            transform: scale(1);
            width: calc(100% - 48px);
            margin: 72px auto 24px;
          }

          /* Globe stats */
          .globe-stats { gap: 20px !important; }

          /* Breathing waves: keep 2 layers for perf */
          .r3-wave-3, .r3-wave-4 { display: none; }
        }

        /* ── Small phone (≤480px) ──────────────── */
        @media (max-width: 480px) {
          .bento-big { min-height: 460px; }
          .bento-big-content { min-height: 460px; padding: 20px 16px 40px; }
          .bento-small { min-height: 420px; }
          .bento-r2 { min-height: 420px; }
          .bento-r3 { min-height: 380px; }
          .r3-float { width: calc(100% - 32px); margin: 64px auto 20px; }
          .r2-content { padding: 72px 16px 24px; }
          .globe-stats { gap: 14px !important; }
        }

        /* ── Touch: freeze waves + particles ───── */
        @media (hover: none) {
          .r3-wave { animation-play-state: paused; }
          .particle { animation: none; translate: calc(var(--rx) - var(--sx)) calc(var(--ry) - var(--sy)); }
          .particle-blob { opacity: 1; }
        }
      `}</style>
      <div className="bento-grid">
        <Row1BigCard />
        <Row1SmallCard />
        <Row2QRCard />
        <Row2VerifyCard />
        <Row2GlobalCard />
        <Row3DashCard />
      </div>
    </>
  );
}
