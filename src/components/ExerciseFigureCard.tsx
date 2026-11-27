"use client";

import { useState } from "react";
import { DSCard } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { authService } from "@/lib/api/auth";
import { figureOrDefault, type ExerciseFigure } from "@/lib/exerciseFigure";
import { toast } from "@/components/Toast";
import { ExerciseFigurePicker } from "./ExerciseFigurePicker";

/**
 * Settings > Profile: the exercise figure. Shown only while the
 * exercise_figure_choice flag is on (default off, until the production figure
 * images exist). Private: nobody else sees it.
 */
export function ExerciseFigureCard() {
  const on = useFeatureFlag("exercise_figure_choice");
  const { user, updateUser } = useAuth();
  const saved = figureOrDefault(user?.exercise_figure);
  const [figure, setFigure] = useState<ExerciseFigure>(saved);
  const [saving, setSaving] = useState(false);
  if (!on || !user) return null;
  const changed = figure.body !== saved.body || figure.tone !== saved.tone;

  const save = async () => {
    setSaving(true);
    try {
      const res = await authService.updateProfile({ exercise_figure: figure });
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success("Saved");
      } else {
        toast.error(res.message || "Could not save that change. Please try again.");
      }
    } catch {
      toast.error("Could not save that change. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DSCard className="mb-6 p-4 sm:p-6" style={{ overflow: "visible" }}>
      <h3 className="mb-1 text-[16px] font-medium text-ink">Exercise figure</h3>
      <p className="mb-4 text-sm text-fg-2">Shown in your exercise guides.</p>
      <ExerciseFigurePicker value={figure} onChange={setFigure} />
      <button
        type="button"
        onClick={() => void save()}
        disabled={!changed || saving}
        className="mt-5 inline-flex min-h-[44px] items-center rounded-(--r-2) bg-ink px-5 text-sm font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </DSCard>
  );
}
