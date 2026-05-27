"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Role definitions                                                    */
/* ------------------------------------------------------------------ */

interface KPI {
  label: string;
  value: string;
  sub: string;
  pct: number;
}

interface SidebarItem {
  icon: string;
  label: string;
  badge?: string;
  active?: boolean;
}

interface RoleDef {
  id: string;
  chipLabel: string;
  chipTag: string;
  accent: string;
  greeting: string;
  name: string;
  initials: string;
  roleBadge: string;
  kpis: KPI[];
  sidebar: SidebarItem[];
  hasSidebar: boolean;
}

const ROLES: RoleDef[] = [
  {
    id: "gym",
    chipLabel: "Gym Owner",
    chipTag: "Owner",
    accent: "var(--gym)",
    greeting: "Good morning, Lerato",
    name: "Lerato M.",
    initials: "LM",
    roleBadge: "OWNER",
    hasSidebar: true,
    kpis: [
      { label: "Revenue", value: "R 1.08M", sub: "+12.4%", pct: 82 },
      { label: "Members", value: "1,284", sub: "+38 net new", pct: 68 },
      { label: "Check-ins", value: "412", sub: "32% attendance", pct: 32 },
      { label: "Churn", value: "2.1%", sub: "-0.4 pts", pct: 21 },
    ],
    sidebar: [
      { icon: "grid", label: "Dashboard", active: true },
      { icon: "users", label: "Members", badge: "1,284" },
      { icon: "qr", label: "Check-ins", badge: "412" },
      { icon: "chart", label: "Revenue" },
      { icon: "calendar", label: "Classes" },
      { icon: "settings", label: "Settings" },
    ],
  },
  {
    id: "trainer",
    chipLabel: "Personal Trainer",
    chipTag: "Trainer",
    accent: "var(--trainer)",
    greeting: "Good morning, Sarah",
    name: "Sarah O.",
    initials: "SO",
    roleBadge: "TRAINER",
    hasSidebar: true,
    kpis: [
      { label: "Sessions", value: "28/32", sub: "88% utilization", pct: 88 },
      { label: "Clients", value: "42", sub: "+3 this month", pct: 70 },
      { label: "Earnings", value: "R 38.4K", sub: "+14% vs apr", pct: 64 },
      { label: "Rating", value: "4.9", sub: "steady", pct: 98 },
    ],
    sidebar: [
      { icon: "grid", label: "Dashboard", active: true },
      { icon: "calendar", label: "Schedule" },
      { icon: "users", label: "Clients", badge: "42" },
      { icon: "journal", label: "Programs" },
      { icon: "chart", label: "Earnings" },
      { icon: "settings", label: "Settings" },
    ],
  },
  {
    id: "dietitian",
    chipLabel: "Dietitian",
    chipTag: "Dietitian",
    accent: "var(--dietitian)",
    greeting: "Good morning, Priya",
    name: "Dr. Priya I.",
    initials: "PI",
    roleBadge: "DIETITIAN",
    hasSidebar: true,
    kpis: [
      { label: "Clients", value: "68", sub: "+5 this month", pct: 72 },
      { label: "Adherence", value: "76%", sub: "+4 pts vs apr", pct: 76 },
      { label: "Expiring", value: "9", sub: "in 7 days", pct: 30 },
      { label: "Earnings", value: "N 1.84M", sub: "+9% vs apr", pct: 58 },
    ],
    sidebar: [
      { icon: "grid", label: "Dashboard", active: true },
      { icon: "users", label: "Clients", badge: "68" },
      { icon: "plan", label: "Meal plans" },
      { icon: "calendar", label: "Consults" },
      { icon: "clipboard", label: "Protocols" },
      { icon: "settings", label: "Settings" },
    ],
  },
  {
    id: "member",
    chipLabel: "Member",
    chipTag: "Member",
    accent: "var(--consumer)",
    greeting: "Good morning, Tunde",
    name: "Tunde A.",
    initials: "TA",
    roleBadge: "MEMBER",
    hasSidebar: false,
    kpis: [
      { label: "Streak", value: "32", sub: "personal best", pct: 90 },
      { label: "This week", value: "4/5", sub: "1 more to goal", pct: 80 },
      { label: "Next session", value: "Wed", sub: "08:30 · Sarah", pct: 0 },
      { label: "Weight", value: "73.4", sub: "-1.8 kg · 4 wk", pct: 55 },
    ],
    sidebar: [],
  },
];

