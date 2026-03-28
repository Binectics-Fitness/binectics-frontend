import { z } from "zod";

export const membershipPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").trim(),
  description: z.string().optional(),
  plan_type: z.enum(["subscription", "one_time"]),
  duration_days: z
    .string()
    .min(1, "Duration is required")
    .refine((val) => {
      const n = Number(val);
      return Number.isInteger(n) && n >= 1;
    }, "Duration must be at least 1 day")
    .refine((val) => Number(val) <= 3650, "Duration cannot exceed 3,650 days"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => {
      const n = Number(val);
      return Number.isFinite(n) && n >= 0;
    }, "Price must be a valid positive number")
    .refine(
      (val) => Number(val) <= 999999.99,
      "Price cannot exceed 999,999.99",
    ),
  currency: z.string().min(1, "Currency is required"),
  features: z.array(z.string()),
  is_public: z.boolean(),
});

export type MembershipPlanFormData = z.infer<typeof membershipPlanSchema>;
