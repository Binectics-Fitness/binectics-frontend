"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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

const PARTICLE_COUNT = 1500;
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
  const isBlob = i % 10 === 0;
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

// ─── Small card: Pulse Rings ───────────────────────────────────────

const RING_COUNT = 5;

function PulseRings() {
  return (
    <div className="pulse-rings" aria-hidden="true">
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <span
          key={i}
          className="pulse-ring"
          style={{ animationDelay: `${i * 0.7}s`, width: 120 + i * 100, height: 120 + i * 100 }}
        />
      ))}
    </div>
  );
}

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

  return (
    <div
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

  return (
    <div
      className="bento-card bento-small"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="small-blob-bg" aria-hidden="true">
        <div className="small-blob" />
      </div>
      <PulseRings />
      <div className="bento-small-headline">
        <h3>Never miss a <em>day</em>.</h3>
      </div>
      <div style={{ position: "relative", zIndex: 2, padding: "0 8%", paddingTop: 170, display: "flex", flexDirection: "column", justifyContent: "flex-start", height: "100%", gap: 16 }}>
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
            {["M", "T", "W", "T", "F", "S", "S"].map(d => (
              <div key={d} style={{ fontFamily: "var(--font-mono)", fontSize: 10, textAlign: "center", color: "var(--fg-4)", padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
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

        /* ── Small card blob bg ────────────────── */
        .small-blob-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .small-blob {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: oklch(0.72 0.18 145 / 0.10);
          filter: blur(80px);
          animation: small-blob-drift 14s ease-in-out infinite;
        }
        @keyframes small-blob-drift {
          0%   { top: 10%; left: -10%; }
          50%  { top: 50%; left: 20%; }
          100% { top: 10%; left: -10%; }
        }
        .small-card-inner {
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
        @media (hover: none) {
          .particle-blob { opacity: 1; }
        }

        /* ── Small card pulse rings ────────────── */
        .pulse-rings {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-ring {
          position: absolute;
          border: 2px solid oklch(0.14 0.008 80 / 0.18);
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.4);
        }
        @keyframes pulse-expand {
          0%   { transform: scale(0.3); opacity: 0.5; }
          60%  { opacity: 0.15; }
          100% { transform: scale(1); opacity: 0; }
        }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .bento-small:hover .pulse-ring {
            animation: pulse-expand 3.5s ease-out infinite;
          }
        }
        @media (hover: none) {
          .pulse-ring {
            opacity: 0.12;
            transform: scale(1);
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
          .small-blob { animation: none; }
          .small-card-inner { transition: none; }
          .pulse-ring { animation: none; }
        }

        /* ── Reduced motion ────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .particle { animation: none; transition: none; }
          .flow-screen { transition: none; }
        }

        /* ── Touch (no hover) ──────────────────── */
        @media (hover: none) {
          .particle {
            animation: none;
            translate: calc(var(--rx) - var(--sx)) calc(var(--ry) - var(--sy));
          }
        }

        /* ── Mobile ────────────────────────────── */
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-big { grid-column: span 1; min-height: 520px; }
          .bento-small { min-height: 380px; }
          .bento-big-content { padding: 28px 20px 48px; padding-left: 20px; min-height: 520px; justify-content: center; }
          .dash-preview { display: none; }
        }
      `}</style>
      <div className="bento-grid">
        <Row1BigCard />
        <Row1SmallCard />
      </div>
    </>
  );
}
