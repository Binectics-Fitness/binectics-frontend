import { describe, expect, it } from "vitest";
import {
  activeDays,
  countByDay,
  dayKey,
  heatLevel,
  heatmapCells,
  weekStrip,
} from "./activity";

// Wednesday 7 Oct 2026, 10:00 local.
const NOW = new Date(2026, 9, 7, 10, 0, 0);
const at = (d: number, h = 9) => new Date(2026, 9, d, h, 0, 0);

describe("dayKey / countByDay", () => {
  it("keys by local calendar day", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("counts several events on one day and skips unparseable moments", () => {
    const counts = countByDay([at(6, 7), at(6, 18), at(7).toISOString(), "not a date"]);
    expect(counts.get("2026-10-06")).toBe(2);
    expect(counts.get("2026-10-07")).toBe(1);
    expect(counts.size).toBe(2);
  });
});

describe("weekStrip", () => {
  it("returns Monday to Sunday of the current week by default", () => {
    const days = weekStrip([], NOW);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.weekday)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(days[0].date).toBe("2026-10-05");
    expect(days[6].date).toBe("2026-10-11");
    expect(days[2].dayOfMonth).toBe(7);
  });

  it("can start the week on Sunday", () => {
    const days = weekStrip([], NOW, 0);
    expect(days[0].weekday).toBe("Sun");
    expect(days[0].date).toBe("2026-10-04");
  });

  it("marks done, missed, today and upcoming from real events", () => {
    const days = weekStrip([at(5), at(5, 19)], NOW);
    expect(days.map((d) => d.state)).toEqual([
      "done",
      "missed",
      "today",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(days[0].count).toBe(2);
    expect(days[2].isToday).toBe(true);
  });

  it("a check-in today makes today done and keeps it flagged as today", () => {
    const days = weekStrip([at(7, 7)], NOW);
    expect(days[2].state).toBe("done");
    expect(days[2].isToday).toBe(true);
  });

  it("ignores events from other weeks", () => {
    const days = weekStrip([at(1), at(13)], NOW);
    expect(days.every((d) => d.count === 0)).toBe(true);
  });
});

describe("heatLevel", () => {
  it("is 0 with no events", () => {
    expect(heatLevel(0, 5)).toBe(0);
    expect(heatLevel(0, 0)).toBe(0);
  });

  it("puts the busiest day at 3 and any active day at least at 1", () => {
    expect(heatLevel(1, 1)).toBe(3);
    expect(heatLevel(1, 9)).toBe(1);
    expect(heatLevel(4, 9)).toBe(2);
    expect(heatLevel(9, 9)).toBe(3);
  });
});

describe("heatmapCells", () => {
  it("returns one cell per day ending today, oldest first", () => {
    const cells = heatmapCells([], 30, NOW);
    expect(cells).toHaveLength(30);
    expect(cells[29].date).toBe("2026-10-07");
    expect(cells[0].date).toBe("2026-09-08");
    expect(cells.every((c) => c.level === 0)).toBe(true);
  });

  it("buckets real counts into levels and drops events outside the window", () => {
    const cells = heatmapCells([at(7), at(7, 12), at(7, 18), at(6), at(1, 8), at(8), new Date(2026, 7, 1)], 30, NOW);
    const byDate = Object.fromEntries(cells.map((c) => [c.date, c]));
    expect(byDate["2026-10-07"]).toMatchObject({ count: 3, level: 3 });
    expect(byDate["2026-10-06"]).toMatchObject({ count: 1, level: 1 });
    expect(byDate["2026-10-08"]).toBeUndefined();
    expect(byDate["2026-10-01"]).toMatchObject({ count: 1, level: 1 });
    expect(activeDays(cells)).toBe(3);
    expect(cells.reduce((s, c) => s + c.count, 0)).toBe(5);
  });
});
