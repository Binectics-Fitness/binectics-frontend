import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookingSessionLog } from "@/components/coachSessions/BookingSessionLog";
import { coachSessionsService } from "@/lib/api/coachSessions";
import { log } from "./coach-session-fixtures";

const get = vi.spyOn(coachSessionsService, "get");
const wrap = (ui: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

describe("BookingSessionLog (session detail)", () => {
  it("says where logs are made when the session has none, without asking the API", () => {
    get.mockClear();
    render(wrap(<BookingSessionLog sessionLogId={null} clientFirstName="Kemi" />));
    expect(screen.getByText("No log for this session. Logs are made in the coach app.")).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it("shows the log card, with the private note, when there is a log", async () => {
    get.mockResolvedValue({ success: true, data: log() } as never);
    render(wrap(<BookingSessionLog sessionLogId="log1" clientFirstName="Kemi" typeName="1:1 strength" />));
    expect(await screen.findByTestId("session-log-card")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("log1");
    expect(screen.getByText("Left knee from old ACL.")).toBeInTheDocument();
  });

  it("shows an error with retry when the log can't be read", async () => {
    get.mockResolvedValueOnce({ success: false, message: "boom" } as never);
    render(wrap(<BookingSessionLog sessionLogId="log1" clientFirstName="Kemi" />));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load the session log.");
    get.mockResolvedValueOnce({ success: true, data: log() } as never);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("session-log-card")).toBeInTheDocument();
  });
});
