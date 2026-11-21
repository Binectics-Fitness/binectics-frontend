import { describe, expect, it } from "vitest";
import * as glanceCopy from "@/lib/solo/glanceCopy";
import * as fastingCopy from "@/lib/solo/fastingCopy";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TARGETS_COPY,
  TARGET_BELOW_SUPPORTED_RANGE_LINE,
  WEIGHT_COPY,
  fastingAverageSentence,
  fastingDayNote,
  fastingPreview,
  fastingWindowSentence,
  hoursMinutes,
  plainNumber,
  waterAimSentence,
  waterTodaySentence,
  waterUsualNote,
  waterUsualSentence,
  weeklyAverageLine,
  weightChangeSentence,
  weightPreview,
  weightRangeSentence,
  weightSummaryLabel,
  loadedAtNote,
} from "@/lib/solo/glanceCopy";
import { doneTitle, goalLine, notPartOfGoal, progressPhrase, daypart } from "@/lib/solo/fastingCopy";

describe("weight: a number and the plain words lower, higher or the same", () => {
  it("lower", () => expect(weightChangeSentence(-1.2, "4w")).toBe("1.2 kg lower than 4 weeks ago"));
  it("higher", () => expect(weightChangeSentence(1.5, "3m")).toBe("1.5 kg higher than 3 months ago"));
  it("the same", () => {
    expect(weightChangeSentence(0, "1y")).toBe("The same as a year ago");
    expect(weightChangeSentence(0.04, "4w")).toBe("The same as 4 weeks ago");
    expect(weightChangeSentence(-0.04, "4w")).toBe("The same as 4 weeks ago");
  });
  it("never carries an arrow, a sign symbol, a verdict word or a colour", () => {
    for (const d of [-3.4, -0.1, 0, 0.1, 2.2]) {
      const s = weightChangeSentence(d, "4w");
      expect(s).not.toMatch(/[↑↓▲▼+\-−]/);
      expect(s).not.toMatch(/\b(good|bad|better|worse|great|oops|gain|loss|lost|gained|progress)\b/i);
    }
  });
  it("reads aloud as one sentence about both averages", () => {
    expect(weightSummaryLabel(71.2, 70, -1.2, "4w")).toBe("71.2 kilograms 4 weeks ago, 70.0 kilograms this week. 1.2 kg lower than 4 weeks ago.");
  });
  it("words the range and the average", () => {
    expect(weightRangeSentence(68, 70)).toBe("Between 68.0 and 70.0 kg");
    expect(weightRangeSentence(70, 70)).toBe("Around 70.0 kg");
    expect(weeklyAverageLine(70)).toBe("Your weekly average is 70.0 kg.");
  });
});

describe("water: sentence and rail", () => {
  it("no glasses, no aim, with an aim and past it", () => {
    expect(waterTodaySentence(0, 8)).toBe("No water yet today.");
    expect(waterTodaySentence(1, null)).toBe("1 glass today.");
    expect(waterTodaySentence(5, null)).toBe("5 glasses today.");
    expect(waterTodaySentence(5, 8)).toBe("5 glasses today. 3 to go to your 8.");
    expect(waterTodaySentence(8, 8)).toBe("8 glasses today. That is your 8.");
    expect(waterTodaySentence(11, 8)).toBe("11 glasses today. That is your 8.");
  });
  it("usual day, with and without the week before", () => {
    expect(waterUsualSentence(6.24, "week")).toBe("Average 6.2 glasses a day this week.");
    expect(waterUsualSentence(6.24, "weeks4")).toBe("Average 6.2 glasses a day over 4 weeks.");
    expect(waterUsualNote({ avg: 6.2, prev: 5.8, days: 5, span: "week" })).toBe("On the 5 days you counted. That is 0.4 more than the week before.");
    expect(waterUsualNote({ avg: 5.4, prev: 6, days: 1, span: "week" })).toBe("On the 1 day you counted. That is 0.6 fewer than the week before.");
    expect(waterUsualNote({ avg: 6, prev: 6, days: 4, span: "week" })).toBe("On the 4 days you counted. That is the same as the week before.");
    expect(waterUsualNote({ avg: 6, prev: null, days: 4, span: "week" })).toBe("On the 4 days you counted.");
    expect(waterUsualNote({ avg: 6, prev: 5, days: 4, span: "weeks4" })).toBe("On the 4 days you counted.");
  });
});

describe("fasting: strip on a band", () => {
  it("average, hours and minutes", () => {
    expect(fastingAverageSentence(17.4, 5)).toBe("Average 17.4 h on 5 days");
    expect(fastingAverageSentence(16, 1)).toBe("Average 16.0 h on 1 day");
    expect(hoursMinutes(17.25)).toBe("17 h 15 min");
    expect(hoursMinutes(16)).toBe("16 h 00 min");
    expect(plainNumber(16)).toBe("16");
    expect(plainNumber(16.5)).toBe("16.5");
  });
  it("the day note is plain, never a verdict", () => {
    expect(fastingDayNote({ hours: null, count: 0, band: null })).toBe("A rest day, or nothing recorded.");
    expect(fastingDayNote({ hours: 17, count: 1, band: { min: 16, max: 20 } })).toBe("Inside your window.");
    expect(fastingDayNote({ hours: 12, count: 1, band: { min: 16, max: 20 } })).toBe("Outside your window, which is fine.");
    expect(fastingDayNote({ hours: 17, count: 1, band: null })).toBe("One fast that day.");
    expect(fastingDayNote({ hours: 30, count: 2, band: null })).toBe("2 fasts ended that day.");
  });
});

