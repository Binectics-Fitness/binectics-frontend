"use client";

import { useState, useEffect, useRef } from "react";

const VIEWS = [
  { id: "overview", label: "Overview", sub: "4 KPIs" },
  { id: "members", label: "Members", sub: "Live feed" },
  { id: "schedule", label: "Schedule", sub: "6 classes" },
  { id: "revenue", label: "Revenue", sub: "Breakdown" },
] as const;

const SPARK_BARS = [38, 45, 32, 55, 48, 62, 50, 72];

const FEED_ITEMS = [
  { color: "signal", text: "<b>Sarah O.</b> checked in via QR at Sea Point", time: "just now" },
  { color: "signal", text: "New subscription · <b>Studio monthly</b> · Jamal S.", time: "2m" },
  { color: "warn", text: "<b>Coach Themba</b> running 4m late · 18:00 class", time: "4m" },
  { color: "signal", text: "Class booked · <b>Olympic basics</b> · Tue 19:00", time: "8m" },
  { color: "danger", text: "Refund request · R 850 · Pier B. · awaiting review", time: "14m" },
  { color: "signal", text: "Auto-payout posted · R 84,200 → ABSA •••2241", time: "1h" },
];

const CLASSES = [
  { time: "06:00", name: "Strength · Lower", coach: "Coach K", dur: "60 min", cap: "14/14", full: true },
  { time: "07:30", name: "HIIT · Full body", coach: "Coach Themba", dur: "45 min", cap: "11/14", full: false },
  { time: "12:15", name: "Mobility flow", coach: "Marcus B.", dur: "30 min", cap: "4/12", full: false },
  { time: "17:00", name: "Strength · Upper", coach: "Coach K", dur: "60 min", cap: "12/14", full: false },
  { time: "18:00", name: "Olympic basics", coach: "Coach Themba", dur: "60 min", cap: "12/12", full: true },
  { time: "19:15", name: "Conditioning", coach: "Sarah O.", dur: "45 min", cap: "7/16", full: false },
];

const REVENUE_SEGMENTS = [
  { label: "Monthly subscriptions", pct: 64, amount: "R 692,800", color: "var(--ink)" },
  { label: "Annual", pct: 22, amount: "R 238,500", color: "var(--signal)" },
  { label: "Day passes", pct: 10, amount: "R 108,420", color: "var(--gym)" },
  { label: "Personal training", pct: 4, amount: "R 44,480", color: "var(--trainer)" },
];

const CYCLE_MS = 5000;
const EXIT_MS = 150;
const GAP_MS = 100;
const ENTER_MS = 350;
const ROW_STAGGER_MS = 80;

export function GymOwnerDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exiting" | "entering">("visible");
  const [displayIdx, setDisplayIdx] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      ? "gyd-phase-exit"
      : phase === "entering"
        ? "gyd-phase-enter"
        : "gyd-phase-visible";

  const viewId = VIEWS[displayIdx].id;

  return (
    <div className="gyd-root">
      <style>{GYM_OWNER_CSS}</style>

      <div className="gyd-chips">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            className={`gyd-chip ${i === idx ? "active" : ""}`}
            onClick={() => handleChipClick(i)}
            type="button"
          >
            <span className="gyd-chip-nm">{v.label}</span>
            <span className="gyd-chip-tg">{v.sub}</span>
          </button>
        ))}
      </div>

      <div className="gyd-stage">
        <div className="gyd-stage-tag">
          <span>Gym owner dashboard</span>
        </div>

        <div className={`gyd-card ${phaseClass}`}>
          {viewId === "overview" && <OverviewView />}
          {viewId === "members" && <MembersView />}
          {viewId === "schedule" && <ScheduleView />}
          {viewId === "revenue" && <RevenueView />}
        </div>
      </div>
    </div>
  );
}

