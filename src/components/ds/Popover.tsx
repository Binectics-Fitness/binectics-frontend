"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  className = "",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const alignClass =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  const sideStyle = side === "top" ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute z-50 ${alignClass} min-w-[180px] rounded-(--r-3) border border-border bg-bg p-1 ${className}`}
          style={{ boxShadow: "var(--shadow-2)", ...sideStyle }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface PopoverItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export function PopoverItem({ children, onClick, danger }: PopoverItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-(--r-2) px-3 py-2 text-left text-[13.5px] font-medium transition-colors ${
        danger
          ? "text-danger hover:bg-danger-soft"
          : "text-ink hover:bg-bg-2"
      }`}
      style={{ transitionDuration: "var(--motion-fast)" }}
    >
      {children}
    </button>
  );
}
