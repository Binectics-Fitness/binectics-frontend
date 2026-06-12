"use client";

import { useState, useEffect, useRef } from "react";

type SparkQuality = "good" | "ok" | "miss";

interface Client {
  initials: string;
  name: string;
  plan: string;
  week: string;
  kcal: string;
  sparks: { value: number; quality: SparkQuality }[];
  adherence: string;
  macros: { label: string; value: string; pct: number }[];
  status: string;
  statusType: "ontrack" | "excellent" | "nudge" | "silent";
}

interface Template {
  title: string;
  meta: string;
  used: string;
}

interface Action {
  bar: "danger" | "warn" | "gym" | "signal";
  title: string;
  sub: string;
  btn: string;
}

const CLIENTS: Client[] = [
  {
    initials: "BO",
    name: "Bisi Okonkwo",
    plan: "Cutting",
    week: "wk 6/12",
    kcal: "1,650 kcal",
    sparks: [
      { value: 78, quality: "good" },
      { value: 92, quality: "good" },
      { value: 64, quality: "ok" },
      { value: 88, quality: "good" },
      { value: 80, quality: "good" },
      { value: 84, quality: "good" },
      { value: 90, quality: "good" },
    ],
    adherence: "82%",
    macros: [
      { label: "P", value: "138g", pct: 92 },
      { label: "C", value: "122g", pct: 70 },
      { label: "F", value: "52g", pct: 80 },
    ],
    status: "On track",
    statusType: "ontrack",
  },
  {
    initials: "KE",
    name: "Kemi Eze",
    plan: "Maintenance",
    week: "wk 12/16",
    kcal: "2,100 kcal",
    sparks: [
      { value: 85, quality: "good" },
      { value: 78, quality: "good" },
      { value: 88, quality: "good" },
      { value: 92, quality: "good" },
      { value: 80, quality: "good" },
      { value: 86, quality: "good" },
      { value: 84, quality: "good" },
    ],
    adherence: "93%",
    macros: [
      { label: "P", value: "155g", pct: 95 },
      { label: "C", value: "220g", pct: 88 },
      { label: "F", value: "68g", pct: 92 },
    ],
    status: "Excellent",
    statusType: "excellent",
  },
  {
    initials: "CO",
    name: "Chinedu Okoro",
    plan: "Sport perf",
    week: "wk 4/8",
    kcal: "3,200 kcal",
    sparks: [
      { value: 60, quality: "ok" },
      { value: 55, quality: "ok" },
      { value: 30, quality: "miss" },
      { value: 80, quality: "good" },
      { value: 65, quality: "ok" },
      { value: 78, quality: "good" },
      { value: 82, quality: "good" },
    ],
    adherence: "64%",
    macros: [
      { label: "P", value: "168g", pct: 70 },
      { label: "C", value: "240g", pct: 52 },
      { label: "F", value: "82g", pct: 65 },
    ],
    status: "Needs nudge",
    statusType: "nudge",
  },
  {
    initials: "AT",
    name: "Adaora Tunde",
    plan: "PCOS",
    week: "wk 3/12",
    kcal: "1,750 kcal",
    sparks: [
      { value: 22, quality: "miss" },
      { value: 18, quality: "miss" },
      { value: 0, quality: "miss" },
      { value: 0, quality: "miss" },
      { value: 28, quality: "miss" },
      { value: 0, quality: "miss" },
      { value: 0, quality: "miss" },
    ],
    adherence: "12%",
    macros: [
      { label: "P", value: "28g", pct: 18 },
      { label: "C", value: "22g", pct: 12 },
      { label: "F", value: "5g", pct: 8 },
    ],
    status: "4d silent",
    statusType: "silent",
  },
];

const TEMPLATES: Template[] = [
  {
    title: "Cutting · West African staples · 1,650 kcal",
    meta: "Halal · high-P · 4 weeks · jollof/beans/fish base",
    used: "14x",
  },
  {
    title: "PCOS protocol · low-GI · 1,800 kcal",
    meta: "Inositol guidance · 12 weeks",
    used: "9x",
  },
  {
    title: "Type 2 diabetes · stepped carb · 1,950 kcal",
    meta: "CGM-aware · 16 weeks",
    used: "22x",
  },
  {
    title: "Sport performance · contact sports · 3,200 kcal",
    meta: "Periodised · creatine timing · 8 weeks",
    used: "6x",
  },
];

