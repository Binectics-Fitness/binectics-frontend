import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RescheduleBookingButton } from "@/components/bookings/RescheduleBookingButton";
import { TeamSessionsCard } from "@/app/dashboard/gym-owner/schedule/TeamSessionsCard";
import { toast } from "@/components/Toast";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { isSlotRefusal, localTimeKey } from "@/lib/bookings/slots";

vi.mock("@/contexts/OrganizationContext", () => ({ useOptionalOrganization: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const inTwoDays = new Date(Date.now() + 2 * 86_400_000);
const at = (h: number) => {
  const d = new Date(inTwoDays);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const booking = (over: Partial<ConsultationBooking> = {}): ConsultationBooking => ({
  id: "b1",
  clientUserId: "c1",
  clientFirstName: "Ngozi",
  clientLastName: "Eze",
  providerId: "p1",
  consultationTypeId: "t1",
  consultationTypeName: "PT",
  startsAt: at(9),
  endsAt: at(10),
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.CONFIRMED,
  createdAt: "",
  updatedAt: "",
  ...over,
});

const slot = (iso: string) => ({
  startsAt: iso,
  endsAt: iso,
  providerTimezone: "Africa/Lagos",
  isAvailable: true,
});

describe("isSlotRefusal", () => {
  it("knows the refused, taken and conflict answers", () => {
    expect(isSlotRefusal({ success: false, code: "CONSULTATION_SLOT_UNAVAILABLE", status: 400 })).toBe(true);
    expect(isSlotRefusal({ success: false, code: "CONSULTATION_SLOT_TAKEN", status: 409 })).toBe(true);
    expect(isSlotRefusal({ success: false, code: "VALIDATION_ERROR", status: 400 })).toBe(false);
  });
});

describe("RescheduleBookingButton", () => {
  const getSlots = vi.spyOn(consultationsService, "getProviderSlots");
  const reschedule = vi.spyOn(consultationsService, "rescheduleBooking");

  beforeEach(() => {
    getSlots.mockReset();
    reschedule.mockReset();
    vi.mocked(toast.success).mockClear();
  });

  it("is not offered once a session can no longer move", () => {
    for (const status of [
      ConsultationBookingStatus.COMPLETED,
      ConsultationBookingStatus.CANCELLED,
      ConsultationBookingStatus.NO_SHOW,
    ]) {
      const { container, unmount } = render(
        <RescheduleBookingButton booking={booking({ status })} onRescheduled={vi.fn()} />,
      );
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it("moves to an open time, tells the provider who was told, and refetches", async () => {
    getSlots.mockResolvedValue({ success: true, data: [slot(at(11))] });
    reschedule.mockResolvedValue({ success: true, data: booking({ startsAt: at(11) }) });
    const onRescheduled = vi.fn();
    render(<RescheduleBookingButton booking={booking()} onRescheduled={onRescheduled} />);

    await userEvent.click(screen.getByRole("button", { name: "Move session" }));
    await userEvent.click(await screen.findByRole("option", { name: localTimeKey(at(11)) }));
    await userEvent.type(screen.getByLabelText("Reason (optional)"), "Clinic overran");
    await userEvent.click(screen.getByRole("button", { name: "Confirm reschedule" }));

    expect(reschedule).toHaveBeenCalledWith("b1", { startsAt: at(11), reason: "Clinic overran" });
    await waitFor(() => expect(onRescheduled).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Session moved. Your client has been told.");
    expect(screen.queryByRole("button", { name: "Confirm reschedule" })).not.toBeInTheDocument();
  });

  it("shows the server's reason when the hours refuse the time, and reloads the open times", async () => {
    getSlots.mockResolvedValue({ success: true, data: [slot(at(11))] });
    reschedule.mockResolvedValue({
      success: false,
      status: 400,
      code: "CONSULTATION_SLOT_UNAVAILABLE",
      message: "The provider isn't working that day. Pick one of the open times.",
    });
    const onRescheduled = vi.fn();
    render(<RescheduleBookingButton booking={booking()} audience="staff" onRescheduled={onRescheduled} />);

    await userEvent.click(screen.getByRole("button", { name: "Move session" }));
    expect(
      screen.getByText("Pick one of the provider's open times. We'll let the client and the provider know."),
    ).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("option"));
    await userEvent.click(screen.getByRole("button", { name: "Confirm reschedule" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The provider isn't working that day. Pick one of the open times.",
    );
    expect(getSlots).toHaveBeenCalledTimes(2);
    expect(onRescheduled).not.toHaveBeenCalled();
  });
});

describe("TeamSessionsCard (gym schedule)", () => {
  const list = vi.spyOn(consultationsService, "getOrganizationBookings");

  beforeEach(() => list.mockReset());

  it("lists the team's upcoming sessions, soonest first, with who they're with and a move button", async () => {
    list.mockResolvedValue({
      success: true,
      data: [
        booking({ id: "late", startsAt: at(15), providerName: "Kemi Adeyemi" }),
        booking({ id: "done", status: ConsultationBookingStatus.COMPLETED, providerName: "Kemi Adeyemi" }),
        booking({ id: "early", startsAt: at(8), clientFirstName: "Bisi", clientLastName: "Alade", providerName: "Femi Okoro" }),
      ],
    });
    render(<TeamSessionsCard orgId="org1" />);

    const card = await screen.findByTestId("team-sessions");
    await waitFor(() => expect(within(card).getAllByRole("listitem")).toHaveLength(2));
    const rows = within(card).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Bisi Alade with Femi Okoro");
    expect(rows[1]).toHaveTextContent("Ngozi Eze with Kemi Adeyemi");
    expect(within(rows[0]).getByRole("button", { name: "Move session" })).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith("org1", expect.objectContaining({ from: expect.any(String), to: expect.any(String) }));
  });

  it("never shows the member's free text, whether the API sent it or left it out", async () => {
    const privateText = {
      notes: "Knee injury, on medication",
      completionNote: "Weighed 82kg",
      cancelReason: "Feeling unwell",
    };
    // As the owner gets it (fields present), and as staff get it (absent).
    list.mockResolvedValue({
      success: true,
      data: [
        booking({ id: "owner-view", startsAt: at(8), providerName: "Femi Okoro", ...privateText }),
        booking({ id: "staff-view", startsAt: at(9), providerName: "Kemi Adeyemi" }),
      ],
    });
    const getSlots = vi.spyOn(consultationsService, "getProviderSlots");
    getSlots.mockResolvedValue({ success: true, data: [slot(at(11))] });
    render(<TeamSessionsCard orgId="org1" />);

    const card = await screen.findByTestId("team-sessions");
    await waitFor(() => expect(within(card).getAllByRole("listitem")).toHaveLength(2));
    const rows = within(card).getAllByRole("listitem");
    expect(rows[1]).toHaveTextContent("Ngozi Eze with Kemi Adeyemi");

    // The move modal for either row shows none of it either.
    await userEvent.click(within(rows[0]).getByRole("button", { name: "Move session" }));
    await screen.findByRole("option", { name: localTimeKey(at(11)) });
    for (const text of Object.values(privateText)) {
      expect(screen.queryByText(new RegExp(text))).not.toBeInTheDocument();
    }
    getSlots.mockRestore();
  });

  it("stays out of the way for someone the API won't show them to", async () => {
    list.mockResolvedValue({ success: false, status: 404, message: "Organization not found" });
    const { container } = render(<TeamSessionsCard orgId="org1" />);
    await waitFor(() => expect(list).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("never shows a failed load as an empty list", async () => {
    list.mockResolvedValue({ success: false, status: 500, message: "" });
    render(<TeamSessionsCard orgId="org1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load your team's sessions.");
    expect(screen.queryByText(/No 1:1 sessions/)).not.toBeInTheDocument();
  });
});
