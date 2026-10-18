import { useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyClassBookingsCard } from "@/components/classes/MyClassBookingsCard";
import { ListingClassesSection } from "@/components/classes/ListingClassesSection";
import { ClassCancellationPolicyEditor } from "@/app/dashboard/gym-owner/settings/ClassCancellationPolicyEditor";
import { classBookingsService, type ClassBooking } from "@/lib/api/classBookings";
import {
  confirmedCancelCopy,
  lateCancelSentence,
  policyFromRules,
  readCancellationPolicy,
  type ClassCancellationPolicy,
} from "@/lib/classes/cancellationPolicy";
import type { BookingRules } from "@/lib/api/teams";

/**
 * The class late-cancellation fee is a policy the gym sets and members see,
 * never a charge (owner ruling, Oct 18 2026). Members see it before booking
 * and when they cancel; with no policy, no fee is mentioned at all.
 */

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

const POLICY: ClassCancellationPolicy = {
  provider_name: "Iron Temple",
  window_hours: 24,
  fee_percent: 50,
  note: null,
};
const SENTENCE =
  "Cancelling within 24 hours of the class may incur a 50% late-cancellation fee under Iron Temple’s policy.";

const spin = { _id: "c1", name: "Spin", start_time: "07:00", duration_minutes: 45, instructor_name: null, day_of_week: 1 };
const booking = (over: Partial<ClassBooking> = {}): ClassBooking => ({
  _id: "b1",
  class_id: spin as ClassBooking["class_id"],
  organization_id: "o1",
  member_user_id: "u1",
  listing_id: "l1",
  booking_date: "2026-10-26",
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

afterEach(() => vi.restoreAllMocks());

describe("the policy wording", () => {
  it("states the window, the fee and the gym, and says may, not will", () => {
    expect(lateCancelSentence(POLICY)).toBe(SENTENCE);
    expect(lateCancelSentence({ ...POLICY, window_hours: 1 })).toContain("within 1 hour of");
    expect(lateCancelSentence({ ...POLICY, provider_name: "Iron Gains" })).toContain("under Iron Gains’ policy");
    expect(lateCancelSentence({ ...POLICY, provider_name: "" })).toContain("under the gym’s policy");
  });

  it("has no fee sentence without both a fee and a window", () => {
    expect(lateCancelSentence(null)).toBeNull();
    expect(lateCancelSentence({ ...POLICY, fee_percent: 0 })).toBeNull();
    expect(lateCancelSentence({ ...POLICY, window_hours: 0 })).toBeNull();
  });

  it("reads nothing from an API without the policy, and a note alone as a policy", () => {
    expect(readCancellationPolicy(undefined)).toBeNull();
    expect(readCancellationPolicy({ provider_name: "X", fee_percent: 50, window_hours: 0, note: " " })).toBeNull();
    expect(readCancellationPolicy({ provider_name: "X", fee_percent: 50, window_hours: 0, note: "Tell us." })).toEqual({
      provider_name: "X",
      fee_percent: 0,
      window_hours: 0,
      note: "Tell us.",
    });
  });

  it("the cancel copy carries the fee sentence and note only when the gym has them", () => {
    expect(confirmedCancelCopy(null)).toBe("If anyone is waiting, your spot goes to them. To come back, you'd book again.");
    expect(confirmedCancelCopy(POLICY)).toBe(
      `If anyone is waiting, your spot goes to them. ${SENTENCE} To come back, you'd book again.`,
    );
    expect(confirmedCancelCopy({ ...POLICY, note: "Front desk." })).toContain("Iron Temple: “Front desk.”");
  });
});

describe("before booking: the listing timetable", () => {
  const listing = (policy: ClassCancellationPolicy | null) =>
    vi.spyOn(classBookingsService, "getListingClasses").mockResolvedValue({
      success: true,
      data: [{ ...spin, organization_id: "o1", capacity: 12, waitlist_enabled: false } as never],
      cancellation_policy: policy,
    });

  it("shows the gym's policy above the classes", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({ success: true, data: [] });
    listing({ ...POLICY, note: "Emergencies are waived." });
    wrap(<ListingClassesSection listingId="l1" />);
    const notice = await screen.findByTestId("class-cancellation-policy");
    expect(notice).toHaveTextContent(SENTENCE);
    expect(notice).toHaveTextContent("Emergencies are waived.");
  });

  it("mentions no fee when the gym has no policy", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({ success: true, data: [] });
    listing(null);
    wrap(<ListingClassesSection listingId="l1" />);
    expect(await screen.findByRole("button", { name: "Book" })).toBeInTheDocument();
    expect(screen.queryByTestId("class-cancellation-policy")).toBeNull();
    expect(screen.queryByText(/fee/i)).toBeNull();
  });
});

