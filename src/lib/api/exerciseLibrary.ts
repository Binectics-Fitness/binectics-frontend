import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import {
  normalizeLibrary,
  type ExerciseLibrary,
} from "@/lib/exercises/library";

/*
 * Provider exercise library client. Contract:
 * binectics-plans/provider-library-contract.md (binectics-api #326).
 *   GET /exercise-library  (any signed-in user)
 * The reader is tolerant: an unreadable body is treated as "library not
 * available", so the picker hides and custom exercises keep working.
 */
export const exerciseLibraryService = {
  async getLibrary(): Promise<ApiResponse<ExerciseLibrary>> {
    const res = await apiClient.get<unknown>("/exercise-library");
    if (!res.success) return res as ApiResponse<ExerciseLibrary>;
    return { ...res, data: normalizeLibrary(res.data) };
  },
};
