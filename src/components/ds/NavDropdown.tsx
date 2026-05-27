"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface NavDropdownProps {
  label: string;
  active?: boolean;
  align?: "left" | "right";
  children: ReactNode;
}

export function NavDropdown({ label, active, align = "left", children }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scheduleOpen = () => {
    if (closeRef.current) clearTimeout(closeRef.current);
    openRef.current = setTimeout(() => setIsOpen(true), 150);
  };

  const scheduleClose = () => {
    if (openRef.current) clearTimeout(openRef.current);
    closeRef.current = setTimeout(() => setIsOpen(false), 300);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (openRef.current) clearTimeout(openRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1 px-3 py-2 rounded-(--r-2) text-[14px] font-medium transition-colors"
        style={{
          color: active || isOpen ? "var(--ink)" : "var(--fg-2)",
          background: isOpen ? "var(--bg-2)" : "transparent",
          letterSpacing: "-0.005em",
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !active) e.currentTarget.style.color = "var(--ink)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !active) e.currentTarget.style.color = "var(--fg-2)";
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--fg-3)" }}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full pt-2"
          style={{ [align === "right" ? "right" : "left"]: 0 }}
        >
          <div
            className="rounded-(--r-3) overflow-hidden"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 30px oklch(0 0 0 / 0.08)",
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
