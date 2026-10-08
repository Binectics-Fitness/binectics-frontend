import { z } from "zod";
import { emailSchema } from "./shared";

// ─── Admin Login ────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
