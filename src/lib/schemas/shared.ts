import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email");

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(12, "Password must be at least 12 characters")
  .regex(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
    "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)",
  );

export const nameSchema = z.string().min(1, "This field is required").trim();
