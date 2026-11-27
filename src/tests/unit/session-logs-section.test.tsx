import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionLogsSection } from "@/components/coachSessions/SessionLogsSection";
import { coachSessionsService } from "@/lib/api/coachSessions";
import { ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { log } from "./coach-session-fixtures";

const list = vi.spyOn(coachSessionsService, "listForClient");
const wrap = (ui: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);
const NOW = Date.parse("2026-11-27T12:00:00.000Z");
const day = (d: number) => `2026-11-${String(d).padStart(2, "0")}T12:00:00.000Z`;
const mkLog = (d: number, over = {}) => log({ id: `l${d}`, started_at: day(d), ended_at: day(d).replace("12:00", "12:50"), private_note: `private ${d}`, ...over });
const booking = (id: string, d: number, status: ConsultationBookingStatus, over: Partial<ConsultationBooking> = {}) =>
  ({ id, clientUserId: "u1", consultationTypeName: "1:1 strength", startsAt: day(d), endsAt: day(d).replace("12:00", "12:45"), status, ...over }) as ConsultationBooking;

const mount = (bookings: ConsultationBooking[] = []) =>
  render(wrap(<SessionLogsSection clientProfileId="cp1" clientFirstName="Emeka" bookings={bookings} now={NOW} />));

describe("SessionLogsSection: one merged Sessions timeline", () => {
  beforeEach(() => list.mockReset());

  it("reads the client's logs by profile id and opens the newest as a table", async () => {
    list.mockResolvedValue({ success: true, data: { items: [mkLog(26), mkLog(20)] } } as never);
    mount();
    expect(await screen.findByTestId("session-log-card")).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith("cp1", 50);
    expect(screen.getByText("Live logging is on the phone")).toBeInTheDocument();
    expect(screen.getByText("private 26")).toBeInTheDocument();
    expect(screen.queryByText("private 20")).toBeNull();
  });

  it("merges bookings and logs by date, with a status chip on bookings that have no log", async () => {
    list.mockResolvedValue({ success: true, data: { items: [mkLog(26, { booking_id: "bk26" }), mkLog(20, { booking_id: null })] } } as never);
    mount([
      booking("bk26", 26, ConsultationBookingStatus.COMPLETED), // has a log: shown once, as the log
      booking("bk24", 24, ConsultationBookingStatus.COMPLETED),
      booking("bk18", 18, ConsultationBookingStatus.NO_SHOW),
      booking("bk25", 25, ConsultationBookingStatus.CONFIRMED),
      booking("future", 30, ConsultationBookingStatus.CONFIRMED), // not started: not in the timeline
    ]);
    await screen.findByTestId("session-log-card");
    await userEvent.click(screen.getByRole("button", { name: "All" }));
    const rows = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatch(/Thu 26 Nov/);
    expect(rows[1]).toMatch(/Wed 25 Nov.*1:1 strength · no log.*Open/);
    expect(rows[2]).toMatch(/Tue 24 Nov.*no log.*Done/);
    expect(rows[3]).toMatch(/ad hoc/);
    expect(rows[4]).toMatch(/Wed 18 Nov.*1:1 strength.*No-show/);
    expect(rows[4]).not.toMatch(/no log/);
    expect(screen.queryByText(/30 Nov/)).toBeNull();
    // A booking without a log opens its session.
    expect(within(screen.getAllByRole("listitem")[2]).getByRole("link")).toHaveAttribute("href", "/dashboard/trainer/sessions/bk24");
  });

  it("opens another log in place, and closes the open one", async () => {
    list.mockResolvedValue({ success: true, data: { items: [mkLog(26), mkLog(20)] } } as never);
    mount();
    await screen.findByTestId("session-log-card");
    await userEvent.click(screen.getByRole("button", { name: /Fri 20 Nov/ }));
    expect(screen.getByText("private 20")).toBeInTheDocument();
    expect(screen.queryByText("private 26")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Fri 20 Nov/ }));
    expect(screen.queryByTestId("session-log-card")).toBeNull();
  });

  it("shows four rows and 'All' for the rest", async () => {
    list.mockResolvedValue({ success: true, data: { items: [26, 24, 22, 20, 18, 16].map((d) => mkLog(d)) } } as never);
    mount();
    await screen.findByTestId("session-log-card");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Fewer" })).toBeInTheDocument();
  });

  it("has no 'All' when everything already shows", async () => {
    list.mockResolvedValue({ success: true, data: { items: [mkLog(26), mkLog(24)] } } as never);
    mount();
    await screen.findByTestId("session-log-card");
    expect(screen.queryByRole("button", { name: "All" })).toBeNull();
  });

  it("is empty, not an error, when there is nothing to list", async () => {
    list.mockResolvedValue({ success: true, data: { items: [] } } as never);
    mount();
    expect(await screen.findByText(/No session logs with Emeka yet/)).toBeInTheDocument();
  });

  it("lists bookings even when there are no logs, without a log card", async () => {
    list.mockResolvedValue({ success: true, data: { items: [] } } as never);
    mount([booking("bk24", 24, ConsultationBookingStatus.COMPLETED)]);
    expect(await screen.findByText("Done")).toBeInTheDocument();
    expect(screen.queryByTestId("session-log-card")).toBeNull();
  });

  it("shows loading, then an error with a retry that is not mistaken for 'no sessions'", async () => {
    let fail = true;
    list.mockImplementation(() => (fail ? Promise.resolve({ success: false, message: "x" } as never) : Promise.resolve({ success: true, data: { items: [mkLog(26)] } } as never)));
    mount();
    expect(screen.getByRole("status", { name: "Loading session logs" })).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load the session logs.");
    expect(screen.queryByText(/No session logs/)).toBeNull();
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("session-log-card")).toBeInTheDocument();
  });

  it("leaves out logs that are not completed", async () => {
    list.mockResolvedValue({ success: true, data: { items: [mkLog(26, { status: "in_progress" })] } } as never);
    mount();
    expect(await screen.findByText(/No session logs with Emeka yet/)).toBeInTheDocument();
  });
});
