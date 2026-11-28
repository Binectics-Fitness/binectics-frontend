import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { bundledTextApproved, memberTextApproved, WITHHELD_TEXT_LINE } from "../memberText";
import { MEMBER_TEXT_APPROVED_IDS, MEMBER_TEXT_WITHHELD_IDS } from "../memberTextAllowlist.generated";
import { EXERCISE_INFO_IDS, getExerciseInfo } from "../exerciseInfo";
import { memberMaySeeGuidance, guideLookup } from "../clientGuides";
import { buildPlan } from "@/lib/guided/engine";
import { ExerciseDetail } from "@/components/exercises/ExerciseDetail";
import { normalizeLibrary } from "../library";

const wrap = (ui: React.ReactElement) =>
  render(createElement(QueryClientProvider, { client: new QueryClient() }, ui));

describe("member text gate", () => {
  it("the two generated lists are disjoint and the withheld set is the owner's 50", () => {
    expect(MEMBER_TEXT_WITHHELD_IDS).toHaveLength(50);
    expect(MEMBER_TEXT_APPROVED_IDS.filter((i) => MEMBER_TEXT_WITHHELD_IDS.includes(i))).toEqual([]);
  });

  it("fails closed: an id in neither list is not approved", () => {
    expect(bundledTextApproved("not-an-exercise")).toBe(false);
    expect(bundledTextApproved(undefined)).toBe(false);
    expect(memberTextApproved("not-an-exercise")).toBe(false);
  });

  it("uses the API field when present and the bundled list when the API does not send it", () => {
    expect(memberTextApproved("squat", undefined)).toBe(true);
    expect(memberTextApproved("glute-bridge", undefined)).toBe(false);
    expect(memberTextApproved("glute-bridge", false)).toBe(false);
    expect(memberTextApproved("squat", false)).toBe(false);
    expect(memberTextApproved("glute-bridge", true)).toBe(true);
  });

  it("only removes: a withheld exercise never shows text even with the flag on; approved still needs the flag or Starter", () => {
    expect(memberMaySeeGuidance("glute-bridge", true)).toBe(false);
    expect(memberMaySeeGuidance("squat", false)).toBe(true); // Starter id
    expect(memberMaySeeGuidance("barbell-curl", true, true)).toBe(true); // fresh API approval + flag
    expect(memberMaySeeGuidance("barbell-curl", false, true)).toBe(false); // flag is the master switch
  });

  it("the library lookup hides a withheld exercise's text, reading the API field", () => {
    const lib = normalizeLibrary({
      available: true,
      exercises: [
        { id: "glute-bridge", name: "Glute bridge", steps: ["Lift."], member_text_approved: false },
        { id: "squat", name: "Squat", steps: ["Sit."], member_text_approved: true },
        { id: "plank", name: "Plank", steps: ["Hold."] }, // older API: bundled list
        { id: "dumbbell-romanian-deadlift", name: "DB RDL", steps: ["Hinge."] }, // older API: bundled withheld
      ],
    });
    const look = guideLookup(lib.exercises, true);
    expect(look({ libraryExerciseId: "glute-bridge" })).toBeNull();
    expect(look({ libraryExerciseId: "squat" })).not.toBeNull();
    expect(look({ libraryExerciseId: "plank" })).not.toBeNull();
    expect(look({ libraryExerciseId: "dumbbell-romanian-deadlift" })).toBeNull();
  });
});

describe("drift: bundled Starter content cannot reopen the hole", () => {
  const withheldStarter = EXERCISE_INFO_IDS.filter((id) => !bundledTextApproved(id));

  it("finds the withheld Starter exercises (11 on the 29 Nov list)", () => {
    expect(withheldStarter.length).toBeGreaterThan(0);
  });

  it.each(withheldStarter)("%s: detail page renders no written text, only the neutral line", (id) => {
    const info = getExerciseInfo(id)!;
    const { container, unmount } = wrap(createElement(ExerciseDetail, { mediaId: id }));
    expect(screen.getByTestId("exercise-text-withheld")).toHaveTextContent(WITHHELD_TEXT_LINE);
    const html = container.textContent ?? "";
    for (const t of [info.summary, ...info.steps, ...info.formCues, ...info.commonMistakes, ...info.safetyNotes, info.easierVariation.how, info.tempo]) {
      expect(html).not.toContain(t);
    }
    // name and facts stay
    expect(screen.getByRole("heading", { level: 1, name: info.name })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Muscles worked" })).toBeInTheDocument();
    unmount();
  });

  it.each(withheldStarter)("%s: the guided plan carries no cue", (id) => {
    const [p] = buildPlan([{ name: id, cues: ["Chest tall"], mediaId: id }], 30);
    expect(p.cues).toEqual([]);
  });

  it("an approved Starter exercise still shows its text and cues", () => {
    const { container } = wrap(createElement(ExerciseDetail, { mediaId: "squat" }));
    expect(screen.queryByTestId("exercise-text-withheld")).toBeNull();
    expect(container.textContent).toContain(getExerciseInfo("squat")!.steps[0]);
    expect(buildPlan([{ name: "Squat", cues: ["Chest tall"], mediaId: "squat" }], 30)[0].cues).toEqual(["Chest tall"]);
  });
});
