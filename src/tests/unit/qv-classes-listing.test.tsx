import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ListingClassesSection } from "@/components/classes/ListingClassesSection";
import { ClassCancellationPolicyNotice } from "@/components/classes/ClassCancellationPolicyNotice";
import { ClassForm } from "@/app/dashboard/gym-owner/schedule/ClassForm";
import { TeachingClassesCard } from "@/components/classes/TeachingClassesCard";
import { bookableOccurrences, classBookingsService, type ClassBooking } from "@/lib/api/classBookings";
import { teamsService } from "@/lib/api/teams";
import {
  cancelWindowSentence,
  confirmedCancelCopy,
  readCancellationPolicy,
} from "@/lib/classes/cancellationPolicy";
import { planPerLabel } from "@/lib/marketplace/planDisplay";
import { MembershipPlanType } from "@/lib/types";

/**
 * Demo-gym findings (Q-V, Nov 23 2026): classes name their club and a team
 * instructor, a started class isn't offered, a booked class reads Booked,
 * the gym's cancellation window shows without a fee, and a quarterly plan
 * reads "/ quarter".
 */

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("plan cadence", () => {
  const per = (duration_days: number) => planPerLabel({ plan_type: MembershipPlanType.SUBSCRIPTION, duration_days });
  it("names the usual cadences, a quarter included", () => {
    expect(per(7)).toBe("/ week");
    expect(per(30)).toBe("/ month");
    expect(per(90)).toBe("/ quarter");
    expect(per(180)).toBe("/ 6 months");
    expect(per(365)).toBe("/ year");
    expect(per(45)).toBe("/ 45 days");
  });
});

describe("a cancellation window with no fee", () => {
  const policy = readCancellationPolicy({ provider_name: "Imole Forge", window_hours: 12, fee_percent: 0, note: null });

  it("is kept, and asked for without any fee wording", () => {
    expect(policy).toEqual({ provider_name: "Imole Forge", window_hours: 12, fee_percent: 0, note: null });
    expect(cancelWindowSentence(policy)).toBe("Please cancel at least 12 hours before the class.");
    expect(confirmedCancelCopy(policy)).toContain("Please cancel at least 12 hours before the class.");
    expect(confirmedCancelCopy(policy)).not.toMatch(/fee/i);
  });

  it("shows on the timetable notice", () => {
    render(<ClassCancellationPolicyNotice policy={policy} />);
    expect(screen.getByTestId("class-cancellation-policy")).toHaveTextContent(
      "Please cancel at least 12 hours before the class.",
    );
    expect(screen.queryByText(/fee/i)).toBeNull();
  });

  it("a fee keeps its own sentence", () => {
    const fee = readCancellationPolicy({ provider_name: "X", window_hours: 24, fee_percent: 50, note: null });
    expect(cancelWindowSentence(fee)).toMatch(/may incur a 50% late-cancellation fee/);
  });
});

describe("which occurrences can be booked", () => {
  // Mon 23 Nov 2026, 23:10 in Lagos (22:10 UTC): the demo gym's finding.
  const now = new Date("2026-11-23T22:10:00Z");

  it("skips today's class once it has started in the gym's zone", () => {
    expect(
      bookableOccurrences({ day_of_week: 1, start_time: "18:30" }, { timeZone: "Africa/Lagos", now, count: 2 }),
    ).toEqual(["2026-11-30", "2026-12-07"]);
  });

  it("offers today's class while it is still ahead, in the gym's zone", () => {
    // 22:10 UTC is still Monday 23:10 in Lagos but already Tuesday in Auckland.
    expect(
      bookableOccurrences({ day_of_week: 1, start_time: "23:30" }, { timeZone: "Africa/Lagos", now, count: 1 }),
    ).toEqual(["2026-11-23"]);
    expect(
      bookableOccurrences({ day_of_week: 2, start_time: "12:00" }, { timeZone: "Pacific/Auckland", now, count: 1 }),
    ).toEqual(["2026-11-24"]);
  });

  it("closes an occurrence inside the gym's booking lead time", () => {
    expect(
      bookableOccurrences(
        { day_of_week: 1, start_time: "23:30" },
        { timeZone: "Africa/Lagos", leadHours: 1, now, count: 1 },
      ),
    ).toEqual(["2026-11-30"]);
  });
});

