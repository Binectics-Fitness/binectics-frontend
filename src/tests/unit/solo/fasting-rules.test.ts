import { describe, expect, it } from "vitest";
import {
  CLOCK_SKEW_MS,
  HOUR_MS,
  MAX_ELAPSED_MS,
  PRESET_OPTIONS,
  START_MAX_PAST_MS,
  canUndo,
  clockText,
  dayDiff,
  durationText,
  elapsedMs,
  endStamp,
  fastProgress,
  formatHours,
  fromLocalInput,
  localStatus,
  parseCustomHours,
  presetHint,
  presetHours,
  presetTitle,
  relativeDay,
  remainingMs,
  resultOf,
  shortBy,
  spokenDuration,
  stageAt,
  stageIndexAt,
  startAllowed,
  startProblem,
  timesProblem,
  toLocalInput,
  toMs,
  arcPoint,
  ARC,
  ARC_LENGTH,
} from "@/lib/solo/fastingRules";
import { nextTickDelay } from "@/hooks/useNowMs";
import { FASTING_STAGES } from "@/lib/solo/fastingCopy";

const T0 = Date.UTC(2026, 10, 17, 20, 30, 0);
const iso = (ms: number) => new Date(ms).toISOString();

describe("timer math is absolute", () => {
  it("elapsed is now minus the saved start, whatever happened in between", () => {
    expect(elapsedMs(iso(T0), T0 + 10 * HOUR_MS + 42 * 60_000)).toBe(10 * HOUR_MS + 42 * 60_000);
  });

  it("a tab asleep for hours reads the true elapsed on the next read (no accumulation)", () => {
    // Two reads: one just after the start, one after the tab slept 5 hours.
    expect(clockText(elapsedMs(iso(T0), T0 + 60_000))).toBe("0:01");
    expect(clockText(elapsedMs(iso(T0), T0 + 5 * HOUR_MS + 60_000))).toBe("5:01");
  });

  it("a clock set back before the start never reads negative", () => {
    expect(elapsedMs(iso(T0), T0 - 3 * HOUR_MS)).toBe(0);
    expect(fastProgress(elapsedMs(iso(T0), T0 - 3 * HOUR_MS), 16)).toBe(0);
  });

  it("a clock set forward lands on the right value, and the status follows the 24 h 15 min limit", () => {
    expect(localStatus({ started_at: iso(T0), ended_at: null }, T0 + 24 * HOUR_MS + 14 * 60_000)).toBe("running");
    expect(localStatus({ started_at: iso(T0), ended_at: null }, T0 + MAX_ELAPSED_MS + 1)).toBe("expired_unclosed");
    expect(localStatus({ started_at: iso(T0), ended_at: iso(T0 + HOUR_MS) }, T0 + 99 * HOUR_MS)).toBe("ended");
  });

  it("numerals floor to the minute and cross midnight and 24 hours without wrapping", () => {
    expect(clockText(59_999)).toBe("0:00");
    expect(clockText(60_000)).toBe("0:01");
    // The fast started at 20:30 passes midnight: elapsed keeps counting up.
    expect(clockText(elapsedMs(iso(T0), T0 + 4 * HOUR_MS))).toBe("4:00");
    expect(clockText(24 * HOUR_MS + 5 * 60_000)).toBe("24:05");
  });

  it("progress is clamped to 0..1 and remaining to 0", () => {
    expect(fastProgress(8 * HOUR_MS, 16)).toBe(0.5);
    expect(fastProgress(20 * HOUR_MS, 16)).toBe(1);
    expect(remainingMs(8 * HOUR_MS, 16)).toBe(8 * HOUR_MS);
    expect(remainingMs(20 * HOUR_MS, 16)).toBe(0);
    expect(fastProgress(5, 0)).toBe(1);
  });

  it("the timer ticks at the next whole minute of the fast, never slower than the max gap", () => {
    expect(nextTickDelay(T0 + 10_000, T0, 120_000)).toBe(50_050);
    // 10 s in, the minute turns in 50 s but the 30 s cap wins, so a changed clock is noticed soon.
    expect(nextTickDelay(T0 + 10_000, T0, 30_000)).toBe(30_000);
    // 20 s before the minute turns, a 30 s cap does not matter.
    expect(nextTickDelay(T0 + 40_000, T0, 30_000)).toBe(20_050);
    expect(nextTickDelay(T0, null, 30_000)).toBe(30_000);
    // Never zero or negative (a changed clock must not spin a hot loop).
    expect(nextTickDelay(T0 - 5_000_000, T0, 30_000)).toBeGreaterThanOrEqual(250);
  });
});

