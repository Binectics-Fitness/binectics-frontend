import { describe, it, expect, vi } from "vitest";
import { diff, seedForm, taxRateError } from "@/app/dashboard/gym-owner/settings/SettingsClient";
import type { Organization } from "@/lib/api/teams";

vi.mock("next/link", () => ({ default: () => null }));

const base = seedForm({ _id: "g1", name: "Iron Temple", tax_rate: 7.5, primary_email: "a@b.co" } as unknown as Organization);

describe("gym settings diff", () => {
  it("unsets an emptied tax rate and email with null, so the save is not a silent no-op", () => {
    expect(diff(base, { ...base, tax_rate: "", primary_email: " " })).toEqual({ tax_rate: null, primary_email: null });
  });

  it("keeps a rate that isn't a number as typed, so the form stays changed and Save can say why", () => {
    expect(diff(base, { ...base, tax_rate: "abc" })).toEqual({ tax_rate: "abc" });
    expect(taxRateError("abc")).toBe("The tax rate is a percent from 0 to 100.");
    expect(taxRateError("150")).toBe("The tax rate is a percent from 0 to 100.");
    expect(taxRateError("")).toBeNull();
    expect(taxRateError("7.5")).toBeNull();
  });

  it("sends a changed rate as a number", () => {
    expect(diff(base, { ...base, tax_rate: "10" })).toEqual({ tax_rate: 10 });
  });
});
