import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecurringBookingPage from "@/app/booking/recurring/page";
import { consultationsService } from "@/lib/api/consultations";
import { marketplaceService } from "@/lib/api/marketplace";
import { localDayKey } from "@/lib/bookings/slots";

// A day a week out; the default weekday is the start date's, so it is the
// first occurrence.
const first = new Date(Date.now() + 7 * 86_400_000);
first.setHours(0, 0, 0, 0);
const firstDay = localDayKey(first);
const at = (h: number, m = 0) => {
  const d = new Date(first);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams({ listingId: "l1", consultationTypeId: "t1", date: firstDay }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));

const slot = (iso: string, isAvailable = true) => ({
  startsAt: iso,
  endsAt: iso,
  providerTimezone: "Africa/Lagos",
  isAvailable,
});

describe("recurring booking page", () => {
  const getListing = vi.spyOn(marketplaceService, "getListingById");
  const getTypes = vi.spyOn(consultationsService, "getTypes");
  const getSlots = vi.spyOn(consultationsService, "getProviderSlots");
  const createBooking = vi.spyOn(consultationsService, "createBooking");

  beforeEach(() => {
    push.mockReset();
    getListing.mockReset().mockResolvedValue({
      success: true,
      data: { _id: "l1", professional_id: "p1", headline: "Coach Ada" } as never,
    });
    getTypes.mockReset().mockResolvedValue({
      success: true,
      data: [{ id: "t1", name: "Check-in", defaultDurationMinutes: 60, priceMinor: 0 } as never],
    });
    getSlots.mockReset();
    createBooking.mockReset();
  });

  it("books at an open time from the first session's day and lists each occurrence the API refused", async () => {
    getSlots.mockResolvedValue({ success: true, data: [slot(at(9), false), slot(at(10))] });
    createBooking
      .mockResolvedValueOnce({ success: true, data: {} as never })
      .mockResolvedValueOnce({
        success: false,
        status: 400,
        code: "CONSULTATION_SLOT_UNAVAILABLE",
        message: "That time isn't available. Pick one of the open times.",
      })
      .mockResolvedValue({ success: true, data: {} as never });

    render(<RecurringBookingPage />);
    const submit = await screen.findByRole("button", { name: "Create recurring bookings" });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(getSlots).toHaveBeenCalledWith("p1", {
      consultationTypeId: "t1",
      dateFrom: firstDay,
      dateTo: firstDay,
    });

    await userEvent.click(submit);
    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(12));
    // The first occurrence is the offered slot itself.
    expect(createBooking.mock.calls[0][0].startsAt).toBe(at(10));

    const failures = await screen.findByTestId("recurring-failures");
    expect(failures).toHaveTextContent("That time isn't available. Pick one of the open times.");
    expect(failures.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByText(/Booked 11 of 12/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("can't submit when the first session's day has no open time", async () => {
    getSlots.mockResolvedValue({ success: true, data: [slot(at(9), false)] });
    render(<RecurringBookingPage />);
    expect(await screen.findByTestId("recurring-no-times")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create recurring bookings" })).toBeDisabled();
  });
});