describe("durations and days", () => {
  it("reads in a sentence and aloud", () => {
    expect(durationText(16 * HOUR_MS + 4 * 60_000)).toBe("16 h 04 min");
    expect(durationText(45 * 60_000)).toBe("45 min");
    expect(spokenDuration(5 * HOUR_MS + 18 * 60_000)).toBe("5 hours 18 minutes");
    expect(spokenDuration(HOUR_MS)).toBe("1 hour");
    expect(spokenDuration(60_000)).toBe("1 minute");
    expect(spokenDuration(0)).toBe("0 minutes");
  });

  it("counts calendar days, not 24 hour blocks (midnight and clock changes)", () => {
    const evening = new Date(2026, 2, 28, 23, 30).getTime();
    const after = new Date(2026, 2, 29, 0, 30).getTime();
    expect(dayDiff(after, evening)).toBe(1);
    expect(relativeDay(evening, evening)).toBe("Today");
    expect(relativeDay(after, evening)).toBe("Tomorrow");
    expect(relativeDay(evening, after)).toBe("Yesterday");
    expect(relativeDay(new Date(2026, 10, 19, 9).getTime(), new Date(2026, 10, 17, 9).getTime())).toMatch(/Thu 19 Nov/);
  });

  it("a fast that ends the next morning says the weekday; the same day says only the time", () => {
    const s = new Date(2026, 10, 19, 20, 30).getTime();
    expect(endStamp(s, new Date(2026, 10, 19, 22, 0).getTime())).not.toMatch(/Nov/);
    expect(endStamp(s, new Date(2026, 10, 20, 12, 34).getTime())).toMatch(/^Fri /);
    expect(endStamp(s, new Date(2026, 10, 22, 12, 34).getTime())).toMatch(/Sun 22 Nov/);
  });

  it("round trips a datetime-local value in the browser's zone", () => {
    const ms = new Date(2026, 10, 17, 8, 5).getTime();
    expect(toLocalInput(ms)).toBe("2026-11-17T08:05");
    expect(fromLocalInput("2026-11-17T08:05")).toBe(ms);
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("17/11/2026")).toBeNull();
  });
});

describe("presets and the 24 hour cap", () => {
  it("offers 12, 14, 16, 18, 20, one meal a day and custom", () => {
    expect(PRESET_OPTIONS.map((p) => p.key)).toEqual(["12_12", "14_10", "16_8", "18_6", "20_4", "one_meal", "custom"]);
    expect(PRESET_OPTIONS.map((p) => p.hours)).toEqual([12, 14, 16, 18, 20, 23, null]);
    expect(presetHours("one_meal")).toBe(23);
    expect(presetHours("custom")).toBeNull();
    expect(presetHours("ramadan")).toBeNull();
  });

  it.each([
    ["18", 18],
    ["18.5", 18.5],
    ["18,5", 18.5],
    [" 24 ", 24],
    ["1", 1],
  ])("accepts %s", (text, hours) => {
    expect(parseCustomHours(text)).toEqual({ ok: true, hours });
  });

  it("refuses more than 24 with the plain cap message, never a silent clamp", () => {
    expect(parseCustomHours("25")).toEqual({ ok: false, message: "Fasts can be up to 24 hours. Pick 24 or fewer." });
    expect(parseCustomHours("24.5")).toMatchObject({ ok: false });
    expect(parseCustomHours("100")).toMatchObject({ ok: false });
  });

  it("refuses empty, too short and odd steps", () => {
    expect(parseCustomHours("")).toMatchObject({ ok: false, message: "Enter how many hours, from 1 to 24." });
    expect(parseCustomHours("0")).toEqual({ ok: false, message: "A fast needs to be at least 1 hour." });
    expect(parseCustomHours("0.5")).toMatchObject({ ok: false });
    expect(parseCustomHours("18.3")).toMatchObject({ ok: false, message: "Use whole or half hours, like 18 or 18.5." });
    expect(parseCustomHours("abc")).toMatchObject({ ok: false });
    expect(parseCustomHours("-3")).toMatchObject({ ok: false });
  });

  it("words the hint and the title", () => {
    expect(presetHint(16)).toBe("16 hours fasting, 8 hours to eat.");
    expect(presetHint(24)).toBe("24 hours fasting.");
    expect(presetHint(18.5)).toBe("18.5 hours fasting, 5.5 hours to eat.");
    expect(presetTitle("16_8", 16)).toBe("16 hour fast");
    expect(presetTitle("one_meal", 23)).toBe("One meal a day");
    expect(presetTitle("custom", 18.5)).toBe("18.5 hour fast");
    expect(formatHours(16)).toBe("16");
  });
});

