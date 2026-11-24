"use client";

import { useId, type ReactNode } from "react";
import { Chip } from "@/components/ds/Chip";
import { Toggle } from "@/components/ds/Toggle";
import {
  RADIUS_STEPS_KM,
  RATING_OPTIONS,
  SORT_OPTIONS,
  hasNarrowingFilters,
  clearFilters,
  type ExploreFilters,
  type ExploreSort,
  type PickedCity,
} from "@/lib/marketplace/exploreFilters";
import { LOCATION_PURPOSE, fallbackNotice, type ResolvedPlace } from "@/lib/marketplace/explorePlace";
import { DIETITIAN_POPULATIONS, DIETITIAN_SPECIALIZATIONS, toggleCode } from "@/lib/credentials/dietitian";
import type { GeoStatus } from "./useExplorePlace";
import { CityPicker } from "./CityPicker";

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <div className="py-4 border-b border-border last:border-b-0" role="group" aria-labelledby={id}>
      <h3 id={id} className="font-mono text-[11px] uppercase tracking-[0.06em] font-normal mb-2.5" style={{ color: "var(--fg-3)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" }) {
  return (
    <p className="text-[13px] mt-2 leading-snug" style={{ color: tone === "warn" ? "var(--fg-2)" : "var(--fg-3)" }}>
      {children}
    </p>
  );
}

/**
 * The Filters rail (desktop) and sheet (phone width): the same controls as
 * mobile's Filters sheet (board explore-canvas A2 / 06-Web-adaptation W1).
 * Every change applies at once and lands in the URL.
 */
