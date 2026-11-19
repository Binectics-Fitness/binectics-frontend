import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProgramResultsSection from "@/components/programs/results/ProgramResultsSection";
import { RESULTS_COPY as C, RESULT_PILLS } from "@/components/programs/results/copy";
import { resultMeta, resultValue } from "@/components/programs/results/format";
import {
  programsService,
  type ClientProgramSummary,
  type ProgramResultItem,
  type ProgramResultProgram,
} from "@/lib/api/programs";

/**
 * The coach results section (board: binectics-plans/design/coach-results).
 * A fasting or water task shows the day's state and one number only (owner
 * ruling, 19 Nov 2026); every string comes from RESULTS_COPY.
 */

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const item = (over: Partial<ProgramResultItem>): ProgramResultItem => ({
  id: Math.random().toString(36).slice(2),
  title: "Task",
  type: "habit",
  status: "pending",
  completed_late: false,
  completion_source: null,
  auto: null,
  auto_evidence: null,
  auto_progress: null,
  ...over,
});
const fast = { metric: "fasting_hours" as const, comparator: "gte", threshold: 16 };
const water = { metric: "water_glasses" as const, comparator: "gte", threshold: 8 };

const PROGRAM: ProgramResultProgram = {
  id: "inst1",
  name: "Strength base",
  status: "active",
  today: "2026-11-19",
  days: [
    {
      day: "2026-11-19",
      items: [
        item({ title: "Fast 16 hours", status: "done", completion_source: "auto", auto: fast, auto_evidence: { value: 16.3, local_day: "2026-11-19", withdrawn: false } }),
        item({ title: "Drink 8 glasses", auto: water, auto_progress: { value: 3, threshold: 8 } }),
        item({ title: "Lower body workout", type: "workout_plan" }),
      ],
    },
    {
      day: "2026-11-18",
      items: [
        item({ title: "Drink 8 glasses", status: "done", completion_source: "auto", auto: water, auto_evidence: { value: 9, local_day: "2026-11-18", withdrawn: false } }),
        item({ title: "Lower body workout", type: "workout_plan", status: "done", completed_late: true }),
      ],
    },
    {
      day: "2026-11-17",
      items: [
        item({ title: "Fast 16 hours", status: "missed", auto: fast }),
        item({ title: "Lower body workout", type: "workout_plan", status: "skipped" }),
      ],
    },
    {
      day: "2026-11-16",
      items: [
        item({ title: "Fast 16 hours", status: "done", completion_source: "auto", auto: fast, auto_evidence: { value: 13, local_day: "2026-11-16", withdrawn: true } }),
        item({ title: "Walk 8,000 steps", status: "done", completion_source: "auto", auto: { metric: "steps", comparator: "gte", threshold: 8000 }, auto_evidence: { value: 8214, local_day: "2026-11-16", withdrawn: false } }),
      ],
    },
  ],
};

const SUMMARY: ClientProgramSummary = {
  id: "inst1",
  name: "Strength base",
  kind: "program",
  status: "active",
  progress: { day: 4, total_days: 28, last_7_days: { scheduled: 12, done: 9, done_late: 0, skipped: 0, missed: 0, open: 0 } },
  counts: { done: 9, missed: 1, skipped: 1, pending: 1 },
  adherence_pct: 82,
};

const ok = (programs: ProgramResultProgram[], days = 7) => ({ success: true, data: { days, programs } }) as never;

function renderSection() {
  return render(<ProgramResultsSection clientProfileId="cp1" clientFirstName="Chidi" summaries={[SUMMARY]} />);
}