describe("'started earlier' stays inside the API's window", () => {
  it("allows now, a few minutes of clock drift ahead, and up to 36 hours back", () => {
    expect(startAllowed(T0, T0)).toBe(true);
    expect(startAllowed(T0 + CLOCK_SKEW_MS, T0)).toBe(true);
    expect(startAllowed(T0 + CLOCK_SKEW_MS + 1, T0)).toBe(false);
    expect(startAllowed(T0 - START_MAX_PAST_MS, T0)).toBe(true);
    expect(startAllowed(T0 - START_MAX_PAST_MS - 1, T0)).toBe(false);
  });

  it("says why in plain words", () => {
    expect(startProblem(T0 + HOUR_MS, T0)).toBe("A fast cannot start in the future.");
    expect(startProblem(T0 - 40 * HOUR_MS, T0)).toBe("A fast can start at most 36 hours ago.");
    expect(startProblem(null, T0)).toBe("Enter a start date and time.");
    expect(startProblem(T0 - HOUR_MS, T0)).toBeNull();
  });

  it("edited times follow the API's rules", () => {
    expect(timesProblem(T0, T0, T0 + HOUR_MS)).toBe("The end must be after the start.");
    expect(timesProblem(T0, T0 + 25 * HOUR_MS, T0 + 30 * HOUR_MS)).toBe("A fast can last at most 24 hours.");
    expect(timesProblem(T0, T0 + MAX_ELAPSED_MS, T0 + 30 * HOUR_MS)).toBeNull();
    expect(timesProblem(T0 + 10 * HOUR_MS, T0 + 12 * HOUR_MS, T0)).toBe("A fast cannot start in the future.");
    expect(timesProblem(T0 - 5 * HOUR_MS, T0 + 2 * HOUR_MS, T0)).toBe("A fast cannot end in the future.");
  });
});

describe("stage selection", () => {
  const hours = (h: number) => h * HOUR_MS;
  it.each([
    [0, "digesting"],
    [3.99, "digesting"],
    [4, "settling"],
    [7.99, "settling"],
    [8, "switching"],
    [12, "fat_burning"],
    [15.99, "fat_burning"],
    [16, "deeper"],
    [23.5, "deeper"],
    [30, "deeper"],
  ])("at %s hours the stage is %s", (h, id) => {
    expect(stageAt(hours(h)).id).toBe(id);
  });

  it("stage windows are in order and cover every hour with no gap", () => {
    for (let i = 1; i < FASTING_STAGES.length; i += 1) {
      expect(FASTING_STAGES[i].fromHours).toBe(FASTING_STAGES[i - 1].toHours);
    }
    expect(FASTING_STAGES[0].fromHours).toBe(0);
    expect(stageIndexAt(0)).toBe(0);
  });
});

describe("how a finished fast reads", () => {
  const f = (h: number, target = 16) => ({ started_at: iso(T0), ended_at: iso(T0 + h * HOUR_MS), target_hours: target });
  it("by the real times, so an edit counts by what it now says", () => {
    expect(resultOf(f(16))).toBe("reached");
    expect(resultOf(f(15.9))).toBe("early");
    expect(resultOf({ started_at: iso(T0), ended_at: null, target_hours: 16 })).toBe("early");
  });
  it("says how far short, or nothing when reached", () => {
    expect(shortBy(f(14.98))).toBe("1 h 01 min");
    expect(shortBy(f(16))).toBeNull();
    expect(shortBy(f(20))).toBeNull();
  });
  it("offers Undo only while the server's window is open", () => {
    expect(canUndo({ undo_until: iso(T0 + 1000) }, T0)).toBe(true);
    expect(canUndo({ undo_until: iso(T0 - 1) }, T0)).toBe(false);
    expect(canUndo({ undo_until: null }, T0)).toBe(false);
    expect(toMs(iso(T0))).toBe(T0);
  });
});

describe("the arc marker sits exactly on the end of the drawn stroke", () => {
  it("is on the circle of the path at every progress, left end at 0 and right end at 1", () => {
    for (const p of [0, 0.1, 0.25, 0.49, 0.5, 0.51, 0.75, 1]) {
      const m = arcPoint(p);
      expect(Math.hypot(m.x - ARC.cx, m.y - ARC.cy)).toBeCloseTo(ARC.r, 6);
    }
    expect(arcPoint(0)).toEqual({ x: ARC.cx - ARC.r, y: ARC.cy });
    expect(arcPoint(1).x).toBeCloseTo(ARC.cx + ARC.r, 6);
    expect(arcPoint(1).y).toBeCloseTo(ARC.cy, 6);
    expect(arcPoint(0.5).x).toBeCloseTo(ARC.cx, 6);
    expect(arcPoint(0.5).y).toBeCloseTo(ARC.cy - ARC.r, 6);
    // The stroke is dashed for `progress` of the half circle; the marker is at the same arc length.
    const p = 0.37;
    const theta = (ARC_LENGTH * p) / ARC.r;
    expect(arcPoint(p).x).toBeCloseTo(ARC.cx - ARC.r * Math.cos(theta), 6);
  });
});