/* ---- Gym owner: chart + feed data ---- */
const GYM_CHART_POINTS = [34, 42, 38, 50, 46, 58, 52, 64, 60, 72, 68, 78, 74, 82];
const GYM_FEED = [
  { dot: "var(--signal)", text: "Sarah O. checked in", time: "2m" },
  { dot: "var(--signal)", text: "Marcus C. signed up", time: "5m" },
  { dot: "oklch(0.65 0.15 75)", text: "Evening Yoga full", time: "12m" },
];

/* ---- Trainer: schedule data ---- */
const TRAINER_SCHEDULE = [
  { time: "06:30", client: "Lerato M.", type: "Strength", streak: 32, status: "done" },
  { time: "08:00", client: "Marcus C.", type: "Powerlifting", streak: 48, status: "done" },
  { time: "09:30", client: "Aisha P.", type: "Beginner", streak: null, status: "now", badge: "First session" },
  { time: "11:00", client: "Daniel K.", type: "Conditioning", streak: null, status: "upcoming" },
];

/* ---- Dietitian: adherence data ---- */
const DIET_CLIENTS = [
  { name: "Grace A.", adherence: 94, dots: [1,1,1,0,1,1,1], status: "On track", statusColor: "var(--signal)" },
  { name: "James O.", adherence: 72, dots: [1,0,1,1,0,1,0], status: "Needs nudge", statusColor: "oklch(0.65 0.15 75)" },
  { name: "Fatima K.", adherence: 88, dots: [1,1,0,1,1,1,1], status: "On track", statusColor: "var(--signal)" },
];

/* ---- Member: week plan ---- */
const MEMBER_WEEK = [
  { day: "Mon", done: true },
  { day: "Tue", done: true },
  { day: "Wed", done: true },
  { day: "Thu", done: true },
  { day: "Fri", done: false, today: true },
  { day: "Sat", done: false },
  { day: "Sun", done: false },
];

/* ------------------------------------------------------------------ */
/*  SVG icon helper                                                     */
/* ------------------------------------------------------------------ */

function SidebarIcon({ type }: { type: string }) {
  const s = { width: 16, height: 16, viewBox: "0 0 18 18", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "grid": return <svg {...s}><rect x="2" y="2" width="5.5" height="5.5" rx="1" /><rect x="10.5" y="2" width="5.5" height="5.5" rx="1" /><rect x="2" y="10.5" width="5.5" height="5.5" rx="1" /><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" /></svg>;
    case "users": return <svg {...s}><circle cx="7" cy="6" r="3" /><path d="M2 15.5c0-2.5 2-4.5 5-4.5s5 2 5 4.5" /><path d="M12 6.5a2.5 2.5 0 110 0" /></svg>;
    case "qr": return <svg {...s}><rect x="2" y="2" width="5" height="5" rx="0.5" /><rect x="11" y="2" width="5" height="5" rx="0.5" /><rect x="2" y="11" width="5" height="5" rx="0.5" /><rect x="11" y="11" width="2" height="2" /><rect x="14" y="14" width="2" height="2" /></svg>;
    case "chart": return <svg {...s}><path d="M2 16V6" /><path d="M6 16V3" /><path d="M10 16V8" /><path d="M14 16V5" /></svg>;
    case "settings": return <svg {...s}><circle cx="9" cy="9" r="2.5" /><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" /></svg>;
    case "calendar": return <svg {...s}><rect x="2" y="3.5" width="14" height="12" rx="1.5" /><path d="M2 7.5h14" /><path d="M6 2v3M12 2v3" /></svg>;
    case "journal": return <svg {...s}><rect x="3" y="2" width="12" height="14" rx="1.5" /><path d="M6 6h6M6 9h4M6 12h5" /></svg>;
    case "clipboard": return <svg {...s}><rect x="3" y="3" width="12" height="13" rx="1.5" /><path d="M7 2h4v2H7z" /><path d="M6 8h6M6 11h4" /></svg>;
    case "plan": return <svg {...s}><rect x="3" y="2" width="12" height="14" rx="1.5" /><path d="M7 6h4M7 9h4M7 12h2" /></svg>;
    default: return <svg {...s}><circle cx="9" cy="9" r="5" /></svg>;
  }
}

