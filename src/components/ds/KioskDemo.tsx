"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Marketing demo of the real check-in flow: the gym's screen shows a QR code
 * that changes every minute, a member scans it with their phone, and the
 * arrival (or a declined attempt) shows on the gym's kiosk page. Names and
 * times are illustrative; nothing here claims a feature the product lacks.
 */

type Scenario = {
  id: string;
  name: string;
  first: string;
  tag: string;
  ok: boolean;
  time: string;
  streak: number;
};

const SCENARIOS: Scenario[] = [
  { id: "ada", name: "Ada O.", first: "Ada", tag: "Active plan", ok: true, time: "07:42", streak: 24 },
  { id: "kemi", name: "Kemi B.", first: "Kemi", tag: "No active plan", ok: false, time: "07:44", streak: 0 },
];

const EARLIER = [
  { name: "Tunde A.", time: "07:31" },
  { name: "Grace E.", time: "07:18" },
];

/** Run phases, in ms from the start of a run. */
const SCAN_AT = 700;
const RESULT_AT = 1700;
const FEED_AT = 2600;
const RUN_MS = 6500;

const QR_SIZE = 21;

/** A QR-looking pattern with the three finder squares; `seed` changes it. */
function qrCells(seed: number): boolean[] {
  let s = seed * 7919 + 17;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const inFinder = (r: number, c: number) => {
    const corners = [
      [0, 0],
      [0, QR_SIZE - 7],
      [QR_SIZE - 7, 0],
    ];
    for (const [r0, c0] of corners) {
      if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
        const rr = r - r0;
        const cc = c - c0;
        const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        return { finder: true, on: ring || core };
      }
    }
    return { finder: false, on: false };
  };
  const out: boolean[] = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      const f = inFinder(r, c);
      out.push(f.finder ? f.on : rnd() < 0.48);
    }
  }
  return out;
}

function Qr({ seed }: { seed: number }) {
  const cells = useMemo(() => qrCells(seed), [seed]);
  return (
    <div className="kd-qr" aria-hidden="true">
      {cells.map((on, i) => (
        <span key={i} className={on ? "on" : undefined} />
      ))}
    </div>
  );
}

