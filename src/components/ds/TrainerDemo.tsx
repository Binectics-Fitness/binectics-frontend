"use client";

import { useState, useEffect, useRef } from "react";

type View = "schedule" | "clients" | "earnings";

const VIEWS: { id: View; label: string; sub: string }[] = [
  { id: "schedule", label: "Schedule", sub: "5 sessions" },
  { id: "clients", label: "Clients", sub: "4 active" },
  { id: "earnings", label: "Earnings", sub: "R 38.4K" },
];

const SCHEDULE = [
  {
    time: "06:30",
    initials: "JC",
    name: "Jamal Chen",
    meta: "Intake + assessment · 60 min",
    badge: "First session",
    badgeType: "first" as const,
    borderColor: "var(--signal)",
    streak: null,
    cancelled: false,
  },
  {
    time: "08:00",
    initials: "LM",
    name: "Linda Mokoena",
    meta: "Session 14/24 · Strength upper · 60 min",
    badge: null,
    badgeType: null,
    borderColor: "var(--ink)",
    streak: 32,
    cancelled: false,
  },
  {
    time: "11:30",
    initials: "AA",
    name: "Aisha Adams",
    meta: "Programming review · Dubai · 30 min",
    badge: "Online",
    badgeType: "online" as const,
    borderColor: "var(--gym)",
    streak: null,
    cancelled: false,
  },
  {
    time: "13:00",
    initials: "PB",
    name: "Pier Botha",
    meta: "Refund · slot reopened",
    badge: "Cancelled · 06:42",
    badgeType: "cancelled" as const,
    borderColor: "var(--fg-4)",
    streak: null,
    cancelled: true,
  },
  {
    time: "15:30",
    initials: "TN",
    name: "Thandi Nkosi",
    meta: "Session 6/12 · Postnatal · 60 min",
    badge: null,
    badgeType: null,
    borderColor: "var(--ink)",
    streak: 18,
    cancelled: false,
  },
];

const CLIENTS = [
  { initials: "LM", name: "Linda Mokoena", plan: "Studio · 24-session", progress: 58, fraction: "14/24", streak: 32 },
  { initials: "WC", name: "Wei Chen", plan: "Olympic 12-pack", progress: 67, fraction: "8/12", streak: 11 },
  { initials: "AA", name: "Aisha Adams", plan: "Online monthly", progress: 85, fraction: "Monthly", streak: 45 },
  { initials: "MK", name: "Mike Khumalo", plan: "Conditioning 24-pack", progress: 92, fraction: "22/24", streak: 62 },
];

const EARNINGS = [
  { title: "Studio · 24-session pack", sub: "Linda M. · May 02", amount: "+ R 14,400", color: "var(--signal-ink)" },
  { title: "Olympic 12-pack", sub: "Wei C. · Apr 28", amount: "+ R 14,400", color: "var(--signal-ink)" },
  { title: "Online monthly · May", sub: "Aisha A. · Dubai", amount: "$ 320 pending", color: "var(--fg-3)" },
  { title: "Postnatal 12-pack", sub: "Thandi N. · Apr 22", amount: "+ R 11,400", color: "var(--signal-ink)" },
  { title: "Refund · Pier B.", sub: "Cancelled session · 13:00", amount: "− R 1,200", color: "var(--danger)" },
];

const FLAME_SVG = `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1C8 1 3 6 3 10a5 5 0 0 0 10 0C13 6 8 1 8 1Zm0 12.5A3 3 0 0 1 5 10.5c0-1.5 1.5-4 3-5.5 1.5 1.5 3 4 3 5.5A3 3 0 0 1 8 13.5Z" fill="currentColor"/></svg>`;

const CYCLE_MS = 5000;
const EXIT_MS = 150;
const GAP_MS = 100;
const ENTER_MS = 350;
const ROW_STAGGER_MS = 80;

