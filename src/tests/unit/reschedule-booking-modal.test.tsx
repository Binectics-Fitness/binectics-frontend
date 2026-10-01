import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { isSlotRefusal, localDayKey, localTimeKey } from "@/lib/bookings/slots";

const inTwoDays = new Date(Date.now() + 2 * 86_400_000);
inTwoDays.setHours(9, 0, 0, 0);
const at = (h: number, m = 0) => {
  const d = new Date(inTwoDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const booking: ConsultationBooking = {
  id: "b1",
  clientUserId: "c1",
  providerId: "p1",
  consultationTypeId: "t1",
  startsAt: at(9),
  endsAt: at(10),
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.CONFIRMED,
  createdAt: "",
  updatedAt: "",
};

const slot = (iso: string, isAvailable = true) => ({
  startsAt: iso,
  endsAt: iso,
  providerTimezone: "Africa/Lagos",
  isAvailable,
});

describe("RescheduleBookingModal", () => {
  const getSlots = vi.spyOn(consultationsService, "getProviderSlots");

  beforeEach(() => {
    getSlots.mockReset();
  });

  it("offers only the provider's open times for the booking's session type, on the booking's day", async () => {
    getSlots.mockResolvedValue({
      success: true,
      data: [slot(at(9), false), slot(at(11)), slot(at(12), false), slot(at(14))],
    });
    render(<RescheduleBookingModal open booking={booking} onClose={vi.fn()} onConfirm={vi.fn()} />);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    expect(getSlots).toHaveBeenCalledWith("p1", {
      consultationTypeId: "t1",
      dateFrom: localDayKey(inTwoDays),
      dateTo: localDayKey(inTwoDays),
    });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      localTimeKey(at(11)),
      localTimeKey(at(14)),
    ]);
    expect(screen.getByRole("button", { name: "Confirm reschedule" })).toBeDisabled();
  });

  it("sends the slot's own start, unchanged", async () => {
    getSlots.mockResolvedValue({ success: true, data: [slot(at(11))] });
    const onConfirm = vi.fn().mockResolvedValue({ success: true });
    render(<RescheduleBookingModal open booking={booking} onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(await screen.findByRole("option"));
    await userEvent.click(screen.getByRole("button", { name: "Confirm reschedule" }));
    expect(onConfirm).toHaveBeenCalledWith(at(11), undefined);
  });

  it("shows the API's message on a 400 and reloads the open times", async () => {
    getSlots.mockResolvedValue({ success: true, data: [slot(at(11))] });
    const onConfirm = vi.fn().mockResolvedValue({
      success: false,
      status: 400,
      code: "CONSULTATION_SLOT_UNAVAILABLE",
      message: "That time isn't available. Pick one of the open times.",
    });
    render(<RescheduleBookingModal open booking={booking} onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(await screen.findByRole("option"));
    getSlots.mockResolvedValue({ success: true, data: [] });
    await userEvent.click(screen.getByRole("button", { name: "Confirm reschedule" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That time isn't available. Pick one of the open times.",
    );
    await waitFor(() => expect(screen.getByTestId("reschedule-no-slots")).toBeInTheDocument());
    expect(getSlots).toHaveBeenCalledTimes(2);
  });
});

describe("isSlotRefusal", () => {
  it("is the not-offered 400 and the taken 409, nothing else", () => {
    expect(isSlotRefusal({ success: false, status: 400, code: "CONSULTATION_SLOT_UNAVAILABLE" })).toBe(true);
    expect(isSlotRefusal({ success: false, status: 409, code: "SLOT_UNAVAILABLE" })).toBe(true);
    expect(isSlotRefusal({ success: false, status: 400, code: "VALIDATION" })).toBe(false);
    expect(isSlotRefusal({ success: true })).toBe(false);
  });
});

describe("localDayKey", () => {
  it("is the local calendar day", () => {
    expect(localDayKey(new Date(2026, 0, 5, 0, 30))).toBe("2026-01-05");
  });
});
