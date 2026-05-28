"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCommandBar, closeCommandBar } from "@/hooks/useCommandBar";
import { NAVIGATION_COMMANDS, ACTION_COMMANDS, type CommandItem } from "@/lib/constants/commands";

const ALL_COMMANDS = [...NAVIGATION_COMMANDS, ...ACTION_COMMANDS];

export function CommandBar() {
  const { open, close } = useCommandBar();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 220);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open && shouldRender && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, shouldRender]);

  const filtered = query
    ? ALL_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_COMMANDS;

  const handleSelect = useCallback(
    (item: CommandItem) => {
      close();
      if (item.href) {
        router.push(item.href);
      }
    },
    [close, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  };

  if (!shouldRender) return null;

  const navItems = filtered.filter((c) => c.section === "navigation");
  const actionItems = filtered.filter((c) => c.section === "action");
  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          background: "oklch(0.14 0.008 80 / 0.3)",
          opacity: isAnimating ? 1 : 0,
          transitionDuration: "var(--motion-base)",
        }}
        onClick={close}
      />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-(--r-3) border border-border bg-bg"
        style={{
          boxShadow: "var(--shadow-2)",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "scale(1) translateY(0)" : "scale(0.98) translateY(-8px)",
          transitionProperty: "opacity, transform",
          transitionDuration: "var(--motion-base)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      >
        <div className="flex items-center border-b border-border px-4">
          <svg className="mr-3 h-4 w-4 shrink-0 text-fg-3" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="h-12 flex-1 bg-transparent text-[15px] text-ink placeholder:text-fg-4 focus:outline-none"
          />
          <kbd className="rounded-(--r-1) border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg-4">
            ESC
          </kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-[13.5px] text-fg-3">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {navItems.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-fg-4">
                    Navigation
                  </div>
                  {navItems.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex w-full items-center gap-3 rounded-(--r-2) px-3 py-2.5 text-left text-[13.5px] ${
                          activeIndex === idx ? "bg-bg-2 text-ink" : "text-fg-2"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {actionItems.length > 0 && (
                <div className={navItems.length > 0 ? "mt-1" : ""}>
                  <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-fg-4">
                    Actions
                  </div>
                  {actionItems.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex w-full items-center gap-3 rounded-(--r-2) px-3 py-2.5 text-left text-[13.5px] ${
                          activeIndex === idx ? "bg-bg-2 text-ink" : "text-fg-2"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
