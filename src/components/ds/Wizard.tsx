/**
 * Wizard — multi-step stepper from booking.html.
 *
 * Stepper: flex row, numbered circles (22px, mono 11px).
 * States: done (ink bg, checkmark), now (ink bg, number), upcoming (border-2, fg-3).
 * Connecting bar: 1px height, border-2 color, flex-1.
 * Sticky footer: back + continue buttons, border-top.
 */
"use client";

import { useState, ReactNode } from "react";

interface WizardStep {
  label: string;
  content: ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete?: () => void;
  completeLabel?: string;
  rightRail?: ReactNode;
  className?: string;
}

export function Wizard({ steps, onComplete, completeLabel = "Confirm", rightRail, className = "" }: WizardProps) {
  const [current, setCurrent] = useState(0);

  const goNext = () => {
    if (current < steps.length - 1) setCurrent(current + 1);
    else onComplete?.();
  };
  const goBack = () => { if (current > 0) setCurrent(current - 1); };

  return (
    <div className={`flex flex-col min-h-screen ${className}`} style={{ background: "var(--bg)" }}>
      {/* Stepper */}
      <div className="flex items-center mx-auto max-w-360 px-5 sm:px-10 mt-9 mb-9 gap-0 w-full">
        {steps.map((s, i) => {
          const isDone = i < current;
          const isNow = i === current;
          return (
            <div key={i} className="flex items-center gap-2.5 flex-1" style={{ paddingRight: i < steps.length - 1 ? "14px" : 0 }}>
              <div
                className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px]"
                style={{
                  background: isDone || isNow ? "var(--ink)" : "var(--bg)",
                  color: isDone || isNow ? "var(--bg)" : "var(--fg-3)",
                  border: isDone || isNow ? "1px solid var(--ink)" : "1px solid var(--border-2)",
                  fontVariantNumeric: "tabular-nums",
                  transition: "background 200ms, color 200ms, border-color 200ms",
                }}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className="text-[12.5px] font-medium hidden sm:inline" style={{ color: isNow ? "var(--ink)" : "var(--fg-3)" }}>{s.label}</span>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px ml-1.5" style={{ background: "var(--border-2)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 mx-auto max-w-360 px-5 sm:px-10 pb-24 w-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div>{steps[current].content}</div>
        {rightRail && <aside className="hidden lg:block sticky top-20">{rightRail}</aside>}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-360 px-5 sm:px-10 py-3.5 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={current === 0}
            className="btn-ghost-v2 sm disabled:opacity-30"
          >
            ← Back
          </button>
          <div className="font-mono text-[11px] uppercase tracking-[0.04em] hidden sm:block" style={{ color: "var(--fg-3)" }}>
            Step {current + 1} of {steps.length}
          </div>
          <button onClick={goNext} className="btn-primary-v2">
            {current === steps.length - 1 ? completeLabel : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
