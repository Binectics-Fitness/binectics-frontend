"use client";

import { useEffect, useRef, useCallback } from "react";

const NS = "http://www.w3.org/2000/svg";

/* ── artery definitions ── */
const ARTERY_PATHS = [
  { d: "M 88 152 C 160 180, 200 200, 252 244", arr: "lagos" },
  { d: "M 252 244 C 308 268, 360 260, 408 198", arr: "dubai" },
  { d: "M 252 244 C 264 308, 240 368, 184 408", arr: "capetown" },
  { d: "M 252 244 C 320 224, 360 280, 388 360", arr: "nairobi" },
  { d: "M 88 152 C 156 120, 232 96, 308 116", arr: "dubai" },
  { d: "M 408 198 C 416 268, 396 320, 388 360", arr: "nairobi" },
  { d: "M 184 408 C 256 392, 332 388, 388 360", arr: "nairobi" },
  { d: "M 88 152 C 80 232, 116 320, 184 408", arr: "capetown" },
  // reverse directions for variety
  { d: "M 252 244 C 200 200, 160 180, 88 152", arr: "london" },
  { d: "M 408 198 C 360 260, 308 268, 252 244", arr: "lagos" },
  { d: "M 184 408 C 240 368, 264 308, 252 244", arr: "lagos" },
  { d: "M 388 360 C 360 280, 320 224, 252 244", arr: "lagos" },
];

/* ── hub data ── */
const HUBS = [
  {
    id: "london",
    cx: 88,
    cy: 152,
    r: 6,
    fill: "var(--hb-ink)",
    label: "London",
    labelY: 138,
    brand: false,
    tipTranslate: "19, 60",
    tipTitle: "London · GB",
    stats: ["412 providers", "1,284 sessions today"],
    live: "14 live now",
  },
  {
    id: "lagos",
    cx: 252,
    cy: 244,
    r: 7,
    fill: "var(--hb-ink)",
    label: "Lagos",
    labelY: 266,
    brand: false,
    tipTranslate: "183, 151",
    tipTitle: "Lagos · NG",
    stats: ["980 providers", "2,840 sessions today"],
    live: "42 live now",
  },
  {
    id: "dubai",
    cx: 408,
    cy: 198,
    r: 6,
    fill: "var(--hb-ink)",
    label: "Dubai",
    labelY: 184,
    brand: false,
    tipTranslate: "339, 106",
    tipTitle: "Dubai · AE",
    stats: ["412 providers", "1,016 sessions today"],
    live: "28 live now",
  },
  {
    id: "capetown",
    cx: 184,
    cy: 408,
    r: 6,
    fill: "var(--hb-ink)",
    label: "Cape Town",
    labelY: 430,
    brand: false,
    tipTranslate: "115, 316",
    tipTitle: "Cape Town · ZA",
    stats: ["684 providers", "1,920 sessions today"],
    live: "18 live now",
  },
  {
    id: "nairobi",
    cx: 388,
    cy: 360,
    r: 6.5,
    fill: "var(--hb-brand)",
    label: "Nairobi",
    labelY: 382,
    brand: true,
    tipTranslate: "319, 268",
    tipTitle: "Nairobi · KE",
    stats: ["318 providers", "740 sessions today"],
    live: "9 live now · M-Pesa",
  },
];

/* ── minor nodes ── */
const MINOR_NODES = [
  { cx: 160, cy: 80, r: 2.4, cls: "n0" },
  { cx: 308, cy: 116, r: 2.4, cls: "n1" },
  { cx: 448, cy: 120, r: 2, cls: "n2" },
  { cx: 436, cy: 280, r: 2, cls: "n3" },
  { cx: 60, cy: 320, r: 2.4, cls: "n4" },
  { cx: 120, cy: 448, r: 2, cls: "n5" },
  { cx: 440, cy: 420, r: 2.2, cls: "n6" },
  { cx: 40, cy: 80, r: 1.8, cls: "n7" },
  { cx: 220, cy: 160, r: 1.8, cls: "n0" },
  { cx: 350, cy: 180, r: 1.8, cls: "n2" },
  { cx: 300, cy: 320, r: 2.0, cls: "n4" },
  { cx: 140, cy: 280, r: 2.0, cls: "n6" },
  { cx: 76, cy: 240, r: 1.6, cls: "n8" },
  { cx: 416, cy: 76, r: 1.6, cls: "n1" },
  { cx: 340, cy: 440, r: 1.8, cls: "n3" },
  { cx: 40, cy: 404, r: 1.8, cls: "n5" },
];

