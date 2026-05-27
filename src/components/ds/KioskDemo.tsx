"use client";

import { useState, useEffect, useRef, useMemo } from "react";

const MEMBERS = [
  {
    id: "lerato",
    name: "Lerato Mokoena",
    initials: "LM",
    photoBg: "oklch(0.86 0.04 80)",
    type: "Iron Lab Member · 2 years",
    streakFrom: 23,
    streakTo: 24,
    streakLabel: "day streak",
    nextTime: "6:30",
    nextLine: "Strength",
    nextSub: "with Sarah Okafor",
    nextBadge: null,
    welcome: "Welcome back",
    flavor: "standard",
    tag: "Standard",
  },
  {
    id: "marcus",
    name: "Marcus Chen",
    initials: "MC",
    photoBg: "oklch(0.84 0.05 60)",
    type: "Iron Lab Member · 4 years",
    streakFrom: 47,
    streakTo: 48,
    streakLabel: "day streak",
    nextTime: "7:00",
    nextLine: "5×5 Powerlifting",
    nextSub: "one rep from a PR",
    nextBadge: "PR day",
    welcome: "A personal record kind of day",
    flavor: "pr",
    tag: "PR potential",
  },
  {
    id: "aisha",
    name: "Aisha Patel",
    initials: "AP",
    photoBg: "oklch(0.86 0.04 120)",
    type: "Iron Lab Member · day 1",
    streakFrom: 0,
    streakTo: 1,
    streakLabel: "first day",
    nextTime: "6:00",
    nextLine: "Beginner Strength",
    nextSub: "with Sarah — she’s expecting you",
    nextBadge: "First class",
    welcome: "Welcome to Iron Lab. We are glad you are here.",
    flavor: "first",
    tag: "First-timer",
  },
  {
    id: "daniel",
    name: "Daniel Kovač",
    initials: "DK",
    photoBg: "oklch(0.84 0.03 240)",
    type: "Iron Lab Member · 3 years",
    streakFrom: null,
    streakTo: null,
    streakLabel: null,
    nextTime: "now",
    nextLine: "Open gym",
    nextSub: "drop in any time today",
    nextBadge: null,
    welcome: "Missed you these 14 days.",
    flavor: "returning",
    tag: "Returning",
  },
];

const SEQ_TOTAL = 2150;
const HOLD = 2500;
const IDLE_GAP = 800;

function useRAFTime(playing: boolean, duration: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) {
      setT(0);
      return;
    }
    let raf: number;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= duration) {
        setT(duration);
        return;
      }
      setT(elapsed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);
  return t;
}

function StreakNumber({
  from,
  to,
  playing,
}: {
  from: number | null;
  to: number | null;
  playing: boolean;
}) {
  const t = useRAFTime(playing, SEQ_TOTAL);
  if (from === null || to === null) return null;
  let value = from;
  const startT = 1550;
  const endT = 2150;
  if (t < startT) value = from;
  else if (t >= endT) value = to;
  else {
    const p = (t - startT) / (endT - startT);
    const eased = 1 - Math.pow(1 - p, 3);
    value = Math.round(from + (to - from) * eased);
  }
  return <span>{value}</span>;
}