/* ------------------------------------------------------------------ */
/*  Role-specific content renderers                                     */
/* ------------------------------------------------------------------ */

function GymContent({ playing }: { playing: boolean }) {
  const maxY = Math.max(...GYM_CHART_POINTS);
  const points = GYM_CHART_POINTS.map((v, i) => {
    const x = (i / (GYM_CHART_POINTS.length - 1)) * 100;
    const y = 100 - (v / maxY) * 100;
    return `${x},${y}`;
  }).join(" ");
  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <div className="dd-role-content">
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "200ms" }}>
        <div className="dd-section-label">Revenue trend</div>
        <div className="dd-chart-box">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="dd-area-chart">
            <polygon points={fillPoints} className="dd-chart-fill" />
            <polyline points={points} className="dd-chart-line" />
          </svg>
          <div className="dd-chart-axis">
            <span>May 1</span>
            <span>May 14</span>
          </div>
        </div>
      </div>
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "400ms" }}>
        <div className="dd-section-label">Live activity</div>
        {GYM_FEED.map((f, i) => (
          <div key={i} className={`dd-feed-row dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: `${500 + i * 120}ms` }}>
            <span className="dd-feed-dot" style={{ background: f.dot }} />
            <span className="dd-feed-text">{f.text}</span>
            <span className="dd-feed-time">{f.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainerContent({ playing }: { playing: boolean }) {
  return (
    <div className="dd-role-content">
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "200ms" }}>
        <div className="dd-section-label">Today&apos;s schedule</div>
      </div>
      {TRAINER_SCHEDULE.map((s, i) => (
        <div key={i} className={`dd-sched-row dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: `${300 + i * 120}ms` }}>
          <div className="dd-sched-time">{s.time}</div>
          <div className={`dd-sched-card ${s.status === "now" ? "dd-sched-now" : ""} ${s.status === "done" ? "dd-sched-done" : ""}`}>
            <div className="dd-sched-top">
              <span className="dd-sched-client">{s.client}</span>
              {s.streak && (
                <span className="dd-sched-streak">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.5 4.5L6 7L8 5.5L7 9.5L9 6.5L11 11H1L3 6.5L5 9.5L4 5.5L6 7L4.5 4.5L6 1Z" fill="oklch(0.65 0.18 45)" /></svg>
                  {s.streak}
                </span>
              )}
              {s.badge && <span className="dd-sched-badge">{s.badge}</span>}
            </div>
            <div className="dd-sched-type">{s.type}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DietitianContent({ playing }: { playing: boolean }) {
  return (
    <div className="dd-role-content">
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "200ms" }}>
        <div className="dd-section-label">Client adherence</div>
        <div className="dd-adh-header">
          <span>Client</span>
          <span>7-day log</span>
          <span>Status</span>
        </div>
      </div>
      {DIET_CLIENTS.map((c, i) => (
        <div key={i} className={`dd-adh-row dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: `${350 + i * 120}ms` }}>
          <div className="dd-adh-name">
            <span className="dd-adh-avatar">{c.name.split(" ").map(n => n[0]).join("")}</span>
            <span>{c.name}</span>
          </div>
          <div className="dd-adh-dots">
            {c.dots.map((d, j) => (
              <span key={j} className="dd-adh-dot" style={{ background: d ? c.statusColor : "var(--border)" }} />
            ))}
            <span className="dd-adh-pct">{c.adherence}%</span>
          </div>
          <div className="dd-adh-status" style={{ color: c.statusColor }}>{c.status}</div>
        </div>
      ))}
    </div>
  );
}

function MemberContent({ playing }: { playing: boolean }) {
  return (
    <div className="dd-role-content">
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "200ms" }}>
        <div className="dd-section-label">Next up</div>
        <div className="dd-next-card">
          <div className="dd-next-icon" />
          <div className="dd-next-body">
            <div className="dd-next-title">Upper body strength</div>
            <div className="dd-next-sub">Wed 08:30 · 60 min · with Sarah O.</div>
          </div>
        </div>
      </div>
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "400ms" }}>
        <div className="dd-section-label">This week (4/5)</div>
        <div className="dd-week-grid">
          {MEMBER_WEEK.map((d) => (
            <div key={d.day} className={`dd-week-day ${d.done ? "dd-week-done" : ""} ${d.today ? "dd-week-today" : ""}`}>
              <span className="dd-week-label">{d.day}</span>
              {d.done && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-5" /></svg>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={`dd-anim-item ${playing ? "dd-in" : ""}`} style={{ animationDelay: "550ms" }}>
        <div className="dd-section-label">Quick log</div>
        <div className="dd-quick-btns">
          <span className="dd-quick-btn">Log weight</span>
          <span className="dd-quick-btn">Log meal</span>
          <span className="dd-quick-btn">Log workout</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DashboardDemo() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = ROLES[idx];

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoRef.current) clearTimeout(autoRef.current);
  }, []);

  useEffect(() => {
    clearTimers();
    setPlaying(false);
    timerRef.current = setTimeout(() => {
      setRunKey((k) => k + 1);
      setPlaying(true);
    }, 400);
    return () => clearTimers();
  }, [idx, clearTimers]);

  useEffect(() => {
    if (!playing) return;
    autoRef.current = setTimeout(() => {
      setIdx((i) => (i + 1) % ROLES.length);
    }, 5000);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [playing, runKey]);

  const selectRole = (i: number) => {
    if (i === idx) return;
    clearTimers();
    setIdx(i);
  };

  const roleContent = () => {
    switch (role.id) {
      case "gym": return <GymContent playing={playing} />;
      case "trainer": return <TrainerContent playing={playing} />;
      case "dietitian": return <DietitianContent playing={playing} />;
      case "member": return <MemberContent playing={playing} />;
      default: return null;
    }
  };

  return (
    <div className="dd-root">
      <style>{DASHBOARD_CSS}</style>

      <div className="dd-chips">
        {ROLES.map((r, i) => (
          <button
            key={r.id}
            className={`dd-chip ${i === idx ? "active" : ""}`}
            onClick={() => selectRole(i)}
            type="button"
          >
            <span className="dd-chip-dot" style={{ background: r.accent }} />
            <span className="dd-chip-nm">{r.chipLabel}</span>
            <span className="dd-chip-tg">{r.chipTag}</span>
          </button>
        ))}
      </div>

      <div className="dd-frame">
        <div className="dd-frame-bar">
          <div className="dd-dots"><span /><span /><span /></div>
          <div className="dd-url">app.binectics.com/dashboard</div>
        </div>
        <div className="dd-browser" key={runKey}>
          {/* Sidebar — provider roles only */}
          {role.hasSidebar && (
            <div className="dd-sidebar" style={{ "--dd-accent": role.accent } as React.CSSProperties}>
              <div className="dd-sb-logo">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                  <path d="M 8 34 A 20 20 0 0 1 40 34" />
                  <path d="M 14 30 A 12 12 0 0 1 34 30" />
                </svg>
              </div>
              <div className="dd-sb-section">
                {role.sidebar.map((item) => (
                  <div key={item.label} className={`dd-sb-item ${item.active ? "dd-sb-active" : ""}`}>
                    <SidebarIcon type={item.icon} />
                    <span className="dd-sb-label">{item.label}</span>
                    {item.badge && <span className="dd-sb-badge">{item.badge}</span>}
                  </div>
                ))}
              </div>
              <div className="dd-sb-user">
                <span className="dd-sb-avatar" style={{ background: `color-mix(in oklch, ${role.accent} 15%, var(--bg-2))`, color: role.accent }}>{role.initials}</span>
                <div className="dd-sb-user-info">
                  <span className="dd-sb-name">{role.name}</span>
                  <span className="dd-sb-role">{role.roleBadge}</span>
                </div>
              </div>
            </div>
          )}

          <div className="dd-main">
            {/* Member: horizontal tab nav */}
            {!role.hasSidebar && (
              <div className="dd-member-nav">
                {["Home", "Marketplace", "Bookings", "Messages", "Activity"].map((tab, i) => (
                  <span key={tab} className={`dd-member-tab ${i === 0 ? "dd-tab-active" : ""}`}>{tab}</span>
                ))}
                <span className="dd-member-avatar" style={{ background: `color-mix(in oklch, ${role.accent} 15%, var(--bg-2))`, color: role.accent }}>{role.initials}</span>
              </div>
            )}

            {/* Header */}
            <div className="dd-header">
              <span className="dd-header-greet">{role.greeting}</span>
              {role.hasSidebar && (
                <div className="dd-time-filters">
                  {["7D", "30D", "QTD"].map((f, i) => (
                    <span key={f} className={`dd-time-pill ${i === 1 ? "dd-pill-active" : ""}`}>{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className={`dd-kpis ${playing ? "dd-kpis-in" : ""}`}>
              {role.kpis.map((kpi, i) => (
                <div key={kpi.label} className="dd-kpi" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="dd-kpi-label">{kpi.label}</div>
                  <div className="dd-kpi-val">{kpi.value}</div>
                  <div className="dd-kpi-sub">{kpi.sub}</div>
                  {kpi.pct > 0 && (
                    <div className="dd-kpi-bar">
                      <div className="dd-kpi-fill" style={{ background: role.accent, width: playing ? `${kpi.pct}%` : "0%" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Role-specific content */}
            {roleContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scoped CSS                                                         */
/* ------------------------------------------------------------------ */

const DASHBOARD_CSS = `
.dd-root { display: flex; flex-direction: column; gap: 16px; }

/* ---- Chips ---- */
.dd-chips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
@media (max-width: 640px) { .dd-chips { grid-template-columns: repeat(2, 1fr); } }
.dd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 3px; position: relative;
}
.dd-chip:hover { border-color: var(--border-2); }
.dd-chip.active { border-color: var(--ink); }
.dd-chip-dot {
  width: 6px; height: 6px; border-radius: 50%;
  position: absolute; top: 10px; right: 10px;
  opacity: 0.4; transition: opacity 120ms;
}
.dd-chip.active .dd-chip-dot { opacity: 1; }
.dd-chip-nm { font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink); }
.dd-chip-tg { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; }

/* ---- Browser frame ---- */
.dd-frame { border: 1px solid var(--border); border-radius: var(--r-3); overflow: hidden; background: var(--bg); }
.dd-frame-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; background: var(--bg-2); border-bottom: 1px solid var(--border);
}
.dd-dots { display: flex; gap: 5px; }
.dd-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--border-2); }
.dd-url { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); letter-spacing: 0.01em; }

