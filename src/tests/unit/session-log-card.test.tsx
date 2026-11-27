import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SessionLogCard } from "@/components/coachSessions/SessionLogCard";
import { log } from "./coach-session-fixtures";

describe("SessionLogCard (trainer, read-only)", () => {
  it("shows the table, both notes, readiness, pain and weight", () => {
    render(<SessionLogCard log={log()} firstName="Emeka" typeName="1:1 strength" />);
    const table = screen.getByRole("table", { name: "Exercises" });
    expect(within(table).getByText("Goblet squat")).toBeInTheDocument();
    expect(within(table).getByText("16 × 10 · 16 × 10 · 16 × 9")).toBeInTheDocument();
    expect(within(table).getByText("RPE 7, 8, 9")).toBeInTheDocument();
    expect(within(table).getByText("Instead of push-up on knees")).toBeInTheDocument();
    expect(within(table).getByText("Skipped")).toBeInTheDocument();
    expect(within(table).getByText("Out of time")).toBeInTheDocument();
    expect(screen.getByText("Note to Emeka")).toBeInTheDocument();
    expect(screen.getByText("Good work today.")).toBeInTheDocument();
    expect(screen.getByText("Private note")).toBeInTheDocument();
    expect(screen.getByText("Left knee from old ACL.")).toBeInTheDocument();
    expect(screen.getByText("Only you can see this note.")).toBeInTheDocument();
    expect(screen.getByText(/Energy good/)).toHaveTextContent("Energy good · Left knee (goblet squat) · 82.4 kg");
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Logged on phone")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("1:1 strength · 52 min");
  });

  it("says plainly when there is no note, nothing recorded or no exercises", () => {
    render(<SessionLogCard log={log({ shared_note: null, private_note: null, readiness: null, pain_flags: [], weigh_in: null, exercises: [] })} firstName="Emeka" />);
    expect(screen.getByText("No note was sent.")).toBeInTheDocument();
    expect(screen.getByText("None.")).toBeInTheDocument();
    expect(screen.getByText("Nothing recorded.")).toBeInTheDocument();
    expect(screen.getByText("No exercises were logged.")).toBeInTheDocument();
  });
});