export function ExploreFiltersPanel({
  filters,
  onChange,
  picked,
  onPick,
  place,
  near,
  geo,
  onNearMe,
  onSortNearest,
  countryHint,
  cityMode,
  onCityMode,
}: {
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  picked: PickedCity | null;
  onPick: (c: PickedCity | null) => void;
  /** The place in use. */
  place: ResolvedPlace;
  /** Where "Near me" points. */
  near: ResolvedPlace;
  geo: GeoStatus;
  onNearMe: () => void;
  onSortNearest: () => void;
  countryHint?: string | null;
  /** "A city" is open (lifted so the empty state's "Search another city" can open it). */
  cityMode: boolean;
  onCityMode: (on: boolean) => void;
}) {
  const ids = useId();
  const setCityMode = onCityMode;
  const showCity = cityMode || !!picked;
  const hasCoords = !!place.place.coords;
  const set = (patch: Partial<ExploreFilters>) => onChange({ ...filters, ...patch, page: 1 });

  const geoFailed = geo === "denied" || geo === "unavailable" || geo === "unsupported";
  let nearNote: ReactNode;
  if (geo === "asking") nearNote = <Note>Asking for your location…</Note>;
  else if (near.source === "gps") nearNote = <Note>From where you are now.</Note>;
  else if (geoFailed) nearNote = <Note tone="warn">{fallbackNotice(geo, near)}</Note>;
  else
    nearNote = (
      <>
        {near.source === "profile" && near.shown && <Note>From your profile city, {near.shown}.</Note>}
        {near.source === "country" && near.shown && <Note>From your profile country, {near.shown}.</Note>}
        <Note>
          <button type="button" className="underline underline-offset-2 min-h-11 text-left" style={{ color: "var(--ink)" }} onClick={onNearMe}>
            Use my location
          </button>
          <span className="block">{LOCATION_PURPOSE}</span>
        </Note>
      </>
    );

  return (
    <div className="flex flex-col">
      <Section title="Where" id={`${ids}-where`}>
        <div className="flex gap-2 flex-wrap">
          <Chip
            label="Near me"
            selected={!showCity}
            onClick={() => {
              setCityMode(false);
              onPick(null);
              if (near.source !== "gps" && geo !== "asking") onNearMe();
            }}
          />
          <Chip label="A city" selected={showCity} onClick={() => setCityMode(true)} />
        </div>
        {showCity ? (
          picked ? (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-[14px]" style={{ color: "var(--ink)" }}>{picked.name}, {picked.countryCode}</span>
              <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={() => { onPick(null); setCityMode(true); }}>
                Change
              </button>
            </div>
          ) : (
            <div className="mt-2.5">
              <CityPicker
                countryHint={countryHint}
                onPick={(c) => {
                  onPick(c);
                  setCityMode(false);
                }}
              />
            </div>
          )
        ) : (
          nearNote
        )}
      </Section>

      <Section title="Distance" id={`${ids}-distance`}>
        <div className="flex gap-2 flex-wrap">
          {RADIUS_STEPS_KM.map((km) => (
            <Chip key={km} label={`${km} km`} selected={hasCoords && filters.radiusKm === km} disabled={!hasCoords} onClick={() => set({ radiusKm: km })} />
          ))}
        </div>
        {!hasCoords && <Note>Needs your location or a city.</Note>}
      </Section>

      <Section title="Sort by" id={`${ids}-sort`}>
        <div role="radiogroup" aria-labelledby={`${ids}-sort`} className="flex flex-col">
          {SORT_OPTIONS.map((o) => {
            const on = filters.sort === o.value;
            return (
              <label key={o.value} className="flex items-center justify-between min-h-11 text-[14px] cursor-pointer" style={{ color: "var(--ink)" }}>
                {o.label}
                <input
                  type="radio"
                  name={`${ids}-sort-radio`}
                  value={o.value}
                  checked={on}
                  onChange={() => {
                    set({ sort: o.value as ExploreSort });
                    if (o.value === "default" && !hasCoords) onSortNearest();
                  }}
                  className="w-4.5 h-4.5"
                  style={{ accentColor: "var(--ink)" }}
                />
              </label>
            );
          })}
        </div>
        {filters.sort === "default" && !hasCoords && <Note>Top rated until Explore has your location or a city.</Note>}
      </Section>

      <Section title="Rating" id={`${ids}-rating`}>
        <div className="flex gap-2 flex-wrap">
          {RATING_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              ariaLabel={o.value ? `Rated ${o.value} and up` : "Any rating"}
              selected={filters.minRating === o.value}
              onClick={() => set({ minRating: o.value })}
            />
          ))}
        </div>
      </Section>

      <div className="py-2 border-b border-border">
        {[
          { label: "Accepting new clients", on: filters.acceptingOnly, key: "acceptingOnly" as const },
          { label: "Verified only", on: filters.verifiedOnly, key: "verifiedOnly" as const },
        ].map((t) => (
          <div key={t.key} className="flex items-center justify-between min-h-11 text-[14px]" style={{ color: "var(--ink)" }}>
            <span aria-hidden="true">{t.label}</span>
            <Toggle label={t.label} on={t.on} onChange={(v) => set({ [t.key]: v })} />
          </div>
        ))}
      </div>

      {filters.type === "dietitian" &&
        [
          { title: "Specialities", options: DIETITIAN_SPECIALIZATIONS, selected: filters.specs, key: "specs" as const },
          { title: "Works with", options: DIETITIAN_POPULATIONS, selected: filters.pops, key: "pops" as const },
        ].map((g) => (
          <Section key={g.key} title={g.title} id={`${ids}-${g.key}`}>
            <div className="flex gap-2 flex-wrap">
              {g.options.map((o) => (
                <Chip key={o.code} label={o.label} selected={g.selected.includes(o.code)} onClick={() => set({ [g.key]: toggleCode(g.selected, o.code) })} />
              ))}
            </div>
          </Section>
        ))}

      {hasNarrowingFilters(filters, hasCoords) && (
        <div className="pt-4">
          <button type="button" className="btn-ghost-v2 w-full" style={{ height: 44 }} onClick={() => onChange({ ...clearFilters(filters), page: 1 })}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
