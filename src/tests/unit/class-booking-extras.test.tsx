import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyClassBookingsCard } from "@/components/classes/MyClassBookingsCard";
import { classBookingsService, type ClassBooking } from "@/lib/api/classBookings";
import { waitlistPlaceLabel } from "@/lib/bookings/waitlistPlace";
import { downloadIcs } from "@/lib/bookings/calendar";

vi.mock("@/lib/bookings/calendar", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/bookings/calendar")>()),
  downloadIcs: vi.fn(),
}));
const download = vi.mocked(downloadIcs);

/** Mobile #182 on web: the waitlist place and "Add to calendar" on gym classes. */

const auth: { user: { id: string } | null } = { user: { id: "u1" } };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const spin = { _id: "c1", name: "Spin", start_time: "07:00", duration_minutes: 45, instructor_name: null, day_of_week: 1 };
const booking = (over: Partial<ClassBooking> = {}): ClassBooking => ({
  _id: "b1",
  class_id: spin as ClassBooking["class_id"],
  organization_id: "o1",
  member_user_id: "u1",
  listing_id: "l1",
  booking_date: "2026-12-07",
  status: "confirmed",
  cancelled_at: null,
  cancellation_fee_applied: false,
  created_at: "",
  updated_at: "",
  ...over,
});

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const myBookings = vi.spyOn(classBookingsService, "getMyClassBookings");
afterEach(() => vi.clearAllMocks());

describe("waitlistPlaceLabel", () => {
  it("says the place with the right ordinal", () => {
    expect(waitlistPlaceLabel(1)).toBe("You're first in line.");
    expect(waitlistPlaceLabel(2)).toBe("You're 2nd in line.");
    expect(waitlistPlaceLabel(3)).toBe("You're 3rd in line.");
    expect(waitlistPlaceLabel(4)).toBe("You're 4th in line.");
    expect(waitlistPlaceLabel(11)).toBe("You're 11th in line.");
    expect(waitlistPlaceLabel(12)).toBe("You're 12th in line.");
    expect(waitlistPlaceLabel(21)).toBe("You're 21st in line.");
    expect(waitlistPlaceLabel(113)).toBe("You're 113th in line.");
  });

  it("says nothing when the API did not send a usable place", () => {
    expect(waitlistPlaceLabel(undefined)).toBe("");
    expect(waitlistPlaceLabel(null)).toBe("");
    expect(waitlistPlaceLabel(0)).toBe("");
    expect(waitlistPlaceLabel(1.5)).toBe("");
  });
});

describe("MyClassBookingsCard: waitlist place", () => {
  it("shows the member's place on a waitlisted booking with no spot open", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ status: "waitlisted", spot_open: false, waitlist_position: 2 })] });
    wrap(<MyClassBookingsCard />);
    expect(await screen.findByTestId("waitlist-place-b1")).toHaveTextContent("You're 2nd in line.");
    // A waitlist place is not on the calendar yet.
    expect(screen.queryByRole("button", { name: /to your calendar/ })).toBeNull();
  });

  it("shows nothing extra from an API without the position", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ status: "waitlisted", spot_open: false })] });
    wrap(<MyClassBookingsCard />);
    await screen.findByText("Spin");
    expect(screen.queryByTestId("waitlist-place-b1")).toBeNull();
  });

  it("an open spot says so instead of the place", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ status: "waitlisted", spot_open: true, waitlist_position: 1 })] });
    wrap(<MyClassBookingsCard />);
    expect(await screen.findByText("A spot is open.")).toBeInTheDocument();
    expect(screen.queryByTestId("waitlist-place-b1")).toBeNull();
  });
});

describe("MyClassBookingsCard: Add to calendar", () => {
  it("downloads the confirmed class as an .ics", async () => {
    download.mockImplementation(() => {});
    myBookings.mockResolvedValue({ success: true, data: [booking()] });
    wrap(<MyClassBookingsCard />);
    const button = await screen.findByRole("button", { name: /^Add Spin on .* to your calendar$/ });
    expect(button).toHaveStyle({ height: "44px" });
    await userEvent.click(button);
    expect(download).toHaveBeenCalledTimes(1);
    const event = download.mock.calls[0][0]!;
    expect(event.uid).toBe("class-b1");
    expect(event.title).toBe("Spin");
    expect(new Date(event.endIso).getTime() - new Date(event.startIso).getTime()).toBe(45 * 60000);
  });

  it("says so inline when the booking's time can't be read", async () => {
    download.mockImplementation(() => {
      throw new Error("This booking's time could not be read.");
    });
    myBookings.mockResolvedValue({ success: true, data: [booking()] });
    wrap(<MyClassBookingsCard />);
    await userEvent.click(await screen.findByRole("button", { name: /to your calendar/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("This booking's time could not be read.");
  });
});
