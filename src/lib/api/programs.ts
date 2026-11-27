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
  // Built in the program builder from inline exercises (library picker or
  // custom). Linking an existing workout plan is still API-only.
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

/**
 * One exercise inside a workout_plan block. Library picks carry the three
 * library fields; custom exercises carry none. `name` is the required
 * snapshot (max 80 here).
 */
export interface ProgramExercise {
  name: string;
  sets?: number;
  reps?: number;
  seconds?: number;
  rest_seconds?: number;
  cues?: string[];
  library_exercise_id?: string;
  library_variant?: string;
  media_id?: string;
}

/**
 * A rule that completes (habit, workout_plan) or fills (measurement) a task
 * by itself. Health-app metrics come from connected apps; `fasting_hours` and
 * `water_glasses` come from the client's own logs in Binectics (habit only,
 * `gte` only, the task's own day only).
 */
export type ProgramAutoRuleMetric =
  | "steps"
  | "sleep_minutes"
  | "resting_hr_bpm"
  | "weight_kg"
  | "exercise_minutes"
  | "exercise_session"
  | "fasting_hours"
  | "water_glasses";

export interface ProgramAutoRule {
  metric: ProgramAutoRuleMetric;
  comparator: "gte" | "lte" | "any";
  threshold?: number;
  window?: "scheduled_day" | "open_window";
  activity_types?: string[];
  sources?: string[];
  recording_methods?: string[];
}

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
  /** Inline exercises of a workout_plan block (not with workout_plan_id). */
  exercises?: ProgramExercise[];
  /** Form (questionnaire) the client fills in to complete a form task. */
  form_id?: string;
  /** Completes or fills the task by itself (see ProgramAutoRule). */
  auto_rule?: ProgramAutoRule;
  /**
   * Measurement only: the value the client works toward. Saving it makes or
   * updates the program goal for this metric (api #361); removing it removes
   * a goal it made.
   */
  target?: number;
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
  /** Made from a measurement task's target (api #361); the API keeps it in step. */
  from_block?: boolean;
}

/**
 * Whether clients would get something new by publishing (api #361). Comes
 * back on list rows, GET /programs/:id and create/update/publish/assign.
 */
export interface ProgramPublishState {
  /** Paid: sold on its own, included in a plan, or shown on a listing. */
  sold_or_listed: boolean;
  /** Version clients get today; 0 = never published. */
  published_version_no: number;
  has_unpublished_changes: boolean;
  /** sold_or_listed && has_unpublished_changes: show "Publish changes" (D1). */
  needs_publish: boolean;
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
  /** Raw paid-content block (read with normalizeAccess); absent means free. */
  access?: unknown;
  /** On list rows (api #361). */
  publish_state?: ProgramPublishState;
  /** On list rows: tasks in the latest version. Absent on older responses. */
  task_count?: number;
  /** On list rows: clients on a version older than the latest published one. */
  clients_on_older_version?: number;
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
  publish_state?: ProgramPublishState;
}

/** POST /programs/:id/assign with publish_latest (api #361): all or nothing. */
export interface StartClientResult {
  instance: ProgramInstance;
  template: ProgramTemplate;
  version: ProgramTemplateVersion;
  /** True when this call published the latest draft. */
  published: boolean;
  publish_state: ProgramPublishState;
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
  /** "First Last" on GET /programs/:id/assignments (api #360); null without a name. */
  client_name?: string | null;
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
  /** On GET /programs/:id/assignments: the version this client is on. */
  version_no?: number | null;
  latest_published_version_no?: number;
  on_older_version?: boolean;
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
  /** The client's name ("First Last"); the instance itself only carries the id. */
  client_name?: string | null;
  /** Which version this client is on, and whether a newer one is published. */
  version?: {
    version_no: number;
    latest_published_version_no: number;
    newer_available: boolean;
  } | null;
  /** An update that can still be taken back (24 hours). */
  revertable_update?: {
    update_id: string;
    from_version_no: number;
    to_version_no: number;
    applied_at: string;
    revert_until: string;
  } | null;
}

// ── Update clients (propagate a newer version, future tasks only) ────

export type UpdateDiffKind = "added" | "removed" | "changed";

export interface UpdateDiffItem {
  kind: UpdateDiffKind;
  title: string;
  /** "Week 2", "Weeks 3-4". */
  where: string;
  detail?: string;
}

export interface UpdateClientPreview {
  instance_id: string;
  client_profile_id: string;
  client_name: string | null;
  status: ProgramInstanceStatus;
  from_version_no: number;
  versions_behind: number;
  future_tasks: { added: number; changed: number; removed: number; total: number };
  /** The client's own calendar day the update starts to apply (YYYY-MM-DD). */
  effective_from: string;
  selectable: boolean;
  disabled_reason: string | null;
  default_checked: boolean;
  paid: boolean;
}

export interface UpdatePreview {
  template: { id: string; name: string };
  target_version_no: number;
  will_publish: boolean;
  sold: {
    is_sold: boolean;
    paid_clients: Array<{ client_name: string | null; from_version_no: number }>;
  };
  changes: Array<{
    from_version_no: number;
    client_count: number;
    items: UpdateDiffItem[];
    total_items: number;
  }>;
  clients: UpdateClientPreview[];
}

