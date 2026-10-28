import { apiClient, API_BASE_URL } from "./client";
import type { ApiResponse } from "@/lib/types";
import {
  StarterEquipment,
  StarterExportFormat,
  StarterGoal,
  StarterTaskStatus,
  type StarterExercise,
  type StarterLeaveReason,
  type StarterOption,
  type StarterOptions,
  type StarterPreview,
  type StarterProgram,
  type StarterProgramDetail,
  type StarterQuery,
  type StarterSessionOutline,
  type StarterStarted,
  type StarterStartInput,
  type StarterSwapInput,
  type StarterTask,
} from "@/lib/starter/types";

/*
 * Starter Program client. Contract: binectics-plans/starter-api-contract.md
 *   GET   /starter-programs/options?goal&equipment&days
 *   GET   /starter-programs/:templateId/preview
 *   POST  /starter-programs/:templateId/start
 *   GET   /my-programs, /my-programs/:id          (existing)
 *   POST  /my-programs/occurrences/:id/complete|skip   (existing)
 *   POST  /my-programs/:id/leave | swap
 *   PATCH /my-programs/:id/reminders | sharing
 *   GET   /my-programs/export?format=json|csv
 * The readers are tolerant on purpose: a missing optional field degrades to
 * "not shown", never crashes a screen.
 */

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const GOALS = new Set<string>(Object.values(StarterGoal));
const EQUIPMENT = new Set<string>(Object.values(StarterEquipment));
const STATUSES = new Set<string>(Object.values(StarterTaskStatus));

export function normalizeExercise(raw: unknown): StarterExercise | null {
  if (!isObj(raw)) return null;
  const name = str(raw.name);
  if (!name) return null;
  return {
    name,
    sets: num(raw.sets),
    reps: num(raw.reps),
    seconds: num(raw.seconds),
    restSeconds: num(raw.rest_seconds),
    cues: arr(raw.cues).filter((c): c is string => typeof c === "string" && c.trim().length > 0),
    mediaId: str(raw.media_id),
    ...(str(raw.library_exercise_id) ? { libraryExerciseId: str(raw.library_exercise_id) } : {}),
    ...(str(raw.library_variant) ? { libraryVariant: str(raw.library_variant) } : {}),
  };
}

const exercises = (v: unknown): StarterExercise[] =>
  arr(v)
    .map(normalizeExercise)
    .filter((e): e is StarterExercise => e !== null);

function normalizeSession(raw: unknown): StarterSessionOutline | null {
  if (!isObj(raw)) return null;
  const title = str(raw.title);
  if (!title) return null;
  return { title, detail: str(raw.detail), exercises: exercises(raw.exercises) };
}

export function normalizeOption(raw: unknown): StarterOption | null {
  if (!isObj(raw)) return null;
  const templateId = str(raw.template_id);
  const name = str(raw.name);
  if (!templateId || !name) return null;
  const equipment = str(raw.equipment);
  const days = num(raw.duration_days);
  const weeks = num(raw.duration_weeks) ?? (days ? Math.ceil(days / 7) : 0);
  return {
    templateId,
    name,
    summary: str(raw.summary),
    goalTags: arr(raw.goal_tags).filter(
      (g): g is StarterGoal => typeof g === "string" && GOALS.has(g),
    ),
    equipment: equipment && EQUIPMENT.has(equipment) ? (equipment as StarterEquipment) : StarterEquipment.None,
    daysPerWeek: num(raw.days_per_week) ?? 0,
    sessionMinutes: num(raw.session_minutes) ?? 0,
    durationWeeks: weeks,
  };
}

export function normalizeOptions(d: unknown): StarterOptions {
  if (!isObj(d)) return { exact: false, options: [] };
  return {
    exact: d.match === "exact",
    options: arr(d.options)
      .map(normalizeOption)
      .filter((o): o is StarterOption => o !== null),
  };
}

export function normalizePreview(d: unknown): StarterPreview | null {
  const base = normalizeOption(d);
  if (!base || !isObj(d)) return null;
  return {
    ...base,
    cautions: str(d.cautions),
    weekOne: arr(d.week_one)
      .map(normalizeSession)
      .filter((s): s is StarterSessionOutline => s !== null),
    laterWeeks: arr(d.later_weeks)
      .map((w) => {
        if (!isObj(w)) return null;
        const week = num(w.week);
        const name = str(w.name);
        return week && name ? { week, name } : null;
      })
      .filter((w): w is { week: number; name: string } => w !== null),
  };
}

