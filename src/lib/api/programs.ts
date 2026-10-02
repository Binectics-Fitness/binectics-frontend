import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Provider authoring + assignment for Programs (Protocols) — the composable,
 * versioned, event-sourced care-program domain. A template is versioned:
 * editing a published template forks a new draft (handled server-side);
 * assigning a published version deep-copies it into a per-client instance whose
 * scheduled occurrences the client checks off. Types are hand-written here
 * (mirroring nutrition.ts) rather than pulled from the generated schema so the
 * UI does not depend on the API schema landing first.
 */

// ── Enums (serialized lowercase, mirroring the API) ──────────────────

export type ProgramTemplateStatus = "draft" | "published" | "archived";
export type ProgramComponentType =
  | "instruction"
  | "habit"
  | "meal_plan"
  | "measurement"
  | "form"
  // Accepted by the API; not offered in the builder until providers have
  // reusable workout plans to link (today every workout plan belongs to one
  // client).
  | "workout_plan";
export type ProgramCadence =
  | "once"
  | "daily"
  | "weekly"
  | "n_per_week"
  | "custom";
export type GoalDirection = "reach" | "reduce" | "maintain";
export type ProgramInstanceStatus =
  | "assigned"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";
export type OccurrenceStatus = "pending" | "done" | "skipped" | "missed";

// ── Definition (versioned template) ──────────────────────────────────

export interface ProgramBlock {
  _id?: string;
  type: ProgramComponentType;
  order: number;
  cadence?: ProgramCadence;
  start_offset_days?: number;
  duration_days?: number;
  times_per_week?: number;
  title?: string;
  detail?: string;
  metric?: string;
  meal_plan_id?: string;
  workout_plan_id?: string;
  /** Form (questionnaire) the client fills in to complete a form task. */
  form_id?: string;
}

export interface ProgramPhase {
  _id?: string;
  name: string;
  order: number;
  duration_days?: number;
  blocks: ProgramBlock[];
}

export interface ProgramGoalDef {
  _id?: string;
  label: string;
  metric?: string;
  direction: GoalDirection;
  target?: number;
  target_offset_days?: number;
}

export interface ProgramTemplate {
  _id: string;
  created_by: string;
  organization_id: string | null;
  name: string;
  category?: string;
  status: ProgramTemplateStatus;
  latest_version_no: number;
  latest_published_version_no: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramTemplateVersion {
  _id: string;
  template_id: string;
  version_no: number;
  published_at: string | null;
  name: string;
  category?: string;
  goal_statement?: string;
  duration_days?: number;
  intensity?: string;
  indications?: string;
  cautions?: string;
  /** Days after a task's date it can still be done (marked late). 0-7. */
  catch_up_days?: number;
  phases: ProgramPhase[];
  goals: ProgramGoalDef[];
}

/** GET /programs/:id and POST /programs both return the pair. */
export interface ProgramTemplateDetail {
  template: ProgramTemplate;
  version: ProgramTemplateVersion;
}

// ── Instance (a client's assigned program) ───────────────────────────

export interface InstanceGoal {
  _id?: string;
  label: string;
  metric?: string;
  direction: GoalDirection;
  target?: number;
  latest_value?: number;
}

export interface ProgramInstance {
  _id: string;
  template_id: string;
  template_version_id: string;
  client_profile_id: string;
  client_id:
    | string
    | { _id: string; first_name: string; last_name: string };
  provider_id: string;
  organization_id: string | null;
  status: ProgramInstanceStatus;
  started_at?: string;
  ends_at?: string;
  timezone?: string;
  /** Set when the program completes or is cancelled. */
  ended_at?: string;
  catch_up_days?: number;
  name: string;
  category?: string;
  goals: InstanceGoal[];
  occurrences_scheduled: number;
  occurrences_done: number;
  created_at: string;
  updated_at: string;
}

export interface AdherenceSummary {
  done: number;
  missed: number;
  skipped: number;
  pending: number;
  /**
   * done / (done + missed + skipped), rounded: a skipped task counts against
   * adherence like a missed one. null until anything is actionable.
   */
  adherence_pct: number | null;
}

export interface InstanceDetail {
  instance: ProgramInstance;
  adherence: AdherenceSummary;
  goals: InstanceGoal[];
}

// ── Request payloads ─────────────────────────────────────────────────

export interface ProgramDefinitionPayload {
  name: string;
  category?: string;
  goal_statement?: string;
  duration_days?: number;
  intensity?: string;
  indications?: string;
  cautions?: string;
  catch_up_days?: number;
  phases?: ProgramPhase[];
  goals?: ProgramGoalDef[];
}

export type CreateProgramRequest = ProgramDefinitionPayload & {
  organization_id?: string;
};
export type UpdateProgramRequest = Partial<ProgramDefinitionPayload>;

export interface AssignProgramRequest {
  client_profile_id: string;
  start_date?: string;
  timezone?: string;
}

// ── One-off tasks (sent outside any program) ─────────────────────────

export type OneOffTaskType = "form" | "instruction";

/** A task the provider sent a client on its own, with where it stands. */
export interface OneOffTask {
  id: string;
  instance_id: string;
  type: OneOffTaskType;
  title: string;
  detail: string | null;
  form_id: string | null;
  /** Due day, YYYY-MM-DD, in the client's timezone. */
  due_date: string;
  status: OccurrenceStatus;
  completed_late: boolean;
  actioned_at: string | null;
  form_response_id: string | null;
}

/** GET /programs/clients/:id/tasks - the tasks plus the client's calendar. */
export interface OneOffTaskList {
  /** The client's today (YYYY-MM-DD), in their program timezone. */
  today: string;
  /** The latest due day the API accepts. */
  max_due: string;
  tasks: OneOffTask[];
}

export interface SendOneOffTaskRequest {
  type: OneOffTaskType;
  form_id?: string;
  title?: string;
  detail?: string;
  due_date?: string;
  timezone?: string;
}

// ── The provider's view of one client ────────────────────────────────

/** A program as the provider sees it for one client (GET .../overview). */
export interface ClientProgramSummary {
  id: string;
  name: string;
  kind: "program" | "one_off";
  status: ProgramInstanceStatus;
  started_at?: string;
  ends_at?: string | null;
  progress?: {
    day: number | null;
    total_days: number | null;
    last_7_days: { scheduled: number; done: number; done_late: number; skipped: number; missed: number; open: number };
  };
  counts: { done: number; missed: number; skipped: number; pending: number };
  /**
   * done / (done + missed + skipped): a skipped task counts against
   * adherence like a missed one. null until anything was due.
   */
  adherence_pct: number | null;
}

export interface ClientProgramOverview {
  programs: ClientProgramSummary[];
  /** What the client has on Today from this provider. */
  today: Array<{ _id: string; title?: string; status: OccurrenceStatus; scheduled_for: string }>;
}

export const programsService = {
  // ── Authoring ──────────────────────────────────────────────────
  listTemplates(includeArchived = false): Promise<ApiResponse<ProgramTemplate[]>> {
    const q = includeArchived ? "?includeArchived=true" : "";
    return apiClient.get<ProgramTemplate[]>(`/programs${q}`);
  },

  getTemplate(id: string): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.get<ProgramTemplateDetail>(`/programs/${id}`);
  },

