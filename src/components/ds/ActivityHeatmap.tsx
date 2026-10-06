/**
 * ActivityHeatmap — one square per day, shaded by how much happened.
 *
 * Feed it `heatmapCells(events, days, now)` from src/lib/ui/activity.ts,
 * computed on the client with the viewer's clock, so levels come from real
 * counts. Ramp is the signal scale (never a role colour such as --gym-soft,
 * which means "gym", not "intensity"):
 *   0 --bg-2 · 1 --signal-soft · 2 --signal · 3 --signal-ink
 * Once-a-day data (check-ins) only ever uses 0 and 2; the darkest step is
 * kept for days that really were busier than others (see heatLevel).
 * The grid is one labelled image with a spoken summary; each square has a
 * hover title with its date and count.
 */
import { activeDays, type HeatCell, type HeatLevel } from "@/lib/ui/activity";

export const HEAT_COLORS: Record<HeatLevel, string> = {
  0: "var(--bg-2)",
  1: "var(--signal-soft)",
  2: "var(--signal)",
  3: "var(--signal-ink)",
};

interface ActivityHeatmapProps {
  cells: readonly HeatCell[];
  /** What is counted, plural, e.g. "check-ins" or "workouts". */
  noun: string;
  /** Singular form, e.g. "check-in" or "class". Required: English plurals
   *  can't be singularised by rule ("classes" → "classe"). */
  nounOne: string;
  columns?: number;
  /** Show the Less→More legend (default true). */
  legend?: boolean;
  className?: string;
}

export function ActivityHeatmap({
  cells,
  noun,
  nounOne,
  columns = 10,
  legend = true,
  className = "",
}: ActivityHeatmapProps) {
  const word = (n: number) => (n === 1 ? nounOne : noun);
  const total = cells.reduce((sum, c) => sum + c.count, 0);
  const active = activeDays(cells);
  const summary = `${total} ${word(total)} on ${active} of the last ${cells.length} days`;

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={summary}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => (
          <div
            key={cell.date}
            data-level={cell.level}
            title={`${cell.date}: ${cell.count} ${word(cell.count)}`}
            className="aspect-square rounded-[var(--r-1)]"
            style={{ background: HEAT_COLORS[cell.level] }}
          />
        ))}
      </div>
      {legend && (
        <div
          aria-hidden="true"
          className="mt-2.5 flex items-center justify-end gap-1 font-mono text-[10.5px] uppercase tracking-[0.04em]"
          style={{ color: "var(--fg-3)" }}
        >
          <span className="mr-1">Less</span>
          {([0, 1, 2, 3] as const).map((level) => (
            <span
              key={level}
              data-legend-level={level}
              className="inline-block h-2.5 w-2.5 rounded-[var(--r-1)]"
              style={{ background: HEAT_COLORS[level] }}
            />
          ))}
          <span className="ml-1">More</span>
        </div>
      )}
    </div>
  );
}