export type UpdateResultStatus =
  | "updated"
  | "replayed"
  | "already_current"
  | "nothing_to_change"
  | "failed";

export interface UpdateClientResult {
  instance_id: string;
  client_name: string | null;
  status: UpdateResultStatus;
  update_id?: string;
  to_version_no?: number;
  tasks_changed?: number;
  revert_until?: string;
  error_code?: string;
  message?: string;
}

export interface UpdateClientsResponse {
  target_version_no: number;
  published: boolean;
  results: UpdateClientResult[];
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
  /**
   * Publish the latest draft and assign it in one transaction (api #361).
   * Refused with 409 PROGRAM_UNPUBLISHED_CHANGES while
   * publish_state.needs_publish (a sold or listed program with edits).
   */
  publish_latest?: boolean;
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

/**
 * One task on the coach results page (GET /programs/clients/:id/results).
 * For a fasting or water task this is all the coach gets (owner ruling,
 * 19 Nov 2026): the day's state and one number.
 */
export interface ProgramResultItem {
  id: string;
  title: string | null;
  type: ProgramComponentType;
  /** A past pending task whose catch-up window closed reads as missed. */
  status: OccurrenceStatus;
  completed_late: boolean;
  completion_source: "member" | "auto" | null;
  auto: { metric: ProgramAutoRuleMetric; comparator: string; threshold: number | null } | null;
  auto_evidence: { value: number; local_day: string; withdrawn: boolean } | null;
  /** Today only: pending water's glasses so far, or a health-app total. */
  auto_progress: { value: number; threshold: number | null } | null;
}

export interface ProgramResultProgram {
  id: string;
  name: string;
  status: ProgramInstanceStatus;
  /** The program's own day today (YYYY-MM-DD, its timezone). */
  today: string;
  days: Array<{ day: string; items: ProgramResultItem[] }>;
}

export interface ClientProgramResults {
  days: number;
  programs: ProgramResultProgram[];
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

  /** Copy a program (its latest version) into a new draft named "<name> (copy)". */
  duplicateTemplate(id: string): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.post<ProgramTemplateDetail>(`/programs/${id}/duplicate`, {});
  },

  publishTemplate(id: string): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.post<ProgramTemplateDetail>(`/programs/${id}/publish`, {});
  },

  archiveTemplate(id: string): Promise<ApiResponse<{ archived: boolean }>> {
    return apiClient.delete<{ archived: boolean }>(`/programs/${id}`);
  },

  /**
   * Undo an archive: the program returns to published (its latest version
   * is published) or draft. A program that isn't archived comes back as is.
   */
  restoreTemplate(id: string): Promise<ApiResponse<ProgramTemplateDetail>> {
    return apiClient.post<ProgramTemplateDetail>(`/programs/${id}/restore`, {});
  },

  // ── Assignment & monitoring ────────────────────────────────────
  assign(
    id: string,
    payload: AssignProgramRequest,
  ): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(`/programs/${id}/assign`, payload);
  },

  /** "Start a client": publish the latest draft if needed and assign, in one call. */
  startClient(
    id: string,
    payload: Omit<AssignProgramRequest, "publish_latest">,
  ): Promise<ApiResponse<StartClientResult>> {
    return apiClient.post<StartClientResult>(`/programs/${id}/assign`, { ...payload, publish_latest: true });
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

  /** The client's program tasks from me, day by day (last `days` days to today). */
  getClientResults(clientProfileId: string, days: number): Promise<ApiResponse<ClientProgramResults>> {
    return apiClient.get<ClientProgramResults>(`/programs/clients/${clientProfileId}/results?days=${days}`);
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

  // ── Update clients ─────────────────────────────────────────────
  /** Step 1: who is behind, what would change. Writes nothing. */
  previewUpdate(id: string, publishLatest = false): Promise<ApiResponse<UpdatePreview>> {
    const q = publishLatest ? "?publish_latest=true" : "";
    return apiClient.get<UpdatePreview>(`/programs/${id}/update-preview${q}`);
  },

  /** Step 2: update the picked clients (future tasks only). Same key = a retry, never a second apply. */
  updateClients(
    id: string,
    payload: { instance_ids: string[]; idempotency_key: string; publish_latest?: boolean },
  ): Promise<ApiResponse<UpdateClientsResponse>> {
    return apiClient.post<UpdateClientsResponse>(`/programs/${id}/update-clients`, payload);
  },

  /** Take updates back (the Undo toast; 24 hours). */
  revertUpdates(
    updates: Array<{ instance_id: string; update_id: string }>,
  ): Promise<ApiResponse<UpdateClientResult[]>> {
    return apiClient.post<UpdateClientResult[]>("/programs/updates/revert", { updates });
  },

  cancelInstance(instanceId: string): Promise<ApiResponse<ProgramInstance>> {
    return apiClient.post<ProgramInstance>(
      `/programs/instances/${instanceId}/cancel`,
      {},
    );
  },
};
