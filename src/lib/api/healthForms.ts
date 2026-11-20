import { apiClient } from "./client";

/**
 * A member's gym health form (PAR-Q), for the gym's owner and staff with
 * marketplace:manage_listing (binectics-api src/health-forms). The status
 * read carries no answers; the answers read is audit-logged on the API.
 */
export interface StaffHealthForm {
  required: boolean;
  status: "pending" | "done" | "not_sent";
  sent_at: string | null;
  submitted_at: string | null;
  needs_follow_up: boolean;
  followed_up_at: string | null;
  followed_up_by_name: string | null;
}

export interface StaffHealthFormAnswers extends StaffHealthForm {
  answers: { index: number; label: string; type: string | null; value: string }[];
}

const path = (orgId: string, memberUserId: string) =>
  `/marketplace/organizations/${orgId}/members/${memberUserId}/health-form`;

export const healthFormsService = {
  status: (orgId: string, memberUserId: string) => apiClient.get<StaffHealthForm>(path(orgId, memberUserId)),
  answers: (orgId: string, memberUserId: string) =>
    apiClient.get<StaffHealthFormAnswers>(`${path(orgId, memberUserId)}/answers`),
  markFollowedUp: (orgId: string, memberUserId: string) =>
    apiClient.post<StaffHealthForm>(`${path(orgId, memberUserId)}/followed-up`),
};
