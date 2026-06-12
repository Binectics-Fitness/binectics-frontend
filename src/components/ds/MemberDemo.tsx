"use client";

import { useState, useEffect, useRef } from "react";

const VIEWS = [
  { id: "home", chipLabel: "Home", chipTag: "Your day" },
  { id: "marketplace", chipLabel: "Marketplace", chipTag: "Browse" },
  { id: "activity", chipLabel: "Activity", chipTag: "Streaks" },
];

const CYCLE_MS = 5000;
const EXIT_MS = 150;
const GAP_MS = 100;
const ENTER_MS = 350;
const ROW_STAGGER_MS = 80;

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {active ? (
        <path d="M2 7.5L9 2l7 5.5V15a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 012 15V7.5z" fill="currentColor" />
      ) : (
        <path d="M2 7.5L9 2l7 5.5V15a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 012 15V7.5z" stroke="currentColor" strokeWidth="1.4" fill="none" />
      )}
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill={active ? "currentColor" : "none"} />
      <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill={active ? "currentColor" : "none"} />
      <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill={active ? "currentColor" : "none"} />
      <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill={active ? "currentColor" : "none"} />
      <path d="M2 7h14" stroke={active ? "var(--bg)" : "currentColor"} strokeWidth="1.4" />
      <path d="M6 1.5v3M12 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconChat({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 3h12a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0115 13H6l-3 3V4.5A1.5 1.5 0 014.5 3H3z" stroke="currentColor" strokeWidth="1.4" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function IconChart({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 15V9M7 15V5M11 15V8M15 15V3" stroke="currentColor" strokeWidth={active ? "2.2" : "1.4"} strokeLinecap="round" />
    </svg>
  );
}

function IconSearchSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1l1.1 2.4 2.6.2-2 1.8.6 2.6L5 6.8 2.7 8l.6-2.6-2-1.8 2.6-.2L5 1z" fill="currentColor" />
    </svg>
  );
}