export function TrainerDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exiting" | "entering">(
    "visible",
  );
  const [displayIdx, setDisplayIdx] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const view = VIEWS[displayIdx];

  useEffect(() => {
    cycleRef.current = setTimeout(() => {
      setIdx((i) => (i + 1) % VIEWS.length);
    }, CYCLE_MS);
    return () => {
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [idx, displayIdx]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (transRef.current) clearTimeout(transRef.current);

    setPhase("exiting");

    transRef.current = setTimeout(() => {
      setDisplayIdx(idx);
      setPhase("entering");

      transRef.current = setTimeout(() => {
        setPhase("visible");
      }, ENTER_MS + ROW_STAGGER_MS * 6 + 100);
    }, EXIT_MS + GAP_MS);

    return () => {
      if (transRef.current) clearTimeout(transRef.current);
    };
  }, [idx]);

  const handleChipClick = (i: number) => {
    if (i === idx) return;
    if (cycleRef.current) clearTimeout(cycleRef.current);
    setIdx(i);
  };

  const phaseClass =
    phase === "exiting"
      ? "trd-phase-exit"
      : phase === "entering"
        ? "trd-phase-enter"
        : "trd-phase-visible";

  return (
    <div className="trd-root">
      <style>{TRAINER_CSS}</style>

      <div className="trd-chips">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            className={`trd-chip ${i === idx ? "active" : ""}`}
            onClick={() => handleChipClick(i)}
            type="button"
          >
            <span className="trd-chip-nm">{v.label}</span>
            <span className="trd-chip-tg">{v.sub}</span>
          </button>
        ))}
      </div>

      <div className="trd-stage">
        <div className="trd-stage-tag">
          <span>Trainer dashboard</span>
        </div>

        <div className={`trd-card ${phaseClass}`}>
          {view.id === "schedule" && <ScheduleView />}
          {view.id === "clients" && <ClientsView />}
          {view.id === "earnings" && <EarningsView />}
        </div>
      </div>
    </div>
  );
}