function Success({
  member,
  playing,
  runKey,
}: {
  member: (typeof MEMBERS)[0];
  playing: boolean;
  runKey: number;
}) {
  return (
    <div className={`kd-success flavor-${member.flavor}`} key={runKey}>
      <div className="kd-ok-flash">
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 2.5 6 L 5 8.5 L 9.5 4" />
        </svg>
        <span>Checked in</span>
      </div>

      <div className="kd-hero">
        <div className="kd-ring">
          <div className="kd-tick">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 5 12 L 10 17 L 19 7" />
            </svg>
          </div>
          <div className="kd-photo" style={{ background: member.photoBg }}>
            <span>{member.initials}</span>
          </div>
        </div>
      </div>

      <div className="kd-name">{member.name}</div>
      <div className="kd-type">{member.type}</div>

      <div className="kd-nextcard">
        <div className="kd-nc-time">
          <span className="kd-nc-h">{member.nextTime}</span>
          {member.nextTime !== "now" && <span>PM</span>}
        </div>
        <div className="kd-nc-body">
          <div className="kd-nc-t">{member.nextLine}</div>
          <div className="kd-nc-s">{member.nextSub}</div>
        </div>
        {member.nextBadge && (
          <div className="kd-nc-badge">{member.nextBadge}</div>
        )}
      </div>

      {member.streakTo !== null && (
        <div className="kd-streak">
          <div className="kd-str-num">
            <StreakNumber
              from={member.streakFrom}
              to={member.streakTo}
              playing={playing}
            />
          </div>
          <div className="kd-str-lbl">
            <div className="kd-str-top">
              {member.flavor === "first" ? "Your streak begins" : "Day streak"}
            </div>
            <div>{member.streakLabel}</div>
          </div>
          {(member.streakTo ?? 0) - (member.streakFrom ?? 0) > 0 && (
            <div className="kd-str-plus">+1</div>
          )}
        </div>
      )}

      <div className="kd-welcome">{member.welcome}</div>
    </div>
  );
}

function QRHint() {
  const cells = useMemo(() => {
    const result: boolean[] = [];
    let s = 7;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < 169; i++) {
      result.push(rnd() <= 0.55);
    }
    return result;
  }, []);

  return (
    <div className="kd-qr-hint">
      {cells.map((visible, i) => (
        <span key={i} style={visible ? undefined : { opacity: 0 }} />
      ))}
    </div>
  );
}

