"use client";

import { useEffect, useRef, useState } from "react";
import { nutritionService, type FoodItem } from "@/lib/api/nutrition";
import { parseFoods } from "./_lib";

/**
 * Multi-select food input for a meal row. Searches the dietitian's own food
 * library (nutritionService.listFoods) as you type and lets you add any match,
 * while still allowing free-typed foods — so the plan is not gated on every
 * item existing in the library. Selected foods are stored as plain strings
 * (their names), matching the meal's `foods: string[]` shape; there is no
 * schema change and no reference is persisted.
 */
export function FoodPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (foods: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced library search. All state writes happen inside the timeout /
  // async callbacks (never synchronously in the effect body), and a stale
  // response is ignored via the `active` flag.
  useEffect(() => {
    let active = true;
    const q = query.trim();
    const handle = setTimeout(async () => {
      if (!q) {
        if (active) {
          setResults([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const res = await nutritionService.listFoods({ search: q, limit: 8 });
      if (!active) return;
      setResults(res.success && res.data ? res.data.items : []);
      setLoading(false);
    }, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selected = new Set(value.map((v) => v.toLowerCase()));
  const libOptions = results.filter((f) => !selected.has(f.name.toLowerCase()));
  const q = query.trim();
  const canAddFree = q.length > 0 && !selected.has(q.toLowerCase());
  // Combined navigable options: library matches, then the "add free text" row.
  const optionCount = libOptions.length + (canAddFree ? 1 : 0);
  // Results can shrink under the highlight as the query narrows; clamp so the
  // visible highlight and Enter always target a real option.
  const activeIndex = optionCount > 0 ? Math.min(highlight, optionCount - 1) : 0;

  const commit = (foods: string[]) => {
    const merged = [...value];
    for (const f of foods) {
      const name = f.trim();
      if (name && !merged.some((m) => m.toLowerCase() === name.toLowerCase())) {
        merged.push(name);
      }
    }
    if (merged.length !== value.length) onChange(merged);
    setQuery("");
    setResults([]);
    setHighlight(0);
  };

  const addLibrary = (food: FoodItem) => commit([food.name]);
  // Free text may be pasted comma-separated, so split it the same way the
  // legacy input did.
  const addFree = () => commit(parseFoods(query));

  const chooseHighlighted = () => {
    if (activeIndex < libOptions.length) addLibrary(libOptions[activeIndex]);
    else if (canAddFree) addFree();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(optionCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      // Always stop Enter from submitting the parent <form>: the food field is
      // a compound widget, so Enter means "add a food", never "create the plan".
      e.preventDefault();
      if (optionCount > 0) chooseHighlighted();
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      // Quick correction: backspace on an empty field drops the last chip.
      onChange(value.slice(0, -1));
    }
  };

  const activeStyle = { background: "var(--bg-2)" };

  return (
    <div ref={boxRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-(--r-2) px-2 py-1.5"
        style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
      >
        {value.map((food, i) => (
          <span
            key={`${food}-${i}`}
            className="inline-flex items-center gap-1 rounded-(--r-1) px-2 py-0.5 text-[12px]"
            style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}
          >
            {food}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${food}`}
              style={{ color: "var(--fg-3)", lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? "Add another…" : "Search your food library or type to add…"}
          className="flex-1 min-w-[10ch] bg-transparent text-[13px] outline-none"
          style={{ color: "var(--ink)" }}
        />
      </div>

      {open && (q.length > 0 || loading) && (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-(--r-2)"
          style={{
            border: "1px solid var(--border-2)",
            background: "var(--bg)",
            boxShadow: "0 12px 32px rgba(3,20,30,0.14)",
          }}
        >
          {loading && (
            <div className="px-3 py-2 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              Searching your library…
            </div>
          )}

          {!loading &&
            libOptions.map((f, idx) => (
              <button
                type="button"
                key={f._id}
                onClick={() => addLibrary(f)}
                onMouseEnter={() => setHighlight(idx)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                style={activeIndex === idx ? activeStyle : undefined}
              >
                <span className="text-[13px]" style={{ color: "var(--ink)" }}>{f.name}</span>
                <span className="shrink-0 text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                  {f.serving_label} · {f.calories_kcal} kcal
                </span>
              </button>
            ))}

          {!loading && canAddFree && (
            <button
              type="button"
              onClick={addFree}
              onMouseEnter={() => setHighlight(libOptions.length)}
              className="w-full px-3 py-2 text-left text-[13px]"
              style={{
                color: "var(--fg-2)",
                borderTop: libOptions.length ? "1px solid var(--border)" : undefined,
                ...(activeIndex === libOptions.length ? activeStyle : {}),
              }}
            >
              Add “{q}” as free text
            </button>
          )}

          {!loading && libOptions.length === 0 && !canAddFree && (
            <div className="px-3 py-2 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              No matches in your library.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
