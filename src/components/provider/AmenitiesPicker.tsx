"use client";

import { AMENITY_CATALOGUE } from "@/lib/constants/facility-catalogue";

/**
 * Toggle one amenity. The result keeps the catalogue's order, so switching
 * one off and on again reads as no change, and keeps any value the catalogue
 * doesn't know (set by an older client or the API) at the end, untouched.
 */
export function toggleAmenity(values: readonly string[], key: string): string[] {
  const set = new Set(values);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  const known = AMENITY_CATALOGUE.map((a) => a.key as string);
  return [
    ...known.filter((k) => set.has(k)),
    ...values.filter((v) => !known.includes(v) && set.has(v)),
  ];
}

/**
 * The gym's amenities as toggle chips (Wi-Fi, showers, parking...). Members
 * see them on the gym's listing and the Facilities page. Saved with the
 * listing's Save button.
 */
export function AmenitiesPicker({
  values,
  onChange,
  disabled,
}: {
  values: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Amenities">
      {AMENITY_CATALOGUE.map(({ key, label, icon: Icon }) => {
        const on = values.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(toggleAmenity(values, key))}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium disabled:opacity-60"
            style={{
              border: `1px solid ${on ? "var(--ink)" : "var(--border-2)"}`,
              background: on ? "var(--ink)" : "var(--bg)",
              color: on ? "var(--bg)" : "var(--fg-2)",
              cursor: disabled ? "default" : "pointer",
              transition: "background var(--motion-fast), color var(--motion-fast)",
            }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