export function normalizeProgram(raw: unknown): StarterProgram | null {
  if (!isObj(raw)) return null;
  const id = str(raw._id);
  const name = str(raw.name);
  if (!id || !name) return null;
  const p = isObj(raw.progress) ? raw.progress : null;
  const w = p && isObj(p.last_7_days) ? p.last_7_days : null;
  return {
    id,
    name,
    status: str(raw.status) ?? "active",
    startedAt: str(raw.started_at),
    endsAt: typeof raw.ends_at === "string" ? raw.ends_at : null,
    catchUpDays: num(raw.catch_up_days),
    remindersEnabled: raw.reminders_enabled === true,
    sharedWithProviderIds: arr(raw.shared_with_provider_ids).map(String),
    progress: p
      ? {
          day: typeof p.day === "number" ? p.day : null,
          totalDays: typeof p.total_days === "number" ? p.total_days : null,
          last7: w ? { scheduled: num(w.scheduled) ?? 0, done: num(w.done) ?? 0 } : null,
        }
      : null,
  };
}

export function normalizeTask(raw: unknown): StarterTask | null {
  if (!isObj(raw)) return null;
  const id = str(raw._id);
  const scheduledFor = str(raw.scheduled_for);
  if (!id || !scheduledFor) return null;
  const status = str(raw.status);
  return {
    id,
    instanceId: str(raw.instance_id),
    title: str(raw.title) ?? "Starter session",
    detail: str(raw.detail),
    scheduledFor,
    status: status && STATUSES.has(status) ? (status as StarterTaskStatus) : StarterTaskStatus.Pending,
    completedLate: raw.completed_late === true,
    value: num(raw.value),
    sessionMinutes: (num(raw.session_minutes) ?? 0) > 0 ? num(raw.session_minutes) : undefined,
    exercises: exercises(raw.exercises),
  };
}

/** Wraps a normaliser: a reply that cannot be read becomes a failed response. */
function mapData<T, U>(
  res: ApiResponse<T>,
  fn: (d: T) => U | null,
  unreadable: string,
): ApiResponse<U> {
  if (!res.success) return { ...res, data: undefined } as ApiResponse<U>;
  const out = fn(res.data as T);
  if (out === null) return { success: false, message: unreadable };
  return { ...res, data: out };
}

const startBody = (input: StarterStartInput) => ({
  adult_confirmed: input.adultConfirmed,
  safety_ack: input.safetyAck,
  screening_flagged: input.screeningFlagged,
  start_date: input.startDate,
  timezone: input.timezone,
  reminders_enabled: input.remindersEnabled ?? false,
});

function normalizeStarted(d: unknown): StarterStarted | null {
  const instanceId = isObj(d) ? str(d.instance_id) : undefined;
  if (!instanceId || !isObj(d)) return null;
  return { instanceId, name: str(d.name), startedAt: str(d.started_at) };
}

export interface StarterExportFile {
  blob: Blob;
  filename: string;
}

