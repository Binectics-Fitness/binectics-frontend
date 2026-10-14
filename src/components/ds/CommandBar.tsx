"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCommandBar } from "@/hooks/useCommandBar";
import { UnifiedSearchSection } from "@/lib/api/search";
import { useUnifiedSearch } from "@/lib/queries/search";
import { useAuth } from "@/contexts/AuthContext";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { useShellNav, type ShellNavEntry } from "@/hooks/useShellNav";
import {
  HELP_COMMANDS,
  accountCommands,
  actionCommandsFor,
  defaultNavigationCommands,
  type CommandItem,
} from "@/lib/constants/commands";

function CmdIcon({ d, node }: { d: string; node?: ReactNode }) {
  return (
    <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 5, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--ink)" }}>
      {node ?? (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      )}
    </div>
  );
}

/** A shell sidebar item as a command; its badge count shows as the meta. */
function shellCommand(entry: ShellNavEntry): CommandItem {
  return {
    id: `nav:${entry.href}:${entry.name}`,
    label: entry.name,
    section: "navigation",
    href: entry.href,
    meta: entry.badge,
    icon: "",
    iconNode: entry.icon,
  };
}

/**
 * What the bar offers this person: the sidebar of the dashboard on screen
 * (so only places their role and workspace give them), or a few role-wide
 * destinations off-dashboard; actions for their role; and help.
 */
export function useCommandList(): CommandItem[] {
  const { user } = useAuth();
  const shellNav = useShellNav();
  const gymTrainer = Boolean(useCoachingGym());
  const role = user?.role;
  return useMemo(() => {
    let nav: CommandItem[];
    if (shellNav && user) {
      const fromShell = shellNav.map(shellCommand);
      const hrefs = new Set(fromShell.map((c) => c.href));
      nav = [...fromShell, ...accountCommands().filter((c) => !hrefs.has(c.href))];
    } else {
      nav = defaultNavigationCommands(role);
    }
    return [...nav, ...actionCommandsFor(role, { gymTrainer }), ...HELP_COMMANDS];
  }, [shellNav, user, role, gymTrainer]);
}

function toSearchCommands(
  prefix: string,
  items: unknown[],
  fallbackMeta: string,
  icon: string,
): CommandItem[] {
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as {
      id?: unknown;
      title?: unknown;
      subtitle?: unknown;
      action_url?: unknown;
    };

    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const label =
      typeof candidate.title === "string" ? candidate.title.trim() : "";
    const href =
      typeof candidate.action_url === "string"
        ? candidate.action_url.trim()
        : "";

    if (!id || !label || !href) return [];

    return [
      {
        id: `${prefix}-${id}`,
        label,
        section: "navigation",
        href,
        meta:
          typeof candidate.subtitle === "string" && candidate.subtitle.trim()
            ? candidate.subtitle
            : fallbackMeta,
        icon,
      },
    ];
  });
}

export function CommandBar() {
  const { open, close } = useCommandBar();
  const { user } = useAuth();
  const allCommands = useCommandList();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  // Starts mounted when the bar is already open on first render.
  const [shouldRender, setShouldRender] = useState(open);
  const normalizedQuery = query.trim();
  const hasAuthToken = !!user;

  const unifiedSearch = useUnifiedSearch(
    {
      q: normalizedQuery,
      limit: 5,
    },
    hasAuthToken && open && normalizedQuery.length >= 2,
  );

  // Opening mounts the bar, then fades it in on the next frame. Closing
  // fades it out, then unmounts it and clears the query, so the next open
  // starts empty. Every update runs in a frame or timer callback, never
  // synchronously in the effect body.
  useEffect(() => {
    if (open) {
      let fadeIn = 0;
      const mount = requestAnimationFrame(() => {
        setShouldRender(true);
        fadeIn = requestAnimationFrame(() => setIsAnimating(true));
      });
      return () => {
        cancelAnimationFrame(mount);
        cancelAnimationFrame(fadeIn);
      };
    }
    const fadeOut = requestAnimationFrame(() => setIsAnimating(false));
    const unmount = setTimeout(() => {
      setShouldRender(false);
      setQuery("");
      setActiveIndex(0);
    }, 220);
    return () => {
      cancelAnimationFrame(fadeOut);
      clearTimeout(unmount);
    };
  }, [open]);

  useEffect(() => {
    if (open && shouldRender && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, shouldRender]);

  const staticFiltered = query
    ? allCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  const marketplaceItems: CommandItem[] =
    normalizedQuery.length >= 2
      ? toSearchCommands(
          "marketplace",
          unifiedSearch.data?.sections?.[UnifiedSearchSection.MARKETPLACE] ?? [],
          "listing",
          "M3 7h18M3 12h18M3 17h18",
        )
      : [];

  const bookingItems: CommandItem[] =
    normalizedQuery.length >= 2
      ? toSearchCommands(
          "booking",
          unifiedSearch.data?.sections?.[UnifiedSearchSection.BOOKINGS] ?? [],
          "booking",
          "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
        )
      : [];

  const teamItems: CommandItem[] =
    normalizedQuery.length >= 2
      ? toSearchCommands(
          "team",
          unifiedSearch.data?.sections?.[UnifiedSearchSection.TEAMS] ?? [],
          "team",
          "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 7a4 4 0 1 0 0-.01M20 8v6M23 11h-6",
        )
      : [];

  const planItems: CommandItem[] =
    normalizedQuery.length >= 2
      ? toSearchCommands(
          "plan",
          unifiedSearch.data?.sections?.[UnifiedSearchSection.PLANS] ?? [],
          "plan",
          "M20 6L9 17l-5-5",
        )
      : [];

  const searchItems = [
    ...marketplaceItems,
    ...bookingItems,
    ...teamItems,
    ...planItems,
  ];

  const filtered = [...searchItems, ...staticFiltered];

  const handleSelect = useCallback(
    (item: CommandItem) => {
      close();
      router.push(item.href);
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

  const navItems = filtered.filter(
    (c) =>
      c.section === "navigation" &&
      !/^(marketplace|booking|team|plan)-/.test(c.id),
  );
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
              <CmdIcon d={item.icon} node={item.iconNode} />
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
            aria-label="Search, jump to a page or run an action"
            style={{ flex: 1, border: 0, background: "transparent", font: "inherit", fontSize: 15, color: "var(--ink)", outline: "none" }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 4, color: "var(--fg-3)" }}>esc</span>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", padding: "6px 0 10px" }}>
          {normalizedQuery.length >= 2 && unifiedSearch.isLoading && (
            <div style={{ padding: "10px 18px", fontSize: "12.5px", color: "var(--fg-3)" }}>
              Searching...
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", fontSize: "13.5px", color: "var(--fg-3)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {marketplaceItems.length > 0 && renderGroup("Marketplace", marketplaceItems)}
              {bookingItems.length > 0 && renderGroup("Bookings", bookingItems)}
              {teamItems.length > 0 && renderGroup("Teams", teamItems)}
              {planItems.length > 0 && renderGroup("Plans", planItems)}
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