export function KioskDemo() {
  const [idx, setIdx] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const member = MEMBERS[idx];

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
    const tStart = setTimeout(() => {
      setRunKey((k) => k + 1);
      setPlaying(true);
    }, IDLE_GAP);
    return () => clearTimeout(tStart);
  }, [idx]);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setTimeout(() => {
      setIdx((i) => (i + 1) % MEMBERS.length);
    }, SEQ_TOTAL + HOLD);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, runKey]);

  const [clock, setClock] = useState("");
  useEffect(() => {
    const upd = () => {
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
    };
    upd();
    const i = setInterval(upd, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="kd-root">
      <style>{KIOSK_CSS}</style>

      {/* Member selector chips */}
      <div className="kd-chips">
        {MEMBERS.map((m, i) => (
          <button
            key={m.id}
            className={`kd-chip ${i === idx ? "active" : ""}`}
            onClick={() => setIdx(i)}
            type="button"
          >
            <span className="kd-chip-nm">
              {m.name.split(" ")[0]} {m.name.split(" ")[1]?.[0]}.
            </span>
            <span className="kd-chip-tg">{m.tag}</span>
          </button>
        ))}
      </div>

      {/* Stage */}
      <div className="kd-stage">
        <div className="kd-stage-tag">
          <span>Live · Iron Lab kiosk</span>
        </div>

        <div className="kd-kiosk">
          <div className={`kd-screen ${playing ? "kd-playing" : ""}`}>
            {/* Status bar */}
            <div className="kd-stbar">
              <div className="kd-stbar-gym">
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                >
                  <path d="M 8 1.5 A 4.5 4.5 0 1 0 8 10.5" />
                  <path d="M 7 4 A 2 2 0 1 0 7 8" />
                </svg>
                <span>Iron Lab</span>
              </div>
              <div>{clock}</div>
            </div>

            <div className="kd-stage-area">
              {/* Idle */}
              <div className="kd-idle">
                <div className="kd-idle-eyebrow">Scan to enter</div>
                <div className="kd-idle-title">
                  Hold your <em>Binectics</em> code up to the camera
                </div>
                <div className="kd-viewfinder">
                  <span className="kd-bracket tl" />
                  <span className="kd-bracket tr" />
                  <span className="kd-bracket bl" />
                  <span className="kd-bracket br" />
                  <QRHint />
                  <div className="kd-scanline" />
                </div>
                <div className="kd-idle-help">
                  Camera unlocks the door · checks you in · counts
                  your streak.
                </div>
                <div className="kd-idle-foot">
                  <span>
                    Today ·{" "}
                    <span style={{ color: "var(--ink)" }}>216 checked in</span>
                  </span>
                  <span>Door ✓</span>
                </div>
              </div>

              {/* Success */}
              <Success member={member} playing={playing} runKey={runKey} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const KIOSK_CSS = `
/* ====== Kiosk Demo (kd- prefix) ====== */
.kd-root { display: flex; flex-direction: column; gap: 16px; }

.kd-chips {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
}
@media (max-width: 640px) {
  .kd-chips { grid-template-columns: repeat(2, 1fr); }
}
.kd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 2px;
}
.kd-chip:hover { border-color: var(--border-2); }
.kd-chip.active { border-color: var(--ink); }
.kd-chip-nm { font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink); }
.kd-chip-tg { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; }

.kd-stage {
  background: oklch(0.93 0.005 80);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 40px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  min-height: 600px;
  background-image: radial-gradient(circle at 50% 30%, oklch(0 0 0 / 0.04), transparent 70%);
}
@media (max-width: 640px) {
  .kd-stage { padding: 20px 12px; min-height: 520px; }
}
.kd-stage-tag {
  position: absolute; top: 14px; left: 16px;
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
}
.kd-stage-tag::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal); box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: kd-livedot 1.4s ease-in-out infinite;
}
@keyframes kd-livedot { 50% { opacity: 0.4; } }

/* Kiosk device */
.kd-kiosk {
  width: 300px; height: 600px;
  background: oklch(0.10 0.005 80);
  border-radius: 28px; padding: 10px;
  box-shadow:
    0 30px 50px -22px oklch(0 0 0 / 0.35),
    0 2px 0 0 oklch(0 0 0 / 0.06) inset,
    0 -2px 0 0 oklch(1 0 0 / 0.04) inset;
  position: relative;
}
@media (max-width: 640px) {
  .kd-kiosk { width: 260px; height: 520px; border-radius: 24px; padding: 8px; }
}
.kd-kiosk::before {
  content: ""; position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%; background: oklch(0.20 0.01 240);
  z-index: 3;
}

.kd-screen {
  width: 100%; height: 100%;
  background: var(--bg);
  border-radius: 20px; overflow: hidden;
  position: relative;
  display: flex; flex-direction: column;
}

.kd-stbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 14px 6px;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em;
}
.kd-stbar-gym { display: flex; align-items: center; gap: 5px; color: var(--ink); }
.kd-stbar-gym svg { width: 11px; height: 11px; }

.kd-stage-area { flex: 1; position: relative; overflow: hidden; }

/* ====== IDLE ====== */
.kd-idle {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 24px 24px;
  transition: opacity 200ms ease-out;
}
.kd-playing .kd-idle { opacity: 0; pointer-events: none; }

.kd-idle-eyebrow {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px;
}
.kd-idle-title {
  font-size: 22px; letter-spacing: -0.02em; font-weight: 500; line-height: 1.1;
  text-align: center; margin-bottom: 28px; max-width: 14ch; color: var(--ink);
}
.kd-idle-title em { font-family: var(--font-serif); font-weight: 400; font-style: italic; }

.kd-viewfinder { width: 160px; height: 160px; position: relative; margin-bottom: 24px; }
.kd-bracket {
  position: absolute; width: 24px; height: 24px;
  border-color: var(--ink); border-style: solid; border-width: 0;
}
.kd-bracket.tl { top: 0; left: 0; border-top-width: 2px; border-left-width: 2px; }
.kd-bracket.tr { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; }
.kd-bracket.bl { bottom: 0; left: 0; border-bottom-width: 2px; border-left-width: 2px; }
.kd-bracket.br { bottom: 0; right: 0; border-bottom-width: 2px; border-right-width: 2px; }

.kd-scanline {
  position: absolute; left: 6px; right: 6px; height: 2px;
  background: linear-gradient(to right, transparent, var(--signal), transparent);
  box-shadow: 0 0 12px var(--signal);
  animation: kd-scan 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes kd-scan {
  0%   { top: 6px; opacity: 0.5; }
  50%  { top: calc(100% - 8px); opacity: 1; }
  100% { top: 6px; opacity: 0.5; }
}

.kd-qr-hint {
  position: absolute; inset: 24px;
  display: grid; grid-template-columns: repeat(13, 1fr); grid-template-rows: repeat(13, 1fr);
  gap: 1px; opacity: 0.10;
}
.kd-qr-hint span { background: var(--ink); }

.kd-idle-help {
  font-size: 12px; color: var(--fg-3); text-align: center;
  line-height: 1.45; max-width: 22ch;
}

.kd-idle-foot {
  margin-top: auto; width: 100%;
  border-top: 1px solid var(--border); padding-top: 12px;
  display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em;
}

/* ====== SUCCESS ====== */
.kd-success {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  padding: 28px 22px 20px;
  opacity: 0; pointer-events: none;
}
.kd-playing .kd-success { opacity: 1; pointer-events: auto; }

.kd-ok-flash {
  position: absolute; top: 0; left: 0; right: 0; height: 32px;
  background: var(--signal-soft);
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--signal-ink); text-transform: uppercase; letter-spacing: 0.07em;
  transform: translateY(-100%);
}
.kd-ok-flash svg { width: 10px; height: 10px; }
.kd-playing .kd-ok-flash { animation: kd-flash 800ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards; }
@keyframes kd-flash { to { transform: translateY(0%); } }

.kd-hero { display: flex; justify-content: center; padding-top: 28px; margin-bottom: 18px; }
.kd-ring {
  width: 120px; height: 120px; border-radius: 50%;
  position: relative; background: var(--signal);
  transform: scale(0); opacity: 0;
}
.kd-playing .kd-ring {
  animation: kd-ringIn 500ms cubic-bezier(0.34, 1.4, 0.64, 1) 50ms forwards,
             kd-ringFade 400ms ease-out 800ms forwards;
}
@keyframes kd-ringIn { to { transform: scale(1); opacity: 1; } }
@keyframes kd-ringFade { to { background: transparent; box-shadow: inset 0 0 0 1.5px var(--border-2); } }

.kd-tick {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.kd-tick svg { width: 48px; height: 48px; color: oklch(0.985 0.005 85); }
.kd-tick svg path { stroke-dasharray: 60; stroke-dashoffset: 60; }
.kd-playing .kd-tick svg path { animation: kd-tickdraw 320ms cubic-bezier(0.16, 1, 0.3, 1) 350ms forwards; }
@keyframes kd-tickdraw { to { stroke-dashoffset: 0; } }
.kd-playing .kd-tick { animation: kd-tickfade 300ms ease-out 850ms forwards; }
@keyframes kd-tickfade { to { opacity: 0; transform: scale(0.7); } }

.kd-photo {
  position: absolute; inset: 0;
  border-radius: 50%; overflow: hidden;
  opacity: 0; transform: scale(0.85);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-serif); font-style: italic; font-size: 48px; color: var(--ink);
}
.kd-playing .kd-photo { animation: kd-photoIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 800ms forwards; }
@keyframes kd-photoIn { to { opacity: 1; transform: scale(1); } }

.kd-name {
  text-align: center; font-size: 22px; letter-spacing: -0.025em;
  font-weight: 500; line-height: 1.1; color: var(--ink);
  opacity: 0; transform: translateY(8px); margin-bottom: 3px;
}
.kd-playing .kd-name { animation: kd-riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 950ms forwards; }

.kd-type {
  text-align: center;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em;
  opacity: 0; transform: translateY(6px); margin-bottom: 16px;
}
.kd-playing .kd-type { animation: kd-riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1040ms forwards; }
@keyframes kd-riseIn { to { opacity: 1; transform: translateY(0); } }

/* Next class card */
.kd-nextcard {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-3);
  padding: 10px 12px; display: flex; align-items: center; gap: 10px;
  opacity: 0; transform: translateY(6px); margin-bottom: 10px;
}
.kd-playing .kd-nextcard { animation: kd-riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1180ms forwards; }
.kd-nc-time {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center;
  width: 38px; font-family: var(--font-mono); font-size: 9px;
  color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.1;
}
.kd-nc-h { color: var(--ink); font-family: var(--font-sans); font-size: 16px; font-weight: 500; letter-spacing: -0.02em; }
.kd-nc-body { flex: 1; min-width: 0; }
.kd-nc-t { font-size: 13px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink); }
.kd-nc-s { font-size: 10.5px; color: var(--fg-3); margin-top: 1px; font-family: var(--font-mono); }
.kd-nc-badge {
  font-family: var(--font-mono); font-size: 9px;
  color: var(--signal-ink); background: var(--signal-soft);
  padding: 2px 5px; border-radius: var(--r-1);
  text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0;
}

/* Streak */
.kd-streak {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-3);
  padding: 12px; display: flex; align-items: center; gap: 12px;
  opacity: 0; transform: translateY(6px); margin-bottom: 10px;
}
.kd-playing .kd-streak { animation: kd-riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1300ms forwards; }
.kd-str-num {
  font-size: 30px; font-weight: 500; letter-spacing: -0.04em; line-height: 1;
  font-variant-numeric: tabular-nums; color: var(--ink);
}
.kd-str-lbl {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; line-height: 1.3;
}
.kd-str-top { color: var(--ink); font-family: var(--font-sans); font-size: 12px; letter-spacing: -0.005em; text-transform: none; margin-bottom: 1px; }
.kd-str-plus {
  margin-left: auto;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--signal-ink); background: var(--signal-soft);
  padding: 3px 6px; border-radius: var(--r-1);
  opacity: 0; transform: translateY(-4px);
}
.kd-playing .kd-str-plus { animation: kd-riseIn 400ms cubic-bezier(0.16, 1, 0.3, 1) 1700ms forwards; }

/* Welcome */
.kd-welcome {
  margin-top: auto; text-align: center;
  font-family: var(--font-serif); font-style: italic;
  font-size: 15px; color: var(--fg-2); letter-spacing: -0.01em;
  padding-top: 10px;
  opacity: 0; transform: translateY(6px);
}
.kd-playing .kd-welcome { animation: kd-riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1600ms forwards; }

/* Flavor variants */
.flavor-first .kd-str-num { font-size: 24px; }
.flavor-pr .kd-nextcard { border-color: oklch(0.85 0.07 75); background: var(--trainer-soft); }
.flavor-pr .kd-nc-badge { background: oklch(0.92 0.07 75); color: oklch(0.32 0.12 75); }
.flavor-returning .kd-welcome { font-size: 18px; color: var(--ink); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .kd-scanline { animation: none; top: 50%; }
  .kd-playing .kd-ok-flash,
  .kd-playing .kd-ring,
  .kd-playing .kd-tick svg path,
  .kd-playing .kd-tick,
  .kd-playing .kd-photo,
  .kd-playing .kd-name,
  .kd-playing .kd-type,
  .kd-playing .kd-nextcard,
  .kd-playing .kd-streak,
  .kd-playing .kd-str-plus,
  .kd-playing .kd-welcome {
    animation: kd-fade 200ms ease forwards !important;
  }
  @keyframes kd-fade { to { opacity: 1; transform: none; } }
}
`;
