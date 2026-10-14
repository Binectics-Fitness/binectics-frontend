import { buildCsv } from "@/lib/csv/csv";
import type {
  ImportDateFormat,
  ImportField,
  ImportPreviewRow,
} from "@/lib/api/memberImports";

/**
 * Pure helpers for the member-import drawer: the template, field labels,
 * calendar-day formatting and the problem list the gym can copy or
 * download. No DOM, no fetch; unit-tested in
 * src/tests/unit/member-import.test.tsx.
 */

/** The columns the template ships with, in order. */
export const TEMPLATE_HEADERS = [
  "Full name",
  "Email",
  "Phone",
  "Plan",
  "End date",
  "Start date",
  "Branch",
  "Notes",
] as const;

/**
 * A downloadable starting point. Day-first dates, as Nigerian gyms write
 * them; the third row's 25/11 shows which way round they go.
 */
export function buildTemplateCsv(): string {
  return buildCsv(TEMPLATE_HEADERS, [
    ["Adaeze Okafor", "adaeze@example.com", "0803 123 4567", "Gold Monthly", "31/12/2026", "01/12/2026", "", "Paid cash"],
    ["Tunde Bello", "tunde@example.com", "", "Silver Quarterly", "15/01/2027", "", "", ""],
    ["Ngozi Eze", "ngozi@example.com", "+234 805 765 4321", "Gold Monthly", "25/11/2026", "", "", "Prefers mornings"],
  ]);
}

export const FIELD_LABELS: Record<ImportField, string> = {
  full_name: "Full name",
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  phone: "Phone",
  plan: "Plan",
  end_date: "Membership end date",
  start_date: "Start date",
  branch: "Branch",
  notes: "Notes",
};

/** Which fields the gym must map, and the order the mapping step shows. */
export const FIELD_ORDER: Array<{ field: ImportField; required?: boolean; hint?: string }> = [
  { field: "full_name", hint: "Or map first and last name separately." },
  { field: "first_name" },
  { field: "last_name" },
  { field: "email", required: true, hint: "Members claim their membership by signing up with this email." },
  { field: "phone", hint: "Kept on your list. Not used to sign in." },
  { field: "plan", required: true },
  { field: "end_date", required: true, hint: "The membership runs until the end of this day." },
  { field: "start_date" },
  { field: "branch" },
  { field: "notes", hint: "Only your team sees these." },
];

export const DATE_FORMAT_OPTIONS: Array<{ value: ImportDateFormat; label: string; example: string }> = [
  { value: "auto", label: "Work it out", example: "Flags dates that could be read two ways" },
  { value: "dmy", label: "Day first", example: "DD/MM/YYYY · 03/04/2026 is 3 April" },
  { value: "mdy", label: "Month first", example: "MM/DD/YYYY · 03/04/2026 is 4 March" },
  { value: "ymd", label: "Year first", example: "YYYY-MM-DD · 2026-04-03" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-04-03" → "3 Apr 2026". A calendar day, not an instant: no time
 * zone can move it, and the month is a word, so a day/month swap shows.
 */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** Rows that need the gym's attention: not imported, or imported with a note. */
export function rowsWithProblems(rows: readonly ImportPreviewRow[]): ImportPreviewRow[] {
  return rows.filter((r) => r.problems.length > 0);
}

/** One line per problem, for the clipboard: "Row 4 (ada@x.test): message". */
export function problemsText(rows: readonly ImportPreviewRow[]): string {
  const lines: string[] = [];
  for (const r of rows) {
    for (const p of r.problems) {
      const who = r.email ?? r.name ?? "";
      lines.push(`Row ${r.row}${who ? ` (${who})` : ""}: ${p.message}`);
    }
  }
  return lines.join("\n");
}

/** The same list as a CSV the gym can fix in its spreadsheet. */
export function problemsCsv(rows: readonly ImportPreviewRow[]): string {
  const body: string[][] = [];
  for (const r of rows) {
    for (const p of r.problems) {
      body.push([
        String(r.row),
        r.name ?? "",
        r.email ?? "",
        p.severity === "error" ? "Not imported" : p.severity === "skip" ? "Skipped" : "Imported",
        p.message,
      ]);
    }
  }
  return buildCsv(["Row", "Name", "Email", "Outcome", "Problem"], body);
}

/** Starts a browser download of `text` as `name`. */
export function downloadText(text: string, name: string, type = "text/csv"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** How many days the queued invites take at `perDay` a day. */
export function inviteDays(count: number, perDay: number): number {
  if (count <= 0 || perDay <= 0) return 0;
  return Math.ceil(count / perDay);
}
