import { describe, it, expect } from "vitest";
import {
  bestLine, clientRowMeta, dayLabel, minutesLabel, noShowDate, noteCell, painLine, rpeCell, setsCell, setsLine, tally,
} from "@/lib/coachSessions/format";
import { set, summary, log } from "./coach-session-fixtures";

describe("coach session text", () => {
  it("writes the trainer's sets as kg x reps and bodyweight sets as the count", () => {
    expect(setsCell([set(0, 10, 16), set(1, 10, 16), set(2, 9, 16)])).toBe("16 × 10 · 16 × 10 · 16 × 9");
    expect(setsCell([set(0, 10, null), set(1, 8, 0)])).toBe("10 · 8");
  });

  it("leaves out sets that were not done", () => {
    expect(setsCell([set(0, 10, 16), set(1, 10, 16, null, false)])).toBe("16 × 10");
  });

  it("lists RPE only where it was given", () => {
    expect(rpeCell([set(0, 10, 16, 7), set(1, 10, 16, 8), set(2, 9, 16, 9)])).toBe("RPE 7, 8, 9");
    expect(rpeCell([set(0, 10, 16)])).toBe("");
  });

  it("gives the client one load in front when it is shared, runs of a load otherwise", () => {
    expect(setsLine([set(0, 10, 16), set(1, 10, 16), set(2, 9, 16)])).toBe("16 kg × 10, 10, 9");
    expect(setsLine([set(0, 10, null), set(1, 8, null)])).toBe("10, 8");
    expect(setsLine([set(0, 10, 16), set(1, 10, 16), set(2, 8, 14)])).toBe("16 kg × 10, 10 · 14 kg × 8");
  });

  it("notes a swap, the exercise note and why it was skipped", () => {
    const e = log().exercises;
    expect(noteCell(e[1])).toBe("Instead of push-up on knees");
    expect(noteCell(e[2])).toBe("Out of time");
  });

  it("names the pain area and the exercise", () => {
    expect(painLine({ area: "knee_l", exercise_key: "goblet-squat", note: null }, [{ key: "goblet-squat", name: "Goblet squat" }])).toBe("Noted: left knee, goblet squat");
    expect(painLine({ area: "back", exercise_key: null, note: "tight" }, [])).toBe("Noted: back, tight");
  });

  it("says 'Best so far' only when the API said so, with the top loaded set", () => {
    const [a, b] = summary().exercises;
    expect(bestLine(a)).toBe("Best so far: 16 kg × 10");
    expect(bestLine(b)).toBeNull();
  });

  it("counts exercises done and skipped and the volume", () => {
    expect(tally(log())).toEqual({ done: 2, skipped: 1, volumeKg: 16 * 29 });
    expect(clientRowMeta(summary())).toBe("2 exercises · Best so far on goblet squat");
  });

  it("labels minutes and days", () => {
    expect(minutesLabel(52 * 60_000)).toBe("52 min");
    expect(minutesLabel(65 * 60_000)).toBe("1 h 5 min");
    expect(dayLabel("2026-11-26T12:00:00.000Z", "UTC")).toBe("Thu 26 Nov");
  });

  it("puts the no-show date seven days after the end", () => {
    expect(dayLabel(noShowDate("2026-11-25T12:00:00.000Z"), "UTC")).toBe("Wed 2 Dec");
  });
});
