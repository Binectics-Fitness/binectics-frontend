"use client";

import { useEffect, useMemo, useState } from "react";
import { loadLibrary } from "@/components/programs/exerciseLibraryCache";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { getExerciseInfo } from "@/lib/exercises/exerciseInfo";
import { memberTextApproved } from "@/lib/exercises/memberText";
import { hasGuidance, MEMBER_GUIDANCE_FLAG, type LibraryExercise } from "@/lib/exercises/library";
import type { LibraryRef } from "@/lib/exercises/clientArt";

/** The library exercise id a provider-assigned row points at, or null. */
export function libraryIdOf(ref: LibraryRef): string | null {
  const id = ref.libraryExerciseId || ref.mediaId?.split("--")[0];
  return id || null;
}

/**
 * Whether a member may read the library's written guidance for an exercise.
 *
 * The Starter program already shows members its own exercises' steps and
 * cues, and the library carries the same words for those, so they are always
 * allowed. Every other exercise's text is new and has not been read by a
 * coach: it shows only when the owner has switched MEMBER_GUIDANCE_FLAG on.
 */
export function memberMaySeeGuidance(id: string, flagOn: boolean, apiApproved?: boolean | null): boolean {
  // The approved-text gate only removes: withheld exercises show no library text whatever the flag says.
  if (!memberTextApproved(id, apiApproved)) return false;
  return flagOn || !!getExerciseInfo(id);
}

/** Looks up the guidance a member may read for a provider-assigned row. */
export type GuideLookup = (ref: LibraryRef) => LibraryExercise | null;

/** Pure form of the lookup, for tests. */
export function guideLookup(exercises: readonly LibraryExercise[], flagOn: boolean): GuideLookup {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return (ref) => {
    const id = libraryIdOf(ref);
    if (!id) return null;
    const entry = byId.get(id);
    if (!entry || !hasGuidance(entry)) return null;
    return memberMaySeeGuidance(id, flagOn, entry.memberTextApproved) ? entry : null;
  };
}

const NONE: GuideLookup = () => null;

/**
 * The written guidance a member may read for the exercises in a list.
 * `enabled` is false until the list has a library exercise in it, so a
 * member with only custom exercises never fetches the library. A library
 * that fails to load simply means no guidance: the rows stay as they are.
 */
export function useClientExerciseGuides(enabled: boolean): GuideLookup {
  const flagOn = useFeatureFlag(MEMBER_GUIDANCE_FLAG);
  const [exercises, setExercises] = useState<LibraryExercise[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void loadLibrary().then((s) => {
      if (live && s.status === "ready") setExercises(s.library.exercises);
    });
    return () => {
      live = false;
    };
  }, [enabled]);
  return useMemo(() => (exercises ? guideLookup(exercises, flagOn) : NONE), [exercises, flagOn]);
}
