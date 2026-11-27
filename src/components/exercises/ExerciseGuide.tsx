import { Eyebrow } from "@/components/ds";
import { GUIDANCE_NOTE, hasGuidance, type LibraryExercise } from "@/lib/exercises/library";

type Guide = Pick<LibraryExercise, "primaryMuscles" | "secondaryMuscles" | "steps" | "cues">;

/**
 * The library's written guidance for one exercise: what it works, the steps
 * and the cues. Plain text only, so it reads the same with or without an
 * illustration beside it. Renders nothing when the library has no text for
 * the exercise (an older API, or a custom exercise).
 */
export function ExerciseGuide({ guide, className = "" }: { guide: Guide | null | undefined; className?: string }) {
  if (!guide || !hasGuidance(guide)) return null;
  const main = guide.primaryMuscles ?? [];
  const also = guide.secondaryMuscles ?? [];
  const steps = guide.steps ?? [];
  const cues = guide.cues ?? [];
  return (
    <div className={`flex flex-col gap-3 text-[14px] leading-relaxed ${className}`} data-testid="exercise-guide" style={{ color: "var(--fg-2)" }}>
      {main.length > 0 && (
        <div>
          <Eyebrow>Works</Eyebrow>
          <p className="mt-1">
            {main.join(", ")}
            {also.length > 0 && <span style={{ color: "var(--fg-3)" }}>{`. Also: ${also.join(", ")}`}</span>}
          </p>
        </div>
      )}
      {steps.length > 0 && (
        <div>
          <Eyebrow>How to do it</Eyebrow>
          <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5 marker:font-mono">
            {steps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      )}
      {cues.length > 0 && (
        <div>
          <Eyebrow>Cues</Eyebrow>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            {cues.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>
        {GUIDANCE_NOTE}
      </p>
    </div>
  );
}
