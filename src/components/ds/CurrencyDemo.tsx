"use client";

import { useState, useEffect, useRef } from "react";

const COUNTRIES = [
  {
    id: "ng",
    name: "Nigeria",
    currency: "NGN",
    price: "₦45,500",
    period: "/month",
    gateway: "Paystack",
    methods: "Card · Bank transfer · USSD",
    settlement: "T+1 to provider",
  },
  {
    id: "gb",
    name: "United Kingdom",
    currency: "GBP",
    price: "£49",
    period: "/month",
    gateway: "Stripe",
    methods: "Card · Apple Pay · Google Pay",
    settlement: "T+2 to provider",
  },
  {
    id: "ke",
    name: "Kenya",
    currency: "KES",
    price: "KSh 6,400",
    period: "/month",
    gateway: "Flutterwave",
    methods: "Card · M-Pesa · Mobile money",
    settlement: "T+2 to provider",
  },
  {
    id: "in",
    name: "India",
    currency: "INR",
    price: "₹4,199",
    period: "/month",
    gateway: "Razorpay",
    methods: "Card · UPI · Net banking",
    settlement: "T+2 to provider",
  },
];

const CYCLE_MS = 3500;
const EXIT_MS = 150;
const GAP_MS = 100;
const ENTER_MS = 350;
const ROW_STAGGER_MS = 80;

