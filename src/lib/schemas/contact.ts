import { z } from "zod";
import { emailSchema } from "./shared";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: emailSchema,
  subject: z.string().min(1, "Subject is required").trim(),
  category: z.string(),
  message: z
    .string()
    .min(1, "Message is required")
    .min(20, "Message must be at least 20 characters")
    .trim(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const verificationOtpSchema = z.object({
  otp: z
    .string()
    .length(6, "Please enter a valid 6-digit code")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

export type VerificationOtpFormData = z.infer<typeof verificationOtpSchema>;
