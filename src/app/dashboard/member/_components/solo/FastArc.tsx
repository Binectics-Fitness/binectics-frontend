import { ARC, ARC_LENGTH, ARC_PATH, arcPoint } from "@/lib/solo/fastingRules";

/**
 * The half-arc from the start time to the end time. The marker sits EXACTLY on
 * the end of the drawn stroke (arcPoint is the same circle the path is drawn
 * on). It is a picture of the sentence in `label`, which is its whole accessible
 * name, so nothing is conveyed by the drawing alone. No animation: it moves a
 * step each minute, and never "draws".
 */
export function FastArc({ progress, color, track, label }: { progress: number; color: string; track: string; label: string }) {
  const p = Math.min(1, Math.max(0, progress));
  const m = arcPoint(p);
  return (
    <svg viewBox={`0 0 ${ARC.width} ${ARC.height}`} role="img" aria-label={label} data-testid="fast-arc">
      <path d={ARC_PATH} fill="none" stroke={track} strokeWidth={ARC.stroke} strokeLinecap="round" />
      <path
        d={ARC_PATH}
        fill="none"
        stroke={color}
        strokeWidth={ARC.stroke}
        strokeLinecap="round"
        strokeDasharray={`${(ARC_LENGTH * p).toFixed(2)} ${ARC_LENGTH.toFixed(2)}`}
        data-testid="fast-arc-progress"
      />
      <circle cx={m.x} cy={m.y} r={16} style={{ fill: "var(--signal)", stroke: "var(--signal-ink)" }} strokeWidth={1} data-testid="fast-arc-marker" />
      <circle cx={m.x} cy={m.y} r={5} style={{ fill: "var(--signal-ink)" }} />
    </svg>
  );
}