export function CurrencyDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exiting" | "entering">(
    "visible",
  );
  const [displayIdx, setDisplayIdx] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const country = COUNTRIES[displayIdx];

  // Auto-cycle
  useEffect(() => {
    cycleRef.current = setTimeout(() => {
      setIdx((i) => (i + 1) % COUNTRIES.length);
    }, CYCLE_MS);
    return () => {
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [idx, displayIdx]);

  // Transition sequence when idx changes (but not on first mount)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Cancel any in-flight transition
    if (transRef.current) clearTimeout(transRef.current);

    // Phase 1: exit current
    setPhase("exiting");

    transRef.current = setTimeout(() => {
      // Phase 2: swap data
      setDisplayIdx(idx);
      setPhase("entering");

      transRef.current = setTimeout(() => {
        // Phase 3: fully visible
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
      ? "cd-phase-exit"
      : phase === "entering"
        ? "cd-phase-enter"
        : "cd-phase-visible";

  return (
    <div className="cd-root">
      <style>{CURRENCY_CSS}</style>

      {/* Country selector chips */}
      <div className="cd-chips">
        {COUNTRIES.map((c, i) => (
          <button
            key={c.id}
            className={`cd-chip ${i === idx ? "active" : ""}`}
            onClick={() => handleChipClick(i)}
            type="button"
          >
            <span className="cd-chip-nm">{c.name}</span>
            <span className="cd-chip-tg">{c.gateway}</span>
          </button>
        ))}
      </div>

      {/* Stage */}
      <div className="cd-stage">
        <div className="cd-stage-tag">
          <span>Multi-currency checkout</span>
        </div>

        <div className={`cd-card ${phaseClass}`}>
          {/* Plan header */}
          <div className="cd-plan-header">
            <div className="cd-plan-name">Athlete Plan</div>
            <div className="cd-plan-provider">Iron Lab Fitness</div>
          </div>

          {/* Price display */}
          <div className="cd-price">
            <div className="cd-price-amount" key={`price-${displayIdx}`}>
              {country.price}
            </div>
            <div className="cd-price-period">{country.period}</div>
          </div>

          {/* Divider */}
          <div className="cd-divider" />

          {/* Payment details */}
          <div className="cd-details">
            <div className="cd-row cd-row-0">
              <span className="cd-label">Currency</span>
              <span className="cd-value">{country.currency}</span>
            </div>
            <div className="cd-row cd-row-1">
              <span className="cd-label">Gateway</span>
              <span className="cd-value">{country.gateway}</span>
            </div>
            <div className="cd-row cd-row-2">
              <span className="cd-label">Methods</span>
              <span className="cd-value">{country.methods}</span>
            </div>
            <div className="cd-row cd-row-3">
              <span className="cd-label">Settlement</span>
              <span className="cd-value">{country.settlement}</span>
            </div>
          </div>

          {/* Pay button */}
          <button className="cd-pay-btn" type="button">
            Pay {country.price}
          </button>

          {/* Footer */}
          <div className="cd-footer">
            Secured by {country.gateway} · 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  );
}

const CURRENCY_CSS = `
/* ====== Currency Demo (cd- prefix) ====== */
.cd-root { display: flex; flex-direction: column; gap: 16px; }

/* Chips */
.cd-chips {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
}
@media (max-width: 640px) {
  .cd-chips { grid-template-columns: repeat(2, 1fr); }
}
.cd-chip {
  border: 1px solid var(--border); border-radius: var(--r-2);
  padding: 8px 10px; background: var(--bg); text-align: left;
  cursor: pointer; transition: border-color 120ms, background 120ms;
  display: flex; flex-direction: column; gap: 2px;
}
.cd-chip:hover { border-color: var(--border-2); }
.cd-chip.active { border-color: var(--ink); }
.cd-chip-nm {
  font-size: 13px; font-weight: 500; letter-spacing: -0.005em; color: var(--ink);
}
.cd-chip-tg {
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}

/* Stage */
.cd-stage {
  background: oklch(0.93 0.005 80);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 40px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  min-height: 520px;
  background-image: radial-gradient(circle at 50% 30%, oklch(0 0 0 / 0.04), transparent 70%);
}
@media (max-width: 640px) {
  .cd-stage { padding: 20px 12px; min-height: 460px; }
  .cd-price-amount { font-size: 28px; }
}
.cd-stage-tag {
  position: absolute; top: 14px; left: 16px;
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
}
.cd-stage-tag::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--signal); box-shadow: 0 0 0 3px oklch(0.68 0.16 148 / 0.2);
  animation: cd-livedot 1.4s ease-in-out infinite;
}
@keyframes cd-livedot { 50% { opacity: 0.4; } }

/* Card */
.cd-card {
  width: 340px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-3);
  padding: 28px 24px 20px;
  box-shadow: 0 4px 24px -6px oklch(0 0 0 / 0.08);
  display: flex; flex-direction: column;
}
@media (max-width: 640px) {
  .cd-card { width: 100%; padding: 24px 16px 16px; }
}

/* Plan header */
.cd-plan-header { margin-bottom: 20px; }
.cd-plan-name {
  font-size: 15px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink);
  margin-bottom: 2px;
}
.cd-plan-provider {
  font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.06em;
}

/* Price */
.cd-price {
  display: flex; align-items: baseline; gap: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}
.cd-price-amount {
  font-size: 38px; font-weight: 500; letter-spacing: -0.03em; line-height: 1;
  font-variant-numeric: tabular-nums; color: var(--ink);
}
.cd-price-period {
  font-size: 14px; color: var(--fg-3); letter-spacing: -0.005em;
}

/* Price animation on enter */
.cd-phase-enter .cd-price-amount {
  animation: cd-priceSlide ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes cd-priceSlide {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Price animation on exit */
.cd-phase-exit .cd-price-amount {
  animation: cd-priceOut ${EXIT_MS}ms ease-out forwards;
}
@keyframes cd-priceOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

/* Divider */
.cd-divider {
  height: 1px; background: var(--border); margin-bottom: 16px;
}

/* Details */
.cd-details {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 20px;
}
.cd-row {
  display: flex; justify-content: space-between; align-items: center;
}
.cd-label {
  font-family: var(--font-mono); font-size: 11px; color: var(--fg-3);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.cd-value {
  font-size: 13px; font-weight: 500; color: var(--ink); letter-spacing: -0.005em;
  text-align: right;
}

/* Row stagger on enter */
.cd-phase-enter .cd-row-0 { animation: cd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 0}ms both; }
.cd-phase-enter .cd-row-1 { animation: cd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 1}ms both; }
.cd-phase-enter .cd-row-2 { animation: cd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 2}ms both; }
.cd-phase-enter .cd-row-3 { animation: cd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 3}ms both; }
@keyframes cd-rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Row exit */
.cd-phase-exit .cd-row {
  animation: cd-rowOut ${EXIT_MS}ms ease-out forwards;
}
@keyframes cd-rowOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

/* Pay button */
.cd-pay-btn {
  width: 100%; height: 44px; border: 1.5px solid var(--ink);
  border-radius: var(--r-2); background: var(--ink); color: var(--bg);
  font-size: 14px; font-weight: 500; letter-spacing: -0.01em;
  cursor: pointer; transition: background 120ms, border-color 120ms;
  margin-bottom: 12px;
}
.cd-pay-btn:hover {
  background: var(--bg); color: var(--ink);
}

/* Pay button flash on enter */
.cd-phase-enter .cd-pay-btn {
  animation: cd-btnFlash 500ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 3 + 60}ms both;
}
@keyframes cd-btnFlash {
  0%   { border-color: var(--signal); box-shadow: 0 0 0 2px var(--signal-soft); opacity: 0; transform: translateY(4px); }
  50%  { border-color: var(--signal); box-shadow: 0 0 0 2px var(--signal-soft); }
  100% { border-color: var(--ink); box-shadow: none; opacity: 1; transform: translateY(0); }
}

/* Pay button exit */
.cd-phase-exit .cd-pay-btn {
  animation: cd-rowOut ${EXIT_MS}ms ease-out forwards;
}

/* Footer */
.cd-footer {
  text-align: center;
  font-family: var(--font-mono); font-size: 10px; color: var(--fg-3);
  letter-spacing: 0.03em;
}

/* Footer animation on enter */
.cd-phase-enter .cd-footer {
  animation: cd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${ROW_STAGGER_MS * 4}ms both;
}
.cd-phase-exit .cd-footer {
  animation: cd-rowOut ${EXIT_MS}ms ease-out forwards;
}

/* Period animation synced with price */
.cd-phase-enter .cd-price-period {
  animation: cd-rowIn ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) 40ms both;
}
.cd-phase-exit .cd-price-period {
  animation: cd-rowOut ${EXIT_MS}ms ease-out forwards;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .cd-phase-enter .cd-price-amount,
  .cd-phase-enter .cd-price-period,
  .cd-phase-enter .cd-row-0,
  .cd-phase-enter .cd-row-1,
  .cd-phase-enter .cd-row-2,
  .cd-phase-enter .cd-row-3,
  .cd-phase-enter .cd-pay-btn,
  .cd-phase-enter .cd-footer,
  .cd-phase-exit .cd-price-amount,
  .cd-phase-exit .cd-price-period,
  .cd-phase-exit .cd-row,
  .cd-phase-exit .cd-pay-btn,
  .cd-phase-exit .cd-footer {
    animation: cd-instantFade 1ms forwards !important;
  }
  @keyframes cd-instantFade { to { opacity: 1; transform: none; } }
  .cd-stage-tag::before { animation: none; opacity: 1; }
}
`;
