import { EXERCISE_ILLUSTRATION_LABELS } from "@/lib/exercises/illustrations";

/**
 * Bundled exercise illustration (illustrated demo art, not professionally
 * reviewed). Renders the SVG loop, whose SMIL animation plays natively in an
 * <img>; with prefers-reduced-motion the still end pose is shown instead.
 * Returns null for an id with no art so callers can show their own fallback.
 */
export function hasExerciseIllustration(mediaId?: string | null): boolean {
  return !!mediaId && mediaId in EXERCISE_ILLUSTRATION_LABELS;
}

export default function ExerciseIllustration({
  mediaId,
  className,
}: {
  mediaId?: string | null;
  className?: string;
}) {
  if (!mediaId || !hasExerciseIllustration(mediaId)) return null;
  return (
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={`/exercises/${mediaId}-end.svg`} />
      <img
        src={`/exercises/${mediaId}.svg`}
        alt={EXERCISE_ILLUSTRATION_LABELS[mediaId]}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}
