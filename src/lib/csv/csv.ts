/**
 * RFC 4180 CSV building, shared by every "Export CSV" button in the app
 * (dietitian food database, trainer sessions log). Pure functions — no DOM,
 * no fetch — so they can be unit-tested; callers wire the string to a Blob
 * download. Unit-tested in src/tests/unit/csv.test.ts.
 */

/** Quote fields containing commas, quotes, or newlines; double embedded quotes. */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Render a number cell: an explicit 0 stays "0", a missing value stays blank
 * rather than printing "undefined"/"null".
 */
export function csvNumber(value: number | undefined | null): string {
  return value === undefined || value === null ? "" : String(value);
}

/**
 * Join a header row and body rows into a CSV document. The header row is
 * always emitted, so an empty export is still a valid (if bodyless) file.
 */
export function buildCsv(headers: readonly string[], rows: readonly string[][]): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];
  return lines.join("\n");
}
