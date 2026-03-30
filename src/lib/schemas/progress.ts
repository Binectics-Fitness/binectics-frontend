import { z } from "zod";
import { emailSchema } from "./shared";

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Schema for optional numeric form inputs.
 *
 * HTML `<input type="number">` with react-hook-form's `valueAsNumber: true`
 * yields NaN when the field is empty. Zod's `z.number()` rejects NaN, so
 * this helper accepts it gracefully. The NaN is cleaned to `undefined` in
 * the form's onSubmit handler via `value || undefined`.
 *
 * Usage: `calories: numericInput(0, 10000),`
 */
function numericInput(min: number, max: number) {
  return z.union([z.number().min(min).max(max), z.nan()]).optional();
}

// ─── Add Client ─────────────────────────────────────────────────

export const addClientSchema = z.object({
  email: emailSchema,
  first_name: z.string().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
  starting_weight_kg: z.string().optional(),
  target_weight_kg: z.string().optional(),
  height_cm: z.string().optional(),
  goals: z.string().optional(),
});

export type AddClientFormData = z.infer<typeof addClientSchema>;

// ─── Create Journal Entry ───────────────────────────────────────

export const createJournalSchema = z.object({
  notes: z.string().min(1, "Journal notes are required").trim(),
  mood: z.string().optional(),
  weight_kg: z.string().optional(),
  adherence_score: z.string().optional(),
});

export type CreateJournalFormData = z.infer<typeof createJournalSchema>;

// ─── Workout Exercise ───────────────────────────────────────────

export const workoutExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required").max(200).trim(),
  description: z.string().max(1000).optional(),
  sets: numericInput(1, 100),
  reps: numericInput(1, 1000),
  duration_minutes: numericInput(1, 600),
  rest_seconds: numericInput(0, 600),
  order: z.number().min(1).max(100),
  notes: z.string().max(500).optional(),
});

export type WorkoutExerciseFormData = z.infer<typeof workoutExerciseSchema>;

// ─── Create/Edit Workout Plan ───────────────────────────────────

export const workoutPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().max(3000).optional(),
  exercises: z.array(workoutExerciseSchema).optional(),
  trainer_notes: z.string().max(3000).optional(),
  frequency: z.string().max(100).optional(),
  difficulty_level: z.string().optional(),
});

export type WorkoutPlanFormData = z.infer<typeof workoutPlanSchema>;

// ─── Diet Meal ──────────────────────────────────────────────────

export const dietMealSchema = z.object({
  meal_type: z.string().min(1, "Meal type is required"),
  title: z.string().min(1, "Meal title is required").max(200).trim(),
  description: z.string().max(2000).optional(),
  foods: z.array(z.string()).optional(),
  calories: numericInput(0, 10000),
  notes: z.string().max(500).optional(),
  order: z.number().min(1).max(100),
});

export type DietMealFormData = z.infer<typeof dietMealSchema>;

// ─── Create/Edit Diet Plan (platform) ───────────────────────────

export const dietPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().max(5000).optional(),
  delivery_type: z.string().min(1, "Delivery type is required"),
  meals: z.array(dietMealSchema).optional(),
  dietitian_notes: z.string().max(3000).optional(),
});

export type DietPlanFormData = z.infer<typeof dietPlanSchema>;
