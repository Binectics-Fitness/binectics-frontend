import { describe, it, expect } from "vitest";
import { insertByDueDate, oneOffStatus } from "@/components/programs/OneOffTasksCard";
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
    expect(oneOffStatus(task({}), today)).toMatchObject({ tone: "neutral" });
    expect(oneOffStatus(task({}), today).label).toMatch(/^Due /);
    expect(oneOffStatus(task({ due_date: today }), today).label).toBe("Due today");
  });

  it("marks a task past its due day warn, not danger: the client can still catch up", () => {
    // Once the catch-up window closes the API reports it missed instead.
    expect(oneOffStatus(task({ due_date: "2026-09-24" }), today)).toEqual({
      label: "Past due, still open",
      tone: "warn",
    });
  });

  it("judges due dates against the day it gives, i.e. the client's", () => {
    // Due the 26th: "due today" for a client already on the 26th, even if
    // the provider's own clock still says the 25th.
    expect(oneOffStatus(task({ due_date: "2026-09-26" }), "2026-09-26").label).toBe("Due today");
  });

  it("names a finished form Submitted and a finished task Done, with late when late", () => {
    expect(oneOffStatus(task({ status: "done" }), today).label).toBe("Submitted");
    expect(oneOffStatus(task({ status: "done", completed_late: true }), today).label).toBe("Submitted late");
    expect(oneOffStatus(task({ type: "instruction", status: "done" }), today).label).toBe("Done");
    expect(oneOffStatus(task({ type: "instruction", status: "done", completed_late: true }), today).label).toBe("Done late");
  });

  it("shows missed and skipped as they are", () => {
    expect(oneOffStatus(task({ status: "missed" }), today)).toEqual({ label: "Missed", tone: "warn" });
    expect(oneOffStatus(task({ status: "skipped" }), today)).toEqual({ label: "Skipped", tone: "neutral" });
    expect(oneOffStatus(task({ status: "done" }), today).tone).toBe("success");
  });
});

describe("insertByDueDate", () => {
  const t = (id: string, due_date: string) => task({ id, due_date });

  it("places a newly sent task where the API would list it (newest due first)", () => {
    const list = [t("a", "2026-10-20"), t("b", "2026-09-28")];
    expect(insertByDueDate(list, t("n", "2026-10-01")).map((x) => x.id)).toEqual(["a", "n", "b"]);
    expect(insertByDueDate(list, t("n", "2026-11-01")).map((x) => x.id)).toEqual(["n", "a", "b"]);
    expect(insertByDueDate(list, t("n", "2026-09-26")).map((x) => x.id)).toEqual(["a", "b", "n"]);
  });
});
