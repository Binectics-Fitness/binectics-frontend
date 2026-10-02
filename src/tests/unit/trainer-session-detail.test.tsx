import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrainerSessionDetailPage from "@/app/dashboard/trainer/sessions/[sessionId]/page";
import {
  consultationsService,
  ConsultationBookingStatus,
  ConsultationCancelledBy,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { formatMinor } from "@/lib/currencies/helpers";
import { localTimeKey } from "@/lib/bookings/slots";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      <div data-testid="shell-actions">{actions}</div>
      {children}
    </div>
  ),
}));
vi.mock("@/contexts/OrganizationContext", () => ({ useOptionalOrganization: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const inTwoDays = new Date(Date.now() + 2 * 86_400_000);
inTwoDays.setHours(9, 0, 0, 0);
const at = (h: number) => {
  const d = new Date(inTwoDays);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const session: ConsultationBooking = {
  id: "6650aa00bb11cc22dd33ee44",
  clientUserId: "c1",
  clientFirstName: "Linda",
  clientLastName: "Mokoena",
  providerId: "p1",
  consultationTypeId: "t1",
  consultationTypeName: "1:1 strength",
  startsAt: at(9),
  endsAt: at(10),
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.CONFIRMED,
  notes: "Knee is sore",
  price: { amountMinor: 1_500_000, currency: "NGN" },
  receipt: { reference: "bkg_xyz", paidAt: "2026-09-20T10:15:00.000Z" },
  createdAt: "",
  updatedAt: "",
};
const ok = <T,>(data: T) => ({ success: true, data });

/** A params promise React.use reads synchronously, as Next hands it over once resolved. */
function resolvedParams(sessionId: string): Promise<{ sessionId: string }> {
  const p = Promise.resolve({ sessionId }) as Promise<{ sessionId: string }> & {
    status?: string;
    value?: { sessionId: string };
  };
  p.status = "fulfilled";
  p.value = { sessionId };
  return p;
}

function renderPage(id = session.id) {
  return render(
    <Suspense fallback={null}>
      <TrainerSessionDetailPage params={resolvedParams(id)} />
    </Suspense>,
  );
}

describe("trainer session detail page", () => {
  const get = vi.spyOn(consultationsService, "getBooking");
  const complete = vi.spyOn(consultationsService, "completeBooking");
  const reschedule = vi.spyOn(consultationsService, "rescheduleBooking");
  const slots = vi.spyOn(consultationsService, "getProviderSlots");

  beforeEach(() => {
    get.mockReset();
    complete.mockReset();
    reschedule.mockReset();
    slots.mockReset();
  });

  it("shows the real session: client, type, status, notes and payment, with no invented workout data", async () => {
    get.mockResolvedValue(ok(session));
    renderPage();
    expect(await screen.findByRole("heading", { name: "Linda Mokoena" })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(session.id);
    expect(screen.getByText("1:1 strength")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Knee is sore")).toBeInTheDocument();
    const payment = screen.getByTestId("payment-state");
    expect(payment).toHaveTextContent("Paid");
    expect(payment).toHaveTextContent(formatMinor("NGN", 1_500_000));
    expect(payment).toHaveTextContent("Ref bkg_xyz");
    expect(within(payment).getByRole("link", { name: "Receipt" })).toHaveAttribute(
      "href",
      `/booking/${session.id}/receipt`,
    );
    expect(screen.queryByText(/Sets logged|RPE|PR/)).toBeNull();
  });

  it("shows a free session as free and a cancel reason when there is one", async () => {
    get.mockResolvedValue(
      ok({
        ...session,
        price: undefined,
        receipt: undefined,
        status: ConsultationBookingStatus.CANCELLED,
        cancelledBy: ConsultationCancelledBy.CLIENT,
        cancelReason: "Travelling",
      }),
    );
    renderPage();
    expect(await screen.findByTestId("payment-state")).toHaveTextContent("Free session");
    expect(screen.getByText("Cancelled by client")).toBeInTheDocument();
    expect(screen.getByText("Travelling")).toBeInTheDocument();
    // A cancelled session has nothing to move.
    expect(screen.queryByRole("button", { name: "Reschedule" })).toBeNull();
  });

  it("shows an unpaid hold as awaiting payment, not paid", async () => {
    get.mockResolvedValue(
      ok({
        ...session,
        status: ConsultationBookingStatus.PENDING,
        receipt: undefined,
        payment: { reference: "bkg_xyz", amountMinor: 1_500_000, currency: "NGN", expiresAt: at(8) },
      }),
    );
    renderPage();
    const payment = await screen.findByTestId("payment-state");
    expect(payment).toHaveTextContent("Awaiting payment");
    expect(within(payment).queryByRole("link", { name: "Receipt" })).toBeNull();
  });

  it("says the session is not found on a 404", async () => {
    get.mockResolvedValue({ success: false, status: 404, message: "Booking not found" });
    renderPage("missing");
    expect(await screen.findByText("Session not found")).toBeInTheDocument();
  });

  it("completes through the existing endpoint and reloads the session", async () => {
    get.mockResolvedValueOnce(ok(session));
    get.mockResolvedValueOnce(ok({ ...session, status: ConsultationBookingStatus.COMPLETED }));
    complete.mockResolvedValue(ok({ ...session, status: ConsultationBookingStatus.COMPLETED }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Complete" }));
    expect(complete).toHaveBeenCalledWith(session.id);
    await waitFor(() => expect(screen.getByText("Completed")).toBeInTheDocument());
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("reschedules to one of the trainer's offered slots", async () => {
    get.mockResolvedValue(ok(session));
    slots.mockResolvedValue({
      success: true,
      data: [{ startsAt: at(11), endsAt: at(12), providerTimezone: "Africa/Lagos", isAvailable: true }],
    });
    reschedule.mockResolvedValue(ok({ ...session, startsAt: at(11), endsAt: at(12) }));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Reschedule" }));
    expect(screen.getByText(/We'll let your client know/)).toBeInTheDocument();
    const option = await screen.findByRole("option", { name: localTimeKey(at(11)) });
    await userEvent.click(option);
    await userEvent.click(screen.getByRole("button", { name: "Confirm reschedule" }));
    expect(slots).toHaveBeenCalledWith("p1", expect.objectContaining({ consultationTypeId: "t1" }));
    expect(reschedule).toHaveBeenCalledWith(session.id, { startsAt: at(11), reason: undefined });
  });
});
