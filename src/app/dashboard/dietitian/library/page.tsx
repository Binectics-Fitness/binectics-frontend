"use client";

import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import ExerciseLibraryView from "@/components/exercises/ExerciseLibraryView";

/** The exercise Library (reference), behind the runtime flag `exercise_library_page`. */
export default function DietitianLibraryPage() {
  return (
    <DietitianDashboardShell activeItem="Library" crumb="Library">
      <ExerciseLibraryView audience="dietitian" />
    </DietitianDashboardShell>
  );
}
