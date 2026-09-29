"use client";

import { useState, useRef, useEffect } from "react";
import { useRegion } from "@/contexts/RegionContext";

/**
 * The marketing footer's display-currency picker. It lists the currencies
 * the platform offers (GET /currencies) and only changes how marketing
 * amounts are shown; it never changes what anything costs or is charged in.
 */
export function RegionSelector() {
  const { currency, currencies = [], setCurrency } = useRegion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onEscape);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (currencies.length === 0 && !currency) return null;

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 font-mono text-[11.5px] cursor-pointer rounded-(--r-2) px-2.5 py-2 min-h-11 hover:bg-bg-2"
        style={{ color: "var(--fg-3)", background: "transparent", border: "none" }}
        aria-label="Change display currency"
        aria-expanded={open}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>{currency || "Currency"}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 rounded-(--r-3) overflow-hidden overflow-y-auto min-w-50"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 8px 24px oklch(0 0 0 / 0.1)", zIndex: 50, maxHeight: "min(320px, 60vh)" }}
          role="listbox"
        >
          {currencies.map((c) => {
            const isActive = c.code === currency;
            return (
              <button
                key={c.code}
                role="option"
                aria-selected={isActive}
                onClick={() => { setCurrency(c.code); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 min-h-11 text-left cursor-pointer hover:bg-bg-2"
                style={{ background: isActive ? "var(--bg-2)" : "transparent", border: "none", borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-[13px] font-medium flex-1" style={{ color: "var(--ink)" }}>{c.name}</span>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{c.code}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
