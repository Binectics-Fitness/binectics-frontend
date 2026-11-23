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

/**
 * The member's own gym health forms (PAR-Q), binectics-api
 * `me/health-forms` (api #358). Same calls and shapes as mobile #273
 * `api/healthForms.ts`. The questions, the Yes / No options and the advice
 * to speak with a doctor come from the API's PAR-Q template.
 */
export type HealthFormStatus = "pending" | "done";

export interface MyHealthForm {
  id: string;
  organization_id: string;
  organization_name: string;
  status: HealthFormStatus;
  sent_at: string | null;
  submitted_at: string | null;
}

export interface HealthFormQuestion {
  /** Position in the form, 0-based; answers are sent by it. */
  index: number;
  /** A QuestionType value: MULTIPLE_CHOICE for the yes/no questions, TEXTAREA for the details. */
  type: string;
  label: string;
  help_text: string | null;
  is_required: boolean;
  options: { value: string; label: string }[];
}

export interface MyHealthFormDetail extends MyHealthForm {
  title: string;
  questions: HealthFormQuestion[];
  answers: { index: number; value: string }[];
  /** The template's advice, once sent with a yes answer; null otherwise. */
  advice: string | null;
}

export interface HealthFormAnswer {
  index: number;
  value: string;
}

export interface HealthFormSubmitResult {
  id: string;
  status: "done";
  submitted_at: string;
  any_yes: boolean;
  /** The template's advice to speak with a doctor, when any answer was yes. */
  advice: string | null;
}

/** 409 from submit: the form was already sent (another tab, or the phone). */
export const HEALTH_FORM_ALREADY_SENT = "HEALTH_FORM_ALREADY_SENT";

export const myHealthFormsService = {
  list: () => apiClient.get<MyHealthForm[]>("/me/health-forms"),
  get: (id: string) => apiClient.get<MyHealthFormDetail>(`/me/health-forms/${encodeURIComponent(id)}`),
  submit: (id: string, answers: HealthFormAnswer[]) =>
    apiClient.post<HealthFormSubmitResult>(`/me/health-forms/${encodeURIComponent(id)}/submit`, { answers }),
};
