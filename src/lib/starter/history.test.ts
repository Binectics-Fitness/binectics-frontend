import { describe, expect, it } from "vitest";
import { HistoryStatus, historyStatus, loggedNumbers, weekSummary, weeklyHistory } from "./history";
import { StarterTaskStatus, type StarterTask } from "./types";

const t = (id: string, day: string, status: StarterTaskStatus, late = false, title = `Session ${id}`): StarterTask => ({
  id,
  title,
  scheduledFor: `${day}T00:00:00.000Z`,
  status,
  completedLate: late,
  exercises: [],
});

describe("historyStatus", () => {
  it("maps each task state", () => {
    expect(historyStatus(t("a", "2026-11-02", StarterTaskStatus.Done))).toBe(HistoryStatus.Done);
    expect(historyStatus(t("a", "2026-11-02", StarterTaskStatus.Done, true))).toBe(HistoryStatus.DoneLate);
    expect(historyStatus(t("a", "2026-11-02", StarterTaskStatus.Skipped))).toBe(HistoryStatus.Skipped);
    expect(historyStatus(t("a", "2026-11-02", StarterTaskStatus.Missed))).toBe(HistoryStatus.Missed);
    expect(historyStatus(t("a", "2026-11-02", StarterTaskStatus.Pending))).toBe(HistoryStatus.Open);
  });
});

describe("weekSummary", () => {
  it("lists only the non-zero parts", () => {
    expect(weekSummary({ done: 2, late: 1, skipped: 0, missed: 1 }, 0)).toBe("2 sessions done, 1 of them late · 1 missed");
    expect(weekSummary({ done: 1, late: 0, skipped: 1, missed: 0 }, 1)).toBe("1 session done · 1 skipped · 1 still open");
    expect(weekSummary({ done: 0, late: 0, skipped: 0, missed: 0 }, 0)).toBe("Nothing recorded");
  });
});

describe("weeklyHistory", () => {
  it("is empty with nothing recorded", () => {
    expect(weeklyHistory({ days: [], startedAt: "2026-11-02T00:00:00.000Z" })).toEqual([]);
  });

  it("groups by program week, newest first, and counts each session once", () => {
    const days = [
      { day: "2026-11-10", items: [t("c", "2026-11-10", StarterTaskStatus.Done, true)] },
      { day: "2026-11-04", items: [t("b", "2026-11-04", StarterTaskStatus.Skipped)] },
      { day: "2026-11-02", items: [t("a", "2026-11-02", StarterTaskStatus.Done)] },
    ];
    const extra = [t("c", "2026-11-10", StarterTaskStatus.Done, true), t("d", "2026-11-11", StarterTaskStatus.Missed)];
    const weeks = weeklyHistory({ days, extra, startedAt: "2026-11-02T08:00:00.000Z" });
    expect(weeks.map((w) => w.label)).toEqual(["Week 2", "Week 1"]);
    expect(weeks[0].rows.map((r) => [r.id, r.statusLabel])).toEqual([
      ["d", "Missed"],
      ["c", "Done late"],
    ]);
    expect(weeks[0].summary).toBe("1 session done, 1 of them late · 1 missed");
    expect(weeks[0].from).toBe("From Mon, Nov 9");
    expect(weeks[1].summary).toBe("1 session done · 1 skipped");
  });
});

describe("loggedNumbers", () => {
  const base = { duration_minutes: 30, performed_at: "2026-11-05T18:00:00.000Z" };
  it("keeps the member's own entries for this program's sessions", () => {
    const out = loggedNumbers(
      [
        { ...base, _id: "1", title: "Session a", notes: "Squat: 10 kg x 8\n\nPush-up: 6 reps" },
        { ...base, _id: "2", title: "Session a", notes: "imported", source: "health_connect" },
        { ...base, _id: "3", title: "Evening run", notes: "5k" },
        { ...base, _id: "4", title: "Session a" },
        { ...base, _id: "5", title: "Session a", notes: "before start", performed_at: "2026-10-01T10:00:00.000Z" },
      ],
      { sessionTitles: ["Session a"], startedAt: "2026-11-02T00:00:00.000Z" },
    );
    expect(out).toEqual([
      { id: "1", title: "Session a", dayLabel: "Thu, Nov 5", minutes: 30, lines: ["Squat: 10 kg x 8", "Push-up: 6 reps"] },
    ]);
  });
});