function OverviewView() {
  return (
    <div className="gyd-kpi-grid">
      <div className="gyd-kpi gyd-row-0">
        <div className="gyd-kpi-label">Revenue &middot; 30d</div>
        <div className="gyd-kpi-row">
          <div className="gyd-kpi-value">R 1,084,200</div>
          <div className="gyd-spark">
            {SPARK_BARS.map((h, i) => (
              <div
                key={i}
                className={`gyd-spark-bar ${i === SPARK_BARS.length - 1 ? "last" : ""}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="gyd-kpi-delta gyd-delta-up">&uarr; 12.4%</div>
      </div>

      <div className="gyd-kpi gyd-row-1">
        <div className="gyd-kpi-label">Active members</div>
        <div className="gyd-kpi-value">1,284</div>
        <div className="gyd-kpi-delta gyd-delta-up">&uarr; 38 net new</div>
      </div>

      <div className="gyd-kpi gyd-row-2">
        <div className="gyd-kpi-label">Check-ins &middot; today</div>
        <div className="gyd-kpi-value">412 / 1,284</div>
        <div className="gyd-kpi-delta gyd-delta-up">32% attendance</div>
      </div>

      <div className="gyd-kpi gyd-row-3">
        <div className="gyd-kpi-label">Churn &middot; 30d</div>
        <div className="gyd-kpi-value">2.1%</div>
        <div className="gyd-kpi-delta gyd-delta-danger">&darr; 0.4 pts</div>
      </div>
    </div>
  );
}

function MembersView() {
  return (
    <div className="gyd-feed">
      <div className="gyd-feed-header gyd-row-0">
        <span className="gyd-feed-title">Live activity</span>
        <span className="gyd-live-badge">
          <span className="gyd-live-dot" />
          Live
        </span>
      </div>
      <div className="gyd-feed-list">
        {FEED_ITEMS.map((item, i) => (
          <div key={i} className={`gyd-feed-item gyd-row-${i}`}>
            <span className={`gyd-feed-dot gyd-dot-${item.color}`} />
            <span
              className="gyd-feed-text"
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
            <span className="gyd-feed-time">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleView() {
  return (
    <div className="gyd-sched">
      <div className="gyd-sched-header gyd-row-0">
        <span className="gyd-sched-title">Today&apos;s classes</span>
        <span className="gyd-sched-date">Mon &middot; May 11 &middot; Sea Point</span>
      </div>
      <div className="gyd-sched-list">
        {CLASSES.map((cls, i) => (
          <div key={i} className={`gyd-sched-row gyd-row-${i}`}>
            <span className="gyd-sched-time">{cls.time}</span>
            <div className="gyd-sched-info">
              <span className="gyd-sched-name">{cls.name}</span>
              <span className="gyd-sched-coach">{cls.coach} &middot; {cls.dur}</span>
            </div>
            <span className={`gyd-sched-cap ${cls.full ? "full" : "open"}`}>{cls.cap}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueView() {
  return (
    <div className="gyd-rev">
      <div className="gyd-rev-header gyd-row-0">
        <span className="gyd-rev-title">Revenue mix &middot; 30 days</span>
      </div>

      <div className="gyd-rev-bar gyd-row-1">
        {REVENUE_SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="gyd-rev-seg"
            style={{ flex: seg.pct, background: seg.color }}
          />
        ))}
      </div>

      <div className="gyd-rev-legend">
        {REVENUE_SEGMENTS.map((seg, i) => (
          <div key={i} className={`gyd-rev-row gyd-row-${i + 2}`}>
            <div className="gyd-rev-row-left">
              <span className="gyd-rev-dot" style={{ background: seg.color }} />
              <span className="gyd-rev-label">{seg.label}</span>
            </div>
            <span className="gyd-rev-val">{seg.amount} &middot; {seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const GYM_OWNER_CSS = `
.gyd-root { display: flex; flex-direction: column; gap: 16px; }

.gyd-chips {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
}
@media (max-width: 640px) {
  .gyd-chips { grid-template-columns: repeat(2, 1fr); }
}
.gyd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 2px;
}
.gyd-chip:hover { border-color: var(--border-2); }
.gyd-chip.active { border-color: var(--ink); }
.gyd-chip-nm {
  font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink);
}
.gyd-chip-tg {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}

.gyd-stage {
  background: oklch(0.93 0.005 80);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 40px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  min-height: 380px;
  background-image: radial-gradient(circle at 50% 30%, oklch(0 0 0 / 0.04), transparent 70%);
}
@media (max-width: 640px) {
  .gyd-stage { padding: 20px 12px; min-height: 320px; }
}
.gyd-stage-tag {
  position: absolute; top: 14px; left: 16px;
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
}
.gyd-stage-tag::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal); box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: gyd-livedot 1.4s ease-in-out infinite;
}
@keyframes gyd-livedot { 50% { opacity: 0.4; } }

.gyd-card {
  width: 480px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 20px 18px;
  box-shadow: 0 4px 24px -6px oklch(0 0 0 / 0.08);
  display: flex; flex-direction: column;
}
@media (max-width: 640px) {
  .gyd-card { width: 100%; padding: 16px 14px; }
}

.gyd-kpi-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.gyd-kpi {
  border: 1px solid var(--border); border-radius: var(--r-2);
  background: var(--bg); padding: 14px 16px;
  display: flex; flex-direction: column; gap: 4px;
}
.gyd-kpi-label {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.gyd-kpi-row {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 8px;
}
.gyd-kpi-value {
  font-size: 24px; font-weight: 500; color: var(--ink);
  font-variant-numeric: tabular-nums; line-height: 1.1;
  letter-spacing: -0.02em;
}
.gyd-kpi-delta {
  font-family: var(--font-mono); font-size: 10.5px;
}
.gyd-delta-up { color: var(--signal-ink); }
.gyd-delta-danger { color: var(--danger); }

.gyd-spark {
  display: flex; align-items: flex-end; gap: 1.5px; height: 28px;
}
.gyd-spark-bar {
  width: 5px; border-radius: 1px; background: var(--bg-3);
  min-height: 3px;
}
.gyd-spark-bar.last { background: var(--ink); }

.gyd-feed { display: flex; flex-direction: column; gap: 0; }
.gyd-feed-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.gyd-feed-title {
  font-size: 14px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em;
}
.gyd-live-badge {
  display: flex; align-items: center; gap: 5px;
  font-family: var(--font-mono); font-size: 10px; color: var(--signal-ink);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.gyd-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal);
  box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: gyd-livedot 1.4s ease-in-out infinite;
}
.gyd-feed-list { display: flex; flex-direction: column; gap: 0; }
.gyd-feed-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--border);
}
.gyd-feed-item:first-child { border-top: none; }
.gyd-feed-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  margin-top: 4px;
}
.gyd-dot-signal {
  background: var(--signal);
  box-shadow: 0 0 0 2.5px oklch(0.68 0.16 148 / 0.15);
}
.gyd-dot-warn {
  background: var(--warn);
  box-shadow: 0 0 0 2.5px oklch(0.75 0.15 75 / 0.15);
}
.gyd-dot-danger {
  background: var(--danger);
  box-shadow: 0 0 0 2.5px oklch(0.55 0.2 25 / 0.15);
}
.gyd-feed-text {
  flex: 1; font-size: 13px; color: var(--ink); line-height: 1.4;
  letter-spacing: -0.005em;
}
.gyd-feed-text b { font-weight: 600; }
.gyd-feed-time {
  font-family: var(--font-mono); font-size: 11px; color: var(--fg-3);
  flex-shrink: 0; white-space: nowrap; margin-top: 1px;
}

