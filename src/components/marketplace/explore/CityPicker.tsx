"use client";

import { useEffect, useId, useState } from "react";
import { searchCities, type CityResult } from "@/lib/marketplace/explorePlace";
import type { PickedCity } from "@/lib/marketplace/exploreFilters";

const DEBOUNCE_MS = 300;

/**
 * "A city": a search over GET /utility/cities, the same city table the API
 * places listings with, so a picked city's point is exactly where listings
 * typed with that city sit.
 */
export function CityPicker({ onPick, countryHint }: { onPick: (c: PickedCity) => void; countryHint?: string | null }) {
  const inputId = useId();
  const listId = useId();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<CityResult[]>([]);
  const [state, setState] = useState<"idle" | "searching" | "done" | "failed">("idle");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      setState("searching");
      searchCities(q, { limit: 8 })
        .then((r) => {
          if (!live) return;
          // The member's own country first, then the API's order.
          const own = countryHint ? r.filter((c) => c.countryCode === countryHint) : [];
          setRows([...own, ...r.filter((c) => !own.includes(c))]);
          setState("done");
        })
        .catch(() => {
          if (live) setState("failed");
        });
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [text, nonce, countryHint]);

  const q = text.trim();
  const showResults = q.length >= 2;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="sr-only">Search a city</label>
      <input
        id={inputId}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search a city"
        autoComplete="off"
        aria-controls={listId}
        className="h-11 w-full px-3 rounded-(--r-2) border border-border-2 bg-bg text-[14px]"
        style={{ color: "var(--ink)" }}
      />
      <div id={listId} aria-live="polite">
        {showResults && state === "searching" && <p className="text-[13px] py-1.5" style={{ color: "var(--fg-3)" }}>Searching…</p>}
        {showResults && state === "failed" && (
          <p className="text-[13px] py-1.5" style={{ color: "var(--danger-ink)" }}>
            Couldn&apos;t search cities.{" "}
            <button type="button" className="underline min-h-11" onClick={() => setNonce((n) => n + 1)}>Try again</button>
          </p>
        )}
        {showResults && state === "done" && rows.length === 0 && (
          <p className="text-[13px] py-1.5" style={{ color: "var(--fg-3)" }}>No city starts with &ldquo;{q}&rdquo;</p>
        )}
        {showResults && state === "done" && rows.length > 0 && (
          <ul className="flex flex-col border border-border rounded-(--r-2) overflow-hidden list-none p-0 m-0">
            {rows.map((c) => (
              <li key={`${c.name}|${c.stateName}|${c.countryCode}|${c.lat}`} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  className="w-full min-h-11 px-3 py-2 text-left text-[13.5px] hover:bg-bg-2"
                  style={{ color: "var(--ink)" }}
                  onClick={() => onPick({ name: c.name, countryCode: c.countryCode, lat: c.lat, lng: c.lng })}
                >
                  {c.name}
                  <span style={{ color: "var(--fg-3)" }}>
                    {" "}· {[c.stateName, c.countryName ?? c.countryCode].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