const ACTIONS: Action[] = [
  {
    bar: "danger",
    title: "Adaora T. · 4 days silent",
    sub: "No logs since May 7 · auto-nudge failed",
    btn: "Open",
  },
  {
    bar: "warn",
    title: "2 new plans due today",
    sub: "Folake A. + Samuel A. (after intake)",
    btn: "Queue",
  },
  {
    bar: "gym",
    title: "3 follow-up logs to review",
    sub: "Bisi O. · Chinedu O. · Maryam O.",
    btn: "Review",
  },
  {
    bar: "signal",
    title: "9 plans expire in 7 days",
    sub: "Renewal nudges sent · 4 viewed",
    btn: "Track",
  },
];

const VIEWS = [
  { id: "clients", label: "Clients", sub: "4 clients" },
  { id: "plans", label: "Meal plans", sub: "4 templates" },
  { id: "actions", label: "Actions", sub: "4 tasks" },
];

const CYCLE_MS = 5000;
const EXIT_MS = 150;
const GAP_MS = 100;
const ENTER_MS = 350;
const ROW_STAGGER_MS = 80;

export function DietitianDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exiting" | "entering">(
    "visible",
  );
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
      ? "dtd-phase-exit"
      : phase === "entering"
        ? "dtd-phase-enter"
        : "dtd-phase-visible";

  const view = VIEWS[displayIdx];

  return (
    <div className="dtd-root">
      <style>{DTD_CSS}</style>

      <div className="dtd-chips">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            className={`dtd-chip ${i === idx ? "active" : ""}`}
            onClick={() => handleChipClick(i)}
            type="button"
          >
            <span className="dtd-chip-nm">{v.label}</span>
            <span className="dtd-chip-tg">{v.sub}</span>
          </button>
        ))}
      </div>

      <div className="dtd-stage">
        <div className="dtd-stage-tag">
          <span>Dietitian dashboard</span>
        </div>

        <div className={`dtd-card ${phaseClass}`}>
          {view.id === "clients" && <ClientsView />}
          {view.id === "plans" && <PlansView />}
          {view.id === "actions" && <ActionsView />}
        </div>
      </div>
    </div>
  );
}

function ClientsView() {
  return (
    <>
      <div className="dtd-header">
        <div className="dtd-header-title">Active clients · adherence</div>
        <div className="dtd-header-sub">68 total · sorted by needs-attention</div>
      </div>
      <div className="dtd-col-headers">
        <span className="dtd-col-client">Client & plan</span>
        <span className="dtd-col-spark">7-day log</span>
        <span className="dtd-col-macros">Macros</span>
        <span className="dtd-col-status">Status</span>
      </div>
      {CLIENTS.map((c, i) => (
        <div key={c.initials} className={`dtd-client-row dtd-row-${i}`}>
          <div className="dtd-client-info">
            <div className="dtd-avatar">{c.initials}</div>
            <div className="dtd-client-text">
              <div className="dtd-client-name">{c.name}</div>
              <div className="dtd-client-meta">{c.plan} · {c.week} · {c.kcal}</div>
            </div>
          </div>
          <div className="dtd-spark-col">
            <div className="dtd-spark-bars">
              {c.sparks.map((s, si) => (
                <div
                  key={si}
                  className={`dtd-spark-bar dtd-spark-${s.quality}`}
                  style={{ height: `${Math.max(s.value * 0.28, 2)}px` }}
                />
              ))}
            </div>
            <div className="dtd-spark-pct">{c.adherence}</div>
          </div>
          <div className="dtd-macros-col">
            {c.macros.map((m) => (
              <div key={m.label} className="dtd-macro-row">
                <span className="dtd-macro-label">{m.label}</span>
                <div className="dtd-macro-track">
                  <div className="dtd-macro-fill" style={{ width: `${m.pct}%` }} />
                </div>
                <span className="dtd-macro-val">{m.value}</span>
              </div>
            ))}
          </div>
          <div className="dtd-status-col">
            <span className={`dtd-status-pill dtd-status-${c.statusType}`}>{c.status}</span>
          </div>
        </div>
      ))}
    </>
  );
}