/* ---- Browser content ---- */
.dd-browser { display: flex; min-height: 520px; }
@media (max-width: 640px) { .dd-browser { min-height: 480px; } }

/* ---- Sidebar (provider roles) ---- */
.dd-sidebar {
  width: 160px; flex-shrink: 0;
  background: var(--bg); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; padding: 14px 8px;
}
@media (max-width: 640px) { .dd-sidebar { width: 48px; } }
.dd-sb-logo {
  display: flex; align-items: center; justify-content: center;
  padding: 4px 8px 16px; color: var(--ink);
}
.dd-sb-section { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.dd-sb-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: var(--r-2);
  color: var(--fg-3); font-size: 12px; font-weight: 400;
  transition: background 120ms, color 120ms;
}
@media (max-width: 640px) {
  .dd-sb-item { justify-content: center; padding: 8px; }
  .dd-sb-label, .dd-sb-badge { display: none; }
}
.dd-sb-active {
  background: color-mix(in oklch, var(--dd-accent) 10%, transparent);
  color: var(--ink);
}
.dd-sb-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-sb-badge {
  font-family: var(--font-mono); font-size: 9px;
  color: var(--fg-3); letter-spacing: 0.02em;
}
.dd-sb-user {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 8px; border-top: 1px solid var(--border); margin-top: 8px;
}
@media (max-width: 640px) { .dd-sb-user { justify-content: center; } .dd-sb-user-info { display: none; } }
.dd-sb-avatar {
  width: 28px; height: 28px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; flex-shrink: 0;
}
.dd-sb-user-info { display: flex; flex-direction: column; min-width: 0; }
.dd-sb-name { font-size: 11px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-sb-role { font-family: var(--font-mono); font-size: 9px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.04em; }

/* ---- Main area ---- */
.dd-main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 16px 20px; overflow: hidden; }
@media (max-width: 640px) { .dd-main { padding: 12px 10px; } }