  createTemplate(
    payload: CreateProgramRequest,
  ): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.post<ProgramTemplateDetail>("/programs", payload);
  },

  updateTemplate(
    id: string,
    payload: UpdateProgramRequest,
  ): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.patch<ProgramTemplateDetail>(`/programs/${id}`, payload);
  },

  publishTemplate(id: string): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.post<ProgramTemplateDetail>(`/programs/${id}/publish`, {});
  },

  archiveTemplate(id: string): Promise<ApiResponse<{ archived: boolean }>> {
    return apiClient.delete<{ archived: boolean }>(`/programs/${id}`);
  },

  // ── Assignment & monitoring ────────────────────────────────────
  assign(
    id: string,
    payload: AssignProgramRequest,
  ): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(`/programs/${id}/assign`, payload);
  },

  listAssignments(id: string): Promise<ApiResponse<ProgramInstance[]>> {
    return apiClient.get<ProgramInstance[]>(`/programs/${id}/assignments`);
  },

  getInstance(instanceId: string): Promise<ApiResponse<InstanceDetail>> {
    return apiClient.get<InstanceDetail>(`/programs/instances/${instanceId}`);
  },

  pauseInstance(instanceId: string): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(
      `/programs/instances/${instanceId}/pause`,
      {},
    );
  },

  resumeInstance(instanceId: string): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(
      `/programs/instances/${instanceId}/resume`,
      {},
    );
  },

  completeInstance(instanceId: string): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(
      `/programs/instances/${instanceId}/complete`,
      {},
    );
  },

  getClientOverview(clientProfileId: string): Promise<ApiResponse<ClientProgramOverview>> {
    return apiClient.get<ClientProgramOverview>(`/programs/clients/${clientProfileId}/overview`);
  },

  // ── One-off tasks ──────────────────────────────────────────────
  listOneOffTasks(clientProfileId: string): Promise<ApiResponse<OneOffTaskList>> {
    return apiClient.get<OneOffTaskList>(`/programs/clients/${clientProfileId}/tasks`);
  },

  sendOneOffTask(
    clientProfileId: string,
    payload: SendOneOffTaskRequest,
  ): Promise<ApiResponse<OneOffTask>> {
    return apiClient.post<OneOffTask>(`/programs/clients/${clientProfileId}/tasks`, payload);
  },

  withdrawOneOffTask(
    clientProfileId: string,
    taskId: string,
  ): Promise<ApiResponse<{ withdrawn: boolean }>> {
    return apiClient.delete<{ withdrawn: boolean }>(
      `/programs/clients/${clientProfileId}/tasks/${taskId}`,
    );
  },

  cancelInstance(instanceId: string): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(
      `/programs/instances/${instanceId}/cancel`,
      {},
    );
  },
};