function TabBar({ activeTab }: { activeTab: string }) {
  const tabs = [
    { id: "home", label: "Home", Icon: IconHome },
    { id: "marketplace", label: "Marketplace", Icon: IconSearch },
    { id: "bookings", label: "Bookings", Icon: IconCalendar },
    { id: "messages", label: "Messages", Icon: IconChat },
    { id: "activity", label: "Activity", Icon: IconChart },
  ];
  return (
    <div className="md-tabbar">
      {tabs.map((t) => (
        <div key={t.id} className={`md-tab ${t.id === activeTab ? "md-tab-active" : ""}`}>
          <t.Icon active={t.id === activeTab} />
          <span className="md-tab-label">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function ViewHome({ phaseClass }: { phaseClass: string }) {
  return (
    <div className={`md-view ${phaseClass}`}>
      <div className="md-topbar">
        <span className="md-topbar-brand">Binectics</span>
        <div className="md-avatar">TO</div>
      </div>

      <div className="md-greeting">
        <div className="md-greeting-eyebrow">Sunday &middot; 25 May &middot; Cape Town</div>
        <div className="md-greeting-name">Hey, <em>Tunde.</em></div>
      </div>

      <div className="md-kpi-grid md-row-0">
        <div className="md-kpi-card">
          <div className="md-kpi-label">Streak</div>
          <div className="md-kpi-value">32 days</div>
          <div className="md-kpi-delta">personal best</div>
        </div>
        <div className="md-kpi-card">
          <div className="md-kpi-label">This week</div>
          <div className="md-kpi-value">4 / 5</div>
          <div className="md-kpi-delta">1 more to go</div>
        </div>
        <div className="md-kpi-card md-row-1">
          <div className="md-kpi-label">Next session</div>
          <div className="md-kpi-value">Wed 08:30</div>
          <div className="md-kpi-delta">with Sarah</div>
        </div>
        <div className="md-kpi-card md-row-1">
          <div className="md-kpi-label">Weight</div>
          <div className="md-kpi-value">73.4 kg</div>
          <div className="md-kpi-delta md-kpi-delta-down">&darr; 1.8 kg</div>
        </div>
      </div>

      <div className="md-nextup md-row-2">
        <div className="md-nextup-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 14l3-4 3 2.5 4-5.5" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="md-nextup-text">
          <div className="md-nextup-title">Strength &middot; Sarah Okafor</div>
          <div className="md-nextup-meta">Wed 28 &middot; 08:30 &middot; 60 min</div>
        </div>
      </div>

      <TabBar activeTab="home" />
    </div>
  );
}

function ViewMarketplace({ phaseClass }: { phaseClass: string }) {
  return (
    <div className={`md-view ${phaseClass}`}>
      <div className="md-topbar">
        <span className="md-topbar-back"><IconBack /></span>
        <span className="md-topbar-title">Marketplace</span>
        <div className="md-avatar">TO</div>
      </div>

      <div className="md-searchbar md-row-0">
        <span className="md-searchbar-icon"><IconSearchSmall /></span>
        <span className="md-searchbar-placeholder">Search gyms, trainers...</span>
      </div>

      <div className="md-filters md-row-0">
        <span className="md-filter-chip md-filter-active">Gym</span>
        <span className="md-filter-chip">Trainer</span>
        <span className="md-filter-chip">Dietitian</span>
        <span className="md-filter-chip">Near me</span>
      </div>

      <div className="md-provider-list">
        <div className="md-provider-card md-row-1">
          <div className="md-provider-img md-provider-img-1" />
          <div className="md-provider-body">
            <div className="md-provider-name">Iron Lab Fitness</div>
            <div className="md-provider-meta">Gym &middot; Sea Point, Cape Town</div>
            <div className="md-provider-rating">
              <IconStar />
              <span>4.9 &middot; 412 reviews</span>
            </div>
            <div className="md-provider-price">From R 450/mo</div>
          </div>
        </div>

        <div className="md-provider-card md-row-2">
          <div className="md-provider-img md-provider-img-2" />
          <div className="md-provider-body">
            <div className="md-provider-name">Sarah Okafor</div>
            <div className="md-provider-meta">Personal Trainer &middot; Sea Point</div>
            <div className="md-provider-rating">
              <IconStar />
              <span>4.8 &middot; 89 reviews</span>
            </div>
            <div className="md-provider-price">From R 600/session</div>
          </div>
        </div>
      </div>

      <TabBar activeTab="marketplace" />
    </div>
  );
}

function ViewActivity({ phaseClass }: { phaseClass: string }) {
  const weekDays = [
    { day: "Mon", date: 19, done: true },
    { day: "Tue", date: 20, done: true },
    { day: "Wed", date: 21, done: true },
    { day: "Thu", date: 22, done: false },
    { day: "Fri", date: 23, done: true },
    { day: "Sat", date: 24, done: false },
    { day: "Sun", date: 25, today: true, done: false },
  ];

  const activities = [
    { text: "Checked in at Iron Lab", time: "Today", active: true },
    { text: "Logged 73.4 kg", time: "Yesterday", active: true },
    { text: "Strength session completed", time: "Wed", active: false },
  ];

  return (
    <div className={`md-view ${phaseClass}`}>
      <div className="md-topbar">
        <span className="md-topbar-back"><IconBack /></span>
        <span className="md-topbar-title">Activity</span>
        <div className="md-avatar">TO</div>
      </div>

      <div className="md-streak-hero md-row-0">
        <div className="md-streak-number">32</div>
        <div className="md-streak-label">day streak</div>
        <div className="md-streak-sub">Personal best</div>
      </div>

      <div className="md-week-grid md-row-1">
        {weekDays.map((d) => (
          <div
            key={d.day}
            className={`md-week-cell ${d.done ? "md-week-done" : ""} ${d.today ? "md-week-today" : ""} ${!d.done && !d.today ? "md-week-undone" : ""}`}
          >
            <span className="md-week-day">{d.day}</span>
            <span className="md-week-date">{d.date}</span>
            {d.done && <span className="md-week-check"><IconCheck /></span>}
          </div>
        ))}
      </div>

      <div className="md-recent md-row-2">
        <div className="md-recent-label">This week</div>
        {activities.map((a, i) => (
          <div key={i} className={`md-recent-row md-row-${i}`}>
            <span className={`md-recent-dot ${a.active ? "md-recent-dot-active" : ""}`} />
            <span className="md-recent-text">{a.text}</span>
            <span className="md-recent-time">{a.time}</span>
          </div>
        ))}
      </div>

      <TabBar activeTab="activity" />
    </div>
  );
}

export function MemberDemo() {
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
      }, ENTER_MS + ROW_STAGGER_MS * 4 + 100);
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
      ? "md-phase-exit"
      : phase === "entering"
        ? "md-phase-enter"
        : "md-phase-visible";

  const viewId = VIEWS[displayIdx].id;

  return (
    <div className="md-root">
      <style>{MEMBER_CSS}</style>

      <div className="md-chips">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            className={`md-chip ${i === idx ? "active" : ""}`}
            onClick={() => handleChipClick(i)}
            type="button"
          >
            <span className="md-chip-nm">{v.chipLabel}</span>
            <span className="md-chip-tg">{v.chipTag}</span>
          </button>
        ))}
      </div>

      <div className="md-stage">
        <div className="md-stage-tag">
          <span>Member app</span>
        </div>

        <div className="md-phone">
          <div className="md-notch">
            <div className="md-island" />
          </div>
          <div className="md-phone-body">
            {viewId === "home" && <ViewHome phaseClass={phaseClass} />}
            {viewId === "marketplace" && <ViewMarketplace phaseClass={phaseClass} />}
            {viewId === "activity" && <ViewActivity phaseClass={phaseClass} />}
          </div>
          <div className="md-home-indicator" />
        </div>
      </div>
    </div>
  );
}

