import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExerciseDetail, NO_ILLUSTRATION_YET } from "../ExerciseDetail";
import { StarterTaskStatus } from "@/lib/starter/types";

const api = vi.hoisted(() => ({ listMine: vi.fn(), getProgram: vi.fn() }));
vi.mock("@/lib/api/starter", async (orig) => ({ ...(await orig<typeof import("@/lib/api/starter")>()), starterService: api }));

const program = { id: "p1", name: "Get moving", status: "active", remindersEnabled: false, sharedWithProviderIds: [], progress: null };
const task = {
  id: "occ1",
  title: "Session 3",
  scheduledFor: "2026-11-23T00:00:00.000Z",
  status: StarterTaskStatus.Pending,
  completedLate: false,
  exercises: [
    { name: "March in place", seconds: 60, cues: [], mediaId: "march-in-place" },
    { name: "Squat", sets: 3, reps: 10, restSeconds: 45, cues: ["Sit back like into a chair"], mediaId: "squat" },
  ],
};

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  vi.clearAllMocks();
  api.listMine.mockResolvedValue({ success: true, data: [program] });
  api.getProgram.mockResolvedValue({ success: true, data: { program, tasks: [task] } });
});

describe("ExerciseDetail", () => {
  it("shows the illustrated demo and every guidance section when web has the art", () => {
    wrap(<ExerciseDetail mediaId="squat" />);
    expect(screen.getByRole("heading", { level: 1, name: "Bodyweight squat" })).toBeInTheDocument();
    const art = screen.getByTestId("exercise-detail-art");
    expect(within(art).getByRole("img", { name: /^Squat, side view/ })).toHaveAttribute("src", "/exercises/squat.svg");
    // Reduced motion: the still end pose.
    expect(art.querySelector('source[media="(prefers-reduced-motion: reduce)"]')).toHaveAttribute("srcset", "/exercises/squat-end.svg");
    expect(screen.getByText("Illustrated demo")).toBeInTheDocument();
    for (const h of ["Muscles worked", "How to do it", "Form cues", "Common mistakes", "Stay safe", "Make it easier", "No equipment?"]) {
      expect(screen.getByRole("heading", { level: 2, name: h })).toBeInTheDocument();
    }
    expect(screen.getByText(/not medical advice\. Illustrated demo\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See Chair squat" })).toHaveAttribute("href", "/dashboard/member/exercises/chair-squat");
    expect(screen.getByRole("link", { name: "Back to your program" })).toHaveAttribute("href", "/dashboard/member/starter");
    expect(api.listMine).not.toHaveBeenCalled();
  });

  it("shows the name and cues with no picture when web has no art", () => {
    wrap(<ExerciseDetail mediaId="plank" />);
    expect(screen.getByRole("heading", { level: 1, name: "Plank" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No illustration for this exercise yet" })).toBeInTheDocument();
    expect(screen.getByText(NO_ILLUSTRATION_YET)).toBeInTheDocument();
    expect(screen.queryByText("Illustrated demo")).toBeNull();
    // Mobile's summary describes its picture; with no web art that sentence is dropped.
    expect(screen.queryByText(/The picture/)).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Form cues" })).toBeInTheDocument();
  });

  it("adds the plan's prescription, cues and position when opened from a session", async () => {
    wrap(<ExerciseDetail mediaId="squat" session="occ1" index={1} />);
    expect(await screen.findByTestId("exercise-detail-dose")).toHaveTextContent("3 x 10");
    expect(screen.getByText("Rest 45 sec")).toBeInTheDocument();
    expect(screen.getByText("Part of Session 3 · Exercise 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "From your plan" })).toBeInTheDocument();
    expect(screen.getByText("Sit back like into a chair")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to session" })).toHaveAttribute("href", "/dashboard/member/starter/session/occ1");
    // A variation keeps the way back but not the row.
    expect(screen.getByRole("link", { name: "See Chair squat" })).toHaveAttribute(
      "href",
      "/dashboard/member/exercises/chair-squat?session=occ1",
    );
  });

  it("goes back to the guided run from its form tips", () => {
    wrap(<ExerciseDetail mediaId="squat" session="occ1" index={1} back="guided" />);
    expect(screen.getByRole("link", { name: "Back to guided session" })).toHaveAttribute(
      "href",
      "/dashboard/member/starter/session/occ1/guided",
    );
  });

  it("says so plainly for an exercise with no guide", async () => {
    wrap(<ExerciseDetail mediaId="mystery-move" />);
    expect(screen.getByRole("heading", { name: "No guide for this exercise yet" })).toBeInTheDocument();
    expect(screen.queryByTestId("exercise-detail-art")).toBeNull();
  });
});
