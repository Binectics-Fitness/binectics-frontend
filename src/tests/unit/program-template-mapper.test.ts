import { describe, it, expect } from "vitest";
import {
  formToPayload,
  phaseRowsToPayload,
  goalRowsToPayload,
  versionToForm,
  emptyPhaseRow,
  emptyBlockRow,
  emptyGoalRow,
  type ProgramFormState,
  type PhaseFormRow,
} from "@/app/dashboard/dietitian/programs/_lib";
import type { ProgramTemplateVersion } from "@/lib/api/programs";

// Regression guards for the program builder mapper:
//
// 1. Phase and block `order` must be re-derived from array position (0-based),
//    so a reordered/gappy builder never sends inconsistent orders.
// 2. Empty rows (no name, no usable blocks; blocks with no title/metric) are
//    dropped rather than sent as blanks.
// 3. Blank numeric strings become omitted fields, not NaN/0.
// 4. versionToForm ∘ formToPayload round-trips the meaningful content.

function fullForm(): ProgramFormState {
  return {
    name: "Gut reset",
    category: "Gut health",
    goal_statement: "Calm the gut",
    duration_days: "84",
    intensity: "standard",
    indications: "IBS",
    cautions: "Pregnancy",
    phases: [
      {
        name: "Remove",
        duration_days: "14",
        blocks: [
          { ...emptyBlockRow("habit"), title: "Avoid trigger foods", cadence: "daily" },
          {
            ...emptyBlockRow("measurement"),
            title: "Log weight",
            cadence: "weekly",
            metric: "weight_kg",
            start_offset_days: "0",
          },
        ],
      },
      { ...emptyPhaseRow(), name: "Restore", duration_days: "" },
    ],
    goals: [
      { label: "Lose 4kg", metric: "weight_kg", direction: "reduce", target: "70", target_offset_days: "84" },
    ],
  };
}

describe("phaseRowsToPayload", () => {
  it("re-derives 0-based order and drops empty blocks/phases", () => {
    const rows: PhaseFormRow[] = [
      {
        name: "Phase A",
        duration_days: "7",
        blocks: [
          { ...emptyBlockRow("habit"), title: "Do X" },
          emptyBlockRow("habit"), // no title → dropped
          { ...emptyBlockRow("measurement"), metric: "hrv" }, // measurement w/ metric kept
        ],
      },
      { ...emptyPhaseRow(), name: "", blocks: [emptyBlockRow()] }, // no name, no usable blocks → dropped
    ];
    const out = phaseRowsToPayload(rows);
    expect(out).toHaveLength(1);
    expect(out[0].order).toBe(0);
    expect(out[0].blocks).toHaveLength(2);
    expect(out[0].blocks.map((b) => b.order)).toEqual([0, 1]);
    expect(out[0].blocks[1].metric).toBe("hrv");
  });

  it("only carries times_per_week for n_per_week and metric for measurement", () => {
    const [phase] = phaseRowsToPayload([
      {
        name: "P",
        duration_days: "",
        blocks: [
          { ...emptyBlockRow("habit"), title: "daily", cadence: "n_per_week", times_per_week: "3" },
          { ...emptyBlockRow("instruction"), title: "note", metric: "should_be_dropped" },
        ],
      },
    ]);
    expect(phase.blocks[0].times_per_week).toBe(3);
    expect(phase.blocks[1].metric).toBeUndefined(); // metric only kept for measurement
  });
});

describe("goalRowsToPayload", () => {
  it("drops unlabeled goals and omits blank numerics", () => {
    const out = goalRowsToPayload([
      { ...emptyGoalRow(), label: "Real", direction: "reach", target: "", target_offset_days: "" },
      { ...emptyGoalRow(), label: "" }, // dropped
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].target).toBeUndefined();
    expect(out[0].target_offset_days).toBeUndefined();
    expect(out[0].direction).toBe("reach");
  });
});

describe("formToPayload", () => {
  it("maps meta, phases and goals and omits blanks", () => {
    const p = formToPayload(fullForm());
    expect(p.name).toBe("Gut reset");
    expect(p.duration_days).toBe(84);
    expect(p.phases).toHaveLength(2);
    expect(p.phases![0].blocks).toHaveLength(2);
    expect(p.phases![1].name).toBe("Restore");
    expect(p.phases![1].duration_days).toBeUndefined(); // blank → omitted
    expect(p.goals![0].metric).toBe("weight_kg");
  });
});

describe("versionToForm round-trip", () => {
  it("prefills a form that re-serializes to the same meaningful payload", () => {
    const payload = formToPayload(fullForm());
    const version = {
      _id: "v1",
      template_id: "t1",
      version_no: 1,
      published_at: null,
      ...payload,
    } as ProgramTemplateVersion;
    const round = formToPayload(versionToForm(version));
    expect(round.name).toBe(payload.name);
    expect(round.phases).toEqual(payload.phases);
    expect(round.goals).toEqual(payload.goals);
    expect(round.duration_days).toBe(payload.duration_days);
  });
});
