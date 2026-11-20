import { describe, it, expect } from "vitest";
import { bookingAssurances } from "@/lib/bookings/assurances";

// Each provider sets its own cancellation policy (owner ruling, Oct 18 2026):
// the booking page never promises a blanket refund window.
describe("bookingAssurances", () => {
  it("defers a paid session's refund to the provider's policy, with no number", () => {
    const lines = bookingAssurances(true, "Tunde Okafor");
    expect(lines).toContain("If you cancel, Tunde Okafor’s policy sets the refund. You see the amount before you confirm.");
    expect(lines.join(" ")).not.toMatch(/\d+ ?h(ours?)?\b|free cancellation/i);
  });

  it("handles a name ending in s and a missing name", () => {
    expect(bookingAssurances(true, "Iron Lens")[2]).toContain("Iron Lens’ policy");
    expect(bookingAssurances(true, " ")[2]).toContain("the provider’s policy");
  });

  it("states the API's cut-off for a free session, without calling it a refund", () => {
    const lines = bookingAssurances(false, "Tunde Okafor");
    expect(lines).toContain("You can cancel up to 24 hours before");
    expect(lines.join(" ")).not.toMatch(/free cancellation|refund/i);
  });
});