export function KioskDemo() {
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState(0);
  const [t, setT] = useState(0);
  const member = SCENARIOS[idx];

  // One run per scenario; the code "rotates" between runs.
  useEffect(() => {
    const timers = [SCAN_AT, RESULT_AT, FEED_AT].map((at) => setTimeout(() => setT(at), at));
    const next = setTimeout(() => {
      setT(0);
      setIdx((i) => (i + 1) % SCENARIOS.length);
      setRun((r) => r + 1);
    }, RUN_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(next);
    };
  }, [run]);

  const pick = (i: number) => {
    setT(0);
    setIdx(i);
    setRun((r) => r + 1);
  };

  const scanning = t >= SCAN_AT && t < RESULT_AT;
  const result = t >= RESULT_AT;
  const fed = t >= FEED_AT;

  return (
    <div className="kd-root">
      <style>{KIOSK_CSS}</style>

      <div className="kd-chips" role="group" aria-label="Choose a member">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`kd-chip ${i === idx ? "active" : ""}`}
            aria-pressed={i === idx}
            onClick={() => pick(i)}
          >
            <span className="kd-chip-nm">{s.name}</span>
            <span className="kd-chip-tg">{s.tag}</span>
          </button>
        ))}
      </div>

      <div className="kd-stage">
        {/* The gym's screen: any tablet, phone or computer in a browser */}
        <figure className="kd-col">
          <div className="kd-screen">
            <div className="kd-bar">
              <span>Iron Lab</span>
              <span>Check-in kiosk</span>
            </div>
            <div className="kd-screen-body">
              <div className="kd-eyebrow">Scan to check in</div>
              <Qr seed={run} />
              <div className="kd-rotate">
                <span className="kd-rotate-track">
                  <span key={run} className="kd-rotate-fill" />
                </span>
                <span>Code changes every minute</span>
              </div>
            </div>
            <div className="kd-feed">
              <div className="kd-feed-head">Today&rsquo;s arrivals</div>
              {fed && (
                <div key={`row-${run}`} className={`kd-row kd-row-new ${member.ok ? "" : "kd-row-declined"}`}>
                  <span>{member.name}</span>
                  <span>{member.ok ? member.time : "Declined · No membership"}</span>
                </div>
              )}
              {EARLIER.map((r) => (
                <div key={r.name} className="kd-row">
                  <span>{r.name}</span>
                  <span>{r.time}</span>
                </div>
              ))}
            </div>
          </div>
          <figcaption className="kd-cap">The gym&rsquo;s screen, in a web browser</figcaption>
        </figure>

        {/* The member's phone */}
        <figure className="kd-col">
          <div className={`kd-phone ${result && member.ok ? "kd-phone-dark" : ""}`}>
            {!result && (
              <div className="kd-cam">
                <div className="kd-cam-label">{scanning ? "Scanning…" : "Point your camera at the code"}</div>
                <div className="kd-finder">
                  <span className="kd-br tl" />
                  <span className="kd-br tr" />
                  <span className="kd-br bl" />
                  <span className="kd-br br" />
                  <div className="kd-finder-qr">
                    <Qr seed={run} />
                  </div>
                  {scanning && <div className="kd-scanline" />}
                </div>
              </div>
            )}
            {result && member.ok && (
              <div key={`ok-${run}`} className="kd-result">
                <div className="kd-status">Checked in · {member.time}</div>
                <div className="kd-hello">You&rsquo;re in, {member.first}.</div>
                <div className="kd-gym">Iron Lab</div>
                <div className="kd-streak">
                  <span className="kd-streak-num">{member.streak}</span>
                  <span className="kd-streak-lbl">day streak</span>
                </div>
              </div>
            )}
            {result && !member.ok && (
              <div key={`no-${run}`} className="kd-result kd-result-light">
                <div className="kd-status kd-status-no">Not checked in</div>
                <div className="kd-hello kd-hello-light">You need an active plan at Iron Lab.</div>
                <div className="kd-gym kd-gym-light">Buy or renew a plan, then scan again.</div>
              </div>
            )}
          </div>
          <figcaption className="kd-cap">The member&rsquo;s phone</figcaption>
        </figure>
      </div>
    </div>
  );
}

