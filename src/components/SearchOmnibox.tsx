"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  searchService,
  UnifiedSearchItemKind,
  type UnifiedSearchItem,
  type UnifiedSearchResult,
} from "@/lib/api/search";

function kindIcon(kind: UnifiedSearchItemKind): string {
  switch (kind) {
    case UnifiedSearchItemKind.LISTING:
      return "\uD83C\uDFF9"; // 🏋️
    case UnifiedSearchItemKind.BOOKING:
      return "\uD83D\uDCC5"; // 📅
    case UnifiedSearchItemKind.ORGANIZATION:
      return "\uD83C\uDFE2"; // 🏢
    case UnifiedSearchItemKind.PLAN:
      return "\uD83D\uDCCB"; // 📋
    default:
      return "•";
  }
}

function sectionTitle(key: string): string {
  switch (key) {
    case "marketplace":
      return "Marketplace";
    case "bookings":
      return "Bookings";
    case "teams":
      return "Teams";
    case "plans":
      return "Plans";
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

export function SearchOmnibox({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef<string>("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function runSearch(q: string) {
    if (q.length < 2) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    latestQueryRef.current = q;

    const capturedQuery = q;

    searchService
      .unifiedSearch({ q: capturedQuery, limit: 5 })
      .then((res) => {
        if (latestQueryRef.current !== capturedQuery) return; // stale
        if (res.success && res.data) {
          setResult(res.data);
        }
      })
      .catch(() => {
        // fail silently
      })
      .finally(() => {
        if (latestQueryRef.current === capturedQuery) {
          setIsLoading(false);
        }
      });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(val.trim());
    }, 320);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function clearAndClose() {
    setQuery("");
    setResult(null);
    setIsOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  const allResults = useMemo<Array<{ section: string; items: UnifiedSearchItem[] }>>(
    () => {
      if (!result) return [];
      return Object.entries(result.sections)
        .filter(([, items]) => items.length > 0)
        .map(([section, items]) => ({ section, items }));
    },
    [result],
  );

  const totalResults = useMemo(
    () => allResults.reduce((sum, s) => sum + s.items.length, 0),
    [allResults],
  );

  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="flex items-center gap-2 rounded-(--r-2) border px-3 py-2"
        style={{
          borderColor: isOpen ? "var(--ink)" : "var(--border)",
          background: "var(--bg-2)",
        }}
      >
        <svg
          className="shrink-0"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          style={{ color: "var(--fg-4)" }}
        >
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          autoComplete="off"
          className="flex-1 min-w-0 text-sm bg-transparent outline-none"
          style={{ color: "var(--ink)" }}
        />
        {query && (
          <button
            type="button"
            onClick={clearAndClose}
            className="text-xs shrink-0"
            style={{ color: "var(--fg-4)", cursor: "pointer", background: "none", border: "none" }}
          >
            &times;
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-(--r-3) z-50 overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            minWidth: "300px",
          }}
        >
          {isLoading && totalResults === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--fg-3)" }}>
              Searching...
            </div>
          ) : !isLoading && totalResults === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--fg-3)" }}>
              No results for &quot;{query.trim()}&quot;
            </div>
          ) : (
            <div className="py-2">
              {allResults.map(({ section, items }) => (
                <div key={section}>
                  <div
                    className="px-4 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-4)" }}
                  >
                    {sectionTitle(section)}
                  </div>
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.action_url}
                      onClick={clearAndClose}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-[var(--bg-2)]"
                      style={{ textDecoration: "none" }}
                    >
                      <span className="text-base shrink-0">{kindIcon(item.kind)}</span>
                      <div className="min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--ink)" }}
                        >
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div
                            className="text-xs truncate"
                            style={{ color: "var(--fg-3)" }}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
              <div
                className="px-4 py-2 text-xs"
                style={{ color: "var(--fg-4)", borderTop: "1px solid var(--border)" }}
              >
                {totalResults} result{totalResults !== 1 ? "s" : ""} &middot; Press Esc to close
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchOmnibox;
