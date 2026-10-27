import { StarterEquipment, StarterGoal, StarterLeaveReason, type StarterDaysPerWeek } from "./types";

/**
 * Maps the goals a member saved on their profile (free-text tags, plus
 * onboarding ids) to the three Starter Program goals so the picker can
 * pre-select one. Anything unmapped is ignored. Same table as mobile.
 */
const GOAL_BY_TAG: Record<string, StarterGoal> = {
  "weight loss": StarterGoal.LoseWeight,
  "lose body fat": StarterGoal.LoseWeight,
  "build muscle": StarterGoal.BuildStrength,
  "gain strength": StarterGoal.BuildStrength,
  "general fitness": StarterGoal.GetActive,
  "increase endurance": StarterGoal.GetActive,
  "improve cardio": StarterGoal.GetActive,
  "stress relief": StarterGoal.GetActive,
  weight: StarterGoal.LoseWeight,
  strong: StarterGoal.BuildStrength,
  better: StarterGoal.GetActive,
};

export const STARTER_GOALS: { value: StarterGoal; label: string }[] = [
  { value: StarterGoal.LoseWeight, label: "Lose weight" },
  { value: StarterGoal.BuildStrength, label: "Build strength" },
  { value: StarterGoal.GetActive, label: "Get more active" },
];

export const STARTER_EQUIPMENT: { value: StarterEquipment; label: string }[] = [
  { value: StarterEquipment.None, label: "None" },
  { value: StarterEquipment.Dumbbells, label: "Dumbbells or bands" },
  { value: StarterEquipment.Gym, label: "Gym" },
];

export const STARTER_DAYS: { value: StarterDaysPerWeek; label: string }[] = [
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
];

export const STARTER_LEAVE_REASONS: { value: StarterLeaveReason; label: string }[] = [
  { value: StarterLeaveReason.TooHard, label: "Too hard" },
  { value: StarterLeaveReason.TooEasy, label: "Too easy" },
  { value: StarterLeaveReason.NoTime, label: "No time" },
  { value: StarterLeaveReason.NoEquipment, label: "No equipment" },
  { value: StarterLeaveReason.Other, label: "Something else" },
];

/** The starter goal for one saved tag, or null. */
export function starterGoalForTag(tag: string): StarterGoal | null {
  return GOAL_BY_TAG[tag.trim().toLowerCase()] ?? null;
}

/** The first saved tag that maps (the member's own order wins), or null. */
export function suggestStarterGoal(
  fitnessGoals: readonly string[] | null | undefined,
): StarterGoal | null {
  for (const tag of fitnessGoals ?? []) {
    const goal = starterGoalForTag(tag);
    if (goal) return goal;
  }
  return null;
}
