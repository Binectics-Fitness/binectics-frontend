"use client";

import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { exerciseDose, isTimedExercise, restLine, type SetEntry } from "@/lib/starter/model";
import type { StarterExercise } from "@/lib/starter/types";

interface ExerciseCardProps {
  exercise: StarterExercise;
  index: number;
  ticked: boolean;
  onTick: (next: boolean) => void;
  /** Hide the tick box (a finished session). */
  locked?: boolean;
  /** Numbers form rows, or null when the form is closed. */
  numbers: SetEntry[] | null;
  onNumber: (setIndex: number, key: keyof SetEntry, value: string) => void;
}

const inputStyle = {
  width: 84,
  padding: "8px 10px",
  borderRadius: "var(--r-2)",
  border: "1px solid var(--border-2)",
  fontSize: 14,
  background: "var(--bg)",
  color: "var(--ink)",
} as const;

/**
 * One exercise of a session: a tick box, name, dose, cues and the bundled
 * illustration (a looping demo that shows a still with reduced motion). The
 * picture is only a hint; every exercise reads fine without it.
 */
export function ExerciseCard({
  exercise: e,
  index,
  ticked,
  onTick,
  locked,
  numbers,
  onNumber,
}: ExerciseCardProps) {
  const dose = exerciseDose(e);
  const rest = restLine(e);
  const facts = [dose, rest].filter(Boolean).join(" · ");
  const id = `ex-${index}`;
  return (
    <li
      className="rounded-(--r-3) p-4"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-3">
        {!locked && (
          <input
            id={`${id}-tick`}
            type="checkbox"
            checked={ticked}
            onChange={(ev) => onTick(ev.target.checked)}
            aria-label={`${e.name}, done`}
            className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--ink)]"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3
            className="text-[15px] font-medium"
            style={{ color: "var(--ink)", textDecoration: ticked ? "line-through" : undefined }}
          >
            {e.name}
          </h3>
          {facts && (
            <p className="mt-0.5 font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>
              {facts}
            </p>
          )}
          {e.cues.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {e.cues.map((c, ci) => (
                <li key={ci} className="text-[14px] leading-snug" style={{ color: "var(--fg-2)" }}>
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasExerciseIllustration(e.mediaId) && (
          <div
            className="shrink-0 overflow-hidden rounded-(--r-2)"
            style={{ width: 96, height: 96, background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <ExerciseIllustration mediaId={e.mediaId} className="block h-full w-full object-contain" />
          </div>
        )}
      </div>

      {numbers && !isTimedExercise(e) && (
        <div className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          {numbers.map((s, si) => (
            <div key={si} className="flex flex-wrap items-center gap-2">
              <span className="w-12 text-[13px]" style={{ color: "var(--fg-2)" }}>
                Set {si + 1}
              </span>
              <input
                inputMode="decimal"
                value={s.weight}
                onChange={(ev) => onNumber(si, "weight", ev.target.value)}
                placeholder="kg"
                aria-label={`${e.name}, set ${si + 1}, weight in kilograms`}
                style={inputStyle}
              />
              <input
                inputMode="numeric"
                value={s.reps}
                onChange={(ev) => onNumber(si, "reps", ev.target.value)}
                placeholder="reps"
                aria-label={`${e.name}, set ${si + 1}, reps`}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
