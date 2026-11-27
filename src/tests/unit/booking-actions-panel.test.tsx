import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingActionsPanel } from "@/components/BookingActionsPanel";
import { consultationsService, ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";

vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const booking = {
  id: "b1",
  status: ConsultationBookingStatus.CONFIRMED,
  startsAt: "2026-11-25T07:00:00.000Z",
  endsAt: "2026-11-25T07:15:00.000Z",
} as ConsultationBooking;
const NOW = Date.parse("2026-11-26T09:00:00.000Z");

const complete = vi.spyOn(consultationsService, "completeBooking");
const noShow = vi.spyOn(consultationsService, "markNoShow");

describe("close-out panel", () => {
  beforeEach(() => {
    complete.mockReset().mockResolvedValue({ success: true, data: booking } as never);
    noShow.mockReset().mockResolvedValue({ success: true, data: booking } as never);
  });
  const mount = (b = booking, now = NOW) => render(<BookingActionsPanel booking={b} now={now} onActionComplete={vi.fn()} />);

  it("closes out as Done and sends the private note", async () => {
    mount();
    await userEvent.type(screen.getByLabelText("Private note"), "Good fit.");
    expect(screen.getByText("9 / 255")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close out" }));
    expect(complete).toHaveBeenCalledWith("b1", "Good fit.");
    expect(noShow).not.toHaveBeenCalled();
  });

  it("caps the note at 255 characters", () => {
    mount();
    expect(screen.getByLabelText("Private note")).toHaveAttribute("maxLength", "255");
  });

  it("marks a no-show, with no note field", async () => {
    mount();
    await userEvent.click(screen.getByRole("button", { name: "No-show" }));
    expect(screen.queryByLabelText("Private note")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Close out" }));
    expect(noShow).toHaveBeenCalledWith("b1");
    expect(complete).not.toHaveBeenCalled();
  });

  it("says when the session becomes a no-show if left open", () => {
    mount();
    // Ends Wed 25 Nov; the API's 7-day grace makes it Wed 2 Dec.
    expect(screen.getByText(/No-show on .*2 Dec if left open/)).toBeInTheDocument();
  });

  it("is disabled until the session has started", () => {
    mount(booking, Date.parse("2026-11-24T09:00:00.000Z"));
    expect(screen.getByRole("button", { name: "Close out" })).toBeDisabled();
  });
});
