"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCommandBar, closeCommandBar } from "@/hooks/useCommandBar";
import { NAVIGATION_COMMANDS, ACTION_COMMANDS, HELP_COMMANDS, type CommandItem } from "@/lib/constants/commands";

const ALL_COMMANDS = [...NAVIGATION_COMMANDS, ...ACTION_COMMANDS, ...HELP_COMMANDS];

function CmdIcon({ d }: { d: string }) {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 5, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </div>
  );
}

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
  const helpItems = filtered.filter((c) => c.section === "help");
  let flatIndex = 0;

  function renderGroup(label: string, items: CommandItem[]) {
    if (items.length === 0) return null;
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ padding: "4px 18px 6px", fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
        {items.map((item) => {
          const idx = flatIndex++;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              style={{
                padding: "9px 18px",
                display: "flex",
                gap: 12,
                alignItems: "center",
                cursor: "pointer",
                background: activeIndex === idx ? "var(--bg-2)" : "transparent",
                border: "none",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <CmdIcon d={item.icon} />
              <span style={{ flex: 1, fontSize: "13.5px", color: "var(--ink)", fontWeight: 500 }}>{item.label}</span>
              {item.meta && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.meta}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120 }}>
      {/* Scrim */}
      <div
        onClick={close}
        style={{
          position: "absolute",
          inset: 0,
          background: "oklch(0 0 0 / 0.45)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: isAnimating ? 1 : 0,
          transition: "opacity var(--motion-base)",
        }}
      />

      {/* Box */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 580,
          maxHeight: "64vh",
          overflow: "hidden",
          borderRadius: 14,
          background: "var(--bg)",
          boxShadow: "0 20px 60px oklch(0 0 0 / 0.20)",
          display: "flex",
          flexDirection: "column",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "scale(1) translateY(0)" : "scale(0.98) translateY(-8px)",
          transitionProperty: "opacity, transform",
          transitionDuration: "var(--motion-base)",
          transitionTimingFunction: "var(--ease-out)",
          margin: "0 16px",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--fg-3)" strokeWidth="1.6" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search · jump · run an action..."
            style={{ flex: 1, border: 0, background: "transparent", font: "inherit", fontSize: 15, color: "var(--ink)", outline: "none" }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 4, color: "var(--fg-3)" }}>esc</span>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", padding: "6px 0 10px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", fontSize: "13.5px", color: "var(--fg-3)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {renderGroup("Navigate", navItems)}
              {renderGroup("Actions", actionItems)}
              {renderGroup("Help", helpItems)}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "8px 18px", borderTop: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", display: "flex", justifyContent: "space-between", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <span>↑↓ navigate</span>
            <span>↵ select</span>
          </div>
          <span>Binectics</span>
        </div>
      </div>
    </div>
  );
}
