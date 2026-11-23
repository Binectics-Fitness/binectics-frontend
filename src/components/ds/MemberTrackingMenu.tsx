"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TRACKING_LABEL, trackingNavLinks } from "@/lib/solo/nav";

/**
 * "Tracking" on the member's full top bar: the member's own tools (Fasting,
 * Water, Progress, Daily list, Log) in one disclosure, so a member with a
 * gym or coach reaches them without the bar growing by five links. A button
 * that opens a list of links: click or Enter/Space opens it, Escape closes it
 * and returns focus to the button, a click outside or a link closes it.
 */
export function MemberTrackingMenu({ active, pathname }: { active: boolean; pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const here = pathname?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        // Tabbing out of the menu closes it.
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-(--r-2) px-2 py-1.5 text-[13.5px] hover:bg-[var(--bg-2)] hover:text-[var(--ink)] ${active ? "font-medium" : ""}`}
        style={{
          color: active || open ? "var(--ink)" : "var(--fg-2)",
          background: active ? "var(--bg-3)" : undefined,
          letterSpacing: "-0.005em",
        }}
        data-testid="nav-tracking"
      >
        {TRACKING_LABEL}
        <ChevronDown size={12} aria-hidden="true" style={{ color: "var(--fg-3)" }} />
      </button>
      {open && (
        <ul
          id={listId}
          className="absolute left-0 top-full z-50 mt-1.5 min-w-44 rounded-(--r-3) p-1.5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          {trackingNavLinks().map((link) => {
            const current = here === link.href || here.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center rounded-(--r-2) px-3 text-[14px] hover:bg-[var(--bg-2)] ${current ? "font-medium" : ""}`}
                  style={{ color: current ? "var(--ink)" : "var(--fg-2)" }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
