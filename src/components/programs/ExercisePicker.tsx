"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import {
  ALL,
  DEMO_ART_NOTE,
  DEMO_TAG,
  distinctValues,
  filterLibrary,
  type LibraryExercise,
} from "@/lib/exercises/library";

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

/** Neutral tag for provider-side art. Wording is an owner/lawyer decision. */
export function DemoTag() {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-(--r-1) shrink-0"
      style={{ color: "var(--fg-3)", background: "var(--bg-2)", border: "1px solid var(--border)" }}
      title={DEMO_ART_NOTE}
    >
      <span aria-hidden="true">{DEMO_TAG}</span>
      <span className="sr-only">Illustrated demo</span>
    </span>
  );
}

/** A small still (end pose) thumbnail; an empty tile when there is no art. */
export function ExerciseThumb({ mediaId, size = 48 }: { mediaId?: string; size?: number }) {
  const has = hasExerciseIllustration(mediaId);
  return (
    <div
      className="shrink-0 flex items-center justify-center overflow-hidden rounded-(--r-2)"
      style={{ width: size, height: size, background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      {has && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/exercises/${mediaId}-end.svg`} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
      )}
    </div>
  );
}

/**
 * Pick an exercise from the library: search by name, narrow by category and
 * equipment. Choosing returns the exercise (a variant is chosen on the row
 * afterwards). A custom exercise is always one click away in the parent.
 */
export default function ExercisePicker({
  exercises,
  onPick,
  onClose,
}: {
  exercises: LibraryExercise[];
  onPick: (exercise: LibraryExercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [equipment, setEquipment] = useState(ALL);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const categories = useMemo(() => distinctValues(exercises, "category"), [exercises]);
  const equipments = useMemo(() => distinctValues(exercises, "equipment"), [exercises]);
  const results = useMemo(
    () => filterLibrary(exercises, { query, category, equipment }),
    [exercises, query, category, equipment],
  );

  return (
    <div
      role="dialog"
      aria-label="Exercise library"
      className="rounded-(--r-2) p-3 flex flex-col gap-2.5"
      style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
          Exercise library
          <span className="ml-2 font-normal text-[12px]" style={{ color: "var(--fg-3)" }}>
            {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] sm:min-h-0 font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 sm:px-2.5 py-1.25 rounded-(--r-1)"
          style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
        >
          Close
        </button>
      </div>

      <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
        {DEMO_ART_NOTE}.
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises by name"
        aria-label="Search exercises by name"
        className="h-9 rounded-(--r-2) px-3 text-[13px]"
        style={{ ...fieldStyle, background: "var(--bg)" }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SearchableSelect
          value={category}
          onChange={setCategory}
          options={[{ label: "All categories", value: ALL }, ...categories.map((c) => ({ label: c, value: c }))]}
          placeholder="All categories"
        />
        <SearchableSelect
          value={equipment}
          onChange={setEquipment}
          options={[{ label: "All equipment", value: ALL }, ...equipments.map((c) => ({ label: c, value: c }))]}
          placeholder="All equipment"
        />
      </div>

      <ul className="flex flex-col max-h-[320px] overflow-y-auto overflow-x-hidden rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
        {results.length === 0 && (
          <li className="px-3 py-4 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            No library exercise matches. Close this and add a custom exercise instead.
          </li>
        )}
        {results.map((e) => (
          <li key={e.id} className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            {/* Phones: the name block takes the first line, the actions wrap under it. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <ExerciseThumb mediaId={e.id} />
              <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-0">
                <div className="text-[13px] font-medium break-words" style={{ color: "var(--ink)" }}>{e.name}</div>
                <div className="font-mono text-[10.5px] break-words" style={{ color: "var(--fg-3)" }}>
                  {e.category} · {e.equipment}
                </div>
              </div>
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <DemoTag />
              {hasExerciseIllustration(e.id) && (
                <button
                  type="button"
                  onClick={() => setPreviewId((p) => (p === e.id ? null : e.id))}
                  aria-expanded={previewId === e.id}
                  className="min-h-[44px] sm:min-h-0 text-[12px] px-3 sm:px-2 py-1 rounded-(--r-1)"
                  style={{ color: "var(--fg-2)", border: "1px solid var(--border)", background: "transparent" }}
                >
                  {previewId === e.id ? "Hide" : "Preview"}
                </button>
              )}
              <button
                type="button"
                onClick={() => onPick(e)}
                aria-label={`Add ${e.name}`}
                className="min-h-[44px] sm:min-h-0 text-[12px] font-medium px-4 sm:px-2.5 py-1 rounded-(--r-1)"
                style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
              >
                Add
              </button>
              </div>
            </div>
            {previewId === e.id && (
              <div className="mt-2 flex justify-center">
                <ExerciseIllustration mediaId={e.id} className="w-full max-w-[280px] rounded-(--r-2)" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
