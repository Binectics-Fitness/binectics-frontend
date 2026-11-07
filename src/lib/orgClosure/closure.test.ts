import { describe, expect, it } from "vitest";
import {
  canReopenNow,
  closureErrorMessage,
  confirmationMatches,
  daysLeftLabel,
  daysLeftToReopen,
  exportFileName,
  exportPath,
  parseClosures,
  ORG_CLOSED_MESSAGE,
} from "./closure";

const NOW = new Date("2026-11-10T12:00:00Z");

describe("confirmationMatches", () => {
  it("accepts the gym name in any case, or CLOSE", () => {
    expect(confirmationMatches("iron gym", "Iron Gym")).toBe(true);
    expect(confirmationMatches("  IRON GYM ", "Iron Gym")).toBe(true);
    expect(confirmationMatches("CLOSE", "Iron Gym")).toBe(true);
    expect(confirmationMatches(" CLOSE ", "Iron Gym")).toBe(true);
  });
  it("refuses lowercase close, which the API refuses", () => {
    expect(confirmationMatches("close", "Iron Gym")).toBe(false);
    expect(confirmationMatches("Close", "Iron Gym")).toBe(false);
  });
  it("rejects anything else, including empty", () => {
    expect(confirmationMatches("", "Iron Gym")).toBe(false);
    expect(confirmationMatches("Iron", "Iron Gym")).toBe(false);
    expect(confirmationMatches("closed", "Iron Gym")).toBe(false);
  });
});

describe("reopen window", () => {
  it("counts whole days, rounding up, and is 0 once passed", () => {
    expect(daysLeftToReopen({ reopenUntil: "2026-11-13T12:00:00Z" }, NOW)).toBe(3);
    expect(daysLeftToReopen({ reopenUntil: "2026-11-10T15:00:00Z" }, NOW)).toBe(1);
    expect(daysLeftToReopen({ reopenUntil: "2026-11-09T12:00:00Z" }, NOW)).toBe(0);
    expect(daysLeftToReopen({ reopenUntil: null }, NOW)).toBeNull();
  });
  it("labels singular, plural and expired", () => {
    expect(daysLeftLabel(1)).toBe("1 day left to reopen");
    expect(daysLeftLabel(12)).toBe("12 days left to reopen");
    expect(daysLeftLabel(0)).toMatch(/ended/);
  });
  it("follows the server's can_reopen flag, not the device clock", () => {
    const base = parseClosures([{ id: "a", name: "A", reopen_until: "2026-11-01T00:00:00Z", can_reopen: true }])[0];
    expect(canReopenNow(base)).toBe(true);
    expect(canReopenNow({ ...base, canReopen: false })).toBe(false);
  });
});

describe("parseClosures", () => {
  it("reads an array or { items } and drops rows without an id", () => {
    expect(parseClosures([{ id: "a", name: "A" }, { name: "x" }, null])).toHaveLength(1);
    expect(parseClosures({ items: [{ id: "b", name: "B" }] })[0].id).toBe("b");
    expect(parseClosures(undefined)).toEqual([]);
  });
});

describe("closureErrorMessage", () => {
  it("has plain words for each refusal", () => {
    expect(closureErrorMessage("ORG_CLOSE_CONFIRMATION_MISMATCH", 400)).toMatch(/exact name/);
    expect(closureErrorMessage("ORG_CLOSE_NOT_SUPPORTED", 400)).toMatch(/Trainer and dietitian/);
    expect(closureErrorMessage("ORG_ALREADY_CLOSED", 409)).toMatch(/already closed/);
    expect(closureErrorMessage("ORG_REOPEN_WINDOW_EXPIRED", 409)).toMatch(/window has ended/);
    expect(closureErrorMessage("ORG_CLOSED", 409)).toBe(ORG_CLOSED_MESSAGE);
    expect(closureErrorMessage(undefined, 404)).toMatch(/owner/);
  });
});

describe("exports", () => {
  it("builds the three contract paths", () => {
    expect(exportPath("revenue", "o1", "csv")).toBe("/transactions/organizations/o1/export/revenue-by-trainer?format=csv");
    expect(exportPath("sales", "o1", "json")).toBe("/content/organizations/o1/export/sales?format=json");
    expect(exportPath("ledger", "o1", "csv")).toBe("/transactions/organizations/o1/export/ledger?format=csv");
  });
  it("makes a safe file name", () => {
    expect(exportFileName("Iron Gym & Co.", "ledger", "csv")).toBe("iron-gym-co-ledger.csv");
    expect(exportFileName("???", "ledger", "json")).toBe("gym-ledger.json");
  });
});
