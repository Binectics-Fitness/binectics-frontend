"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useId, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useRegion } from "@/contexts/RegionContext";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { Drawer } from "@/components/ds/Drawer";
import { MarketplaceAuthCluster } from "@/components/MarketplaceAuthCluster";
import {
  TYPE_TABS,
  applyEmptyAction,
  buildListingParams,
  countLabel,
  distanceLabel,
  emptyActions,
  emptyCopy,
  exploreQueryString,
  hasNarrowingFilters,
  parseExploreQuery,
  resultsCaption,
  sortCaption,
  typeNoun,
  type ExploreFilters,
  type PickedCity,
} from "@/lib/marketplace/exploreFilters";
import { sourceNote } from "@/lib/marketplace/explorePlace";
import { ExploreCard } from "@/components/marketplace/explore/ExploreCard";
import { ExploreFiltersPanel } from "@/components/marketplace/explore/ExploreFiltersPanel";
import { useExploreList } from "@/components/marketplace/explore/useExploreList";
import { useExplorePlace } from "@/components/marketplace/explore/useExplorePlace";

const SEARCH_DEBOUNCE_MS = 400;

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * Explore (web): list-first, the same filters, search, sort and API query
 * as mobile Explore (#250, #253, #256), laid out as the board's left rail
 * (binectics-plans/design/explore-canvas 06-Web-adaptation). The state
 * lives in the URL so a search can be shared or bookmarked.
 */
function Explore() {
  const router = useRouter();
  const sp = useSearchParams();
  const spKey = sp.toString();
  const { filters, picked } = useMemo(() => parseExploreQuery(new URLSearchParams(spKey)), [spKey]);
  const { currency } = useRegion();
  const place = useExplorePlace(picked);
  const params = buildListingParams(filters, place.place, currency);
  const list = useExploreList(params, place.ready);

  const [cityMode, setCityMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchId = useId();

  const replace = useCallback(
    (next: ExploreFilters, nextPicked: PickedCity | null) => {
      const qs = exploreQueryString(next, nextPicked);
      router.replace(qs ? `/marketplace?${qs}` : "/marketplace", { scroll: false });
    },
    [router],
  );
  const setFilters = (next: ExploreFilters) => replace(next, picked);
  const setPicked = (c: PickedCity | null) => replace({ ...filters, page: 1 }, c);

  // The search box: typed text applies after a pause; the URL's own text
  // (a shared link, "Clear search") wins whenever it changes.
  const [text, setText] = useState(filters.query);
  const [urlQuery, setUrlQuery] = useState(filters.query);
  if (urlQuery !== filters.query) {
    setUrlQuery(filters.query);
    setText(filters.query);
  }
  useEffect(() => {
    if (text.trim() === filters.query.trim()) return;
    const t = setTimeout(() => replace({ ...filters, query: text, page: 1 }, picked), text.trim() ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [text, filters, picked, replace]);

  const askNear = () => void place.ask();
  const onSortNearest = () => {
    // Nearest needs a point: ask for the browser's position unless a city
    // (picked or the profile city) already gives one.
    if (!picked && place.near.source !== "gps" && place.geo !== "asking") void place.ask();
  };

  const hasCoords = !!place.place.coords;
  const narrowed = hasNarrowingFilters(filters, hasCoords);
  const noun = typeNoun(filters.type);
  const note = sourceNote(place.source);
  const ready = list.status === "ready";

  const openCityPicker = () => {
    setCityMode(true);
    if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 1023px)").matches) setDrawerOpen(true);
  };

  const panel = (
    <ExploreFiltersPanel
      filters={filters}
      onChange={setFilters}
      picked={picked}
      onPick={setPicked}
      place={place}
      near={place.near}
      geo={place.geo}
      onNearMe={askNear}
      onSortNearest={onSortNearest}
      countryHint={place.near.place.country}
      cityMode={cityMode}
      onCityMode={setCityMode}
    />
  );

  const goToPage = (n: number) => {
    setFilters({ ...filters, page: n });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const empty = emptyCopy(filters, place.name, hasCoords);

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* ═══ TOPBAR ═══ */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-360 flex items-center justify-between h-14 sm:h-16 px-4 sm:px-10 gap-4 sm:gap-6">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="hidden md:flex gap-0.5" aria-label="Main">
            {[
              { href: "/", label: "Home", active: false },
              { href: "/marketplace", label: "Marketplace", active: true },
              { href: "/pricing", label: "Pricing", active: false },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={`px-3 py-2 rounded-(--r-2) text-[13.5px] ${l.active ? "bg-bg-2" : "hover:bg-bg-2"}`}
                style={{ color: l.active ? "var(--ink)" : "var(--fg-2)" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <MarketplaceAuthCluster signupHref="/login?mode=signup&role=member" />
          </div>
        </div>
      </header>

      {/* ═══ HEAD ═══ */}
      <section className="mx-auto max-w-360 px-4 sm:px-10 pt-8 sm:pt-12 pb-4">
        <div className="eyebrow mb-2" data-testid="explore-place">
          {place.shown ?? "All places"}
          {note && place.shown ? ` · ${note}` : ""}
        </div>
        <h1 className="text-[32px] sm:text-[40px] font-medium leading-none" style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}>
          Explore
        </h1>
        <form
          role="search"
          className="mt-5 flex items-center gap-2.5 h-11 px-3.5 border border-border-2 rounded-(--r-2) bg-bg focus-within:border-ink"
          onSubmit={(e) => {
            e.preventDefault();
            replace({ ...filters, query: text, page: 1 }, picked);
          }}
        >
          <label htmlFor={searchId} className="sr-only">Search providers</label>
          <span style={{ color: "var(--fg-3)" }}><SearchIcon /></span>
          <input
            id={searchId}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by name or specialty"
            maxLength={100}
            className="flex-1 min-w-0 h-full bg-transparent text-[14px] outline-none"
            style={{ color: "var(--ink)" }}
          />
        </form>
      </section>

      {/* ═══ TYPE TABS ═══ */}
      <div className="mx-auto max-w-360 px-4 sm:px-10">
        <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Provider type">
          {TYPE_TABS.map((t) => {
            const on = filters.type === t.value;
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={on}
                onClick={() => setFilters({ ...filters, type: t.value, page: 1, specs: [], pops: [] })}
                className={`min-h-11 px-3.5 text-[14px] -mb-px shrink-0 ${on ? "border-b-[1.5px] border-ink font-medium" : ""}`}
                style={{ color: on ? "var(--ink)" : "var(--fg-2)" }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═══ LAYOUT ═══ */}
      <div className="mx-auto max-w-360 px-4 sm:px-10 pt-5 pb-20 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
        <aside className="hidden lg:block sticky top-4" aria-label="Filters">
          {panel}
        </aside>

        <div className="min-w-0">
          <div className="lg:hidden mb-4">
            <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={() => setDrawerOpen(true)} aria-haspopup="dialog">
              Filters{narrowed ? " · on" : ""}
            </button>
          </div>

          <div className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1 mb-4">
            <h2 className="font-mono text-[11.5px] uppercase tracking-[0.06em] font-normal" style={{ color: "var(--fg-3)" }} aria-live="polite">
              {ready && list.total !== null ? resultsCaption(list.total, filters, place.place, place.name) : list.status === "failed" ? "" : "Looking…"}
            </h2>
            {ready && (list.total ?? 0) > 0 && (
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>{sortCaption(filters, place.place)}</span>
            )}
          </div>

          {list.status === "loading" ? (
            <AsyncSpinner size="page" label="Loading providers" />
          ) : list.status === "failed" ? (
            <div className="border border-border rounded-(--r-3) px-6 py-10">
              <EmptySlate
                mt="mt-0"
                message="Couldn't load providers"
                hint="Check your connection. Your filters are kept."
                action={
                  <button type="button" className="btn-primary-v2 mx-auto" style={{ height: 44 }} onClick={list.retry}>
                    Try again
                  </button>
                }
              />
            </div>
          ) : list.items.length === 0 ? (
            <div className="border border-border rounded-(--r-3) px-6 py-10">
              <EmptySlate
                mt="mt-0"
                message={empty.title}
                hint={empty.description}
                action={emptyActions(filters, hasCoords).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="btn-ghost-v2"
                    style={{ height: 44 }}
                    onClick={() => (a.id === "pick-city" ? openCityPicker() : setFilters(applyEmptyAction(filters, a.id)))}
                  >
                    {a.label}
                  </button>
                ))}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {list.items.map((l) => (
                <ExploreCard key={l._id} l={l} distance={distanceLabel(l.distance_km, place.origin, l)} />
              ))}
            </div>
          )}

          {ready && list.totalPages > 1 && (
            <nav className="flex justify-center items-center gap-1 mt-8" aria-label="Pages">
              <button
                type="button"
                onClick={() => goToPage(Math.max(1, filters.page - 1))}
                disabled={filters.page <= 1}
                aria-label="Previous page"
                className="w-11 h-11 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono disabled:opacity-30"
                style={{ color: "var(--fg-2)" }}
              >‹</button>
              {Array.from({ length: Math.min(5, list.totalPages) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-current={filters.page === n ? "page" : undefined}
                  className={`w-11 h-11 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono ${filters.page === n ? "bg-ink text-bg" : "hover:bg-bg-2"}`}
                  style={{ color: filters.page === n ? "var(--bg)" : "var(--fg-2)" }}
                >{n}</button>
              ))}
              {list.totalPages > 5 && (
                <>
                  <span className="font-mono text-[13px] px-1" style={{ color: "var(--fg-4)" }}>…</span>
                  <button
                    type="button"
                    onClick={() => goToPage(list.totalPages)}
                    aria-current={filters.page === list.totalPages ? "page" : undefined}
                    className={`w-11 h-11 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono ${filters.page === list.totalPages ? "bg-ink text-bg" : "hover:bg-bg-2"}`}
                    style={{ color: filters.page === list.totalPages ? "var(--bg)" : "var(--fg-2)" }}
                  >{list.totalPages}</button>
                </>
              )}
              <button
                type="button"
                onClick={() => goToPage(Math.min(list.totalPages, filters.page + 1))}
                disabled={filters.page >= list.totalPages}
                aria-label="Next page"
                className="w-11 h-11 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono disabled:opacity-30"
                style={{ color: "var(--fg-2)" }}
              >›</button>
            </nav>
          )}
        </div>
      </div>

      {/* Phone and tablet: the same controls as a sheet; the list updates under it. */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" width={420}>
        <div className="flex flex-col min-h-full">
        <div className="flex-1 px-5">{panel}</div>
        <div className="sticky bottom-0 bg-bg px-5 py-4 border-t border-border">
          <button type="button" className="btn-primary-v2 w-full" style={{ height: 44 }} onClick={() => setDrawerOpen(false)}>
            {ready && list.total !== null ? `Show ${countLabel(list.total, filters.type)}` : `Show ${noun.many}`}
          </button>
        </div>
        </div>
      </Drawer>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<AsyncSpinner size="page" label="Loading providers" />}>
      <Explore />
    </Suspense>
  );
}