function ScheduleView() {
  return (
    <div className="trd-schedule">
      <div className="trd-card-header">
        <div className="trd-card-title">Today</div>
        <div className="trd-card-sub">5 sessions · 4 h 10 min</div>
      </div>
      {SCHEDULE.map((s, i) => (
        <div key={i}>
          {i === 4 && (
            <div className="trd-gap-line trd-row-gap">
              <span className="trd-gap-rule" />
              <span className="trd-gap-text">14:00 – 15:30 · 90 min open</span>
              <span className="trd-gap-rule" />
            </div>
          )}
          <div
            className={`trd-session trd-row-${i}`}
            style={{ opacity: s.cancelled ? 0.5 : 1 }}
          >
            <div className="trd-session-time">{s.time}</div>
            <div
              className="trd-session-card"
              style={{ borderLeftColor: s.borderColor }}
            >
              <div className="trd-session-top">
                <div
                  className="trd-avatar"
                  style={{ width: 28, height: 28, fontSize: 11 }}
                >
                  {s.initials}
                </div>
                <div className="trd-session-info">
                  <div className="trd-session-name-row">
                    <span className="trd-session-name">{s.name}</span>
                    {s.badge && (
                      <span
                        className={`trd-badge trd-badge-${s.badgeType}`}
                      >
                        {s.badge}
                      </span>
                    )}
                    {s.streak && (
                      <span className="trd-streak-pill">
                        <span
                          className="trd-flame"
                          dangerouslySetInnerHTML={{ __html: FLAME_SVG }}
                        />
                        <span className="trd-streak-num">{s.streak}</span>
                      </span>
                    )}
                  </div>
                  <div className="trd-session-meta">{s.meta}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsView() {
  return (
    <div className="trd-clients">
      <div className="trd-card-header">
        <div className="trd-card-title">Active clients</div>
        <div className="trd-card-sub">42 total · ranked by next session</div>
      </div>
      {CLIENTS.map((c, i) => (
        <div key={i} className={`trd-client-row trd-row-${i}`}>
          <div
            className="trd-avatar"
            style={{ width: 32, height: 32, fontSize: 11 }}
          >
            {c.initials}
          </div>
          <div className="trd-client-info">
            <div className="trd-client-name">{c.name}</div>
            <div className="trd-client-plan">{c.plan} · {c.fraction}</div>
          </div>
          <div className="trd-client-progress">
            <div className="trd-progress-track">
              <div
                className="trd-progress-fill"
                style={{ width: `${c.progress}%` }}
              />
            </div>
            <div className="trd-progress-label">{c.progress}%</div>
          </div>
          <span className="trd-streak-pill">
            <span
              className="trd-flame"
              dangerouslySetInnerHTML={{ __html: FLAME_SVG }}
            />
            <span className="trd-streak-num">{c.streak}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function EarningsView() {
  return (
    <div className="trd-earnings">
      <div className="trd-card-header">
        <div className="trd-card-title">Earnings · this month</div>
        <div className="trd-card-sub">R 38,400 booked · next payout May 13</div>
      </div>
      {EARNINGS.map((e, i) => (
        <div key={i} className={`trd-earn-row trd-row-${i}`}>
          <div className="trd-earn-info">
            <div className="trd-earn-title">{e.title}</div>
            <div className="trd-earn-sub">{e.sub}</div>
          </div>
          <div className="trd-earn-amount" style={{ color: e.color }}>
            {e.amount}
          </div>
        </div>
      ))}
    </div>
  );
}

const TRAINER_CSS = `
.trd-root { display: flex; flex-direction: column; gap: 16px; }

.trd-chips {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
@media (max-width: 640px) {
  .trd-chips { grid-template-columns: repeat(2, 1fr); }
}
.trd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 2px;
}
.trd-chip:hover { border-color: var(--border-2); }
.trd-chip.active { border-color: var(--ink); }
.trd-chip-nm {
  font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink);
}
.trd-chip-tg {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}

.trd-stage {
  background: oklch(0.93 0.005 80);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 40px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  min-height: 420px;
  background-image: radial-gradient(circle at 50% 30%, oklch(0 0 0 / 0.04), transparent 70%);
}
@media (max-width: 640px) {
  .trd-stage { padding: 20px 12px; min-height: 360px; }
}
.trd-stage-tag {
  position: absolute; top: 14px; left: 16px;
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
}
.trd-stage-tag::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal); box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: trd-livedot 1.4s ease-in-out infinite;
}
@keyframes trd-livedot { 50% { opacity: 0.4; } }

.trd-card {
  width: 400px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 0;
  box-shadow: 0 4px 24px -6px oklch(0 0 0 / 0.08);
  display: flex; flex-direction: column;
}
@media (max-width: 640px) {
  .trd-card { width: 100%; }
}

.trd-card-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.trd-card-title {
  font-size: 14px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink);
  margin-bottom: 2px;
}
.trd-card-sub {
  font-family: var(--font-mono); font-size: 11px; color: var(--fg-3);
  letter-spacing: 0.02em;
}

.trd-avatar {
  border-radius: 50%;
  background: var(--bg-3);
  color: var(--fg-2);
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}

.trd-streak-pill {
  display: inline-flex; align-items: center; gap: 3px;
  background: var(--bg-2);
  border-radius: 999px;
  padding: 2px 7px 2px 5px;
  flex-shrink: 0;
}
.trd-flame {
  display: inline-flex; align-items: center;
  color: var(--signal-ink);
  line-height: 0;
}
.trd-streak-num {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.trd-schedule { display: flex; flex-direction: column; }
.trd-session {
  display: flex; align-items: stretch;
  border-bottom: 1px solid var(--border);
}
.trd-session:last-child { border-bottom: none; }
.trd-session-time {
  width: 60px; flex-shrink: 0;
  font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-3);
  text-align: right; padding: 12px 10px 12px 0;
  border-right: 1px solid var(--border);
  display: flex; align-items: center; justify-content: flex-end;
}
.trd-session-card {
  flex: 1; min-width: 0;
  border-left: 3px solid var(--ink);
  padding: 10px 14px;
}
.trd-session-top {
  display: flex; align-items: center; gap: 10px;
}
.trd-session-info { flex: 1; min-width: 0; }
.trd-session-name-row {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.trd-session-name {
  font-size: 14px; font-weight: 500; color: var(--ink);
  letter-spacing: -0.005em;
}
.trd-session-meta {
  font-size: 12px; color: var(--fg-3); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.trd-badge {
  display: inline-block;
  font-size: 10px; font-weight: 600;
  padding: 1px 7px;
  border-radius: var(--r-2);
  letter-spacing: 0.02em;
  line-height: 1.6;
  white-space: nowrap;
}
.trd-badge-first {
  background: var(--signal-soft);
  color: var(--signal-ink);
}
.trd-badge-online {
  background: transparent;
  border: 1px solid var(--gym);
  color: var(--gym);
}
.trd-badge-cancelled {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
}

.trd-gap-line {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px 8px 70px;
}
.trd-gap-rule {
  flex: 1; height: 1px; background: var(--border);
}
.trd-gap-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-4);
  white-space: nowrap;
}
@media (max-width: 640px) {
  .trd-gap-line { padding-left: 14px; }
}

.trd-clients { display: flex; flex-direction: column; }
.trd-client-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
}
.trd-client-row:last-child { border-bottom: none; }
.trd-client-info { flex: 1; min-width: 0; }
.trd-client-name {
  font-size: 14px; font-weight: 500; color: var(--ink);
  letter-spacing: -0.005em;
}
.trd-client-plan {
  font-family: var(--font-mono); font-size: 12px; color: var(--fg-3);
  margin-top: 1px;
}
.trd-client-progress {
  display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
  flex-shrink: 0;
}
.trd-progress-track {
  width: 72px; height: 4px;
  background: var(--bg-3);
  border-radius: 2px;
  overflow: hidden;
}
.trd-progress-fill {
  height: 100%;
  background: var(--ink);
  border-radius: 2px;
}
.trd-progress-label {
  font-family: var(--font-mono); font-size: 11px; color: var(--fg-3);
  font-variant-numeric: tabular-nums;
}

.trd-earnings { display: flex; flex-direction: column; }
.trd-earn-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}
.trd-earn-row:last-child { border-bottom: none; }
.trd-earn-info { flex: 1; min-width: 0; }
.trd-earn-title {
  font-size: 13.5px; color: var(--ink);
  letter-spacing: -0.005em;
}
.trd-earn-sub {
  font-family: var(--font-mono); font-size: 12px; color: var(--fg-3);
  margin-top: 1px;
}
.trd-earn-amount {
  font-family: var(--font-mono); font-size: 14px; font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap; flex-shrink: 0;
}

.trd-phase-enter .trd-row-0 { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 0}ms both; }
.trd-phase-enter .trd-row-1 { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 1}ms both; }
.trd-phase-enter .trd-row-2 { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both; }
.trd-phase-enter .trd-row-3 { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 3}ms both; }
.trd-phase-enter .trd-row-4 { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 4}ms both; }
.trd-phase-enter .trd-row-gap { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 4}ms both; }
.trd-phase-enter .trd-card-header { animation: trd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both; }
@keyframes trd-rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.trd-phase-exit .trd-session,
.trd-phase-exit .trd-client-row,
.trd-phase-exit .trd-earn-row,
.trd-phase-exit .trd-gap-line,
.trd-phase-exit .trd-card-header {
  animation: trd-rowOut ${EXIT_MS}ms ease-out forwards;
}
@keyframes trd-rowOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .trd-phase-enter .trd-row-0,
  .trd-phase-enter .trd-row-1,
  .trd-phase-enter .trd-row-2,
  .trd-phase-enter .trd-row-3,
  .trd-phase-enter .trd-row-4,
  .trd-phase-enter .trd-row-gap,
  .trd-phase-enter .trd-card-header,
  .trd-phase-exit .trd-session,
  .trd-phase-exit .trd-client-row,
  .trd-phase-exit .trd-earn-row,
  .trd-phase-exit .trd-gap-line,
  .trd-phase-exit .trd-card-header {
    animation: trd-instantFade 1ms forwards !important;
  }
  @keyframes trd-instantFade { to { opacity: 1; transform: none; } }
  .trd-stage-tag::before { animation: none; opacity: 1; }
}
`;