describe("a class row on the gym's listing", () => {
  const spin = {
    _id: "c1", organization_id: "o1", name: "Spin · Lekki", day_of_week: 1, start_time: "06:30",
    duration_minutes: 45, capacity: 20, waitlist_enabled: true, is_active: true, created_at: "", updated_at: "",
    instructor_name: "Amaka Okafor", location_id: "loc1", location: { id: "loc1", name: "Lekki Phase 1" },
  };

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-11-23T22:10:00Z"), toFake: ["Date"] });
    vi.spyOn(classBookingsService, "getListingClasses").mockResolvedValue({
      success: true,
      data: [spin],
      cancellation_policy: null,
      time_zone: "Africa/Lagos",
      booking_lead_time_hours: 0,
    } as Awaited<ReturnType<typeof classBookingsService.getListingClasses>>);
  });

  const booking = (over: Partial<ClassBooking> = {}): ClassBooking => ({
    _id: "b1", class_id: "c1", organization_id: "o1", member_user_id: "u1", listing_id: "l1",
    booking_date: "2026-11-30", status: "confirmed", cancelled_at: null, cancellation_fee_applied: false,
    created_at: "", updated_at: "", ...over,
  });

  it("names the club and the instructor, and never offers today's started class", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({ success: true, data: [] });
    wrap(<ListingClassesSection listingId="l1" />);
    const row = (await screen.findByText("Spin · Lekki")).closest("div.rounded-\\(--r-2\\)") as HTMLElement;
    expect(within(row).getByText(/Lekki Phase 1/)).toBeInTheDocument();
    expect(within(row).getByText(/Amaka Okafor/)).toBeInTheDocument();
    expect(within(row).queryByText(/Nov 23/)).toBeNull();
    expect(within(row).getAllByText(/Nov 30/).length).toBeGreaterThan(0);
  });

  it("reads Booked · Cancel for a date the member holds, and cancels it", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({ success: true, data: [booking()] });
    const cancel = vi
      .spyOn(classBookingsService, "cancelClassBooking")
      .mockResolvedValue({ success: true, data: booking({ status: "cancelled_by_member" }) });
    wrap(<ListingClassesSection listingId="l1" />);
    const button = await screen.findByRole("button", { name: "Booked · Cancel" });
    expect(screen.queryByRole("button", { name: "Book" })).toBeNull();
    await userEvent.setup().click(button);
    const dialog = await screen.findByRole("dialog");
    await userEvent.setup().click(within(dialog).getByRole("button", { name: "Cancel booking" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("b1"));
  });
});

describe("the new-class form", () => {
  const loc = (id: string, name: string) => ({
    _id: id, organization_id: "o1", name, is_primary: id === "l1", is_active: true, created_at: "", updated_at: "",
  });

  beforeEach(() => {
    vi.spyOn(teamsService, "getLocations").mockResolvedValue({
      success: true,
      data: [loc("l1", "Lekki Phase 1"), loc("l2", "Yaba")],
    });
    vi.spyOn(teamsService, "getMembers").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "m1", organization_id: "o1", status: "active",
          user_id: { _id: "u9", first_name: "Tunde", last_name: "Bakare", email: "t@x.test" },
          team_role_id: { _id: "r1", name: "Consultant / Trainer", code: "consultant" },
        },
        {
          _id: "m2", organization_id: "o1", status: "removed",
          user_id: { _id: "u8", first_name: "Gone", last_name: "Person", email: "g@x.test" },
          team_role_id: { _id: "r1", name: "Consultant / Trainer", code: "consultant" },
        },
      ],
    } as unknown as Awaited<ReturnType<typeof teamsService.getMembers>>);
  });

  async function pick(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
    await user.click(screen.getByLabelText(label));
    await user.click(await screen.findByText(option, { selector: "li" }));
  }

  it("asks where the class runs when the gym has more than one club", async () => {
    const onSubmit = vi.fn();
    wrap(<ClassForm organizationId="o1" saving={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Class name"), "Spin");
    await screen.findByLabelText("Location");
    await user.click(screen.getByRole("button", { name: "Save class" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Choose where the class runs.")).toBeInTheDocument();

    await pick(user, "Location", "Yaba");
    await user.click(screen.getByRole("button", { name: "Save class" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ location_id: "l2" }));
  });

  it("picks the instructor from the active team, or takes a typed name", async () => {
    const onSubmit = vi.fn();
    wrap(<ClassForm organizationId="o1" saving={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Class name"), "Spin");
    await screen.findByLabelText("Location");
    await pick(user, "Location", "Lekki Phase 1");
    await waitFor(() => expect(teamsService.getMembers).toHaveBeenCalled());
    await user.click(screen.getByLabelText("Instructor"));
    await screen.findByText("Tunde Bakare", { selector: "li" });
    expect(screen.queryByText(/Gone Person/, { selector: "li" })).toBeNull();
    await user.click(screen.getByText("Tunde Bakare", { selector: "li" }));
    await user.click(screen.getByRole("button", { name: "Save class" }));
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ instructor_user_id: "u9", location_id: "l1" }),
    );

    await pick(user, "Instructor", "Someone else");
    await user.type(screen.getByLabelText("Instructor name"), "Guest coach");
    await user.click(screen.getByRole("button", { name: "Save class" }));
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ instructor_user_id: null, instructor_name: "Guest coach" }),
    );
  });
});

describe("a staff trainer's classes", () => {
  it("lists the classes the gym linked them to, with the club", async () => {
    vi.spyOn(classBookingsService, "getMyTeachingClasses").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "c1", organization_id: "o1", name: "Strength Foundations", day_of_week: 1, start_time: "18:30",
          duration_minutes: 60, capacity: 12, waitlist_enabled: true, is_active: true, created_at: "", updated_at: "",
          organization_name: "Imole Forge", time_zone: "Africa/Lagos", location: { id: "l2", name: "Yaba" },
        },
      ],
    });
    wrap(<TeachingClassesCard />);
    expect(await screen.findByText("Classes you teach")).toBeInTheDocument();
    expect(screen.getByText(/Strength Foundations/)).toHaveTextContent("Strength Foundations · Yaba · 60m");
  });

  it("shows nothing for a coach who teaches no class", async () => {
    const read = vi.spyOn(classBookingsService, "getMyTeachingClasses").mockResolvedValue({ success: true, data: [] });
    const { container } = wrap(<TeachingClassesCard />);
    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
