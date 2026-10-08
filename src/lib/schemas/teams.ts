import { z } from "zod";
import { emailSchema } from "./shared";

// ─── Organization Creation ──────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").trim(),
  description: z.string().optional(),
});

export type CreateOrganizationFormData = z.infer<
  typeof createOrganizationSchema
>;

// ─── Invite Member (by email) ───────────────────────────────────

export const inviteMemberSchema = z.object({
  email: emailSchema,
  team_role_id: z.string().min(1, "Please select a role"),
});

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

// ─── Add Member Directly ────────────────────────────────────────

// Sends a pending invitation (no account, no password). Names are optional.
export const addMemberDirectSchema = z.object({
  first_name: z.string().trim().optional(),
  last_name: z.string().trim().optional(),
  email: emailSchema,
  team_role_id: z.string().min(1, "Please select a role"),
});

export type AddMemberDirectFormData = z.infer<typeof addMemberDirectSchema>;

// ─── Create Team Role ───────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").trim(),
  code: z.string().min(1, "Role code is required").trim(),
  permissions: z.array(z.string()),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