/* ── secondary edges ── */
const SECONDARY_EDGES = [
  [160, 80, 88, 152],
  [308, 116, 252, 244],
  [408, 198, 448, 120],
  [408, 198, 436, 280],
  [252, 244, 184, 408],
  [184, 408, 120, 448],
  [388, 360, 440, 420],
  [88, 152, 40, 80],
  [184, 408, 252, 244],
  [308, 116, 408, 198],
  [60, 320, 184, 408],
  [60, 320, 88, 152],
];

export default function HeartbeatMotion() {
  const pulseLayerRef = useRef<SVGGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const tickRef = useRef<HTMLSpanElement>(null);
  const rateRef = useRef<HTMLSpanElement>(null);
  const hubDotsRef = useRef<Map<string, SVGCircleElement>>(new Map());
  const counterVal = useRef(1431284);
  const recentPulses = useRef<number[]>([]);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const alive = useRef(true);
  const stageRef = useRef<HTMLDivElement>(null);

  const setHubDotRef = useCallback(
    (id: string) => (el: SVGCircleElement | null) => {
      if (el) hubDotsRef.current.set(id, el);
    },
    []
  );

  useEffect(() => {
    alive.current = true;
    const layer = pulseLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = true;

    function spawnPulse() {
      if (!alive.current || !layer || !visible) return;

      const a = ARTERY_PATHS[Math.floor(Math.random() * ARTERY_PATHS.length)];
      const isAccent = Math.random() < 0.16;
      const dur = 3200 + Math.random() * 1200;

      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", isAccent ? "3.2" : "2.4");
      c.setAttribute("fill", isAccent ? "var(--hb-brand)" : "var(--hb-ink)");
      c.style.offsetPath = `path('${a.d}')`;
      c.style.offsetDistance = "0%";
      c.style.opacity = "0";
      layer.appendChild(c);

      const anim = c.animate(
        [
          { offsetDistance: "0%", opacity: 0 },
          { offsetDistance: "8%", opacity: 1 },
          { offsetDistance: "90%", opacity: 1 },
          { offsetDistance: "100%", opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(.5,0,.5,1)", fill: "forwards" }
      );

      anim.onfinish = () => {
        c.remove();

        // flash the arrival hub
        const hub = hubDotsRef.current.get(a.arr);
        if (hub) {
          hub.classList.add("hb-arrived");
          const tid = setTimeout(() => hub.classList.remove("hb-arrived"), 500);
          timeoutIds.current.push(tid);
        }

        // increment counter
        counterVal.current += 1;
        if (counterRef.current) {
          counterRef.current.textContent =
            counterVal.current.toLocaleString();
        }
        if (tickRef.current) {
          tickRef.current.classList.add("hb-flash");
          const tid2 = setTimeout(
            () => tickRef.current?.classList.remove("hb-flash"),
            700
          );
          timeoutIds.current.push(tid2);
        }

        // update rolling rate
        const now = performance.now();
        recentPulses.current.push(now);
        recentPulses.current = recentPulses.current.filter(
          (t) => now - t < 5000
        );
        const rate = (recentPulses.current.length / 5).toFixed(1);
        if (rateRef.current) {
          rateRef.current.textContent = "~" + rate + "/sec";
        }
      };

      // schedule next pulse
      const nextDelay = 800 + Math.random() * 1200;
      const tid = setTimeout(spawnPulse, nextDelay);
      timeoutIds.current.push(tid);
    }

    const visObs = new IntersectionObserver(
      ([entry]) => {
        const wasHidden = !visible;
        visible = entry.isIntersecting;
        if (visible && wasHidden) spawnPulse();
      },
      { threshold: 0.05 }
    );
    visObs.observe(stage);

    // staggered start
    const t1 = setTimeout(spawnPulse, 200);
    const t2 = setTimeout(spawnPulse, 600);
    const t3 = setTimeout(spawnPulse, 900);
    timeoutIds.current.push(t1, t2, t3);

    return () => {
      alive.current = false;
      visObs.disconnect();
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
      // clean any remaining pulse circles
      if (layer) {
        while (layer.firstChild) layer.removeChild(layer.firstChild);
      }
    };
  }, []);

  return (
    <div className="hb-stage" ref={stageRef}>
      <style>{`
        .hb-stage {
          --hb-bg-2: oklch(0.94 0.014 75);
          --hb-bg: oklch(0.97 0.01 75);
          --hb-ink: oklch(0.18 0.012 80);
          --hb-ink-soft: oklch(0.45 0.012 80);
          --hb-brand: oklch(0.62 0.13 47);
          --hb-border: oklch(0.88 0.008 80);

          width: 100%;
          aspect-ratio: 1 / 1;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        }
        .hb-stage svg.hb-svg { width: 100%; height: 100%; display: block; }

        /* Hub idle breathing */
        @keyframes hb-hub-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .hb-hub-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: hb-hub-breathe 4s ease-in-out infinite;
          transition: r 0.15s ease, transform 0.18s ease;
        }
        .hb-hub-group:hover .hb-hub-dot {
          animation: none;
          transform: scale(1.35);
        }

        /* Hub arrival flash */
        @keyframes hb-hub-flash {
          0% { transform: scale(1); }
          20% { transform: scale(1.6); }
          100% { transform: scale(1); }
        }
        .hb-hub-dot.hb-arrived {
          animation: hb-hub-flash 0.5s ease-out;
        }

        /* Faint scattered dots blink */
        @keyframes hb-dot-blink {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .hb-node { animation: hb-dot-blink 4s ease-in-out infinite; }
        .hb-n0 { animation-delay: 0s; }
        .hb-n1 { animation-delay: 0.4s; }
        .hb-n2 { animation-delay: 0.8s; }
        .hb-n3 { animation-delay: 1.2s; }
        .hb-n4 { animation-delay: 1.6s; }
        .hb-n5 { animation-delay: 2.0s; }
        .hb-n6 { animation-delay: 2.4s; }
        .hb-n7 { animation-delay: 2.8s; }
        .hb-n8 { animation-delay: 3.2s; }

        /* Edges breathe */
        @keyframes hb-edge-breathe {
          0%, 100% { stroke-opacity: 0.10; }
          50% { stroke-opacity: 0.20; }
        }
        .hb-edge {
          stroke: var(--hb-ink);
          stroke-width: 0.8;
          fill: none;
          animation: hb-edge-breathe 5s ease-in-out infinite;
        }
        .hb-e1 { animation-delay: 0s; }
        .hb-e2 { animation-delay: 1.2s; }
        .hb-e3 { animation-delay: 2.4s; }
        .hb-e4 { animation-delay: 3.6s; }

        /* Labels */
        .hb-label {
          font-size: 10.5px;
          font-weight: 500;
          fill: var(--hb-ink-soft);
          letter-spacing: 0.02em;
          pointer-events: none;
          transition: fill 0.15s, opacity 0.15s;
        }
        .hb-hub-group:hover .hb-label { opacity: 0; }
        .hb-label.hb-brand-label { fill: var(--hb-brand); font-weight: 600; }

        /* Tooltip card */
        .hb-tip { opacity: 0; transition: opacity 0.18s ease; pointer-events: none; }
        .hb-hub-group:hover .hb-tip { opacity: 1; }
        .hb-tip-bg { fill: var(--hb-bg); stroke: var(--hb-ink); stroke-opacity: 0.14; }
        .hb-tip-pointer { fill: var(--hb-bg); stroke: var(--hb-ink); stroke-opacity: 0.14; }
        .hb-tip-title { font-size: 11px; font-weight: 600; fill: var(--hb-ink); }
        .hb-tip-stat {
          font-size: 9.5px;
          fill: var(--hb-ink-soft);
          font-family: ui-monospace, monospace;
          letter-spacing: 0.04em;
        }
        .hb-tip-accent { fill: var(--hb-brand); font-weight: 600; }
        .hb-tip-divider { stroke: var(--hb-ink); stroke-opacity: 0.1; }

        /* Caption strip */
        .hb-caption {
          position: absolute;
          left: 22px;
          bottom: 22px;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--hb-ink-soft);
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .hb-caption strong {
          color: var(--hb-ink);
          font-weight: 600;
          font-feature-settings: "tnum";
          font-variant-numeric: tabular-nums;
        }
        .hb-counter-tick {
          display: inline-block;
          background: oklch(0.62 0.13 47 / 0.12);
          color: var(--hb-brand);
          padding: 2px 7px;
          border-radius: 999px;
          font-weight: 600;
          font-feature-settings: "tnum";
          opacity: 0;
          transition: opacity 0.4s;
        }
        .hb-counter-tick.hb-flash { opacity: 1; }

        /* Legend */
        .hb-legend {
          position: absolute;
          right: 22px;
          bottom: 22px;
          font-family: ui-monospace, monospace;
          font-size: 9.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--hb-ink-soft);
          text-align: right;
        }
        .hb-legend .hb-row {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
          margin-top: 3px;
        }

        /* Cursor */
        .hb-hub-group { cursor: pointer; }
      `}</style>

      <svg
        className="hb-svg"
        viewBox="0 0 480 480"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animated network graph showing live sessions between London, Lagos, Dubai, Cape Town, and Nairobi"
      >
        <defs>
          {ARTERY_PATHS.slice(0, 8).map((a, i) => (
            <path key={`a${i + 1}`} id={`hb-a${i + 1}`} d={a.d} />
          ))}
        </defs>

        {/* frame */}
        <rect
          x="0"
          y="0"
          width="480"
          height="480"
          fill="none"
          stroke="var(--hb-ink)"
          strokeOpacity="0.05"
          strokeWidth="1"
        />

        {/* arteries (visible lines, breathing) */}
        <use href="#hb-a1" className="hb-edge hb-e1" />
        <use href="#hb-a2" className="hb-edge hb-e2" />
        <use href="#hb-a3" className="hb-edge hb-e3" />
        <use href="#hb-a4" className="hb-edge hb-e4" />
        <use href="#hb-a5" className="hb-edge hb-e2" />
        <use href="#hb-a6" className="hb-edge hb-e1" />
        <use href="#hb-a7" className="hb-edge hb-e3" />
        <use href="#hb-a8" className="hb-edge hb-e4" />

        {/* secondary thin edges */}
        <g className="hb-edge" style={{ animationDelay: "0.6s" }}>
          {SECONDARY_EDGES.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>

        {/* scattered minor nodes */}
        <g fill="var(--hb-ink)">
          {MINOR_NODES.map((n, i) => (
            <circle
              key={i}
              className={`hb-node hb-${n.cls}`}
              cx={n.cx}
              cy={n.cy}
              r={n.r}
            />
          ))}
        </g>

        {/* pulse layer (JS appends to this group) */}
        <g ref={pulseLayerRef} />

        {/* hub groups */}
        {HUBS.map((hub) => (
          <g key={hub.id} className="hb-hub-group" data-city={hub.label}>
            <circle
              className="hb-hub-dot"
              ref={setHubDotRef(hub.id)}
              data-id={hub.id}
              cx={hub.cx}
              cy={hub.cy}
              r={hub.r}
              fill={hub.fill}
            />
            <text
              x={hub.cx}
              y={hub.labelY}
              textAnchor="middle"
              className={`hb-label${hub.brand ? " hb-brand-label" : ""}`}
            >
              {hub.label}
            </text>
            <g
              className="hb-tip"
              transform={`translate(${hub.tipTranslate})`}
            >
              <rect
                className="hb-tip-bg"
                x="0"
                y="0"
                width="138"
                height="76"
                rx="6"
              />
              <polygon
                className="hb-tip-pointer"
                points="64,76 74,76 69,82"
              />
              <text x="12" y="20" className="hb-tip-title">
                {hub.tipTitle}
              </text>
              <line
                className="hb-tip-divider"
                x1="12"
                y1="28"
                x2="126"
                y2="28"
              />
              {hub.stats.map((stat, si) => (
                <text
                  key={si}
                  x="12"
                  y={44 + si * 14}
                  className="hb-tip-stat"
                >
                  {stat}
                </text>
              ))}
              <text
                x="12"
                y={44 + hub.stats.length * 14}
                className="hb-tip-stat"
              >
                <tspan className="hb-tip-accent">{"●"}</tspan>{" "}
                {hub.live}
              </text>
            </g>
          </g>
        ))}
      </svg>

      {/* Caption strip */}
      <div className="hb-caption">
        <span>
          <strong ref={counterRef}>1,431,284</strong> sessions this month
        </span>
        <span className="hb-counter-tick" ref={tickRef}>
          +1
        </span>
      </div>

      {/* Legend */}
      <div className="hb-legend">
        <div className="hb-row">
          <span
            ref={rateRef}
            style={{
              fontFeatureSettings: "'tnum'",
              color: "var(--hb-ink)",
              fontWeight: 600,
            }}
          >
            ~2.1/sec
          </span>
        </div>
      </div>
    </div>
  );
}
