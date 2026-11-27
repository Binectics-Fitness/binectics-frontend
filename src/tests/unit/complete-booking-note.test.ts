import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/lib/api/client";
import { consultationsService } from "@/lib/api/consultations";

describe("consultationsService.completeBooking", () => {
  const patch = vi.spyOn(apiClient, "patch");
  beforeEach(() => {
    patch.mockReset();
    patch.mockResolvedValue({ success: true, data: {} } as never);
  });

  it("sends the private note in the body", async () => {
    await consultationsService.completeBooking("b1", "Good fit. Send the PAR-Q.");
    expect(patch).toHaveBeenCalledWith("/consultations/bookings/b1/complete", { note: "Good fit. Send the PAR-Q." });
  });

  it("trims the note and keeps it within the API's 255 characters", async () => {
    await consultationsService.completeBooking("b1", `  ${"x".repeat(300)}  `);
    const body = patch.mock.calls[0][1] as { note: string };
    expect(body.note).toHaveLength(255);
  });

  it("sends an empty body, not an empty note, when there is none", async () => {
    await consultationsService.completeBooking("b1");
    expect(patch).toHaveBeenLastCalledWith("/consultations/bookings/b1/complete", {});
    await consultationsService.completeBooking("b1", "   ");
    expect(patch).toHaveBeenLastCalledWith("/consultations/bookings/b1/complete", {});
  });
});