.gyd-sched { display: flex; flex-direction: column; }
.gyd-sched-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.gyd-sched-title {
  font-size: 14px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em;
}
.gyd-sched-date {
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  letter-spacing: 0.02em;
}
.gyd-sched-list { display: flex; flex-direction: column; gap: 0; }
.gyd-sched-row {
  display: flex; align-items: center; gap: 12px;
  padding: 7px 0;
  border-top: 1px solid var(--border);
}
.gyd-sched-row:first-child { border-top: none; }
.gyd-sched-time {
  font-family: var(--font-mono); font-size: 12px; color: var(--ink);
  font-variant-numeric: tabular-nums; width: 40px; flex-shrink: 0;
}
.gyd-sched-info {
  flex: 1; display: flex; flex-direction: column; gap: 1px;
}
.gyd-sched-name {
  font-size: 13px; font-weight: 500; color: var(--ink); letter-spacing: -0.005em;
}
.gyd-sched-coach {
  font-size: 12px; color: var(--fg-3);
}
.gyd-sched-cap {
  font-family: var(--font-mono); font-size: 12px;
  font-variant-numeric: tabular-nums; flex-shrink: 0;
}
.gyd-sched-cap.full { color: var(--danger); }
.gyd-sched-cap.open { color: var(--signal-ink); }

