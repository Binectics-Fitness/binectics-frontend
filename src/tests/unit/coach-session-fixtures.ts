import type { ClientSessionSummary, CoachSessionLog, LoggedSet } from "@/lib/api/coachSessions";

export const set = (index: number, reps: number | null, load_kg: number | null, rpe: number | null = null, done = true): LoggedSet => ({
  index, reps, load_kg, seconds: null, distance_m: null, rpe, done, logged_at: null,
});

const ex = (order: number, name: string, key: string, sets: LoggedSet[], extra: object = {}) => ({
  order, name, key, swapped_from: null, skipped: false, skip_reason: null, note: null, sets, ...extra,
});

/** Midday UTC so the day label is the same in every time zone. */
export const log = (over: Partial<CoachSessionLog> = {}): CoachSessionLog => ({
  id: "log1",
  local_id: "local-1",
  status: "completed",
  client_id: "u1",
  client_profile_id: "cp1",
  booking_id: null,
  started_at: "2026-11-26T12:00:00.000Z",
  ended_at: "2026-11-26T12:52:00.000Z",
  completed_at: "2026-11-26T12:52:00.000Z",
  readiness: { energy: "good", pain_today: true },
  exercises: [
    ex(0, "Goblet squat", "goblet-squat", [set(0, 10, 16, 7), set(1, 10, 16, 8), set(2, 9, 16, 9)]),
    ex(1, "Incline push-up", "incline-push-up", [set(0, 10, null), set(1, 10, null), set(2, 8, null)], { swapped_from: "Push-up on knees" }),
    ex(2, "Plank", "plank", [], { skipped: true, skip_reason: "Out of time" }),
  ],
  pain_flags: [{ area: "knee_l", exercise_key: "goblet-squat", note: null }],
  shared_note: "Good work today.",
  private_note: "Left knee from old ACL.",
  weigh_in: { weight_kg: 82.4, recorded_at: null },
  suggested_next: null,
  ...over,
});

export const summary = (over: Partial<ClientSessionSummary> = {}): ClientSessionSummary => ({
  id: "s1",
  status: "completed",
  provider: { id: "p1", first_name: "Chinedu", last_name: "Eze", profile_picture: null },
  booking_id: null,
  started_at: "2026-11-26T12:00:00.000Z",
  ended_at: "2026-11-26T12:52:00.000Z",
  completed_at: "2026-11-26T12:52:00.000Z",
  exercises: [
    { ...ex(0, "Goblet squat", "goblet-squat", [set(0, 10, 16), set(1, 10, 16), set(2, 9, 16)]), best_so_far: true },
    { ...ex(1, "Incline push-up", "incline-push-up", [set(0, 10, null), set(1, 8, null)], { swapped_from: "Push-up on knees" }), best_so_far: false },
    { ...ex(2, "Plank", "plank", [], { skipped: true }), best_so_far: false },
  ],
  pain_flags: [{ area: "knee_l", exercise_key: "goblet-squat", note: null }],
  shared_note: "Squat moved up to 16 kg.",
  weigh_in: { weight_kg: 82.4, recorded_at: null },
  suggested_next: null,
  ...over,
});
