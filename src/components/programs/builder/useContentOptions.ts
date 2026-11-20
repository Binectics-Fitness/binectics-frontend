"use client";

import { useCallback, useEffect, useState } from "react";
import { formsService, type Form } from "@/lib/api/forms";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { DietPlanDeliveryType } from "@/lib/types";

export interface ContentOption {
  id: string;
  title: string;
}

/**
 * What a check-in form or meal plan task can link to.
 *  - Forms: published and active only; the client opens a form through its
 *    public read, which serves published forms and nothing else.
 *  - Meal plans: reusable templates (no client copy) delivered on the
 *    platform; a document plan can't render as a program task.
 * `reload` refetches after "+ New form / + New meal plan" and returns the lists.
 */
export function useContentOptions(withMealPlans: boolean) {
  const [forms, setForms] = useState<ContentOption[]>([]);
  const [mealPlans, setMealPlans] = useState<ContentOption[]>([]);

  /** Fetch and show the lists; returns them (empty on a failed read). */
  const reload = useCallback(async () => {
    const next = await fetchOptions(withMealPlans);
    if (next.forms) setForms(next.forms);
    if (next.mealPlans) setMealPlans(next.mealPlans);
    return { forms: next.forms ?? [], mealPlans: next.mealPlans ?? [] };
  }, [withMealPlans]);

  useEffect(() => {
    let live = true;
    void fetchOptions(withMealPlans).then((next) => {
      if (!live) return;
      if (next.forms) setForms(next.forms);
      if (next.mealPlans) setMealPlans(next.mealPlans);
    });
    return () => {
      live = false;
    };
  }, [withMealPlans]);

  return { forms, mealPlans, reload };
}

async function fetchOptions(withMealPlans: boolean): Promise<{ forms: ContentOption[] | null; mealPlans: ContentOption[] | null }> {
  const [f, m] = await Promise.all([
    formsService.getMyForms(),
    withMealPlans ? progressService.getProviderDietPlans() : Promise.resolve(null),
  ]);
  return {
    forms:
      f.success && f.data
        ? f.data.filter((x: Form) => x.is_published && x.is_active !== false).map((x) => ({ id: x._id, title: x.title }))
        : null,
    mealPlans:
      m && m.success && m.data
        ? m.data
            .filter((p: DietPlan) => !p.client_profile_id && !p.client_id && p.delivery_type === DietPlanDeliveryType.PLATFORM)
            .map((p) => ({ id: p._id, title: p.title }))
        : null,
  };
}