describe("cancelling: the confirmation dialog", () => {
  it("says what the gym's policy is", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({
      success: true,
      data: [booking({ cancellation_policy: POLICY })],
    });
    wrap(<MyClassBookingsCard />);
    expect(await screen.findByText(/Late cancellations may incur the gym’s fee\./)).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog", { name: /^Cancel Spin on / });
    expect(dialog).toHaveTextContent(SENTENCE);
  });

  it("mentions no fee when the gym has no policy", async () => {
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({
      success: true,
      data: [booking({ cancellation_policy: null })],
    });
    wrap(<MyClassBookingsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog", { name: /^Cancel Spin on / });
    expect(dialog).not.toHaveTextContent(/fee/i);
    expect(screen.queryByText(/Late cancellations may incur/)).toBeNull();
  });
});

describe("provider settings: the policy editor", () => {
  const BASE: Pick<BookingRules, "cancellation_fee_percent" | "cancellation_window_hours" | "cancellation_policy_note"> = {
    cancellation_fee_percent: 0,
    cancellation_window_hours: 0,
    cancellation_policy_note: "",
  };

  function Harness({ canManage = true, initial = BASE }: { canManage?: boolean; initial?: typeof BASE }) {
    const [rules, setRules] = useState(initial);
    return (
      <>
        <ClassCancellationPolicyEditor
          rules={rules}
          providerName="Iron Temple"
          canManage={canManage}
          onChange={(patch) => setRules((r) => ({ ...r, ...patch }))}
        />
        <output data-testid="saved">{JSON.stringify(rules)}</output>
      </>
    );
  }

  it("sets the window, the fee and a note, with a live preview of what members see", async () => {
    render(<Harness />);
    expect(screen.getByTestId("class-cancellation-policy-none")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Window (hours before class)"));
    await userEvent.type(screen.getByLabelText("Window (hours before class)"), "24");
    // Only the window: no fee yet, so members see none.
    expect(screen.getByText(/Set both a window and a fee/)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Late-cancellation fee (%)"));
    await userEvent.type(screen.getByLabelText("Late-cancellation fee (%)"), "50");
    await userEvent.type(screen.getByLabelText("Policy note (optional)"), "Emergencies are waived.");

    const preview = screen.getByTestId("class-cancellation-policy");
    expect(preview).toHaveTextContent(SENTENCE);
    expect(preview).toHaveTextContent("Emergencies are waived.");
    expect(JSON.parse(screen.getByTestId("saved").textContent!)).toEqual({
      cancellation_fee_percent: 50,
      cancellation_window_hours: 24,
      cancellation_policy_note: "Emergencies are waived.",
    });
  });

  it("caps the fee at 100% and clears the whole policy", async () => {
    render(<Harness initial={{ cancellation_fee_percent: 50, cancellation_window_hours: 24, cancellation_policy_note: "x" }} />);
    await userEvent.clear(screen.getByLabelText("Late-cancellation fee (%)"));
    await userEvent.type(screen.getByLabelText("Late-cancellation fee (%)"), "250");
    expect(screen.getByLabelText("Late-cancellation fee (%)")).toHaveValue(100);

    await userEvent.click(screen.getByRole("button", { name: "Clear policy" }));
    expect(JSON.parse(screen.getByTestId("saved").textContent!)).toEqual(BASE);
    expect(screen.getByTestId("class-cancellation-policy-none")).toBeInTheDocument();
  });

  it("is read-only for staff who cannot manage the organization", () => {
    render(<Harness canManage={false} initial={{ ...BASE, cancellation_fee_percent: 50, cancellation_window_hours: 24 }} />);
    expect(screen.getByLabelText("Window (hours before class)")).toBeDisabled();
    expect(screen.getByLabelText("Late-cancellation fee (%)")).toBeDisabled();
    expect(screen.getByLabelText("Policy note (optional)")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear policy" })).toBeNull();
    // They still see what members see.
    expect(within(screen.getByTestId("class-cancellation-policy")).getByText(SENTENCE)).toBeInTheDocument();
  });

  it("previews exactly what the API will send members", () => {
    expect(policyFromRules("Iron Temple", { cancellation_fee_percent: 50, cancellation_window_hours: 24 })).toEqual(POLICY);
    expect(policyFromRules("Iron Temple", { cancellation_fee_percent: 0, cancellation_window_hours: 24 })).toBeNull();
  });
});