export const starterService = {
  /** Best match plus up to two alternatives for the member's three answers. */
  async getOptions(query: StarterQuery): Promise<ApiResponse<StarterOptions>> {
    const qs = new URLSearchParams({
      goal: query.goal,
      equipment: query.equipment,
      days: String(query.days),
    });
    const res = await apiClient.get<unknown>(`/starter-programs/options?${qs.toString()}`);
    return mapData(res, normalizeOptions, "The programs could not be read.");
  },

  /** Week 1 in full and one line per later week. */
  async getPreview(templateId: string): Promise<ApiResponse<StarterPreview>> {
    const res = await apiClient.get<unknown>(
      `/starter-programs/${encodeURIComponent(templateId)}/preview`,
    );
    return mapData(res, normalizePreview, "The program could not be read.");
  },

  /** Starts the program. Sends only the screening flag, never the answers. */
  async start(input: StarterStartInput): Promise<ApiResponse<StarterStarted>> {
    const res = await apiClient.post<unknown>(
      `/starter-programs/${encodeURIComponent(input.templateId)}/start`,
      startBody(input),
    );
    return mapData(res, normalizeStarted, "The program started but the reply was not understood.");
  },

  /** Leaves the current program and starts another in one request. */
  async swap(instanceId: string, input: StarterSwapInput): Promise<ApiResponse<StarterStarted>> {
    const res = await apiClient.post<unknown>(
      `/my-programs/${encodeURIComponent(instanceId)}/swap`,
      { template_id: input.templateId, reason: input.reason, ...startBody(input) },
    );
    return mapData(
      res,
      (d) => (isObj(d) ? normalizeStarted(d.started) : null),
      "The program changed but the reply was not understood.",
    );
  },

  /** The member's starter programs (live or ended), newest first. */
  async listMine(): Promise<ApiResponse<StarterProgram[]>> {
    const res = await apiClient.get<unknown>("/my-programs");
    return mapData(
      res,
      (d) =>
        arr(d)
          .filter((r) => isObj(r) && r.source === "starter")
          .map(normalizeProgram)
          .filter((p): p is StarterProgram => p !== null),
      "Your programs could not be read.",
    );
  },

  /** One program with its dated sessions (exercises included). */
  async getProgram(instanceId: string): Promise<ApiResponse<StarterProgramDetail>> {
    const res = await apiClient.get<unknown>(`/my-programs/${encodeURIComponent(instanceId)}`);
    return mapData(
      res,
      (d) => {
        if (!isObj(d)) return null;
        const program = normalizeProgram(d.instance);
        if (!program) return null;
        return {
          program,
          tasks: arr(d.agenda)
            .map(normalizeTask)
            .filter((t): t is StarterTask => t !== null),
        };
      },
      "Your program could not be read.",
    );
  },

  async completeTask(occurrenceId: string): Promise<ApiResponse<StarterTask>> {
    const res = await apiClient.post<unknown>(
      `/my-programs/occurrences/${encodeURIComponent(occurrenceId)}/complete`,
    );
    return mapData(res, normalizeTask, "The session was saved but the reply was not understood.");
  },

  async skipTask(occurrenceId: string): Promise<ApiResponse<StarterTask>> {
    const res = await apiClient.post<unknown>(
      `/my-programs/occurrences/${encodeURIComponent(occurrenceId)}/skip`,
      {},
    );
    return mapData(res, normalizeTask, "The session was saved but the reply was not understood.");
  },

  /** Leaves the program. History is kept. Idempotent. */
  async leave(instanceId: string, reason?: StarterLeaveReason): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>(
      `/my-programs/${encodeURIComponent(instanceId)}/leave`,
      reason ? { reason } : {},
    );
  },

  async setReminders(instanceId: string, enabled: boolean): Promise<ApiResponse<unknown>> {
    return apiClient.patch<unknown>(`/my-programs/${encodeURIComponent(instanceId)}/reminders`, {
      enabled,
    });
  },

  /** Full replacement; [] turns sharing off. */
  async setSharing(instanceId: string, providerIds: string[]): Promise<ApiResponse<unknown>> {
    return apiClient.patch<unknown>(`/my-programs/${encodeURIComponent(instanceId)}/sharing`, {
      provider_ids: providerIds,
    });
  },

  /**
   * Downloads the member's history. The reply is a file, not the usual JSON
   * envelope, so it is fetched directly (same-origin proxy, cookie auth).
   */
  async downloadExport(format: StarterExportFormat): Promise<ApiResponse<StarterExportFile>> {
    try {
      const res = await fetch(`${API_BASE_URL}/my-programs/export?format=${format}`, {
        credentials: "include",
        headers: { Accept: format === StarterExportFormat.Csv ? "text/csv" : "application/json" },
      });
      if (!res.ok) {
        let body: Raw = {};
        try {
          const parsed: unknown = await res.json();
          if (isObj(parsed)) body = parsed;
        } catch {
          /* not JSON */
        }
        const message = Array.isArray(body.message) ? body.message.join(" ") : str(body.message);
        return { success: false, status: res.status, code: str(body.code), message };
      }
      const blob = await res.blob();
      const header = res.headers.get("content-disposition") ?? "";
      const filename =
        /filename="?([^";]+)"?/i.exec(header)?.[1] ??
        `binectics-history-${new Date().toISOString().slice(0, 10)}.${format}`;
      return { success: true, data: { blob, filename } };
    } catch {
      return { success: false, message: "Network error. Check your connection and try again." };
    }
  },
};
