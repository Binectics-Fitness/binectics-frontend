import { z } from "zod";
import { emailSchema } from "./shared";

/**
 * The public contact form (/contact). Limits match the inputs' own
 * minLength/maxLength so the browser and this schema agree.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100, "Keep your name under 100 characters"),
  email: emailSchema.max(254, "That email address is too long"),
  subject: z.string().trim().min(3, "Please add a subject").max(200, "Keep the subject under 200 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(2000, "Keep the message under 2,000 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const verificationOtpSchema = z.object({
  otp: z
    .string()
    .length(6, "Please enter a valid 6-digit code")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

export type VerificationOtpFormData = z.infer<typeof verificationOtpSchema>;
