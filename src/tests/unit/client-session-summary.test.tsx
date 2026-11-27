import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientSessionSummaryView } from "@/components/coachSessions/ClientSessionSummaryView";
import { YourSessionsList } from "@/components/coachSessions/YourSessionsList";
import { summary } from "./coach-session-fixtures";

describe("ClientSessionSummaryView", () => {
  it("shows what the client did, the coach's note, pain and weight", () => {
    render(<ClientSessionSummaryView log={summary()} typeName="1:1 strength" bookNextHref={null} />);
    expect(screen.getByRole("heading", { name: "Chinedu Eze" })).toBeInTheDocument();
    expect(screen.getByText("From Chinedu")).toBeInTheDocument();
    expect(screen.getByText("Squat moved up to 16 kg.")).toBeInTheDocument();
    expect(screen.getByText("What you did")).toBeInTheDocument();
    expect(screen.getByText("16 kg × 10, 10, 9")).toBeInTheDocument();
    expect(screen.getByText("Best so far: 16 kg × 10")).toBeInTheDocument();
    expect(screen.getByText("Instead of push-up on knees")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText("Noted: left knee, goblet squat")).toBeInTheDocument();
    expect(screen.getByText("Weight 82.4 kg")).toBeInTheDocument();
  });

  it("never draws the private note or readiness, even if a response ever carried them", () => {
    const leaky = { ...summary(), private_note: "SECRET coach note", readiness: { energy: "low", pain_today: true } };
    const { container } = render(<ClientSessionSummaryView log={leaky} bookNextHref={null} />);
    expect(container.textContent).not.toMatch(/SECRET|Private note|Energy|Readiness/i);
  });

  it("offers Book next with the suggested slot when there is a listing to book", () => {
    const log = summary({ suggested_next: { starts_at: "2026-12-03T12:00:00.000Z", consultation_type_id: "t1" } });
    render(<ClientSessionSummaryView log={log} typeName="1:1 strength" bookNextHref="/booking?listingId=l1&consultationTypeId=t1&startsAt=x" />);
    expect(screen.getByText("Next session")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book next" })).toHaveAttribute("href", expect.stringContaining("listingId=l1"));
  });

  it("shows the suggested time but no button when there is nowhere to book", () => {
    const log = summary({ suggested_next: { starts_at: "2026-12-03T12:00:00.000Z", consultation_type_id: "t1" } });
    render(<ClientSessionSummaryView log={log} bookNextHref={null} />);
    expect(screen.getByText("Next session")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Book next" })).toBeNull();
  });

  it("has no Next session card when the coach suggested nothing, and no note card without a note", () => {
    render(<ClientSessionSummaryView log={summary({ shared_note: null, weigh_in: null, pain_flags: [] })} bookNextHref="/booking" />);
    expect(screen.queryByText("Next session")).toBeNull();
    expect(screen.queryByText("From Chinedu")).toBeNull();
    expect(screen.queryByText(/Weight/)).toBeNull();
    expect(screen.queryByText(/Noted/)).toBeNull();
  });
});

describe("YourSessionsList", () => {
  it("lists each session with its coach and opens its summary", () => {
    render(<YourSessionsList sessions={[summary({ id: "a" }), summary({ id: "b", started_at: "2026-11-19T12:00:00.000Z" })]} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/dashboard/sessions/a", "/dashboard/sessions/b"]);
    expect(links[0]).toHaveTextContent("with Chinedu");
    expect(links[0]).toHaveTextContent("Best so far on goblet squat");
  });

  it("leaves out the session being read, and renders nothing when none remain", () => {
    const { container } = render(<YourSessionsList sessions={[summary({ id: "a" })]} currentId="a" />);
    expect(container).toBeEmptyDOMElement();
  });
});
