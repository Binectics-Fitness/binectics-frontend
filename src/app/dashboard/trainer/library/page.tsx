"use client";

import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import ExerciseLibraryView from "@/components/exercises/ExerciseLibraryView";

/** The exercise Library (reference), behind the runtime flag `exercise_library_page`. */
export default function TrainerLibraryPage() {
  return (
    <TrainerDashboardShell activeItem="Library" crumb="Library">
      <ExerciseLibraryView audience="trainer" />
    </TrainerDashboardShell>
  );
}
