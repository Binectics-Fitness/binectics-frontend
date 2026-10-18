import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyClassBookingsCard } from "@/components/classes/MyClassBookingsCard";
import { ListingClassesSection } from "@/components/classes/ListingClassesSection";
import {
  classBookingsService,
  keepsWaitlistPlace,
  nextOccurrences,
  type ClassBooking,
} from "@/lib/api/classBookings";

/**
 * A waitlisted member whose class has a free spot (one that sat open while
 * the members waiting couldn't take it) takes it by booking again. The API
 * fills open spots in waitlist order, so "someone ahead of you got it" and
 * "no spot yet" are answers, not failures: the member keeps their place.
 */

const auth: { user: { id: string } | null } = { user: { id: "u1" } };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const SPOT_TAKEN = "The open spot went to a member ahead of you on the waitlist. You keep your place.";
const spin = { _id: "c1", name: "Spin", start_time: "07:00", duration_minutes: 45, instructor_name: null, day_of_week: 1 };

const booking = (over: Partial<ClassBooking> = {}): ClassBooking => ({
  _id: "b1",
  class_id: spin as ClassBooking["class_id"],
  organization_id: "o1",
  member_user_id: "u1",
  listing_id: "l1",
  booking_date: "2026-10-26",
  status: "waitlisted",
  spot_open: true,
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
const bookClass = vi.spyOn(classBookingsService, "bookClass");

beforeEach(() => {
  auth.user = { id: "u1" };
});
afterEach(() => vi.clearAllMocks());

describe("keepsWaitlistPlace", () => {
  it("knows the API's codes, and the spot-taken words from an API without them", () => {
    expect(keepsWaitlistPlace({ success: false, status: 400, code: "CLASS_WAITLIST_SPOT_TAKEN" })).toBe(true);
    expect(keepsWaitlistPlace({ success: false, status: 400, code: "CLASS_ALREADY_WAITLISTED" })).toBe(true);
    expect(keepsWaitlistPlace({ success: false, status: 400, message: SPOT_TAKEN })).toBe(true);
    expect(keepsWaitlistPlace({ success: false, status: 400, message: "This class is full" })).toBe(false);
    expect(keepsWaitlistPlace({ success: true })).toBe(false);
  });
});

describe("MyClassBookingsCard: Take the spot", () => {
  it("is offered on a waitlisted booking whose class has a free spot, and books it", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking()] });
    bookClass.mockResolvedValue({ success: true, data: booking({ status: "confirmed", spot_open: undefined }) });
    wrap(<MyClassBookingsCard />);

    expect(await screen.findByText("A spot is open.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Take the spot in Spin/ }));

    expect(bookClass).toHaveBeenCalledWith("l1", "c1", "2026-10-26");
    expect(await screen.findByRole("status")).toHaveTextContent(/^You're in for /);
  });

  it("says plainly when the spot went to someone ahead, not as an error", async () => {
    myBookings.mockResolvedValueOnce({ success: true, data: [booking()] });
    myBookings.mockResolvedValue({ success: true, data: [booking({ spot_open: false })] });
    bookClass.mockResolvedValue({ success: false, status: 400, code: "CLASS_WAITLIST_SPOT_TAKEN", message: SPOT_TAKEN });
    wrap(<MyClassBookingsCard />);

    await userEvent.click(await screen.findByRole("button", { name: /Take the spot/ }));

    const note = await screen.findByRole("status");
    expect(note).toHaveTextContent(SPOT_TAKEN);
    expect(note.getAttribute("style")).toContain("var(--fg-2)");
    // The list is read again: no spot now, so no button; still waitlisted.
    expect(await screen.findByText("Waitlist")).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole("button", { name: /Take the spot/ })).toBeNull());
  });

  it("shows any other refusal as an error", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking()] });
    bookClass.mockResolvedValue({ success: false, status: 400, message: "This class has already started" });
    wrap(<MyClassBookingsCard />);

    await userEvent.click(await screen.findByRole("button", { name: /Take the spot/ }));

    const note = await screen.findByRole("status");
    expect(note).toHaveTextContent("This class has already started");
    expect(note.getAttribute("style")).toContain("var(--danger)");
  });

  it.each([
    ["the class is still full", { spot_open: false }],
    ["the booking is confirmed", { status: "confirmed" as const, spot_open: undefined }],
    ["an old booking has no listing to book through", { listing_id: null }],
  ])("is not offered when %s", async (_label, over) => {
    myBookings.mockResolvedValue({ success: true, data: [booking(over)] });
    wrap(<MyClassBookingsCard />);
    expect(await screen.findByText("Spin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Take the spot/ })).toBeNull();
    expect(screen.queryByText("A spot is open.")).toBeNull();
  });
});

