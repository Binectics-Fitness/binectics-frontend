"use client";

import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import ExerciseLibraryView from "@/components/exercises/ExerciseLibraryView";

/** The exercise Library (reference), behind the runtime flag `exercise_library_page`. */
export default function GymLibraryPage() {
  return (
    <GymDashboardShell activeItem="Library" crumb="Library">
      <ExerciseLibraryView audience="gym" />
    </GymDashboardShell>
  );
}