describe("ProgramResultsSection", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows each day newest first, with the state and one number for fasting and water", async () => {
    vi.spyOn(programsService, "getClientResults").mockResolvedValue(ok([PROGRAM]));
    renderSection();
    expect(await screen.findByText("Strength base")).toBeInTheDocument();
    expect(programsService.getClientResults).toHaveBeenCalledWith("cp1", 7);

    expect(screen.getByRole("heading", { name: C.heading })).toBeInTheDocument();
    expect(screen.getByText(`${C.day(4, 28)} · ${C.week(9, 12)}`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `${C.openProgram} →` })).toHaveAttribute(
      "href",
      expect.stringContaining("/instances/inst1"),
    );
    expect(screen.getByText(C.privacy)).toBeInTheDocument();

    // The numbers, and nothing for the plain, missed, withdrawn or health-app tasks.
    expect(screen.getByText(C.hours(16.3))).toBeInTheDocument();
    expect(screen.getByText(C.soFar(3))).toBeInTheDocument();
    expect(screen.getByText(C.glasses(9))).toBeInTheDocument();
    expect(screen.queryByText(C.hours(13))).not.toBeInTheDocument();
    expect(screen.queryByText(/8,214|8214/)).not.toBeInTheDocument();

    expect(screen.getAllByText(`${C.shared} · ${C.targetHours(16)}`).length).toBe(2);
    expect(screen.getAllByText(`${C.shared} · ${C.targetGlasses(8)}`).length).toBe(2);
    expect(screen.getByText(C.withdrawnMeta)).toBeInTheDocument();
    expect(screen.getByText(C.health)).toBeInTheDocument();

    for (const p of ["done", "late", "missed", "pending", "skipped", "withdrawn"] as const) {
      expect(screen.getAllByText(RESULT_PILLS[p].label).length).toBeGreaterThan(0);
    }
    // "Today" labels today's day (desktop block and phone line both render).
    expect(screen.getAllByText(C.today).length).toBeGreaterThan(0);
    expect(screen.getAllByText(C.dayCount(1, 3)).length).toBeGreaterThan(0);
  });

  it("asks for a longer range when a range pill is pressed", async () => {
    const spy = vi.spyOn(programsService, "getClientResults").mockResolvedValue(ok([PROGRAM]));
    renderSection();
    await screen.findByText("Strength base");
    await userEvent.click(screen.getByRole("button", { name: C.range(14) }));
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith("cp1", 14));
    expect(screen.getByRole("button", { name: C.range(14) })).toHaveAttribute("aria-pressed", "true");
  });

  it("says so when there is no program, without range pills", async () => {
    vi.spyOn(programsService, "getClientResults").mockResolvedValue(ok([]));
    renderSection();
    expect(await screen.findByText(C.emptyTitle)).toBeInTheDocument();
    expect(screen.getByText(C.emptyBody("Chidi"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: C.range(7) })).not.toBeInTheDocument();
    expect(screen.queryByText(C.privacy)).not.toBeInTheDocument();
  });

  it("says when a program had nothing in the range", async () => {
    vi.spyOn(programsService, "getClientResults").mockResolvedValue(ok([{ ...PROGRAM, days: [] }]));
    renderSection();
    expect(await screen.findByText(C.noneInRange(7))).toBeInTheDocument();
  });

  it("shows loading, then an error with a retry that loads again", async () => {
    const spy = vi
      .spyOn(programsService, "getClientResults")
      .mockResolvedValueOnce({ success: false, message: "boom" } as never)
      .mockResolvedValueOnce(ok([PROGRAM]));
    renderSection();
    expect(screen.getByRole("status", { name: C.loading })).toBeInTheDocument();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(C.error)).toBeInTheDocument();
    await userEvent.click(within(alert).getByRole("button", { name: C.retry }));
    expect(await screen.findByText("Strength base")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("result formatting", () => {
  it("gives a pending fasting task no number (the running fast is the client's own)", () => {
    expect(resultValue(item({ auto: fast }))).toBeNull();
    expect(resultValue(item({ auto: water, status: "done", auto_evidence: { value: 1, local_day: "d", withdrawn: false } }))?.text).toBe("1 glass");
    expect(resultMeta(item({ type: "measurement" }))).toBe("Measurement");
  });

  it("words a fast as the member app does: hours and zero-padded minutes", () => {
    expect(C.hours(16.3)).toBe("16 h 18 min");
    expect(C.hours(17)).toBe("17 h 00 min");
    expect(C.hours(16.1)).toBe("16 h 06 min");
    expect(C.hours(14.7)).toBe("14 h 42 min");
    expect(C.hours(0.5)).toBe("30 min");
    expect(C.hours(0)).toBe("0 min");
    expect(resultValue(item({ auto: fast, status: "done", auto_evidence: { value: 16.3, local_day: "d", withdrawn: false } }))?.text).toBe("16 h 18 min");
  });
});
