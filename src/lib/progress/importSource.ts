/**
 * Where an imported tracker row came from (Health Connect). The API keeps the
 * writing app's package in `origin_app` and the title free of it, so readers
 * show the app as a badge: the same rule as binectics-mobile
 * (src/api/progress.ts trackerImport, src/health/originLabels.ts).
 */

/** The writing app's package → the name people see. Same list as the API's
 *  health-mapping.ts and mobile's originLabels.ts. */
const ORIGIN_LABELS: Record<string, string> = {
  "com.sec.android.app.shealth": "Samsung Health",
  "com.samsung.android.wear.shealth": "Galaxy Watch",
  "com.google.android.apps.fitness": "Google Fit",
  "com.google.android.apps.healthdata": "Health Connect",
};

export function originLabel(origin?: string | null): string {
  return (origin && ORIGIN_LABELS[origin]) || "Health Connect";
}

/** Provenance fields on a tracker row; absent or "manual" = typed in Binectics. */
export interface TrackerProvenance {
  source?: string | null;
  origin_app?: string | null;
  recording_method?: string | null;
}

export interface TrackerImport {
  /** "Samsung Health" */
  label: string;
  /** Typed in by hand in the writing app (not measured by a device). */
  manual: boolean;
}

/** The badge's facts, or null for an entry made in Binectics. */
export function trackerImport(row: TrackerProvenance): TrackerImport | null {
  if (!row.source || row.source === "manual") return null;
  return { label: originLabel(row.origin_app), manual: row.recording_method === "manual" };
}

/** What a screen reader says for the badges. */
export function importLabel(imported: TrackerImport): string {
  return `From ${imported.label}${imported.manual ? ", typed in by hand" : ""}`;
}