/* ---- Member horizontal nav ---- */
.dd-member-nav {
  display: flex; align-items: center; gap: 0;
  border-bottom: 1px solid var(--border); margin: -16px -20px 16px; padding: 0 20px;
}
@media (max-width: 640px) { .dd-member-nav { margin: -12px -10px 12px; padding: 0 10px; overflow-x: auto; } }
.dd-member-tab {
  font-size: 12px; color: var(--fg-3); padding: 10px 12px;
  border-bottom: 2px solid transparent; transition: color 120ms;
  white-space: nowrap;
}
.dd-tab-active { color: var(--ink); border-bottom-color: var(--ink); font-weight: 500; }
.dd-member-avatar {
  width: 24px; height: 24px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 600; margin-left: auto; flex-shrink: 0;
}

/* ---- Header ---- */
.dd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dd-header-greet { font-size: 16px; font-weight: 500; letter-spacing: -0.02em; color: var(--ink); }
@media (max-width: 640px) { .dd-header-greet { font-size: 14px; } .dd-time-filters { display: none; } }
.dd-time-filters { display: flex; gap: 3px; }
.dd-time-pill {
  font-family: var(--font-mono); font-size: 9px; color: var(--fg-3);
  padding: 3px 7px; border-radius: var(--r-1); text-transform: uppercase; letter-spacing: 0.04em;
}
.dd-pill-active { background: var(--ink); color: var(--bg); }

