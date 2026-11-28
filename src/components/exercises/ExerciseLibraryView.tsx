"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { ExerciseGuide } from "@/components/exercises/ExerciseGuide";
import { ExerciseThumb } from "@/components/programs/ExercisePicker";
import { loadLibrary, type LibraryState } from "@/components/programs/exerciseLibraryCache";
import { AsyncSpinner, Drawer, EmptySlate, Eyebrow, FilterPill, PageHeader } from "@/components/ds";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  ALL,
  LIBRARY_NOTE,
  LIBRARY_PAGE_FLAG,
  WITHHELD_NOTE,
  distinctMuscles,
  distinctValues,
  equipmentLabel,
  filterLibrary,
  hasGuidance,
  type ArtTag,
  type LibraryExercise,
} from "@/lib/exercises/library";

/** Who is looking. A gym owner reads; nobody authors from this page. */
export type LibraryAudience = "trainer" | "dietitian" | "gym";

/** The honest tag: art exists in this app's shipped set, or it does not. */
export function artTag(e: Pick<LibraryExercise, "id">): ArtTag {
  return hasExerciseIllustration(e.id) ? "Illustrated" : "Text only";
}

function Tag({ tag }: { tag: ArtTag }) {
  const art = tag === "Illustrated";
  return (
    <span
      className="inline-block whitespace-nowrap rounded-(--r-1) px-2 py-0.5 text-[11.5px] font-medium"
      style={{ background: art ? "var(--move-soft)" : "var(--bg-2)", color: art ? "var(--move-ink)" : "var(--fg-2)" }}
    >
      {tag}
    </span>
  );
}

const meta = (e: LibraryExercise) =>
  [e.category, equipmentLabel(e.equipment), e.timed ? "Hold" : null].filter(Boolean).join(" · ");

