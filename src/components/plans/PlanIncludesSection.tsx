"use client";

import { useEffect, useId, useState } from "react";
import { Chip, Eyebrow } from "@/components/ds";
import { toast } from "@/components/Toast";
import { programsService } from "@/lib/api/programs";
import { progressService } from "@/lib/api/progress";
import { paidContentCopy } from "@/lib/paidContent/helpers";
import { paidContentErrorOf } from "@/lib/api/paidContent";
import {
  includesCopy,
  pickableMealPlans,
  pickablePrograms,
  planIncludesService,
  sameIds,
  withIncluded,
  type IncludedItem,
} from "@/lib/api/planIncludes";

/**
 * What a saved plan includes: the provider's paid programs and paid library
 * meal plans. Members who buy the plan get them with it. Mount it only while
 * selling is on and the viewer may price (usePaidContentSeller), on a plan
 * that already exists.
 *
 * Saves on its own with PUT .../includes, which replaces the whole list; the
 * plan's own Save does not touch it. Items taken out stay with current
 * members until their plan ends. Mirrors mobile PlanIncludesEditor.
 */
export function PlanIncludesSection({
  orgId,
  planId,
  planName,
}: {
  orgId: string | null | undefined;
  planId: string | null | undefined;
  planName: string;
}) {
  const [programs, setPrograms] = useState<IncludedItem[]>([]);
  const [mealPlans, setMealPlans] = useState<IncludedItem[]>([]);
  const [savedPrograms, setSavedPrograms] = useState<string[]>([]);
  const [savedMeals, setSavedMeals] = useState<string[]>([]);
  const [pickedPrograms, setPickedPrograms] = useState<string[]>([]);
  const [pickedMeals, setPickedMeals] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const uid = useId();

  useEffect(() => {
    if (!orgId || !planId) return;
    let live = true;
    void Promise.all([
      planIncludesService.get(orgId, planId),
      programsService.listTemplates(false),
      progressService.getProviderDietPlans(100),
    ]).then(([current, progs, meals]) => {
      if (!live) return;
      setError(null);
      if (!current.success || !current.data) {
        setError(current.message || "We couldn't load what this plan includes.");
        setLoaded(true);
        return;
      }
      const have = current.data;
      // A role without meal plans may be refused that list: an empty list, not a failure.
      setPrograms(withIncluded(progs.success && progs.data ? pickablePrograms(progs.data) : [], have.programs));
      setMealPlans(withIncluded(meals.success && meals.data ? pickableMealPlans(meals.data) : [], have.mealPlans));
      const pIds = have.programs.map((p) => p.id);
      const mIds = have.mealPlans.map((p) => p.id);
      setSavedPrograms(pIds);
      setSavedMeals(mIds);
      setPickedPrograms(pIds);
      setPickedMeals(mIds);
      if (!progs.success) setError(progs.message || "We couldn't load your programs.");
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [orgId, planId, attempt]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const dirty = !sameIds(pickedPrograms, savedPrograms) || !sameIds(pickedMeals, savedMeals);
  const removing =
    savedPrograms.some((id) => !pickedPrograms.includes(id)) || savedMeals.some((id) => !pickedMeals.includes(id));

  const save = async () => {
    if (!orgId || !planId || saving) return;
    setSaving(true);
    setError(null);
    const res = await planIncludesService.set(orgId, planId, pickedPrograms, pickedMeals);
    setSaving(false);
    if (!res.success) {
      const e = paidContentErrorOf(res);
      setError(e ? paidContentCopy(e) : res.message || "Couldn't save what this plan includes.");
      return;
    }
    setSavedPrograms(pickedPrograms);
    setSavedMeals(pickedMeals);
    toast.success("Includes saved");
  };

  const nothingToPick = loaded && programs.length === 0 && mealPlans.length === 0;
  const failedToLoad = loaded && error !== null && programs.length === 0 && mealPlans.length === 0 && savedPrograms.length === 0;

  return (
    <section aria-labelledby={`${uid}-heading`} className="flex flex-col gap-3">
      <h3 id={`${uid}-heading`} className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        Includes
      </h3>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        {includesCopy(planName)}
      </p>

      {!planId ? (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          Save the plan first, then choose what it includes.
        </p>
      ) : !loaded ? (
        <p role="status" className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          Loading what this plan includes…
        </p>
      ) : failedToLoad ? (
        <button type="button" className="btn-ghost-v2 sm self-start min-h-11" onClick={() => {
            setLoaded(false);
            setAttempt((n) => n + 1);
          }}>
          Try again
        </button>
      ) : nothingToPick ? (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          You have no paid programs or meal plans yet. Mark one as paid, then come back to include it here.
        </p>
      ) : (
        <>
          {programs.length > 0 && (
            <div className="flex flex-col gap-2">
              <Eyebrow id={`${uid}-programs`}>Programs</Eyebrow>
              <div role="group" aria-labelledby={`${uid}-programs`} className="flex flex-wrap gap-2">
                {programs.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    ariaLabel={`Program ${p.name}`}
                    selected={pickedPrograms.includes(p.id)}
                    onClick={() => toggle(pickedPrograms, setPickedPrograms, p.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {mealPlans.length > 0 && (
            <div className="flex flex-col gap-2">
              <Eyebrow id={`${uid}-meals`}>Meal plans</Eyebrow>
              <div role="group" aria-labelledby={`${uid}-meals`} className="flex flex-wrap gap-2">
                {mealPlans.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    ariaLabel={`Meal plan ${p.name}`}
                    selected={pickedMeals.includes(p.id)}
                    onClick={() => toggle(pickedMeals, setPickedMeals, p.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {removing && (
            <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              Current members keep what you take out until their plan ends.
            </p>
          )}
          <button
            type="button"
            className="btn-ghost-v2 sm self-start min-h-11"
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save includes"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-[12.5px]" style={{ color: "var(--danger-ink)" }}>
          {error}
        </p>
      )}
    </section>
  );
}
