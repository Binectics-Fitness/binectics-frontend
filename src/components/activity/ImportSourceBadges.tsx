import { StatusPill } from "@/components/ds/StatusPill";
import { importLabel, type TrackerImport } from "@/lib/progress/importSource";

/**
 * The source of an imported tracker row ("Samsung Health"), plus "Manual"
 * when it was typed in by hand in that app. Mirrors mobile's ImportBadges:
 * a neutral source badge, a warn "Manual" one. Non-interactive, so it may
 * sit in the trailing slot of a clickable ListRow.
 */
export function ImportSourceBadges({ imported }: { imported: TrackerImport }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={importLabel(imported)}>
      <StatusPill label={imported.label} tone="neutral" dot={false} />
      {imported.manual && <StatusPill label="Manual" tone="warn" dot={false} />}
    </span>
  );
}
