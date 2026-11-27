"use client";

import { useState } from "react";
import ExerciseIllustration from "@/components/ExerciseIllustration";
import { ExerciseGuide } from "@/components/exercises/ExerciseGuide";
import { DEMO_ART_NOTE, resolveClientArt, type LibraryRef } from "@/lib/exercises/clientArt";
import { libraryIdOf, useClientExerciseGuides } from "@/lib/exercises/clientGuides";

export interface ClientExercise extends LibraryRef {
  name: string;
  /** "3 x 10 · Rest 45 sec", already formatted. */
  dose?: string;
  /** The provider's own words for this exercise. */
  notes?: string[];
}

/**
 * The exercises a provider assigned, in order. A library exercise whose art we
 * hold shows the looping illustration (a still with reduced motion) with a
 * neutral "Demo" tag, never a named guide: the member's real provider wrote
 * this. Any other row is plain text with no placeholder or empty box.
 *
 * A library exercise whose written guidance the member may read (see
 * memberMaySeeGuidance) gets a "How to do it" control that opens the steps
 * and cues under the provider's own notes, art or no art.
 */
export function ClientExerciseList({ exercises }: { exercises: ClientExercise[] }) {
  const anyArt = exercises.some((e) => resolveClientArt(e));
  const guideFor = useClientExerciseGuides(exercises.some((e) => libraryIdOf(e)));
  const [openRow, setOpenRow] = useState<number | null>(null);
  return (
    <div>
      <ol className="flex flex-col gap-3" data-testid="client-exercise-list">
        {exercises.map((e, i) => {
          const art = resolveClientArt(e);
          const notes = (e.notes ?? []).filter(Boolean);
          const guide = guideFor(e);
          const open = openRow === i;
          const panelId = `exercise-guide-${i}`;
          return (
            <li
              key={`${e.name}-${i}`}
              className="rounded-(--r-3) p-4"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
             <div className="flex items-start gap-3">
              <span className="w-5 shrink-0 font-mono text-[13px]" style={{ color: "var(--fg-3)" }}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  {e.name}
                </h3>
                {e.dose && (
                  <p className="mt-0.5 font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>
                    {e.dose}
                  </p>
                )}
                {notes.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {notes.map((n, ni) => (
                      <li key={ni} className="text-[14px] leading-snug" style={{ color: "var(--fg-2)" }}>
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
                {guide && (
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-label={open ? `Hide how to do ${e.name}` : `How to do ${e.name}`}
                    className="mt-2 inline-flex min-h-[44px] items-center text-[13px] font-medium underline underline-offset-4 sm:min-h-0"
                    style={{ color: "var(--ink)", background: "transparent", border: "none", padding: 0 }}
                  >
                    {open ? "Hide how to do it" : "How to do it"}
                  </button>
                )}
              </div>
              {art && (
                <div className="flex shrink-0 flex-col items-center gap-1" data-testid="exercise-art">
                  <div
                    className="overflow-hidden rounded-(--r-2)"
                    style={{ width: 96, height: 96, background: "var(--bg-2)", border: "1px solid var(--border)" }}
                  >
                    <ExerciseIllustration mediaId={art} className="block h-full w-full object-contain" />
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--fg-3)" }} title="Illustrated demo">
                    <span aria-hidden="true">Demo</span>
                    <span className="sr-only">Illustrated demo</span>
                  </span>
                </div>
              )}
             </div>
              {guide && open && (
                <div id={panelId} className="mt-3 pt-3 pl-8" style={{ borderTop: "1px solid var(--border)" }}>
                  <ExerciseGuide guide={guide} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {anyArt && (
        <p className="mt-3 text-[12px]" style={{ color: "var(--fg-3)" }}>
          {DEMO_ART_NOTE}
        </p>
      )}
    </div>
  );
}
