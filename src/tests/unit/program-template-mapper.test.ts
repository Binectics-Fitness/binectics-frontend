import { describe, it, expect } from "vitest";
import {
  formToPayload,
  phaseRowsToPayload,
  goalRowsToPayload,
  versionToForm,
  emptyPhaseRow,
  emptyBlockRow,
  emptyGoalRow,
  blocksMissingContent,
  EMPTY_PROGRAM_FORM,
  type ProgramFormState,
  type PhaseFormRow,
} from "@/components/programs/mapper";
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
    catch_up_days: "2",
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

  it("keeps a meal_plan block that has a linked plan and carries meal_plan_id", () => {
    const out = phaseRowsToPayload([
      {
        name: "Nutrition",
        duration_days: "",
        blocks: [
          { ...emptyBlockRow("meal_plan"), meal_plan_id: "665f00000000000000000001" }, // no title, but linked → kept
          { ...emptyBlockRow("meal_plan") }, // no title, no plan → dropped
        ],
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].blocks).toHaveLength(1);
    expect(out[0].blocks[0].meal_plan_id).toBe("665f00000000000000000001");
  });

  it("round-trips a meal_plan block's linked plan through versionToForm", () => {
    const form: ProgramFormState = {
      name: "Nutrition program",
      category: "",
      goal_statement: "",
      duration_days: "",
      intensity: "",
      indications: "",
      cautions: "",
      catch_up_days: "1",
      phases: [
        {
          name: "Eat",
          duration_days: "",
          blocks: [{ ...emptyBlockRow("meal_plan"), meal_plan_id: "665f00000000000000000009" }],
        },
      ],
      goals: [],
    };
    const payload = formToPayload(form);
    const version = { _id: "v", template_id: "t", version_no: 1, published_at: null, ...payload } as ProgramTemplateVersion;
    const round = formToPayload(versionToForm(version));
    expect(round.phases![0].blocks[0].meal_plan_id).toBe("665f00000000000000000009");
  });

  it("only carries meal_plan_id for meal_plan blocks", () => {
    const [phase] = phaseRowsToPayload([
      {
        name: "P",
        duration_days: "",
        blocks: [{ ...emptyBlockRow("habit"), title: "x", meal_plan_id: "665f00000000000000000002" }],
      },
    ]);
    expect(phase.blocks[0].meal_plan_id).toBeUndefined();
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

describe("form and workout plan tasks", () => {
  it("keeps a form block that links a form and carries form_id", () => {
    const [phase] = phaseRowsToPayload([
      {
        name: "Check in",
        duration_days: "",
        blocks: [
          { ...emptyBlockRow("form"), cadence: "weekly", form_id: "665f000000000000000000f1" },
          { ...emptyBlockRow("habit"), title: "x", form_id: "665f000000000000000000f2" },
        ],
      },
    ]);
    expect(phase.blocks[0]).toMatchObject({ type: "form", form_id: "665f000000000000000000f1" });
    expect(phase.blocks[1].form_id).toBeUndefined(); // only form blocks carry it
  });

  it("round-trips form and workout plan links through versionToForm", () => {
    const version = {
      _id: "v",
      template_id: "t",
      version_no: 1,
      published_at: null,
      name: "Strength",
      goals: [],
      phases: [
        {
          name: "Build",
          order: 0,
          blocks: [
            { type: "form", order: 0, cadence: "weekly", form_id: "665f000000000000000000f1" },
            { type: "workout_plan", order: 1, cadence: "daily", workout_plan_id: "665f000000000000000000a1" },
          ],
        },
      ],
    } as ProgramTemplateVersion;
    const blocks = formToPayload(versionToForm(version)).phases![0].blocks;
    expect(blocks[0].form_id).toBe("665f000000000000000000f1");
    // Not offered in the builder, but editing must never drop the link.
    expect(blocks[1].workout_plan_id).toBe("665f000000000000000000a1");
  });

  it("names tasks that need linked content and have none", () => {
    const missing = blocksMissingContent([
      {
        name: "P",
        duration_days: "",
        blocks: [
          { ...emptyBlockRow("form"), title: "Weekly check-in" }, // titled, no form
          { ...emptyBlockRow("meal_plan"), title: "Eat" }, // titled, no plan
          { ...emptyBlockRow("form") }, // empty row: dropped, not an error
          { ...emptyBlockRow("form"), form_id: "665f000000000000000000f1" },
        ],
      },
    ]);
    expect(missing).toEqual(["phase 1, task 1", "phase 1, task 2"]);
  });
});

describe("catch-up window", () => {
  const withCatchUp = (catch_up_days: string) => ({ ...EMPTY_PROGRAM_FORM, name: "P", catch_up_days });

  it("defaults new programs to the API default of 1 day", () => {
    expect(formToPayload(EMPTY_PROGRAM_FORM).catch_up_days).toBe(1);
  });

  it("sends 0, clamps above 7 and omits a blank", () => {
    expect(formToPayload(withCatchUp("0")).catch_up_days).toBe(0);
    expect(formToPayload(withCatchUp("12")).catch_up_days).toBe(7);
    expect(formToPayload(withCatchUp("")).catch_up_days).toBeUndefined();
  });

  it("prefills older versions without the field as 1", () => {
    const form = versionToForm({
      _id: "v",
      template_id: "t",
      version_no: 1,
      published_at: null,
      name: "Old",
      phases: [],
      goals: [],
    } as ProgramTemplateVersion);
    expect(form.catch_up_days).toBe("1");
  });
});
