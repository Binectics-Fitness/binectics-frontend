import { z } from "zod";

export const createFormSchema = z.object({
  title: z.string().min(1, "Form title is required").trim(),
  description: z.string().optional(),
  allow_multiple_submissions: z.boolean(),
  require_authentication: z.boolean(),
  company_name: z.string().optional(),
  company_description: z.string().optional(),
  custom_logo: z.string().optional(),
  custom_header_color: z.string().optional(),
});

export type CreateFormFormData = z.infer<typeof createFormSchema>;
