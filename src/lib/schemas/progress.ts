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
