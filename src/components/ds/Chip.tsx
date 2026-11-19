"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { restingIcon, selectedFill, selectedLabel, type Category } from "@/lib/ui/categories";

/**
 * Chip: one option among several, 44px tall and fully round (10-System).
 * The member pages' `.pill` promoted into the design system.
 *
 *  - Selected without a category: the ink pill, paper label (Sep 29 ruling).
 *  - Selected with a category: the category's accent, an ink label and a
 *    check (colour by meaning, 19 Nov 2026), so selection never rests on
 *    colour alone. Unselected, the icon takes the category's ink.
 *  - With an icon, selecting swaps the icon for the check (no width change).
 *
 * Mirrors binectics-mobile src/components/ui/Chip.tsx. Use FilterPill for the
 * dense filter bars on provider and admin tables, not this.
 */
export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  category?: Category | null;
  icon?: LucideIcon;
  disabled?: boolean;
  /** What a screen reader says when the label alone is terse ("16 h"). */
  ariaLabel?: string;
  className?: string;
  /** Set by ChipGroup so it can measure the chip. */
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export function Chip({ label, selected, onClick, category = null, icon: Icon, disabled, ariaLabel, className = "", buttonRef }: ChipProps) {
  const on = selected === true;
  const style = {
    "--chip-fill": selectedFill(category),
    "--chip-label": selectedLabel(category),
    "--chip-icon": restingIcon(category),
  } as CSSProperties;
  // A check whenever a selected chip has an icon to swap, or a category to
  // explain: the fill alone must not be the only cue.
  const showCheck = on && (Icon !== undefined || category !== null);
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`bx-chip ${className}`}
      data-on={on}
      data-category={category ?? undefined}
      aria-pressed={selected === undefined ? undefined : on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {showCheck ? (
        <span className="bx-chip-icon bx-chip-check" data-testid="chip-check">
          <Check size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      ) : Icon ? (
        <span className="bx-chip-icon">
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
      ) : null}
      {label}
    </button>
  );
}

export interface ChipOption<V extends string> {
  value: V;
  label: string;
  category?: Category | null;
  icon?: LucideIcon;
  ariaLabel?: string;
}

/**
 * One-of-several chips whose selection is ONE pill that slides to the new
 * chip (transform, 220ms out-expo, no overshoot) and crossfades to its
 * colour. Chips wrap, so the pill moves in x and y. Reduced motion: it
 * jumps. Until the chips are measured (server render, tests) each chip
 * paints its own fill, so the first frame looks the same.
 *
 * Mirrors binectics-mobile src/components/ui/ChipGroup.tsx.
 */
export function ChipGroup<V extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
  className = "",
}: {
  options: readonly ChipOption<V>[];
  /** null: nothing chosen yet. */
  value: V | null;
  onChange: (value: V) => void;
  /** The group's accessible name ("Which target"). */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const chips = useRef(new Map<string, HTMLButtonElement>());
  const plates = useRef(new Map<string, HTMLSpanElement>());
  // Which option the pill sits on (null: none yet): it slides only from a chip.
  const placedOn = useRef<string | null>(null);
  const fill = selectedFill(options.find((o) => o.value === value)?.category);

  const place = useCallback(
    (animate: boolean) => {
      const box = wrap.current;
      const p = pill.current;
      if (!box || !p) return;
      for (const [key, el] of chips.current) {
        const plate = plates.current.get(key);
        if (!plate) continue;
        plate.style.width = `${el.offsetWidth}px`;
        plate.style.height = `${el.offsetHeight}px`;
        plate.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
      }
      const el = value === null ? undefined : chips.current.get(value);
      if (!el) {
        p.style.opacity = "0";
        placedOn.current = null;
      } else {
        p.dataset.instant = String(!animate || placedOn.current === null);
        p.style.width = `${el.offsetWidth}px`;
        p.style.height = `${el.offsetHeight}px`;
        p.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
        p.style.backgroundColor = fill;
        p.style.opacity = "1";
        placedOn.current = value;
      }
      box.dataset.slide = "on";
    },
    [value, fill],
  );

  // The latest `place` for the resize observer, which lives for the whole
  // mount: re-subscribing on each selection would fire its first callback and
  // snap a slide that has only just started.
  const latest = useRef(place);

  // Before paint: a new selection slides, the first one appears in place.
  useLayoutEffect(() => {
    latest.current = place;
    place(true);
  }, [place]);

  // A re-layout (width, font size, wrapping) moves everything without sliding.
  useEffect(() => {
    const box = wrap.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    let first = true;
    const ro = new ResizeObserver(() => {
      // The first callback reports the size we already placed against.
      if (first) {
        first = false;
        return;
      }
      latest.current(false);
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className={`bx-chips ${className}`} role="group" aria-label={label}>
      {options.map((o) => (
        <span
          key={`plate-${o.value}`}
          aria-hidden="true"
          className="bx-chip-plate"
          ref={(el) => {
            if (el) plates.current.set(o.value, el);
            else plates.current.delete(o.value);
          }}
        />
      ))}
      <span ref={pill} aria-hidden="true" className="bx-chip-pill" data-instant="true" data-testid="chip-pill" />
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          selected={o.value === value}
          category={o.category}
          icon={o.icon}
          ariaLabel={o.ariaLabel}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          buttonRef={(el) => {
            if (el) chips.current.set(o.value, el);
            else chips.current.delete(o.value);
          }}
        />
      ))}
    </div>
  );
}