const MEMBER_CSS = `
.md-root { display: flex; flex-direction: column; gap: 16px; }

.md-chips {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
@media (max-width: 640px) {
  .md-chips { grid-template-columns: repeat(2, 1fr); }
}
.md-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 10px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 2px;
}
.md-chip:hover { border-color: var(--border-2); }
.md-chip.active { border-color: var(--ink); }
.md-chip-nm {
  font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink);
}
.md-chip-tg {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}

.md-stage {
  background: oklch(0.93 0.005 80);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 40px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  min-height: 640px;
  background-image: radial-gradient(circle at 50% 30%, oklch(0 0 0 / 0.04), transparent 70%);
}
@media (max-width: 640px) {
  .md-stage { padding: 20px 12px; min-height: 570px; }
}
.md-stage-tag {
  position: absolute; top: 14px; left: 16px;
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
}
.md-stage-tag::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal); box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: md-livedot 1.4s ease-in-out infinite;
}
@keyframes md-livedot { 50% { opacity: 0.4; } }

.md-phone {
  width: min(320px, 100%); height: 580px;
  border: 3px solid var(--ink);
  border-radius: 32px;
  background: var(--bg);
  overflow: hidden;
  display: flex; flex-direction: column;
  position: relative;
}
@media (max-width: 640px) {
  .md-phone { width: min(280px, 100%); height: 510px; }
}

.md-notch {
  width: 100px; height: 24px;
  margin: 0 auto;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.md-island {
  width: 60px; height: 5px;
  background: var(--ink);
  border-radius: 10px;
}

.md-phone-body {
  flex: 1; overflow: hidden;
  display: flex; flex-direction: column;
}

.md-home-indicator {
  width: 100px; height: 4px;
  background: var(--fg-4);
  border-radius: 10px;
  margin: 0 auto 6px;
  flex-shrink: 0;
}

.md-view {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden;
}

.md-topbar {
  height: 44px; display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 16px; flex-shrink: 0;
}
.md-topbar-brand {
  font-size: 13px; font-weight: 500; color: var(--ink);
}
.md-topbar-title {
  font-size: 14px; font-weight: 500; color: var(--ink);
  position: absolute; left: 50%; transform: translateX(-50%);
}
.md-topbar-back {
  color: var(--ink); display: flex; align-items: center; cursor: default;
}
.md-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--bg-3); display: flex; align-items: center;
  justify-content: center; font-size: 9px; font-weight: 600;
  color: var(--fg-2);
}

.md-greeting {
  padding: 12px 16px 0;
}
.md-greeting-eyebrow {
  font-family: var(--font-mono); font-size: 10px;
  text-transform: uppercase; color: var(--fg-3);
  letter-spacing: 0.05em; margin-bottom: 4px;
}
.md-greeting-name {
  font-size: 22px; font-weight: 500; color: var(--ink);
  line-height: 1.2;
}
.md-greeting-name em {
  font-style: italic;
}

.md-kpi-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 6px; padding: 12px 16px 0;
}
.md-kpi-card {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px;
}
.md-kpi-label {
  font-family: var(--font-mono); font-size: 10px;
  text-transform: uppercase; color: var(--fg-3);
  letter-spacing: 0.05em; margin-bottom: 2px;
}
.md-kpi-value {
  font-size: 18px; font-weight: 500; color: var(--ink);
  font-variant-numeric: tabular-nums; line-height: 1.2;
  margin-bottom: 2px;
}
.md-kpi-delta {
  font-family: var(--font-mono); font-size: 9.5px;
  color: var(--signal-ink);
}
.md-kpi-delta-down {
  color: var(--signal-ink);
}

.md-nextup {
  margin: 12px 16px 0; padding: 14px;
  background: var(--bg-2); border-radius: 10px;
  display: flex; align-items: center; gap: 12px;
}
.md-nextup-icon {
  width: 40px; height: 40px; border-radius: 6px;
  background: linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.md-nextup-title {
  font-size: 13px; font-weight: 500; color: var(--ink);
  margin-bottom: 2px;
}
.md-nextup-meta {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
}

.md-tabbar {
  height: 48px; display: flex; align-items: center;
  justify-content: space-evenly;
  border-top: 1px solid var(--border);
  background: var(--bg); flex-shrink: 0;
  margin-top: auto;
}
.md-tab {
  display: flex; flex-direction: column; align-items: center;
  gap: 2px; color: var(--fg-3);
}
.md-tab-active { color: var(--ink); }
.md-tab-label { font-size: 10px; }

.md-searchbar {
  margin: 12px 16px 0; height: 36px;
  border-radius: 8px; background: var(--bg-2);
  border: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px;
  padding: 0 10px;
}
.md-searchbar-icon { color: var(--fg-3); display: flex; align-items: center; }
.md-searchbar-placeholder { font-size: 12px; color: var(--fg-3); }

.md-filters {
  display: flex; gap: 6px; padding: 10px 16px 0;
  overflow: hidden;
}
.md-filter-chip {
  border: 1px solid var(--border); border-radius: 20px;
  padding: 0 10px; height: 28px; font-size: 11px;
  display: flex; align-items: center; color: var(--fg-2);
  white-space: nowrap;
}
.md-filter-active {
  border-color: var(--ink); color: var(--ink);
}

.md-provider-list {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 16px 0;
  flex: 1; overflow: hidden;
}
.md-provider-card {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
}
.md-provider-img {
  width: 100%; height: 100px;
}
.md-provider-img-1 {
  background: oklch(0.88 0.02 80);
}
.md-provider-img-2 {
  background: oklch(0.85 0.03 220);
}
.md-provider-body {
  padding: 10px 12px;
}
.md-provider-name {
  font-size: 14px; font-weight: 500; color: var(--ink);
  margin-bottom: 2px;
}
.md-provider-meta {
  font-size: 11px; color: var(--fg-3); margin-bottom: 4px;
}
.md-provider-rating {
  display: flex; align-items: center; gap: 4px;
  font-family: var(--font-mono); font-size: 11px;
  color: var(--fg-2); margin-bottom: 4px;
}
.md-provider-price {
  font-size: 12px; font-weight: 500; color: var(--ink);
}

.md-streak-hero {
  text-align: center; padding: 20px 16px 0;
}
.md-streak-number {
  font-size: 40px; font-weight: 500; color: var(--ink);
  line-height: 1;
}
.md-streak-label {
  font-size: 13px; color: var(--fg-2); margin-top: 4px;
}
.md-streak-sub {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--signal-ink); margin-top: 4px;
}

.md-week-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 3px; padding: 16px 16px 0;
}
.md-week-cell {
  aspect-ratio: 1; border-radius: 6px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1px;
}
.md-week-done {
  background: var(--signal-soft); color: var(--signal-ink);
}
.md-week-today {
  background: var(--ink); color: var(--bg);
}
.md-week-undone {
  background: var(--bg-2); color: var(--fg-3);
}
.md-week-day {
  font-family: var(--font-mono); font-size: 10px;
  text-transform: uppercase;
}
.md-week-date {
  font-size: 14px; font-weight: 500;
}
.md-week-check {
  display: flex; align-items: center;
  line-height: 0;
}

.md-recent {
  padding: 16px 16px 0;
}
.md-recent-label {
  font-family: var(--font-mono); font-size: 10px;
  text-transform: uppercase; color: var(--fg-3);
  letter-spacing: 0.05em; margin-bottom: 10px;
}
.md-recent-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.md-recent-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--fg-3); flex-shrink: 0;
}
.md-recent-dot-active {
  background: var(--signal);
}
.md-recent-text {
  font-size: 12px; color: var(--ink); flex: 1;
}
.md-recent-time {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--fg-3); flex-shrink: 0;
}

.md-phase-enter .md-row-0 {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 0}ms both;
}
.md-phase-enter .md-row-1 {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 1}ms both;
}
.md-phase-enter .md-row-2 {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both;
}
.md-phase-enter .md-row-3 {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 3}ms both;
}
@keyframes md-rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.md-phase-exit .md-row-0,
.md-phase-exit .md-row-1,
.md-phase-exit .md-row-2,
.md-phase-exit .md-row-3 {
  animation: md-rowOut ${EXIT_MS}ms ease-out forwards;
}
.md-phase-exit .md-greeting,
.md-phase-exit .md-kpi-grid,
.md-phase-exit .md-nextup,
.md-phase-exit .md-searchbar,
.md-phase-exit .md-filters,
.md-phase-exit .md-provider-list,
.md-phase-exit .md-streak-hero,
.md-phase-exit .md-week-grid,
.md-phase-exit .md-recent {
  animation: md-rowOut ${EXIT_MS}ms ease-out forwards;
}
@keyframes md-rowOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

.md-phase-enter .md-greeting {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both;
}
.md-phase-enter .md-kpi-grid {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS}ms both;
}
.md-phase-enter .md-nextup {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both;
}
.md-phase-enter .md-searchbar {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both;
}
.md-phase-enter .md-filters {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS}ms both;
}
.md-phase-enter .md-provider-list {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both;
}
.md-phase-enter .md-streak-hero {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both;
}
.md-phase-enter .md-week-grid {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS}ms both;
}
.md-phase-enter .md-recent {
  animation: md-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both;
}

@media (prefers-reduced-motion: reduce) {
  .md-phase-enter .md-row-0,
  .md-phase-enter .md-row-1,
  .md-phase-enter .md-row-2,
  .md-phase-enter .md-row-3,
  .md-phase-enter .md-greeting,
  .md-phase-enter .md-kpi-grid,
  .md-phase-enter .md-nextup,
  .md-phase-enter .md-searchbar,
  .md-phase-enter .md-filters,
  .md-phase-enter .md-provider-list,
  .md-phase-enter .md-streak-hero,
  .md-phase-enter .md-week-grid,
  .md-phase-enter .md-recent,
  .md-phase-exit .md-row-0,
  .md-phase-exit .md-row-1,
  .md-phase-exit .md-row-2,
  .md-phase-exit .md-row-3,
  .md-phase-exit .md-greeting,
  .md-phase-exit .md-kpi-grid,
  .md-phase-exit .md-nextup,
  .md-phase-exit .md-searchbar,
  .md-phase-exit .md-filters,
  .md-phase-exit .md-provider-list,
  .md-phase-exit .md-streak-hero,
  .md-phase-exit .md-week-grid,
  .md-phase-exit .md-recent {
    animation: md-instantFade 1ms forwards !important;
  }
  @keyframes md-instantFade { to { opacity: 1; transform: none; } }
  .md-stage-tag::before { animation: none; opacity: 1; }
}
`;
