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
