"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Data — matches real trainer client detail page                      */
/* ------------------------------------------------------------------ */

interface NoteEntry {
  date: string;
  text: string;
}

const NOTES: NoteEntry[] = [
  {
    date: "Mon 18 May · 08:30",
    text: "Squatted 90kg x 3 x 4, smooth. Added 2.5kg vs last week. Hip shift is almost gone. Next session: test 92.5kg for a double.",
  },
  {
    date: "Sun 17 May · 19:10",
    text: "Updated block 3, shifted to 3x5 on bench, added rack pulls. Deadlift groove improving but still losing position at the knee.",
  },
  {
    date: "Wed 14 May · 10:00",
    text: "Left shoulder clicking on overhead press, no pain but aware. We'll keep an eye on it. If it persists 2+ weeks, see a physio.",
  },
  {
    date: "Mon 12 May · 08:30",
    text: "Deload week, 80% of working weights. Felt strong. Sleep improving since cutting caffeine after 2pm.",
  },
];

/** The three cards the real trainer client page shows. */
const KPIS = [
  { label: "Latest weight", value: "76.2 kg", sub: "12 May · target 74 kg" },
  { label: "Program adherence", value: "86%", sub: "Strength block 3" },
  { label: "Next session", value: "Wed 08:30", sub: "Confirmed" },
];

