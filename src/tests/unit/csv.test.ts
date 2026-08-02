import { describe, it, expect } from "vitest";
import { buildCsv, csvNumber, escapeCsvField } from "@/lib/csv/csv";

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
