import { buildCsv, csvNumber } from "@/lib/csv/csv";

/**
 * CSV export for the gym members list: exactly the rows the owner sees after
 * filtering. Member names and emails are typed by the members themselves, so
 * every cell goes through the shared helper, which quotes it properly and
 * stops a name like `=HYPERLINK(...)` from running as a formula when the
 * owner opens the file (CWE-1236).
 *
 * Pure (no DOM, no fetch). Unit-tested in src/tests/unit/members-csv.test.ts.
 */

export const MEMBERS_CSV_HEADERS = [
  "Name",
  "Email",
  "Plan",
  "Status",
  "Joined",
  "Amount",
  "Currency",
] as const;

/** One member, already formatted the way the list shows it. */
export interface MembersCsvRow {
  name: string;
  email: string;
  plan: string;
  status: string;
  joined: string;
  /** Major units (naira, not kobo), so spreadsheet formulas read naturally. */
  amount: number | null | undefined;
  currency: string | null | undefined;
}

export function buildMembersCsv(rows: readonly MembersCsvRow[]): string {
  return buildCsv(
    MEMBERS_CSV_HEADERS,
    rows.map((r) => [
      r.name,
      r.email,
      r.plan,
      r.status,
      r.joined,
      csvNumber(r.amount),
      r.currency ?? "",
    ]),
  );
}