function PlansView() {
  return (
    <>
      <div className="dtd-header">
        <div className="dtd-header-title">My plan templates</div>
        <div className="dtd-header-sub">8 active · pull a template to start in 30 seconds</div>
      </div>
      {TEMPLATES.map((t, i) => (
        <div key={i} className={`dtd-template-row dtd-row-${i}`}>
          <div className="dtd-template-text">
            <div className="dtd-template-title">{t.title}</div>
            <div className="dtd-template-meta">{t.meta}</div>
          </div>
          <div className="dtd-template-used">{t.used}</div>
        </div>
      ))}
    </>
  );
}

function ActionsView() {
  return (
    <>
      <div className="dtd-header">
        <div className="dtd-header-title">Action queue</div>
        <div className="dtd-header-sub">5 items · time-sensitive</div>
      </div>
      {ACTIONS.map((a, i) => (
        <div key={i} className={`dtd-action-row dtd-row-${i}`}>
          <div className={`dtd-action-bar dtd-bar-${a.bar}`} />
          <div className="dtd-action-text">
            <div className="dtd-action-title">{a.title}</div>
            <div className="dtd-action-sub">{a.sub}</div>
          </div>
          <button className="dtd-action-btn" type="button">{a.btn}</button>
        </div>
      ))}
    </>
  );
}