const KIOSK_CSS = `
.kd-root { display: flex; flex-direction: column; gap: 16px; }
.kd-chips { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; max-width: 420px; }
.kd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left; cursor: pointer;
  display: flex; flex-direction: column; gap: 2px;
  transition: border-color var(--motion-fast, 120ms);
}
.kd-chip:hover { border-color: var(--border-2); }
.kd-chip.active { border-color: var(--ink); }
.kd-chip-nm { font-size: 13px; font-weight: 500; color: var(--ink); }
.kd-chip-tg { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; }

.kd-stage {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-3);
  padding: 32px 24px; display: flex; gap: 32px; justify-content: center; align-items: flex-start;
  flex-wrap: wrap;
}
@media (max-width: 640px) { .kd-stage { padding: 20px 12px; gap: 24px; } }
.kd-col { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.kd-cap { font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }

/* Gym screen */
.kd-screen {
  width: 320px; max-width: 100%; background: var(--bg); border: 1px solid var(--border-2);
  border-radius: var(--r-3); overflow: hidden; display: flex; flex-direction: column;
}
.kd-bar {
  display: flex; justify-content: space-between; padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.kd-bar span:first-child { color: var(--ink); }
.kd-screen-body { display: flex; flex-direction: column; align-items: center; padding: 18px 16px 14px; gap: 12px; }
.kd-eyebrow { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.08em; }
.kd-qr {
  width: 150px; height: 150px; display: grid;
  grid-template-columns: repeat(${QR_SIZE}, 1fr); grid-template-rows: repeat(${QR_SIZE}, 1fr);
  padding: 8px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-2);
}
.kd-qr span.on { background: var(--ink); }
.kd-rotate { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: var(--fg-3); }
.kd-rotate-track { width: 150px; height: 3px; border-radius: var(--r-full); background: var(--bg-3); overflow: hidden; }
.kd-rotate-fill { display: block; height: 100%; background: var(--signal); animation: kd-drain ${RUN_MS}ms linear forwards; }
@keyframes kd-drain { from { width: 100%; } to { width: 0%; } }
.kd-feed { border-top: 1px solid var(--border); padding: 10px 14px 12px; }
.kd-feed-head { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.kd-row {
  display: flex; justify-content: space-between; gap: 8px; padding: 6px 0;
  border-bottom: 1px solid var(--border); font-size: 12.5px; color: var(--ink);
}
.kd-row:last-child { border-bottom: none; }
.kd-row span:last-child { font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-3); }
.kd-row-new { animation: kd-in var(--motion-base, 240ms) ease-out; background: var(--signal-soft); margin: 0 -6px; padding: 6px; border-radius: var(--r-1); }
.kd-row-declined { background: var(--danger-soft); }
.kd-row-declined span:last-child { color: var(--danger-ink); }
@keyframes kd-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

/* Member phone */
.kd-phone {
  width: 220px; height: 400px; border-radius: 28px; border: 8px solid var(--ink);
  background: var(--bg); overflow: hidden; display: flex; flex-direction: column;
  transition: background var(--motion-base, 240ms);
}
.kd-phone-dark { background: var(--ink); }
.kd-cam { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
.kd-cam-label { font-size: 12.5px; color: var(--fg-2); text-align: center; min-height: 18px; }
.kd-finder { position: relative; width: 150px; height: 150px; }
.kd-finder-qr { position: absolute; inset: 14px; opacity: 0.85; }
.kd-finder-qr .kd-qr { width: 100%; height: 100%; padding: 4px; }
.kd-br { position: absolute; width: 22px; height: 22px; border: 0 solid var(--ink); }
.kd-br.tl { top: 0; left: 0; border-top-width: 2px; border-left-width: 2px; }
.kd-br.tr { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; }
.kd-br.bl { bottom: 0; left: 0; border-bottom-width: 2px; border-left-width: 2px; }
.kd-br.br { bottom: 0; right: 0; border-bottom-width: 2px; border-right-width: 2px; }
.kd-scanline {
  position: absolute; left: 8px; right: 8px; height: 2px; background: var(--signal);
  animation: kd-scan 1s ease-in-out infinite alternate;
}
@keyframes kd-scan { from { top: 10px; } to { top: calc(100% - 12px); } }
.kd-result { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 20px 18px; animation: kd-in var(--motion-base, 240ms) ease-out; }
.kd-status { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--signal); }
.kd-status-no { color: var(--danger-ink); }
.kd-hello { font-size: 22px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.15; color: var(--bg); }
.kd-hello-light { color: var(--ink); font-size: 18px; }
.kd-gym { font-size: 13px; color: var(--on-ink-2); }
.kd-gym-light { color: var(--fg-3); }
.kd-streak {
  margin-top: 10px; display: flex; align-items: baseline; gap: 8px;
  padding: 12px 14px; border-radius: var(--r-2); background: var(--ink-2);
}
.kd-streak-num { font-size: 28px; font-weight: 500; color: var(--bg); font-variant-numeric: tabular-nums; }
.kd-streak-lbl { font-size: 12px; color: var(--on-ink-3); }

@media (prefers-reduced-motion: reduce) {
  .kd-rotate-fill, .kd-row-new, .kd-result, .kd-scanline { animation: none; }
  .kd-rotate-fill { width: 50%; }
}
`;