.gyd-rev { display: flex; flex-direction: column; }
.gyd-rev-header { margin-bottom: 16px; }
.gyd-rev-title {
  font-size: 14px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em;
}
.gyd-rev-bar {
  display: flex; gap: 1px; height: 10px; border-radius: 4px; overflow: hidden;
  margin-bottom: 16px;
}
.gyd-rev-seg {
  border-radius: 2px; min-width: 4px;
}
.gyd-rev-legend { display: flex; flex-direction: column; gap: 0; }
.gyd-rev-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
  border-top: 1px solid var(--border);
}
.gyd-rev-row:first-child { border-top: none; }
.gyd-rev-row-left {
  display: flex; align-items: center; gap: 8px;
}
.gyd-rev-dot {
  width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
}
.gyd-rev-label {
  font-size: 13px; color: var(--ink); letter-spacing: -0.005em;
}
.gyd-rev-val {
  font-family: var(--font-mono); font-size: 12px; color: var(--fg-3);
  font-variant-numeric: tabular-nums;
}

.gyd-phase-enter .gyd-row-0 { animation: gyd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 0}ms both; }
.gyd-phase-enter .gyd-row-1 { animation: gyd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 1}ms both; }
.gyd-phase-enter .gyd-row-2 { animation: gyd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both; }
.gyd-phase-enter .gyd-row-3 { animation: gyd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 3}ms both; }
.gyd-phase-enter .gyd-row-4 { animation: gyd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 4}ms both; }
.gyd-phase-enter .gyd-row-5 { animation: gyd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 5}ms both; }
@keyframes gyd-rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.gyd-phase-exit .gyd-row-0,
.gyd-phase-exit .gyd-row-1,
.gyd-phase-exit .gyd-row-2,
.gyd-phase-exit .gyd-row-3,
.gyd-phase-exit .gyd-row-4,
.gyd-phase-exit .gyd-row-5 {
  animation: gyd-rowOut ${EXIT_MS}ms ease-out forwards;
}
@keyframes gyd-rowOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .gyd-phase-enter .gyd-row-0,
  .gyd-phase-enter .gyd-row-1,
  .gyd-phase-enter .gyd-row-2,
  .gyd-phase-enter .gyd-row-3,
  .gyd-phase-enter .gyd-row-4,
  .gyd-phase-enter .gyd-row-5,
  .gyd-phase-exit .gyd-row-0,
  .gyd-phase-exit .gyd-row-1,
  .gyd-phase-exit .gyd-row-2,
  .gyd-phase-exit .gyd-row-3,
  .gyd-phase-exit .gyd-row-4,
  .gyd-phase-exit .gyd-row-5 {
    animation: gyd-instantFade 1ms forwards !important;
  }
  @keyframes gyd-instantFade { to { opacity: 1; transform: none; } }
  .gyd-stage-tag::before { animation: none; opacity: 1; }
  .gyd-live-dot { animation: none; opacity: 1; }
}
`;
