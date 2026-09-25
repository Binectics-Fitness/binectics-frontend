import { describe, it, expect } from "vitest";
import { oneOffStatus } from "@/components/programs/OneOffTasksCard";
import type { OneOffTask } from "@/lib/api/programs";

// What the provider sees next to each form or task they sent on its own.
const task = (over: Partial<OneOffTask>): OneOffTask => ({
  id: "t",
  instance_id: "i",
  type: "form",
  title: "Weekly check-in",
  detail: null,
  form_id: "f",
  due_date: "2026-09-28",
  status: "pending",
  completed_late: false,
  actioned_at: null,
  form_response_id: null,
  ...over,
});

describe("oneOffStatus", () => {
  const today = "2026-09-25";

  it("says when an open task is due", () => {
    expect(oneOffStatus(task({}), today)).toMatchObject({ tone: "open" });
    expect(oneOffStatus(task({}), today).label).toMatch(/^Due /);
    expect(oneOffStatus(task({ due_date: today }), today).label).toBe("Due today");
  });

  it("flags an open task past its due day as overdue", () => {
    expect(oneOffStatus(task({ due_date: "2026-09-24" }), today)).toEqual({ label: "Overdue", tone: "late" });
  });

  it("names a finished form Submitted and a finished task Done, with late when late", () => {
    expect(oneOffStatus(task({ status: "done" }), today).label).toBe("Submitted");
    expect(oneOffStatus(task({ status: "done", completed_late: true }), today).label).toBe("Submitted late");
    expect(oneOffStatus(task({ type: "instruction", status: "done" }), today).label).toBe("Done");
    expect(oneOffStatus(task({ type: "instruction", status: "done", completed_late: true }), today).label).toBe("Done late");
  });

  it("shows missed and skipped as they are", () => {
    expect(oneOffStatus(task({ status: "missed" }), today)).toEqual({ label: "Missed", tone: "late" });
    expect(oneOffStatus(task({ status: "skipped" }), today).label).toBe("Skipped");
  });
});