describe("targets: ranges, plain text, never a percent or a pass mark", () => {
  it("previews built only from what is logged and what is set", () => {
    expect(weightPreview(70, 68, 70)).toBe("Your weekly average is 70.0 kg. Your range is 68.0 to 70.0 kg.");
    expect(weightPreview(null, 68, 70)).toBe("Your range is 68.0 to 70.0 kg.");
    expect(weightPreview(null, 70, 70)).toBe("Your range is around 70.0 kg.");
    expect(fastingPreview(15.7, 16, 20)).toBe("Average this week 15.7 h. Your window is 16 to 20 h.");
    expect(fastingPreview(null, 16, 20)).toBe("Your window is 16 to 20 h.");
    expect(fastingWindowSentence(16, 20, 5)).toBe("Fast between 16 and 20 hours, on 5 days a week");
    expect(fastingWindowSentence(16, 16, 1)).toBe("Fast for 16 hours, on 1 day a week");
    expect(waterAimSentence(8)).toBe("Aim for 8 glasses a day");
  });
  it("the previews never state a percent, a pass mark, a distance or a count of days left", () => {
    const all = [weightPreview(70, 68, 70), fastingPreview(15.7, 16, 20), waterTodaySentence(5, 8), fastingWindowSentence(16, 20, 5)].join(" ");
    expect(all).not.toMatch(/%|percent|\bpass\b|\bmet\b|days left|\bgoal\b/i);
  });
  it("the below-range refusal is one short plain line, with no advice and no placeholder text", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/solo/glanceCopy.ts"), "utf8");
    expect(src).not.toMatch(/PLACEHOLDER|clinical review|gentle|health worker|medical device/i);
    expect(TARGET_BELOW_SUPPORTED_RANGE_LINE).toBe("The lowest weight we can save is 45 kg.");
    expect(WEIGHT_COPY).not.toHaveProperty("disclaimer");
    expect(TARGETS_COPY.intro).toMatch(/Optional/);
  });
  it("words the offline and could-not-refresh notes", () => {
    expect(loadedAtNote("10:42", true)).toBe("You are offline. Showing what was loaded at 10:42.");
    expect(loadedAtNote("10:42", false)).toBe("Could not refresh. Showing what was loaded at 10:42.");
  });
});

describe("fasting words", () => {
  it("done, goal and stage lines", () => {
    expect(doneTitle("16 h 04 min")).toBe("Saved to your history at 16 h 04 min");
    expect(goalLine(16, null)).toBe("Goal was 16 hours.");
    expect(goalLine(16, "1 h 02 min")).toBe("Goal was 16 hours. You ended 1 h 02 min before it.");
    expect(notPartOfGoal(16)).toBe("Not part of your 16 hour fast.");
  });
  it("the eyebrow names the time of day and where the fast is", () => {
    expect(daypart(5)).toBe("Morning");
    expect(daypart(11)).toBe("Morning");
    expect(daypart(12)).toBe("Afternoon");
    expect(daypart(17)).toBe("Evening");
    expect(daypart(21)).toBe("Night");
    expect(daypart(4)).toBe("Night");
    expect(progressPhrase(0)).toBe("just started");
    expect(progressPhrase(0.3)).toBe("settling in");
    expect(progressPhrase(0.5)).toBe("past halfway");
    expect(progressPhrase(0.8)).toBe("almost there");
    expect(progressPhrase(1)).toBe("length reached");
  });
});

describe("product rules held in every sentence the web can say", () => {
  const strings = (mod: Record<string, unknown>): string[] => {
    const out: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(mod);
    return out;
  };
  const all = [...strings(glanceCopy), ...strings(fastingCopy)];

  it("no streaks, badges, scores or 'missed'", () => {
    for (const s of all) expect(s, s).not.toMatch(/\b(streak|badge|badges|score|missed|miss a day|failed)\b/i);
  });
  it("fasting copy gives no autophagy time", () => {
    const stageText = strings(fastingCopy).join(" ");
    expect(stageText.match(/autophagy/gi)?.length).toBe(1); // only the "we do not show times" disclaimer
    expect(fastingCopy.STAGES_FOOTER).toMatch(/We do not show times for autophagy/);
    for (const s of fastingCopy.FASTING_STAGES) expect(`${s.body} ${s.short} ${s.notice ?? ""}`).not.toMatch(/autophagy/i);
  });
  it("the fasting copy file is marked pending dietitian review, and holds the stage text in one place", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/solo/fastingCopy.ts"), "utf8");
    expect(src.split("\n").slice(0, 5).join(" ")).toMatch(/PENDING DIETITIAN REVIEW/);
    expect(src).toMatch(/Digesting/);
    // No other source file repeats a stage sentence.
    const others = ["src/app/dashboard/member/_components/solo/FastingHero.tsx", "src/app/dashboard/member/_components/solo/FastStages.tsx"].map((f) => readFileSync(join(process.cwd(), f), "utf8")).join("\n");
    expect(others).not.toMatch(/Your body is using your last meal/);
  });
  it("the cap and the 36 hour window are stated in plain words", () => {
    expect(fastingCopy.START_CAP_NOTE).toBe("Fasts can be up to 24 hours.");
  });
});