/** Thumbnail: the end still where art exists, a quiet dumbbell tile where it does not. */
function Thumb({ id, size }: { id: string; size: number }) {
  if (hasExerciseIllustration(id)) return <ExerciseThumb mediaId={id} size={size} />;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-(--r-2)"
      style={{ width: size, height: size, background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-4)" }}
      aria-hidden="true"
    >
      <svg width={Math.round(size * 0.4)} height={Math.round(size * 0.4)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
      </svg>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Rail({ label, values, current, onPick, count, format }: {
  label: string;
  values: string[];
  current: string;
  onPick: (v: string) => void;
  count: (v: string) => number;
  format?: (v: string) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0" role="group" aria-label={label}>
        <FilterPill label="All" active={current === ALL} onClick={() => onPick(ALL)} />
        {values.map((v) => (
          <FilterPill key={v} label={format ? format(v) : v} count={count(v)} active={current === v} onClick={() => onPick(current === v ? ALL : v)} />
        ))}
      </div>
    </div>
  );
}

function Detail({ e, audience }: { e: LibraryExercise; audience: LibraryAudience }) {
  const withheld = e.memberTextApproved !== true && hasGuidance(e);
  return (
    <div className="flex flex-col gap-4 px-6 py-5" data-testid="library-detail">
      <div className="flex items-center gap-2">
        <Tag tag={artTag(e)} />
        <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{meta(e)}</span>
      </div>
      {hasExerciseIllustration(e.id) ? (
        <div className="flex justify-center rounded-(--r-2) p-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <ExerciseIllustration mediaId={e.id} className="w-full max-w-[320px]" />
        </div>
      ) : (
        <p className="rounded-(--r-2) px-3 py-3 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-3)" }}>
          No illustration for this exercise yet. The written steps below are all there is for now.
        </p>
      )}
      {hasGuidance(e) ? (
        <ExerciseGuide guide={e} />
      ) : (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>No written steps for this exercise yet. {LIBRARY_NOTE}</p>
      )}
      {withheld && (
        <p className="rounded-(--r-2) px-3 py-2.5 text-[12.5px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }} role="note">
          {WITHHELD_NOTE}
          {audience === "gym" ? "" : " You can still add this exercise to a workout; add your own notes for your clients."}
        </p>
      )}
    </div>
  );
}

/**
 * The Library page: every library exercise, searchable and filterable, each
 * tagged "Illustrated" or "Text only" (a text-only exercise is never hidden),
 * with a detail panel for the steps and cues. Reference only: adding an
 * exercise to a program happens in the builder's picker. Behind the runtime
 * flag `exercise_library_page`.
 *
 * Providers see all the written text, with a note where members do not.
 */
export default function ExerciseLibraryView({ audience }: { audience: LibraryAudience }) {
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [equipment, setEquipment] = useState(ALL);
  const [muscle, setMuscle] = useState(ALL);
  const [view, setView] = useState<"list" | "grid">("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const on = isEnabled(LIBRARY_PAGE_FLAG);

  // The state starts as "loading", so the first load sets nothing synchronously.
  useEffect(() => {
    if (!on) return;
    let live = true;
    void loadLibrary().then((s) => {
      if (live) setState(s);
    });
    return () => {
      live = false;
    };
  }, [on]);
  const retry = useCallback(() => {
    setState({ status: "loading" });
    void loadLibrary().then(setState);
  }, []);

  const exercises = useMemo(() => (state.status === "ready" ? state.library.exercises : []), [state]);
  const categories = useMemo(() => distinctValues(exercises, "category"), [exercises]);
  const equipments = useMemo(() => distinctValues(exercises, "equipment"), [exercises]);
  const muscles = useMemo(() => distinctMuscles(exercises), [exercises]);
  const results = useMemo(
    () => filterLibrary(exercises, { query, category, equipment, muscle }),
    [exercises, query, category, equipment, muscle],
  );
  const open = exercises.find((e) => e.id === openId) ?? null;
  const filtered = query.trim() !== "" || category !== ALL || equipment !== ALL || muscle !== ALL;
  const clear = () => {
    setQuery("");
    setCategory(ALL);
    setEquipment(ALL);
    setMuscle(ALL);
  };

  const subtitle =
    audience === "gym"
      ? `Read-only reference for your team. ${LIBRARY_NOTE}`
      : `${state.status === "ready" ? `${exercises.length} exercises. ` : ""}${LIBRARY_NOTE}`;

  if (flagsLoading) return <AsyncSpinner label="Loading" />;
  if (!on) {
    return (
      <>
        <PageHeader title="Library" />
        <EmptySlate message="The Library is not switched on for your account yet." hint="Exercises are still available when you build a workout." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Library" subtitle={subtitle} />

      {state.status === "loading" && <AsyncSpinner label="Loading the exercise library" />}
      {state.status === "failed" && (
        <EmptySlate
          message="The exercise library did not load."
          hint="Check your connection and try again."
          action={
            <button type="button" onClick={retry} className="rounded-(--r-1) px-3 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--ink)", color: "var(--bg)" }}>
              Try again
            </button>
          }
        />
      )}
      {state.status === "ready" && !state.library.available && (
        <EmptySlate message="The exercise library is not available right now." hint="Custom exercises still work in the builder." />
      )}

      {state.status === "ready" && state.library.available && (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[230px_1fr] lg:items-start">
          <aside
            className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:rounded-(--r-3) lg:border lg:p-4 lg:[border-color:var(--border)] lg:[background:var(--bg)]"
            aria-label="Filters"
          >
            <Rail label="Category" values={categories} current={category} onPick={setCategory} count={(v) => exercises.filter((e) => e.category === v).length} />
            <Rail label="Equipment" values={equipments} current={equipment} onPick={setEquipment} count={(v) => exercises.filter((e) => e.equipment === v).length} format={equipmentLabel} />
          </aside>

          <section className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                className="flex h-11 flex-1 items-center gap-2.5 rounded-(--r-2) px-3.5"
                style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--fg-3)" }}
              >
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(ev) => setQuery(ev.target.value)}
                  placeholder={`Search ${exercises.length} exercises`}
                  aria-label="Search exercises"
                  className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                  style={{ color: "var(--ink)" }}
                />
              </label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
                  <SearchableSelect
                    value={muscle}
                    onChange={setMuscle}
                    options={[{ label: "Any muscle", value: ALL }, ...muscles.map((m) => ({ label: m, value: m }))]}
                    placeholder="Any muscle"
                  />
                </div>
                <div className="flex shrink-0 gap-1" role="group" aria-label="Layout">
                  <FilterPill label="List" active={view === "list"} onClick={() => setView("list")} />
                  <FilterPill label="Grid" active={view === "grid"} onClick={() => setView("grid")} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--fg-3)" }} aria-live="polite">
              <span>
                {results.length} of {exercises.length}
              </span>
              {filtered && (
                <button type="button" onClick={clear} className="underline" style={{ color: "var(--fg-2)" }}>
                  Clear filters
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <EmptySlate
                mt="mt-2"
                message="No exercise matches."
                hint="Try fewer words or clear a filter."
                action={
                  <button type="button" onClick={clear} className="rounded-(--r-1) px-3 py-1.5 text-[12.5px] font-medium" style={{ border: "1px solid var(--border-2)", color: "var(--ink)" }}>
                    Clear filters
                  </button>
                }
              />
            ) : view === "list" ? (
              <ul className="overflow-hidden rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                {results.map((e) => (
                  <li key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      onClick={() => setOpenId(e.id)}
                      aria-label={`Open ${e.name}`}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-2 sm:gap-4"
                    >
                      <Thumb id={e.id} size={56} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium" style={{ color: "var(--ink)" }}>{e.name}</span>
                        <span className="block font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{meta(e)}</span>
                      </span>
                      <Tag tag={artTag(e)} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {results.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(e.id)}
                      aria-label={`Open ${e.name}`}
                      className="flex h-full w-full flex-col gap-2 rounded-(--r-3) p-3 text-left hover:bg-bg-2"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                    >
                      <Thumb id={e.id} size={96} />
                      <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{e.name}</span>
                      <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{meta(e)}</span>
                      <span className="mt-auto"><Tag tag={artTag(e)} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ""} width={480}>
        {open && <Detail e={open} audience={audience} />}
      </Drawer>
    </>
  );
}