describe("ListingClassesSection: a waitlisted member", () => {
  const [first] = nextOccurrences(1, 4);
  beforeEach(() => {
    vi.spyOn(classBookingsService, "getListingClasses").mockResolvedValue({
      success: true,
      data: [{ ...spin, organization_id: "o1", capacity: 12, waitlist_enabled: true } as never],
    });
  });

  it("is offered the open spot on that date", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ booking_date: first })] });
    bookClass.mockResolvedValue({ success: true, data: booking({ booking_date: first, status: "confirmed" }) });
    wrap(<ListingClassesSection listingId="l1" />);

    expect(await screen.findByText(/You're on the waitlist for .*, and a spot is open\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Take the spot" }));
    expect(bookClass).toHaveBeenCalledWith("l1", "c1", first);
    expect(await screen.findByRole("status")).toHaveTextContent(/^Booked for /);
  });

  it("hears that the spot went to someone ahead as information, keeping their place", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ booking_date: first })] });
    bookClass.mockResolvedValue({ success: false, status: 400, code: "CLASS_WAITLIST_SPOT_TAKEN", message: SPOT_TAKEN });
    wrap(<ListingClassesSection listingId="l1" />);

    await userEvent.click(await screen.findByRole("button", { name: "Take the spot" }));
    const note = await screen.findByRole("status");
    expect(note).toHaveTextContent(SPOT_TAKEN);
    expect(note.getAttribute("style")).toContain("var(--fg-2)");
  });

  it("with no spot open sees their place and a plain Book", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ booking_date: first, spot_open: false })] });
    wrap(<ListingClassesSection listingId="l1" />);

    expect(await screen.findByText(/You're on the waitlist for /)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Take the spot" })).toBeNull();
  });

  it("signed out: a previous member's cached bookings are not shown", async () => {
    // The cache key is shared, not per user: a sign-out can leave the last
    // member's entries behind in the same client.
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["myClassBookings"], [booking({ booking_date: first })]);
    auth.user = null;
    render(
      <QueryClientProvider client={client}>
        <ListingClassesSection listingId="l1" />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("button", { name: "Book" })).toBeInTheDocument();
    expect(screen.queryByText(/You're on the waitlist/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Take the spot" })).toBeNull();
  });

  it("signed out: the timetable doesn't ask for anyone's bookings", async () => {
    auth.user = null;
    wrap(<ListingClassesSection listingId="l1" />);
    expect(await screen.findByRole("button", { name: "Book" })).toBeInTheDocument();
    expect(myBookings).not.toHaveBeenCalled();
  });
});

describe("MyClassBookingsCard: Cancel asks in the app's dialog", () => {
  const cancelBooking = vi.spyOn(classBookingsService, "cancelClassBooking");

  it("cancels a confirmed booking only after the dialog, and never calls window.confirm", async () => {
    const nativeConfirm = vi.spyOn(window, "confirm");
    myBookings.mockResolvedValue({ success: true, data: [booking({ status: "confirmed", spot_open: undefined })] });
    cancelBooking.mockResolvedValue({ success: true, data: booking({ status: "cancelled_by_member" as ClassBooking["status"] }) });
    wrap(<MyClassBookingsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog", { name: /^Cancel Spin on / });
    expect(dialog).toHaveTextContent("If anyone is waiting, your spot goes to them.");
    expect(dialog).toHaveTextContent("the fee is recorded on your booking");
    expect(cancelBooking).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel booking" }));
    expect(cancelBooking).toHaveBeenCalledWith("b1");
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("calls a waitlisted booking leaving the waitlist, keeps it on Keep booking, and shows a refusal inline", async () => {
    myBookings.mockResolvedValue({ success: true, data: [booking({ spot_open: false })] });
    cancelBooking.mockResolvedValue({ success: false, message: "This class has already started." });
    wrap(<MyClassBookingsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    let dialog = await screen.findByRole("dialog", { name: "Leave the waitlist for Spin?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Keep booking" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cancelBooking).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    dialog = await screen.findByRole("dialog", { name: "Leave the waitlist for Spin?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Leave waitlist" }));
    expect(await screen.findByRole("status")).toHaveTextContent("This class has already started.");
  });
});
