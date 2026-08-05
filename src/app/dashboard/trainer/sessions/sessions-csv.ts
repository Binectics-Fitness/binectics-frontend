import type { ConsultationBooking } from "@/lib/api/consultations";
import { buildCsv } from "@/lib/csv/csv";
import {
  bookingStatusLabel,
  clientDisplayName,
  durationMins,
} from "@/lib/consultations/bookingActions";

/**
 * CSV export for the trainer sessions log — exactly the rows the trainer can
 * see after filtering, nothing more. Pure (no DOM, no fetch) so it can be
 * unit-tested; the page wires it to a Blob download. RFC 4180 escaping comes
 * from @/lib/csv/csv.
 *
 * Unit-tested in src/tests/unit/sessions-csv.test.ts.
 */

export const SESSIONS_CSV_HEADERS = [
  "Date",
  "Client",
  "Type",
  "Duration (min)",
  "Status",
  "Notes",
] as const;

export interface SessionsCsvOptions {
  /** Consultation type id → display name. Unknown ids fall back to "Consultation". */
  typesById: Record<string, string>;
  /**
   * Date renderer — pass the org-aware formatter so the export matches what
   * is on screen instead of inventing its own locale.
   */
  fmtDateTime: (iso: string) => string;
}

export function buildSessionsCsv(
  bookings: readonly ConsultationBooking[],
  { typesById, fmtDateTime }: SessionsCsvOptions,
): string {
  return buildCsv(
    SESSIONS_CSV_HEADERS,
    bookings.map((b) => [
      fmtDateTime(b.startsAt),
      clientDisplayName(b),
      typesById[b.consultationTypeId] ?? "Consultation",
      String(durationMins(b)),
      bookingStatusLabel(b.status),
      b.notes?.trim() ?? "",
    ]),
  );
}
