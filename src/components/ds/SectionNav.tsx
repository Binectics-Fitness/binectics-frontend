/**
 * SectionNav — sticky section navigation with completion checkmarks.
 *
 * From profile-edit.html:
 *   Sticky top: 80px. 13px links, r-2 radius, 7px 10px padding.
 *   Active: ink left border (2px), bg background, ink text, 500 weight.
 *   Complete: signal green circle with checkmark.
 *   Warn: amber circle (no checkmark).
 */
"use client";

interface SectionNavItem {
  id: string;
  label: string;
  status?: "incomplete" | "complete" | "warn";
}

interface SectionNavProps {
  items: SectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function SectionNav({ items, activeId, onSelect, className = "" }: SectionNavProps) {
  return (
    <nav className={`sticky top-20 flex flex-col gap-0.5 ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex items-center justify-between rounded-(--r-2) cursor-pointer text-left"
            style={{
              padding: isActive ? "7px 10px 7px 8px" : "7px 10px",
              fontSize: "13px",
              color: isActive ? "var(--ink)" : "var(--fg-3)",
              background: isActive ? "var(--bg)" : "transparent",
              fontWeight: isActive ? 500 : 400,
              borderLeft: isActive ? "2px solid var(--ink)" : "2px solid transparent",
              transition: "color var(--motion-fast), background var(--motion-fast)",
            }}
          >
            <span>{item.label}</span>
            <span
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: item.status === "complete" ? "var(--signal)"
                  : item.status === "warn" ? "var(--warn)"
                  : "var(--bg-3)",
                color: item.status === "complete" ? "var(--bg)" : "transparent",
              }}
            >
              {item.status === "complete" && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
