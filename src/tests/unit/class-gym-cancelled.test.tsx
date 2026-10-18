import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyClassBookingsCard } from "@/components/classes/MyClassBookingsCard";
import { ListingClassesSection } from "@/components/classes/ListingClassesSection";
import { apiClient } from "@/lib/api/client";
import {
  CLASS_REMOVED_MESSAGE,
  classBookingsService,
  classWasRemoved,
  nextOccurrences,
  type ClassBooking,
} from "@/lib/api/classBookings";

/**
 * When a gym deletes a class, the API cancels its upcoming bookings and
 * waitlist places and sends them apart from the live list, as
 * `cancelled_by_gym` (binectics-api #270). The member sees them muted, with
 * the reason, and can't act on them. A booking that races the deletion is
 * refused with 410 CLASS_REMOVED.
 */

const auth: { user: { id: string } | null } = { user: { id: "u1" } };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const spin = { _id: "c1", name: "Spin", start_time: "07:00", duration_minutes: 45, instructor_name: null, day_of_week: 1 };
const yoga = { ...spin, _id: "c2", name: "Sunrise yoga" };

const booking = (over: Partial<ClassBooking> = {}): ClassBooking => ({
  _id: "b1",
  class_id: spin as ClassBooking["class_id"],
  organization_id: "o1",
  member_user_id: "u1",
  listing_id: "l1",
  booking_date: "2099-01-05",
  status: "confirmed",
  cancelled_at: null,
  cancellation_fee_applied: false,
  created_at: "",
  updated_at: "",
  ...over,
});
const removed = booking({
  _id: "g1",
  class_id: yoga as ClassBooking["class_id"],
  status: "cancelled_by_gym",
  cancellation_reason: "Class removed by the gym",
});

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  auth.user = { id: "u1" };
});
afterEach(() => vi.restoreAllMocks());

describe("classBookingsService.getMyClassBookings", () => {
  const respond = (body: unknown) =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (n: string) => (n.toLowerCase() === "content-type" ? "application/json" : null) },
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response);

  it("hands back the gym's cancellations apart from the live list, and only those", async () => {
    respond({
      success: true,
      data: [booking()],
      cancelled_by_gym: [removed, booking({ _id: "x1", status: "confirmed" })],
    });
    const res = await classBookingsService.getMyClassBookings();
    expect(res.data?.map((b) => b._id)).toEqual(["b1"]);
    expect(res.cancelled_by_gym?.map((b) => b._id)).toEqual(["g1"]);
    expect(res.cancelled_by_gym?.[0].cancellation_reason).toBe("Class removed by the gym");
  });

  it("reads an API without the list as none", async () => {
    respond({ success: true, data: [booking()] });
    const res = await classBookingsService.getMyClassBookings();
    expect(res.cancelled_by_gym).toEqual([]);
    expect(res.envelope).toBeUndefined();
  });

  it("keeps the client's other envelope fields apart from data", async () => {
    respond({ success: true, data: [1], total: 9 });
    const res = await apiClient.get<number[]>("/x", false);
    expect(res.data).toEqual([1]);
    expect(res.envelope).toEqual({ total: 9 });
  });
});

describe("MyClassBookingsCard: classes the gym cancelled", () => {
  const myBookings = () => vi.spyOn(classBookingsService, "getMyClassBookings");

  it("shows one muted, with the reason and a neutral badge, and nothing to cancel or take", async () => {
    myBookings().mockResolvedValue({ success: true, data: [booking()], cancelled_by_gym: [removed] });
    wrap(<MyClassBookingsCard />);

    const row = await screen.findByTestId("class-cancelled-g1");
    expect(within(row).getByText("Sunrise yoga").getAttribute("style")).toContain("var(--fg-3)");
    expect(within(row).getByText("Class removed by the gym")).toBeInTheDocument();
    const badge = within(row).getByText("Cancelled by the gym").closest("[data-tone]");
    expect(badge?.getAttribute("data-tone")).toBe("neutral");
    expect(within(row).queryByRole("button")).toBeNull();
    // The live booking keeps its one Cancel.
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
  });

  it("shows the card for a gym cancellation alone", async () => {
    myBookings().mockResolvedValue({ success: true, data: [], cancelled_by_gym: [removed] });
    wrap(<MyClassBookingsCard />);
    expect(await screen.findByText("Gym classes")).toBeInTheDocument();
    expect(screen.getByText("Cancelled by the gym")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("works against an API without the list", async () => {
    myBookings().mockResolvedValue({ success: true, data: [booking()] });
    wrap(<MyClassBookingsCard />);
    expect(await screen.findByText("Spin")).toBeInTheDocument();
    expect(screen.queryByText("Cancelled by the gym")).toBeNull();
  });

  it("renders nothing with neither list", async () => {
    const spy = myBookings().mockResolvedValue({ success: true, data: [], cancelled_by_gym: [] });
    const { container } = wrap(<MyClassBookingsCard />);
    await vi.waitFor(() => expect(spy).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

describe("booking a class the gym just removed", () => {
  const gone = { success: false, status: 410, code: "CLASS_REMOVED", message: "The gym has just taken this class off its timetable." };

  it("knows the refusal by its code, and by 410 from an API that sends no code", () => {
    expect(classWasRemoved(gone)).toBe(true);
    expect(classWasRemoved({ success: false, status: 410 })).toBe(true);
    expect(classWasRemoved({ success: false, status: 400, message: "This class is full" })).toBe(false);
    expect(classWasRemoved({ success: true })).toBe(false);
  });

  it("ListingClassesSection says so plainly", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(classBookingsService, "getListingClasses").mockResolvedValue({
      success: true,
      data: [{ ...spin, organization_id: "o1", capacity: 12, waitlist_enabled: true } as never],
    });
    const book = vi.spyOn(classBookingsService, "bookClass").mockResolvedValue(gone);
    wrap(<ListingClassesSection listingId="l1" />);

    await userEvent.click(await screen.findByRole("button", { name: "Book" }));
    expect(book).toHaveBeenCalledWith("l1", "c1", nextOccurrences(1, 4)[0]);
    const note = await screen.findByRole("status");
    expect(note).toHaveTextContent(CLASS_REMOVED_MESSAGE);
    expect(note.getAttribute("style")).toContain("var(--danger");
  });
});