/* ---- KPIs ---- */
.dd-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
@media (max-width: 640px) { .dd-kpis { grid-template-columns: repeat(2, 1fr); gap: 6px; } }
.dd-kpi {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 10px 12px; opacity: 0; transform: translateY(6px);
}
.dd-kpis-in .dd-kpi { animation: dd-riseIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.dd-kpi-label { font-family: var(--font-mono); font-size: 9px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.dd-kpi-val { font-size: 20px; font-weight: 500; letter-spacing: -0.025em; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; margin-bottom: 2px; }
@media (max-width: 640px) { .dd-kpi-val { font-size: 17px; } }
.dd-kpi-sub { font-size: 10px; color: var(--fg-3); margin-bottom: 8px; }
.dd-kpi-bar { height: 2px; background: var(--border); border-radius: 1px; overflow: hidden; }
.dd-kpi-fill { height: 100%; border-radius: 1px; transition: width 700ms cubic-bezier(0.16, 1, 0.3, 1); }

/* ---- Shared content helpers ---- */
.dd-role-content { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.dd-section-label {
  font-family: var(--font-mono); font-size: 9px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;
}
.dd-anim-item { opacity: 0; transform: translateY(6px); }
.dd-anim-item.dd-in { animation: dd-riseIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }

/* ---- Gym: chart ---- */
.dd-chart-box {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 12px; margin-bottom: 12px; background: var(--bg-2);
}
.dd-area-chart { width: 100%; height: 60px; display: block; }
.dd-chart-fill { fill: color-mix(in oklch, var(--gym) 12%, transparent); }
.dd-chart-line { fill: none; stroke: var(--gym); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.dd-chart-axis {
  display: flex; justify-content: space-between; margin-top: 6px;
  font-family: var(--font-mono); font-size: 9px; color: var(--fg-3); letter-spacing: 0.02em;
}

/* ---- Gym: feed ---- */
.dd-feed-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.dd-feed-row:last-child { border-bottom: none; }
.dd-feed-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.dd-feed-text { flex: 1; font-size: 11px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-feed-time { font-family: var(--font-mono); font-size: 9px; color: var(--fg-3); flex-shrink: 0; }

/* ---- Trainer: schedule ---- */
.dd-sched-row { display: flex; gap: 8px; align-items: stretch; margin-bottom: 6px; }
.dd-sched-time {
  width: 40px; flex-shrink: 0; font-family: var(--font-mono);
  font-size: 10px; color: var(--fg-3); padding-top: 8px; text-align: right;
}
.dd-sched-card {
  flex: 1; padding: 8px 10px; border-radius: var(--r-2);
  background: var(--bg-2); border: 1px solid var(--border);
  border-left: 3px solid var(--signal);
}
.dd-sched-done { opacity: 0.5; border-left-color: var(--border-2); }
.dd-sched-now { border-left-color: var(--trainer); background: oklch(0.97 0.02 75); }
.dd-sched-top { display: flex; align-items: center; gap: 6px; }
.dd-sched-client { font-size: 12px; font-weight: 500; color: var(--ink); }
.dd-sched-streak {
  display: flex; align-items: center; gap: 2px;
  font-family: var(--font-mono); font-size: 9px; color: oklch(0.55 0.15 45);
}
.dd-sched-badge {
  font-family: var(--font-mono); font-size: 8px; color: var(--signal-ink);
  background: var(--signal-soft); padding: 1px 4px; border-radius: var(--r-1);
  text-transform: uppercase; letter-spacing: 0.04em; margin-left: auto;
}
.dd-sched-type { font-size: 10px; color: var(--fg-3); margin-top: 2px; }

/* ---- Dietitian: adherence ---- */
.dd-adh-header {
  display: grid; grid-template-columns: 1fr 100px 80px; gap: 8px;
  font-family: var(--font-mono); font-size: 9px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.04em;
  padding-bottom: 6px; border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
@media (max-width: 640px) { .dd-adh-header { grid-template-columns: 1fr 60px 55px; } }
.dd-adh-row {
  display: grid; grid-template-columns: 1fr 100px 80px; gap: 8px;
  align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);
}
@media (max-width: 640px) { .dd-adh-row { grid-template-columns: 1fr 60px 55px; } }
.dd-adh-row:last-child { border-bottom: none; }
.dd-adh-name { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink); font-weight: 500; }
.dd-adh-avatar {
  width: 22px; height: 22px; border-radius: 999px;
  background: var(--bg-3); display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 600; color: var(--fg-3); flex-shrink: 0;
}
.dd-adh-dots { display: flex; align-items: center; gap: 3px; }
.dd-adh-dot { width: 6px; height: 6px; border-radius: 50%; }
@media (max-width: 640px) { .dd-adh-dots { gap: 2px; } .dd-adh-dot { width: 5px; height: 5px; } }
.dd-adh-pct { font-family: var(--font-mono); font-size: 9px; color: var(--fg-3); margin-left: 4px; }
.dd-adh-status { font-size: 10px; font-weight: 500; }

/* ---- Member: next up card ---- */
.dd-next-card {
  display: flex; gap: 12px; align-items: center;
  padding: 12px; border: 1px solid var(--border); border-radius: var(--r-2);
  background: var(--bg-2); margin-bottom: 16px;
}
.dd-next-icon {
  width: 40px; height: 40px; border-radius: var(--r-2); flex-shrink: 0;
  background: linear-gradient(135deg, color-mix(in oklch, var(--consumer) 20%, var(--bg-2)), var(--bg-2));
}
.dd-next-body { min-width: 0; }
.dd-next-title { font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
.dd-next-sub { font-size: 10px; color: var(--fg-3); }

/* ---- Member: week grid ---- */
.dd-week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 16px; }
.dd-week-day {
  aspect-ratio: 1; border-radius: var(--r-2); background: var(--bg-2);
  border: 1px solid var(--border); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
}
.dd-week-label { font-family: var(--font-mono); font-size: 8px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.04em; }
.dd-week-done { background: var(--signal-soft); border-color: color-mix(in oklch, var(--signal) 25%, transparent); color: var(--signal-ink); }
.dd-week-today { background: var(--ink); border-color: var(--ink); }
.dd-week-today .dd-week-label { color: var(--bg); }

/* ---- Member: quick log ---- */
.dd-quick-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.dd-quick-btn {
  font-size: 11px; color: var(--fg-2); padding: 6px 12px;
  border: 1px solid var(--border); border-radius: var(--r-2); background: var(--bg-2);
}

/* ---- Keyframes ---- */
@keyframes dd-riseIn { to { opacity: 1; transform: translateY(0); } }

/* ---- Reduced motion ---- */
@media (prefers-reduced-motion: reduce) {
  .dd-kpis-in .dd-kpi,
  .dd-anim-item.dd-in {
    animation: dd-fade 1ms ease forwards !important;
    animation-delay: 0ms !important;
  }
  .dd-kpi-fill { transition: none !important; }
  .dd-sb-item { transition: none !important; }
  @keyframes dd-fade { to { opacity: 1; transform: none; } }
}
`;
