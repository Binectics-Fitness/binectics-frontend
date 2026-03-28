import { z } from "zod";
import { emailSchema } from "./shared";

// ─── Admin Login ────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

// ─── Create Super Admin ─────────────────────────────────────────

export const createSuperAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  country: z.string().min(1, "Country is required"),
});

export type CreateSuperAdminFormData = z.infer<typeof createSuperAdminSchema>;