/** Right rail: programs and sessions, as on the real client page. */
const RAIL = [
  { color: "var(--trainer)", title: "Strength block 3", desc: "Day 18 of 42 · 5 of 6 this week · 86%" },
  { color: "var(--border-2)", title: "Wed 08:30 · Next", desc: "Strength session, 60 min" },
  { color: "var(--border-2)", title: "Mon 08:30 · Completed", desc: "Session note: squat 90kg, felt smooth" },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function JournalDemo() {
  const [view, setView] = useState<"trainer" | "client">("trainer");
  const [playing, setPlaying] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [view, clearTimers]);

  useEffect(() => {
    if (!playing) return;
    const hold = view === "trainer" ? 6000 : 4000;
    autoRef.current = setTimeout(() => {
      setView((v) => (v === "trainer" ? "client" : "trainer"));
    }, hold);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [playing, runKey, view]);

  const selectView = (v: "trainer" | "client") => {
    if (v === view) return;
    clearTimers();
    setView(v);
  };

  return (
    <div className="jd-root">
      <style>{JOURNAL_CSS}</style>

      {/* View toggle chips */}
      <div className="jd-chips">
        <button
          className={`jd-chip ${view === "trainer" ? "active" : ""}`}
          onClick={() => selectView("trainer")}
          type="button"
        >
          <span className="jd-chip-dot" style={{ background: "var(--trainer, oklch(0.55 0.14 75))" }} />
          <span className="jd-chip-nm">Trainer view</span>
          <span className="jd-chip-tg">Can edit</span>
        </button>
        <button
          className={`jd-chip ${view === "client" ? "active" : ""}`}
          onClick={() => selectView("client")}
          type="button"
        >
          <span className="jd-chip-dot" style={{ background: "var(--signal)" }} />
          <span className="jd-chip-nm">Client view</span>
          <span className="jd-chip-tg">Read-only</span>
        </button>
      </div>

      {/* Journal frame */}
      <div className="jd-frame" key={runKey}>
        {/* Client hero bar */}
        <div className="jd-hero">
          <div className="jd-avatar">LM</div>
          <div className="jd-hero-info">
            <div className="jd-hero-name">Linda Mokoena</div>
            <div className="jd-hero-meta">
              {view === "trainer"
                ? "Active client · since March 2026"
                : "Shared with you by Sarah Okafor"}
            </div>
          </div>
          <div className="jd-hero-badges">
            <span className="jd-badge jd-badge-signal">Active</span>
          </div>
        </div>

        {/* KPIs */}
        <div className={`jd-kpis ${playing ? "jd-kpis-in" : ""}`}>
          {KPIS.map((k, i) => (
            <div key={k.label} className="jd-kpi" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="jd-kpi-label">{k.label}</div>
              <div className="jd-kpi-val">{k.value}</div>
              <div className="jd-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="jd-content">
          {/* Timeline */}
          <div className="jd-timeline">
            {view === "client" && (
              <div className={`jd-shared-banner jd-anim ${playing ? "jd-in" : ""}`} style={{ animationDelay: "100ms" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6 1v4l2 1" /><circle cx="6" cy="6" r="4.5" /></svg>
                <span>Shared with you by Sarah Okafor · read-only</span>
              </div>
            )}
            {NOTES.map((note, i) => (
              <div
                key={i}
                className={`jd-note jd-anim ${playing ? "jd-in" : ""}`}
                style={{ animationDelay: `${200 + i * 300}ms` }}
              >
                <div className="jd-note-line">
                  <span className="jd-note-dot" style={{ background: "var(--ink)" }} />
                  {i < NOTES.length - 1 && <span className="jd-note-connector" />}
                </div>
                <div className="jd-note-body">
                  <div className="jd-note-head">
                    <span className="jd-note-date">{note.date}</span>
                  </div>
                  <p className="jd-note-text">{note.text}</p>
                </div>
              </div>
            ))}

            {/* Compose area — trainer only */}
            {view === "trainer" && (
              <div className={`jd-compose jd-anim ${playing ? "jd-in" : ""}`} style={{ animationDelay: "1500ms" }}>
                <div className="jd-compose-input">How Linda&rsquo;s training is going, what to work on next</div>
                <div className="jd-compose-bar">
                  <span className="jd-compose-hint">Linda sees notes in her journal.</span>
                  <span className="jd-compose-btn">Save note</span>
                </div>
              </div>
            )}
          </div>

          {/* Programs and sessions rail, trainer only */}
          {view === "trainer" && (
            <div className="jd-signals">
              <div className={`jd-signals-label jd-anim ${playing ? "jd-in" : ""}`} style={{ animationDelay: "600ms" }}>Programs &amp; sessions</div>
              {RAIL.map((s, i) => (
                <div
                  key={s.title}
                  className={`jd-signal-card jd-anim ${playing ? "jd-in" : ""}`}
                  style={{ animationDelay: `${700 + i * 200}ms`, borderLeftColor: s.color }}
                >
                  <div className="jd-signal-title">{s.title}</div>
                  <div className="jd-signal-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scoped CSS                                                         */
/* ------------------------------------------------------------------ */

const JOURNAL_CSS = `
.jd-root { display: flex; flex-direction: column; gap: 16px; }

/* ---- Chips ---- */
.jd-chips { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; max-width: 400px; }
.jd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms;
  display: flex; flex-direction: column; gap: 3px; position: relative;
}
.jd-chip:hover { border-color: var(--border-2); }
.jd-chip.active { border-color: var(--ink); }
.jd-chip-dot {
  width: 6px; height: 6px; border-radius: 50%;
  position: absolute; top: 10px; right: 10px;
  opacity: 0.4; transition: opacity 120ms;
}
.jd-chip.active .jd-chip-dot { opacity: 1; }
.jd-chip-nm { font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink); }
.jd-chip-tg { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; }

/* ---- Frame ---- */
.jd-frame {
  border: 1px solid var(--border); border-radius: var(--r-3);
  background: var(--bg-2); overflow: hidden;
}

/* ---- Hero bar ---- */
.jd-hero {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
}
@media (max-width: 640px) { .jd-hero { padding: 12px 14px; flex-wrap: wrap; } }
.jd-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: var(--bg-3); display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; color: var(--fg-2);
}
.jd-hero-info { flex: 1; min-width: 0; }
.jd-hero-name { font-size: 16px; font-weight: 500; letter-spacing: -0.015em; color: var(--ink); }
.jd-hero-meta { font-size: 12px; color: var(--fg-3); margin-top: 1px; }
.jd-hero-badges { display: flex; gap: 4px; flex-shrink: 0; }
.jd-badge {
  font-family: var(--font-mono); font-size: 9px; text-transform: uppercase;
  letter-spacing: 0.04em; padding: 3px 6px; border-radius: 999px;
  background: var(--bg-3); color: var(--fg-2); border: 1px solid var(--border);
}
.jd-badge-signal { background: var(--signal-soft); color: var(--signal-ink); border-color: color-mix(in oklch, var(--signal) 20%, transparent); }

/* ---- KPIs ---- */
.jd-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 12px 20px; }
@media (max-width: 640px) { .jd-kpis { grid-template-columns: 1fr; padding: 10px 14px; } }
.jd-kpi {
  padding: 8px 10px; border-radius: var(--r-2);
  background: var(--bg); border: 1px solid var(--border);
  opacity: 0; transform: translateY(6px);
}
.jd-kpis-in .jd-kpi { animation: jd-riseIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.jd-kpi-label { font-family: var(--font-mono); font-size: 9px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; }
.jd-kpi-val { font-size: 18px; font-weight: 500; letter-spacing: -0.02em; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1; margin: 4px 0 2px; }
.jd-kpi-sub { font-size: 10px; color: var(--fg-3); }

/* ---- Content grid ---- */
.jd-content { display: grid; grid-template-columns: 1fr 200px; gap: 0; }
@media (max-width: 768px) { .jd-content { grid-template-columns: 1fr; } }

/* ---- Timeline ---- */
.jd-timeline { padding: 16px 20px; }
@media (max-width: 640px) { .jd-timeline { padding: 12px 14px; } }

.jd-shared-banner {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--fg-3); padding: 8px 12px;
  background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-2);
  margin-bottom: 14px;
}

.jd-note { display: flex; gap: 0; margin-bottom: 0; }
.jd-note-line {
  width: 32px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center;
  padding-top: 4px;
}
.jd-note-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.jd-note-connector { width: 1px; flex: 1; background: var(--border); margin-top: 4px; }

.jd-note-body { flex: 1; padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 14px; }
.jd-note:last-of-type .jd-note-body { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.jd-note:last-of-type .jd-note-connector { display: none; }

.jd-note-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
.jd-note-date { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); }
.jd-note-text { font-size: 13px; line-height: 1.55; color: var(--fg-2); }

/* ---- Compose ---- */
.jd-compose {
  margin-top: 12px; border: 1px solid var(--border); border-radius: var(--r-2);
  background: var(--bg); overflow: hidden;
}
.jd-compose-input {
  padding: 10px 12px; font-size: 13px; color: var(--fg-3); min-height: 44px;
}
.jd-compose-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; border-top: 1px solid var(--border); gap: 8px;
}
.jd-compose-hint { font-size: 11px; color: var(--fg-3); }
.jd-compose-btn {
  font-size: 11px; font-weight: 500; padding: 4px 10px;
  background: var(--ink); color: var(--bg); border-radius: var(--r-2);
}

/* ---- Signals rail ---- */
.jd-signals {
  padding: 16px 14px; border-left: 1px solid var(--border);
}
@media (max-width: 768px) {
  .jd-signals { border-left: none; border-top: 1px solid var(--border); padding: 14px 20px; }
}
.jd-signals-label {
  font-family: var(--font-mono); font-size: 9px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;
}
.jd-signal-card {
  border: 1px solid var(--border); border-left: 3px solid;
  border-radius: var(--r-2); padding: 8px 10px; margin-bottom: 8px;
  background: var(--bg);
}
.jd-signal-title { font-size: 12px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
.jd-signal-desc { font-size: 10px; color: var(--fg-3); line-height: 1.45; }

/* ---- Animation ---- */
.jd-anim { opacity: 0; transform: translateY(6px); }
.jd-anim.jd-in { animation: jd-riseIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes jd-riseIn { to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .jd-kpis-in .jd-kpi,
  .jd-anim.jd-in {
    animation: jd-fade 1ms ease forwards !important;
    animation-delay: 0ms !important;
  }
  @keyframes jd-fade { to { opacity: 1; transform: none; } }
}
`;
