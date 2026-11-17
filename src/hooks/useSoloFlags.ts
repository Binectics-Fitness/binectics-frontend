"use client";

import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { SOLO_FLAGS } from "@/lib/solo/flag";

export interface SoloFlagState {
  water: boolean;
  checklist: boolean;
  fasting: boolean;
  history: boolean;
  /** Server flags are still loading (every flag reads off meanwhile). */
  isLoading: boolean;
}

/** The solo server flags from GET /feature-flags/me. Anything unknown is off. */
export function useSoloFlags(): SoloFlagState {
  const { isEnabled, isLoading } = useFeatureFlags();
  return {
    water: isEnabled(SOLO_FLAGS.water),
    checklist: isEnabled(SOLO_FLAGS.checklist),
    fasting: isEnabled(SOLO_FLAGS.fasting),
    history: isEnabled(SOLO_FLAGS.history),
    isLoading,
  };
}