const DTD_CSS = `
.dtd-root { display: flex; flex-direction: column; gap: 16px; }

.dtd-chips {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
@media (max-width: 640px) {
  .dtd-chips { grid-template-columns: repeat(2, 1fr); }
  .dtd-chips .dtd-chip:last-child { grid-column: 1 / -1; }
}
.dtd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 10px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 2px;
}
.dtd-chip:hover { border-color: var(--border-2); }
.dtd-chip.active { border-color: var(--ink); }
.dtd-chip-nm {
  font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink);
}
.dtd-chip-tg {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}

.dtd-stage {
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
  .dtd-stage { padding: 20px 12px; min-height: 360px; }
}
.dtd-stage-tag {
  position: absolute; top: 14px; left: 16px;
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
}
.dtd-stage-tag::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal); box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: dtd-livedot 1.4s ease-in-out infinite;
}
@keyframes dtd-livedot { 50% { opacity: 0.4; } }

.dtd-card {
  width: min(520px, 100%);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  box-shadow: 0 4px 24px -6px oklch(0 0 0 / 0.08);
  display: flex; flex-direction: column;
}
@media (max-width: 640px) {
  .dtd-card { width: 100%; }
}

.dtd-header {
  padding: 20px 20px 0;
  margin-bottom: 14px;
}
.dtd-header-title {
  font-size: 15px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink);
  margin-bottom: 2px;
}
.dtd-header-sub {
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
}

.dtd-col-headers {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr 0.6fr;
  gap: 8px;
  padding: 0 20px 8px;
  border-bottom: 1px solid var(--border);
}
.dtd-col-headers span {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}
@media (max-width: 640px) {
  .dtd-col-headers { display: none; }
}

.dtd-client-row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr 0.6fr;
  gap: 8px;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
}
.dtd-client-row:last-child { border-bottom: none; }
@media (max-width: 640px) {
  .dtd-client-row {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 6px 8px;
    padding: 12px 16px;
  }
  .dtd-client-info { grid-column: 1 / -1; }
  .dtd-status-col { justify-self: end; }
}

.dtd-client-info {
  display: flex; align-items: center; gap: 8px;
  min-width: 0;
}
.dtd-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-3); display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: var(--fg-2);
  flex-shrink: 0;
}
.dtd-client-text { min-width: 0; }
.dtd-client-name {
  font-size: 14px; font-weight: 500; color: var(--ink);
  letter-spacing: -0.005em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dtd-client-meta {
  font-family: var(--font-mono); font-size: 12px; color: var(--fg-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.dtd-spark-col {
  display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
}
.dtd-spark-bars {
  display: flex; align-items: flex-end; gap: 1px; height: 26px;
}
.dtd-spark-bar {
  width: 5px; border-radius: 1px; min-height: 2px;
}
.dtd-spark-good { background: var(--signal); }
.dtd-spark-ok { background: oklch(0.85 0.06 148); }
.dtd-spark-miss { background: oklch(0.88 0.02 80); }
.dtd-spark-pct {
  font-family: var(--font-mono); font-size: 12px; color: var(--ink);
}

.dtd-macros-col {
  display: flex; flex-direction: column; gap: 4px;
}
.dtd-macro-row {
  display: flex; align-items: center; gap: 4px;
}
.dtd-macro-label {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  width: 10px; flex-shrink: 0;
}
.dtd-macro-track {
  flex: 1; height: 3px; background: var(--bg-3); border-radius: 2px;
  overflow: hidden;
}
.dtd-macro-fill {
  height: 100%; background: var(--ink); border-radius: 2px;
  transition: width 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dtd-macro-val {
  font-family: var(--font-mono); font-size: 10px; color: var(--ink);
  min-width: 28px; text-align: right;
}

.dtd-status-col {
  display: flex; justify-content: flex-start;
}
.dtd-status-pill {
  font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.04em; padding: 3px 7px; border-radius: var(--r-1);
  white-space: nowrap;
}
.dtd-status-ontrack,
.dtd-status-excellent {
  background: var(--signal-soft); color: var(--signal-ink);
}
.dtd-status-nudge {
  background: oklch(0.94 0.06 75); color: oklch(0.35 0.12 75);
}
.dtd-status-silent {
  background: var(--danger-soft); color: var(--danger);
}

.dtd-template-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; border-bottom: 1px solid var(--border);
  gap: 12px;
}
.dtd-template-row:last-child { border-bottom: none; }
.dtd-template-text { min-width: 0; flex: 1; }
.dtd-template-title {
  font-size: 13.5px; font-weight: 500; color: var(--ink);
  letter-spacing: -0.005em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dtd-template-meta {
  font-family: var(--font-mono); font-size: 12px; color: var(--fg-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dtd-template-used {
  font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-3);
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .dtd-template-title { white-space: normal; }
  .dtd-template-meta { white-space: normal; }
}

.dtd-action-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 20px; border-bottom: 1px solid var(--border);
}
.dtd-action-row:last-child { border-bottom: none; }
.dtd-action-bar {
  width: 3px; min-height: 32px; border-radius: 2px;
  margin-top: 2px; flex-shrink: 0;
}
.dtd-bar-danger { background: var(--danger); }
.dtd-bar-warn { background: var(--warn); }
.dtd-bar-gym { background: var(--gym); }
.dtd-bar-signal { background: var(--signal); }
.dtd-action-text { flex: 1; min-width: 0; }
.dtd-action-title {
  font-size: 13px; font-weight: 500; color: var(--ink);
  letter-spacing: -0.005em;
}
.dtd-action-sub {
  font-size: 12px; color: var(--fg-3);
}
.dtd-action-btn {
  border: 1px solid var(--border); border-radius: var(--r-2);
  background: transparent; color: var(--ink);
  font-size: 12px; font-weight: 500; height: 34px; padding: 0 10px;
  cursor: pointer; flex-shrink: 0;
  transition: border-color 120ms, background 120ms;
}
.dtd-action-btn:hover {
  border-color: var(--ink); background: var(--bg-2);
}

.dtd-phase-enter .dtd-row-0 { animation: dtd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 0}ms both; }
.dtd-phase-enter .dtd-row-1 { animation: dtd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 1}ms both; }
.dtd-phase-enter .dtd-row-2 { animation: dtd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both; }
.dtd-phase-enter .dtd-row-3 { animation: dtd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 3}ms both; }
@keyframes dtd-rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dtd-phase-enter .dtd-header {
  animation: dtd-headerIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes dtd-headerIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dtd-phase-enter .dtd-col-headers {
  animation: dtd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) 40ms both;
}

.dtd-phase-exit .dtd-header,
.dtd-phase-exit .dtd-col-headers,
.dtd-phase-exit .dtd-client-row,
.dtd-phase-exit .dtd-template-row,
.dtd-phase-exit .dtd-action-row {
  animation: dtd-rowOut ${EXIT_MS}ms ease-out forwards;
}
@keyframes dtd-rowOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .dtd-phase-enter .dtd-header,
  .dtd-phase-enter .dtd-col-headers,
  .dtd-phase-enter .dtd-row-0,
  .dtd-phase-enter .dtd-row-1,
  .dtd-phase-enter .dtd-row-2,
  .dtd-phase-enter .dtd-row-3,
  .dtd-phase-exit .dtd-header,
  .dtd-phase-exit .dtd-col-headers,
  .dtd-phase-exit .dtd-client-row,
  .dtd-phase-exit .dtd-template-row,
  .dtd-phase-exit .dtd-action-row {
    animation: dtd-instantFade 1ms forwards !important;
  }
  @keyframes dtd-instantFade { to { opacity: 1; transform: none; } }
  .dtd-stage-tag::before { animation: none; opacity: 1; }
}
`;
