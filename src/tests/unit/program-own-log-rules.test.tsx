import { describe, it, expect } from "vitest";
import {
  blocksWithBadOwnLogNumber,
  emptyBlockRow,
  phaseRowsToPayload,
  versionToForm,
  type PhaseFormRow,
} from "@/components/programs/mapper";
import { OWN_LOG_COPY, parseOwnLogThreshold } from "@/components/programs/ownLogRules";
import type { ProgramTemplateVersion } from "@/lib/api/programs";

/**
 * A habit task that ticks itself from the client's own fasting or water log
 * (binectics-api #349). The coach sees only that day's done-or-not and one
 * number, and the editor says so next to the option.
 */

// The builder page's own-log UI is covered in program-builder-page.test.tsx.

const habit = (patch: Partial<ReturnType<typeof emptyBlockRow>>) => ({ ...emptyBlockRow("habit"), ...patch });
const phases = (...blocks: ReturnType<typeof emptyBlockRow>[]): PhaseFormRow[] => [
  { name: "Base", duration_days: "28", blocks },
];

describe("own-log threshold bounds", () => {
  it("takes whole hours 1-24 and whole glasses 1-30 only", () => {
    expect(parseOwnLogThreshold("fasting_hours", "1")).toBe(1);
    expect(parseOwnLogThreshold("fasting_hours", "24")).toBe(24);
    expect(parseOwnLogThreshold("fasting_hours", "0")).toBeNull();
    expect(parseOwnLogThreshold("fasting_hours", "25")).toBeNull();
    expect(parseOwnLogThreshold("fasting_hours", "16.5")).toBeNull();
    expect(parseOwnLogThreshold("fasting_hours", "")).toBeNull();
    expect(parseOwnLogThreshold("water_glasses", "30")).toBe(30);
    expect(parseOwnLogThreshold("water_glasses", "31")).toBeNull();
    expect(parseOwnLogThreshold("water_glasses", "-1")).toBeNull();
  });
});

describe("own-log rules in the payload", () => {
  it("sends a gte, scheduled_day rule with the whole number", () => {
    const [p] = phaseRowsToPayload(
      phases(
        habit({ title: "Fast 16 hours", own_log_metric: "fasting_hours", own_log_threshold: "16" }),
        habit({ title: "Water", own_log_metric: "water_glasses", own_log_threshold: "8" }),
      ),
    );
    expect(p.blocks[0].auto_rule).toEqual({ metric: "fasting_hours", comparator: "gte", threshold: 16, window: "scheduled_day" });
    expect(p.blocks[1].auto_rule).toEqual({ metric: "water_glasses", comparator: "gte", threshold: 8, window: "scheduled_day" });
  });

  it("names a blank task after its rule", () => {
    const [p] = phaseRowsToPayload(phases(habit({ own_log_metric: "water_glasses", own_log_threshold: "8" })));
    expect(p.blocks[0].title).toBe("Drink at least 8 glasses");
  });

  it("sends no rule for a habit without one, or for another task type", () => {
    const [p] = phaseRowsToPayload(
      phases(
        habit({ title: "Walk" }),
        { ...emptyBlockRow("instruction"), title: "Read", own_log_metric: "fasting_hours", own_log_threshold: "16" },
      ),
    );
    expect(p.blocks.map((b) => b.auto_rule)).toEqual([undefined, undefined]);
  });

  it("lists tasks whose number is missing or out of bounds", () => {
    expect(
      blocksWithBadOwnLogNumber(
        phases(
          habit({ own_log_metric: "fasting_hours", own_log_threshold: "25" }),
          habit({ own_log_metric: "water_glasses", own_log_threshold: "" }),
          habit({ own_log_metric: "water_glasses", own_log_threshold: "30" }),
          habit({ title: "Walk" }),
        ),
      ),
    ).toEqual(["phase 1, task 1", "phase 1, task 2"]);
  });

  it("round-trips a saved rule and keeps a health-app rule it doesn't edit", () => {
    const version = {
      _id: "v1", template_id: "t1", version_no: 1, published_at: null, name: "Base", goals: [],
      phases: [
        {
          name: "Base", order: 0,
          blocks: [
            { type: "habit", order: 0, title: "Fast", auto_rule: { metric: "fasting_hours", comparator: "gte", threshold: 14, window: "scheduled_day" } },
            { type: "habit", order: 1, title: "Steps", auto_rule: { metric: "steps", comparator: "gte", threshold: 8000, window: "scheduled_day" } },
          ],
        },
      ],
    } as ProgramTemplateVersion;
    const form = versionToForm(version);
    expect(form.phases[0].blocks[0]).toMatchObject({ own_log_metric: "fasting_hours", own_log_threshold: "14" });
    const [p] = phaseRowsToPayload(form.phases);
    expect(p.blocks[0].auto_rule).toEqual(version.phases[0].blocks[0].auto_rule);
    expect(p.blocks[1].auto_rule).toEqual(version.phases[0].blocks[1].auto_rule);
  });
});

describe("copy", () => {
  it("names the coach in what the client sees, and says you only without a name", () => {
    expect(OWN_LOG_COPY.clientSees("Tunde")).toBe('Your client sees "Shared with Tunde" on this task.');
    expect(OWN_LOG_COPY.clientSees("")).toBe('Your client sees "Shared with you" on this task.');
    expect(OWN_LOG_COPY.clientSees(undefined)).toBe('Your client sees "Shared with you" on this task.');
  });

  it("labels the options by what is counted", () => {
    expect(OWN_LOG_COPY.option).toEqual({ fasting_hours: "Fasting hours", water_glasses: "Glasses of water" });
    expect(OWN_LOG_COPY.none).toBe("No, the client ticks it");
  });
});
