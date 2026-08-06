import { z } from "zod";

/**
 * Form-level validation for a membership plan.
 *
 * Currently unreferenced — <PlanForm> and <PlanModal> validate inline. It is
 * kept aligned with the API contract anyway: the field is named
 * `price_minor_input` so that wiring it up cannot accidentally satisfy
 * `CreateOrgMembershipPlanRequest.price_minor` with a MAJOR-unit value.
 *
 * The string it holds is what the user typed, in MAJOR units. Converting it is
 * the caller's job and there is exactly one way to do it —
 * `parseMoneyMinor()` from lib/money/moneyInput, or `<MoneyInput>`, which hands
 * back the minor value directly. Never `Number(value) * 100`.
 */
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
  /** The typed string, in MAJOR units — see the schema docblock. */
  price_minor_input: z
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
