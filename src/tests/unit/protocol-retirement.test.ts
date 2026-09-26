import { describe, it, expect } from "vitest";
import { conversionMessage, leftoverProtocolsText } from "@/components/programs/protocol-retirement";

const conv = (created: boolean, status: "draft" | "published" | "archived" = "draft") => ({
  template: { _id: "t", name: "PCOS", status },
  created,
});

describe("conversionMessage", () => {
  it("a fresh conversion is a draft to schedule and publish", () => {
    expect(conversionMessage("PCOS", conv(true))).toBe(
      '"PCOS" is now a draft program. Check the schedule, then publish it.',
    );
  });

  it("re-opening says it was already converted, and in what state", () => {
    // A stale tab: never tell someone to publish a program they already did.
    expect(conversionMessage("PCOS", conv(false, "published"))).toMatch(/already converted, and that program is published/);
    expect(conversionMessage("PCOS", conv(false, "archived"))).toMatch(/already converted, but that program is archived/);
    expect(conversionMessage("PCOS", conv(false, "draft"))).toBe('"PCOS" was already converted. Opening the draft.');
  });
});

describe("leftoverProtocolsText", () => {
  it("is null when nothing is left, so the Programs notice disappears", () => {
    expect(leftoverProtocolsText(0)).toBeNull();
  });

  it("speaks in the singular and the plural", () => {
    expect(leftoverProtocolsText(1)).toBe(
      "You have 1 protocol from before Programs. Open it as a program to keep using it.",
    );
    expect(leftoverProtocolsText(3)).toBe(
      "You have 3 protocols from before Programs. Open them as programs to keep using them.",
    );
  });
});
