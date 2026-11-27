import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionSummaryPage from "@/app/dashboard/sessions/[id]/page";
import YourSessionsPage from "@/app/dashboard/sessions/page";
import { coachSessionsService } from "@/lib/api/coachSessions";
import { consultationsService } from "@/lib/api/consultations";
import { marketplaceService } from "@/lib/api/marketplace";
import { summary } from "./coach-session-fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href, className, style }: { children: ReactNode; href: string; className?: string; style?: object }) => (
    <a href={href} className={className} style={style}>{children}</a>
  ),
}));
vi.mock("@/components/ds/MemberDashboardShell", () => ({ MemberDashboardShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));

const getMine = vi.spyOn(coachSessionsService, "getMine");
const listMine = vi.spyOn(coachSessionsService, "listMine");
const getBooking = vi.spyOn(consultationsService, "getBooking");
const myProviders = vi.spyOn(marketplaceService, "getMyProviders");

function params(id: string) {
  const p = Promise.resolve({ id }) as Promise<{ id: string }> & { status?: string; value?: { id: string } };
  p.status = "fulfilled";
  p.value = { id };
  return p;
}
const renderPage = (id = "s1") =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Suspense fallback={null}><SessionSummaryPage params={params(id)} /></Suspense>
    </QueryClientProvider>,
  );

const next = { starts_at: "2099-12-03T06:00:00.000Z", consultation_type_id: "t1" };

describe("client session summary page", () => {
  beforeEach(() => {
    getMine.mockReset(); listMine.mockReset(); getBooking.mockReset(); myProviders.mockReset();
    listMine.mockResolvedValue({ success: true, data: { items: [summary({ id: "s1" }), summary({ id: "s0", started_at: "2026-11-19T12:00:00.000Z" })] } } as never);
    getBooking.mockResolvedValue({ success: true, data: { consultationTypeName: "1:1 strength" } } as never);
    myProviders.mockResolvedValue({ success: true, data: { professionals: [{ professional_id: "p1", listing: { _id: "L9" } }], gyms: [] } } as never);
  });

  it("reads only the client endpoint and shows the summary, with All sessions at the bottom", async () => {
    getMine.mockResolvedValue({ success: true, data: summary({ booking_id: "b1", suggested_next: next }) } as never);
    renderPage();
    expect(await screen.findByTestId("client-session-summary")).toBeInTheDocument();
    expect(getMine).toHaveBeenCalledWith("s1");
    expect(screen.getByText("Squat moved up to 16 kg.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All sessions" })).toHaveAttribute("href", "/dashboard/sessions");
    expect(getBooking).toHaveBeenCalledWith("b1");
  });

  it("links Book next to the coach's listing with the suggested type and time", async () => {
    getMine.mockResolvedValue({ success: true, data: summary({ booking_id: "b1", suggested_next: next }) } as never);
    renderPage();
    const link = await screen.findByRole("link", { name: "Book next" });
    const url = new URL(link.getAttribute("href")!, "http://x");
    expect(url.pathname).toBe("/booking");
    expect(url.searchParams.get("listingId")).toBe("L9");
    expect(url.searchParams.get("consultationTypeId")).toBe("t1");
    expect(url.searchParams.get("startsAt")).toBe(next.starts_at);
  });

  it("hides Book next when the coach has no open listing", async () => {
    myProviders.mockResolvedValue({ success: true, data: { professionals: [{ professional_id: "p1", listing: null }], gyms: [] } } as never);
    getMine.mockResolvedValue({ success: true, data: summary({ suggested_next: next }) } as never);
    renderPage();
    await screen.findByText("Next session");
    expect(screen.queryByRole("link", { name: "Book next" })).toBeNull();
  });

  it("still shows the summary when the extras (type name, other sessions, listing) fail", async () => {
    getMine.mockResolvedValue({ success: true, data: summary({ booking_id: "b1", suggested_next: next }) } as never);
    listMine.mockRejectedValue(new Error("x"));
    getBooking.mockRejectedValue(new Error("x"));
    myProviders.mockRejectedValue(new Error("x"));
    renderPage();
    expect(await screen.findByTestId("client-session-summary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "All sessions" })).toBeNull();
  });

  it("says the session isn't available on a 404, with no retry", async () => {
    getMine.mockResolvedValue({ success: false, status: 404, message: "nope" } as never);
    renderPage("zz");
    expect(await screen.findByText("This session isn't available.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("shows an error with a retry for any other failure, and loads on retry", async () => {
    getMine.mockResolvedValueOnce({ success: false, status: 500, message: "boom" } as never);
    renderPage();
    expect(screen.getByRole("status", { name: "Loading summary" })).toBeInTheDocument();
    // One automatic retry (after a second) before the error shows.
    expect(await screen.findByText("Couldn't load this summary.", {}, { timeout: 4000 })).toBeInTheDocument();
    getMine.mockResolvedValue({ success: true, data: summary() } as never);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("client-session-summary")).toBeInTheDocument();
  });
});

describe("Your sessions page", () => {
  const renderList = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <YourSessionsPage />
      </QueryClientProvider>,
    );

  it("lists the member's sessions", async () => {
    listMine.mockResolvedValue({ success: true, data: { items: [summary({ id: "a" })] } } as never);
    renderList();
    expect(await screen.findByRole("link", { name: /with Chinedu/ })).toHaveAttribute("href", "/dashboard/sessions/a");
  });

  it("has an empty state", async () => {
    listMine.mockResolvedValue({ success: true, data: { items: [] } } as never);
    renderList();
    expect(await screen.findByText("No coached sessions yet.")).toBeInTheDocument();
  });

  it("has an error state with retry", async () => {
    listMine.mockResolvedValueOnce({ success: false, message: "x" } as never);
    renderList();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your sessions.");
    listMine.mockResolvedValue({ success: true, data: { items: [summary({ id: "a" })] } } as never);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: /with Chinedu/ })).toBeInTheDocument();
  });
});
