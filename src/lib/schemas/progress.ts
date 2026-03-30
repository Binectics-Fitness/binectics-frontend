import { z } from "zod";
import { emailSchema } from "./shared";

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
  sets: z.number().min(1).max(100).optional(),
  reps: z.number().min(1).max(1000).optional(),
  duration_minutes: z.number().min(1).max(600).optional(),
  rest_seconds: z.number().min(0).max(600).optional(),
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
  calories: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0).max(10000).optional(),
  ),
  notes: z.string().max(500).optional(),
  order: z.coerce.number().min(1).max(100),
});

export type DietMealFormData = z.infer<typeof dietMealSchema>;

// ─── Create/Edit Diet Plan (platform) ───────────────────────────

const dietPlanBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().max(5000).optional(),
  delivery_type: z.string().min(1, "Delivery type is required"),
  meals: z.array(dietMealSchema).optional(),
  dietitian_notes: z.string().max(3000).optional(),
});

/**
 * When delivery_type is "document" we strip the meals array before validation
 * so hidden/stale meal entries don't block form submission.
 */
export const dietPlanSchema = z.preprocess((raw) => {
  const obj = raw as Record<string, unknown>;
  if (obj?.delivery_type === "document") {
    const { meals: _meals, ...rest } = obj;
    return rest;
  }
  return raw;
}, dietPlanBaseSchema);

export type DietPlanFormData = z.infer<typeof dietPlanBaseSchema>;
