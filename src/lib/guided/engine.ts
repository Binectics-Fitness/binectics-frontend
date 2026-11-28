/**
 * Ported from binectics-mobile src/guided/engine.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import type { StarterExercise } from '@/lib/starter/types';
import { bundledTextApproved } from '@/lib/exercises/memberText';

/**
 * Guided session engine: a pure state machine, no timers, no speech, no React.
 *
 * Every event carries the time it happened (`now`, epoch ms). Remaining time
 * is always derived from timestamps (`phaseStartedAt + duration - now`), never
 * decremented, so a busy JS thread, a lock screen or a backgrounded app cannot
 * make the clock drift: the next event just sees more time has passed and the
 * engine walks forward through every phase boundary that was crossed, at the
 * boundary's own time.
 *
 * States: ready -> countdown -> exercise -> rest -> (exercise ...) -> completed.
 * "NEXT" is not a separate state: the rest phase carries the upcoming target
 * (`exIndex`/`setIndex` already point at it) and announces it. With no rest the
 * engine goes straight to the next exercise.
 *
 * Speech is a side effect elsewhere. The engine only records `Cue`s, each with
 * a monotonically increasing id, and bumps `speechEpoch` when anything the
 * member did should silence what is playing. Dedupe lives here: a count-down
 * cue is fired at most once per phase (`cueMark`), and a driver that only
 * speaks cues with an id it has not seen can never repeat one on re-render.
 */

export type Phase = 'ready' | 'countdown' | 'exercise' | 'rest' | 'completed';
export type Outcome = 'finished' | 'ended_early';

export interface PlanItem {
  key: string;
  name: string;
  mediaId?: string;
  kind: 'timed' | 'reps';
  sets: number;
  /** Timed: seconds per set. */
  seconds?: number;
  /** Reps: target reps per set, when the plan says. */
  reps?: number;
  /** Rest after each set (and after the exercise); 0 = none. */
  restSeconds: number;
  cues: string[];
}

export type CueKind =
  | 'getReady'
  | 'form'
  | 'count'
  | 'begin'
  | 'timeLeft'
  | 'halfway'
  | 'setComplete'
  | 'exerciseComplete'
  | 'restStart'
  | 'nextUp'
  | 'restWarn'
  | 'complete'
  /** Coach voice (group `coach`): spoken only when coach lines are on, see cueText. */
  | 'sessionStart'
  | 'encourage'
  | 'easeOff'
  | 'comeback'
  /** A short sound (see ToneName), not speech. */
  | 'tone';

export type ToneName = 'tick' | 'start' | 'end' | 'restEnd';

/**
 * `core` always speaks with voice on; `count` is gated by the countdown preference; `form` by the form-cue one;
 * `coach` (session start, encouragement, ease off, comeback) by the coach-lines one.
 */
export type CueGroup = 'core' | 'count' | 'form' | 'coach' | 'tone';

export interface Cue {
  id: number;
  phaseId: number;
  kind: CueKind;
  group: CueGroup;
  /** Seconds (count, timeLeft, restStart, restWarn). */
  seconds?: number;
  name?: string;
  text?: string;
  set?: number;
  sets?: number;
  reps?: number;
  /** nextUp: the upcoming set belongs to the same exercise as the one just done. */
  sameExercise?: boolean;
  timed?: boolean;
  tone?: ToneName;
  /** complete: every exercise was done (no skips, none left out). */
  allDone?: boolean;
  /** easeOff: raised by the member's own button, so the safety lines may be spoken. */
  safety?: boolean;
}

export interface ExerciseStat {
  setsDone: number;
  skipped: boolean;
}

export type ExerciseStatus = 'done' | 'partial' | 'skipped' | 'pending';

export interface SessionState {
  plan: PlanItem[];
  prepSeconds: number;
  phase: Phase;
  outcome: Outcome | null;
  /** Current exercise; during rest, the upcoming one. */
  exIndex: number;
  /** Current set (0-based); during rest, the upcoming one. */
  setIndex: number;
  /** During rest: the set just finished, for "repeat". */
  restFrom: { ex: number; set: number } | null;
  restKind: 'set' | 'exercise' | null;
  phaseId: number;
  phaseStartedAt: number | null;
  /** null = untimed phase (a rep-based set). */
  phaseDurationMs: number | null;
  pausedAt: number | null;
  /** Smallest count-down threshold already fired in this phase. */
  cueMark: number | null;
  /** Same, for the tone ticks. */
  toneMark: number | null;
  /**
   * Active milliseconds into this phase when the last `encourage` cue fired (null = none yet).
   * Older saved states lack it: read as null.
   */
  encMark: number | null;
  cues: Cue[];
  cueSeq: number;
  speechEpoch: number;
  startedAt: number | null;
  endedAt: number | null;
  pausedMs: number;
  exerciseMs: number;
  restMs: number;
  countdownMs: number;
  stats: ExerciseStat[];
}

export const LATE_MS = 2500;
/** A set cannot be marked done within this long of starting: a double tap must not skip the next set. */
export const MIN_SET_MS = 700;
/**
 * The form cue is spoken during the get-ready countdown only when that is long
 * enough to hear it (get ready + cue is about 4.5 s). With a shorter prep the
 * 3-2-1 calls would cut it off, so the cue follows "Go" instead.
 */
export const FORM_IN_PREP_MIN_S = 8;
const MAX_CUES = 8;
const TIME_LEFT = [10, 5];
const COUNT_FROM = 3;
const REST_WARN = 5;
/** First encouragement is no earlier than this into a timed set (clear of "Go" and the form cue). */
export const ENC_FIRST_MS = 8000;
/** At most one encouragement this often. */
export const ENC_EVERY_MS = 20_000;
/** Never within this long of another cue (halfway)... */
export const ENC_GAP_MS = 6000;
/** ...and none in the final 10 s, plus the 6 s gap before the "ten seconds left" call. */
export const ENC_END_MS = 10_000 + ENC_GAP_MS;

// ─── Plan ───────────────────────────────────────────────────────────────────

export const isTimed = (e: StarterExercise): boolean => e.seconds !== undefined && e.reps === undefined;

/** The session's real exercises, in order, as engine items. `defaultRestSeconds` fills gaps only. */
export function buildPlan(
  exercises: readonly StarterExercise[],
  defaultRestSeconds = 30,
  /** Cues to use when the plan gives none for an exercise (the exercise library's form cues). */
  fallbackCues?: (mediaId?: string) => string[],
): PlanItem[] {
  return exercises.map((e, i) => {
    const timed = isTimed(e);
    return {
      // Any change to the dose makes a saved run non-resumable (see persistence.samePlan).
      key: `${i}-${e.name}-${e.sets ?? ''}-${e.reps ?? ''}-${e.seconds ?? ''}-${e.restSeconds ?? ''}`,
      name: e.name,
      mediaId: e.mediaId,
      kind: timed ? 'timed' : 'reps',
      sets: Math.min(Math.max(Math.round(e.sets ?? 1), 1), 10),
      seconds: timed ? Math.max(1, Math.round(e.seconds as number)) : undefined,
      reps: !timed && e.reps !== undefined ? e.reps : undefined,
      restSeconds: Math.max(0, Math.round(e.restSeconds ?? defaultRestSeconds)),
      // The plan's own cues come first; the library fills in only where the plan is silent.
      // A withheld exercise (see exercises/memberText) shows and speaks no written cue: name, picture and timing stay.
      cues: e.mediaId && !bundledTextApproved(e.mediaId) ? [] : e.cues?.length ? e.cues : (fallbackCues?.(e.mediaId) ?? []),
    };
  });
}

/** Seconds of timed work plus rest, for "about N minutes" on the intro. */
export function estimateSeconds(plan: readonly PlanItem[]): number {
  let total = 0;
  plan.forEach((p, i) => {
    for (let s = 0; s < p.sets; s++) {
      total += p.kind === 'timed' ? (p.seconds ?? 0) : 40; // a rep set takes about 40 s
      const last = i === plan.length - 1 && s === p.sets - 1;
      if (!last) total += p.restSeconds;
    }
  });
  return total;
}

// ─── State ──────────────────────────────────────────────────────────────────

export function initialState(plan: PlanItem[], prepSeconds = 5): SessionState {
  return {
    plan,
    prepSeconds: Math.max(0, Math.round(prepSeconds)),
    phase: 'ready',
    outcome: null,
    exIndex: 0,
    setIndex: 0,
    restFrom: null,
    restKind: null,
    phaseId: 0,
    phaseStartedAt: null,
    phaseDurationMs: null,
    pausedAt: null,
    cueMark: null,
    toneMark: null,
    encMark: null,
    cues: [],
    cueSeq: 0,
    speechEpoch: 0,
    startedAt: null,
    endedAt: null,
    pausedMs: 0,
    exerciseMs: 0,
    restMs: 0,
    countdownMs: 0,
    stats: plan.map(() => ({ setsDone: 0, skipped: false })),
  };
}

export type Event =
  /** `at`: begin at this exercise (0-based), e.g. from an exercise page; earlier ones stay not started. */
  | { type: 'start'; now: number; at?: number; comeback?: boolean; comebackText?: string; openingText?: string; openingMs?: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  /** Rep-based set finished (or a timed set finished early). */
  | { type: 'doneSet'; now: number }
  | { type: 'skipExercise'; now: number }
  | { type: 'skipRest'; now: number }
  | { type: 'repeat'; now: number }
  /** "Need a break": pauses the session and asks for a calming line (the safety lines may play). */
  | { type: 'easeOff'; now: number }
  | { type: 'end'; now: number };

export const isRunning = (s: SessionState): boolean =>
  (s.phase === 'countdown' || s.phase === 'exercise' || s.phase === 'rest') && s.pausedAt === null;
export const isPaused = (s: SessionState): boolean => s.pausedAt !== null && s.phase !== 'completed';

/** Milliseconds left in the current timed phase, from timestamps only. null for untimed phases. */
export function remainingMs(s: SessionState, now: number): number | null {
  if (s.phaseStartedAt === null || s.phaseDurationMs === null) return null;
  const at = s.pausedAt ?? now;
  return Math.max(0, s.phaseDurationMs - (at - s.phaseStartedAt));
}

/** Active (pause-excluded) time in a rep-based set so far. */
export function elapsedMs(s: SessionState, now: number): number {
  if (s.phaseStartedAt === null) return 0;
  return Math.max(0, (s.pausedAt ?? now) - s.phaseStartedAt);
}

export function exerciseStatus(s: SessionState, i: number): ExerciseStatus {
  const st = s.stats[i];
  const sets = s.plan[i].sets;
  if (st.setsDone >= sets) return 'done';
  if (st.skipped) return st.setsDone > 0 ? 'partial' : 'skipped';
  return st.setsDone > 0 ? 'partial' : 'pending';
}

// ─── Internals (mutate a working copy) ──────────────────────────────────────

type Draft = SessionState;

type CueInit = Omit<Cue, 'id' | 'phaseId'>;

function emit(d: Draft, c: CueInit) {
  d.cueSeq += 1;
  d.cues = [...d.cues, { ...c, id: d.cueSeq, phaseId: d.phaseId }].slice(-MAX_CUES);
}

/** Silence whatever is playing: drops queued, unspoken cues as well. */
function silence(d: Draft) {
  d.speechEpoch += 1;
  d.cues = [];
}

function bank(d: Draft, at: number) {
  // Add the active time of the phase being left.
  if (d.phaseStartedAt === null) return;
  const spent = Math.max(0, (d.pausedAt ?? at) - d.phaseStartedAt);
  const capped = d.phaseDurationMs === null ? spent : Math.min(spent, d.phaseDurationMs);
  if (d.phase === 'exercise') d.exerciseMs += capped;
  else if (d.phase === 'rest') d.restMs += capped;
  else if (d.phase === 'countdown') d.countdownMs += capped;
  d.phaseStartedAt = null; // banked: a second bank() for the same phase adds nothing
}

function unpause(d: Draft, at: number) {
  if (d.pausedAt !== null) {
    d.pausedMs += Math.max(0, at - d.pausedAt);
    d.pausedAt = null;
  }
}

function enter(d: Draft, phase: Phase, at: number, durationMs: number | null) {
  d.phase = phase;
  d.phaseId += 1;
  d.phaseStartedAt = at;
  d.phaseDurationMs = durationMs;
  d.pausedAt = null;
  d.cueMark = null;
  d.toneMark = null;
  d.encMark = null;
}

/** The one coach cue that opens a session: a comeback line replaces the plain welcome. */
type Opening = Omit<Cue, 'id' | 'phaseId'>;

function enterExercise(d: Draft, at: number, opts: { form: boolean; fromRest?: boolean; opening?: Opening }) {
  const p = d.plan[d.exIndex];
  enter(d, 'exercise', at, p.kind === 'timed' ? (p.seconds as number) * 1000 : null);
  d.restKind = null;
  d.restFrom = null;
  const timed = p.kind === 'timed';
  // The sound that opens a set: when a rest has just run out, that is the rest-ending sound.
  emit(d, { kind: 'tone', group: 'tone', tone: opts.fromRest ? 'restEnd' : 'start' });
  if (opts.opening) emit(d, opts.opening);
  emit(d, {
    kind: 'begin',
    group: 'core',
    name: p.name,
    set: d.setIndex + 1,
    sets: p.sets,
    reps: p.reps,
    seconds: p.seconds,
    timed,
  });
  if (opts.form && d.setIndex === 0 && p.cues[0]) {
    emit(d, { kind: 'form', group: 'form', text: p.cues[0], name: p.name });
  }
}

/**
 * `openingMs`: extra time added to the FIRST get-ready countdown only, to make room for a spoken
 * welcome before "Get ready". Zero (the default) leaves the countdown exactly as it was.
 */
function enterCountdown(d: Draft, at: number, opening?: Opening, openingMs = 0) {
  const p = d.plan[d.exIndex];
  if (d.prepSeconds <= 0) {
    enterExercise(d, at, { form: true, opening });
    return;
  }
  enter(d, 'countdown', at, d.prepSeconds * 1000 + Math.max(0, Math.round(openingMs)));
  if (opening) emit(d, opening);
  emit(d, { kind: 'getReady', group: 'core', name: p.name });
  if (p.cues[0] && d.prepSeconds >= FORM_IN_PREP_MIN_S) emit(d, { kind: 'form', group: 'form', text: p.cues[0], name: p.name });
}

function complete(d: Draft, at: number, outcome: Outcome) {
  bank(d, at);
  unpause(d, at);
  d.phase = 'completed';
  d.phaseId += 1;
  d.phaseStartedAt = null;
  d.phaseDurationMs = null;
  d.outcome = outcome;
  d.endedAt = at;
  d.restFrom = null;
  d.restKind = null;
  if (outcome === 'finished') {
    const allDone = d.plan.every((p, i) => d.stats[i].setsDone >= p.sets);
    emit(d, { kind: 'complete', group: 'core', allDone });
  }
}

/** Move on after set `ex`/`set` was finished at `at`. */
function afterSet(d: Draft, at: number) {
  const ex = d.exIndex;
  const set = d.setIndex;
  const p = d.plan[ex];
  d.stats[ex] = { ...d.stats[ex], setsDone: d.stats[ex].setsDone + 1 };
  const lastSet = set === p.sets - 1;
  const lastExercise = ex === d.plan.length - 1;
  bank(d, at);
  unpause(d, at);
  emit(d, { kind: 'tone', group: 'tone', tone: 'end' });
  if (lastSet && lastExercise) {
    complete(d, at, 'finished');
    return;
  }
  const next = lastSet ? { ex: ex + 1, set: 0 } : { ex, set: set + 1 };
  const kind = lastSet ? 'exercise' : 'set';
  const restSeconds = p.restSeconds;
  d.restFrom = { ex, set };
  d.exIndex = next.ex;
  d.setIndex = next.set;
  if (restSeconds <= 0) {
    // No rest: say what is done, then go straight on.
    if (lastSet) emit(d, { kind: 'exerciseComplete', group: 'core', name: p.name });
    else emit(d, { kind: 'setComplete', group: 'core', set: set + 1, sets: p.sets });
    enterExercise(d, at, { form: lastSet });
    return;
  }
  enter(d, 'rest', at, restSeconds * 1000);
  d.restKind = kind;
  if (lastSet) emit(d, { kind: 'exerciseComplete', group: 'core', name: p.name });
  else emit(d, { kind: 'setComplete', group: 'core', set: set + 1, sets: p.sets });
  emit(d, { kind: 'restStart', group: 'core', seconds: restSeconds });
  const n = d.plan[next.ex];
  emit(d, {
    kind: 'nextUp',
    group: 'core',
    name: n.name,
    set: next.set + 1,
    sets: n.sets,
    sameExercise: !lastSet,
  });
}

function onExpire(d: Draft, endAt: number) {
  if (d.phase === 'countdown') {
    bank(d, endAt);
    enterExercise(d, endAt, { form: d.prepSeconds < FORM_IN_PREP_MIN_S });
  } else if (d.phase === 'exercise') {
    afterSet(d, endAt);
  } else if (d.phase === 'rest') {
    bank(d, endAt);
    enterExercise(d, endAt, { form: true, fromRest: true });
  }
}

/** Walk forward through every boundary crossed by `now`, then fire the count-down cues for where we landed. */
function settle(d: Draft, now: number) {
  if (d.pausedAt !== null) return;
  let late = false;
  for (let guard = 0; guard < 500; guard++) {
    if (
      (d.phase !== 'countdown' && d.phase !== 'exercise' && d.phase !== 'rest') ||
      d.phaseStartedAt === null ||
      d.phaseDurationMs === null
    )
      break;
    const end = d.phaseStartedAt + d.phaseDurationMs;
    if (now < end) break;
    if (now - end > LATE_MS) late = true;
    onExpire(d, end);
  }
  // A long gap (screen lock, background): don't read out a backlog, keep only
  // the line for the phase we landed in.
  if (late) d.cues = d.cues.filter((c) => c.phaseId === d.phaseId);

  if (d.phaseStartedAt !== null && d.phaseDurationMs !== null) {
    fireThresholds(d, now);
    fireTones(d, now);
    fireEncourage(d, now);
  }
}

function thresholdsFor(d: Draft): { t: number; cue: (t: number) => CueInit }[] {
  const dur = (d.phaseDurationMs ?? 0) / 1000;
  const p = d.plan[d.exIndex];
  if (d.phase === 'countdown') {
    return [3, 2, 1]
      .filter((t) => t <= COUNT_FROM && t <= dur)
      .map((t) => ({ t, cue: () => ({ kind: 'count' as const, group: 'count' as const, seconds: t }) }));
  }
  if (d.phase === 'exercise') {
    const out: { t: number; cue: (t: number) => CueInit }[] = [];
    if (dur >= 40) {
      const half = Math.round(dur / 2);
      out.push({ t: half, cue: () => ({ kind: 'halfway', group: 'count' }) });
    }
    for (const t of TIME_LEFT) {
      if (dur > t + 2) out.push({ t, cue: () => ({ kind: 'timeLeft', group: 'count', seconds: t }) });
    }
    for (const t of [3, 2, 1]) {
      if (dur > 8) out.push({ t, cue: () => ({ kind: 'count', group: 'count', seconds: t }) });
    }
    return out.sort((a, b) => b.t - a.t);
  }
  if (d.phase === 'rest' && dur > REST_WARN + 2) {
    return [
      {
        t: REST_WARN,
        cue: () => ({ kind: 'restWarn', group: 'count', seconds: REST_WARN, name: p.name }),
      },
    ];
  }
  return [];
}

/**
 * Milliseconds from `now` until the next scheduled spoken call in this phase
 * (a count, "ten seconds left", halfway, the rest warning) or the end of the
 * phase, whichever is first. null for an untimed phase (a rep set) or a paused
 * session: nothing is coming. Speech that has to be finished before then can be sized to fit.
 */
export function nextCueInMs(s: SessionState, now: number): number | null {
  // Paused: the clock is stopped and no call will fire until Resume, so there is nothing to fit speech into.
  if (s.pausedAt !== null) return null;
  if (s.phaseStartedAt === null || s.phaseDurationMs === null) return null;
  if (s.phase !== 'countdown' && s.phase !== 'exercise' && s.phase !== 'rest') return null;
  const elapsed = Math.max(0, (s.pausedAt ?? now) - s.phaseStartedAt);
  let next = Math.max(0, s.phaseDurationMs - elapsed);
  const mark = s.cueMark ?? Infinity;
  for (const x of thresholdsFor(s)) {
    if (x.t < mark) next = Math.min(next, Math.max(0, s.phaseDurationMs - x.t * 1000 - elapsed));
  }
  return next;
}

function fireThresholds(d: Draft, now: number) {
  const rem = Math.ceil(((d.phaseDurationMs as number) - (now - (d.phaseStartedAt as number))) / 1000);
  const mark = d.cueMark ?? Infinity;
  const eligible = thresholdsFor(d).filter((x) => x.t >= rem && x.t < mark);
  if (eligible.length === 0) return;
  // The most current one only; earlier ones we skipped past stay silent.
  const pick = eligible.reduce((a, b) => (b.t < a.t ? b : a));
  d.cueMark = pick.t;
  if (pick.t - rem <= 1) emit(d, pick.cue(pick.t));
}

/**
 * A word of encouragement mid-set. Timed sets only (a rep set has no clock to
 * space it by). Rules, all from timestamps: not before ENC_FIRST_MS, at most one
 * per ENC_EVERY_MS, none within ENC_GAP_MS of the halfway call, none in the last
 * ENC_END_MS (the final 10 s plus a gap before "ten seconds left"). Deterministic:
 * the engine decides WHEN, the coach selector decides WHAT.
 */
function fireEncourage(d: Draft, now: number) {
  if (d.phase !== 'exercise' || d.phaseStartedAt === null || d.phaseDurationMs === null) return;
  const elapsed = now - d.phaseStartedAt;
  const remaining = d.phaseDurationMs - elapsed;
  const mark = d.encMark ?? null;
  if (elapsed < (mark === null ? ENC_FIRST_MS : mark + ENC_EVERY_MS)) return;
  if (remaining < ENC_END_MS) return;
  const dur = d.phaseDurationMs / 1000;
  if (dur >= 40) {
    const halfAt = (dur - Math.round(dur / 2)) * 1000; // when the halfway call fires
    if (Math.abs(elapsed - halfAt) < ENC_GAP_MS) return;
  }
  d.encMark = elapsed;
  emit(d, { kind: 'encourage', group: 'coach', timed: true, seconds: Math.ceil(remaining / 1000) });
}

/** Ticks for the last three seconds of any timed phase of 4 s or more; same fire-once rule as the spoken calls. */
function fireTones(d: Draft, now: number) {
  if (d.phase !== 'countdown' && d.phase !== 'exercise' && d.phase !== 'rest') return;
  const dur = (d.phaseDurationMs as number) / 1000;
  if (dur < 4) return;
  const rem = Math.ceil((dur * 1000 - (now - (d.phaseStartedAt as number))) / 1000);
  const mark = d.toneMark ?? Infinity;
  const eligible = [3, 2, 1].filter((t) => t >= rem && t < mark);
  if (eligible.length === 0) return;
  const pick = Math.min(...eligible);
  d.toneMark = pick;
  if (pick - rem <= 1) emit(d, { kind: 'tone', group: 'tone', tone: 'tick', seconds: pick });
}

// ─── Reducer ────────────────────────────────────────────────────────────────

export function reduce(state: SessionState, event: Event): SessionState {
  const d: Draft = { ...state, stats: [...state.stats] };
  const { now } = event;
  switch (event.type) {
    case 'start': {
      if (state.phase !== 'ready' || state.plan.length === 0) return state;
      d.startedAt = now;
      d.exIndex = Math.min(Math.max(Math.floor(event.at ?? 0), 0), state.plan.length - 1);
      d.setIndex = 0;
      silence(d);
      enterCountdown(
        d,
        now,
        event.comeback
          ? { kind: 'comeback', group: 'coach', text: event.comebackText }
          : { kind: 'sessionStart', group: 'coach', text: event.openingText },
        event.openingMs,
      );
      settle(d, now);
      break;
    }
    case 'tick': {
      if (!isRunning(state)) return state;
      settle(d, now);
      break;
    }
    case 'pause': {
      if (!isRunning(state)) return state;
      settle(d, now);
      if (d.phase === 'completed') break;
      d.pausedAt = now;
      silence(d);
      break;
    }
    case 'resume': {
      if (!isPaused(state) || state.pausedAt === null) return state;
      const gap = Math.max(0, now - state.pausedAt);
      d.pausedMs += gap;
      d.phaseStartedAt = (state.phaseStartedAt as number) + gap;
      d.pausedAt = null;
      settle(d, now);
      break;
    }
    case 'doneSet': {
      // While paused the member must resume first. Too soon after the set began = a double tap.
      if (state.phase !== 'exercise' || state.pausedAt !== null) return state;
      if (now - (state.phaseStartedAt ?? 0) < MIN_SET_MS) return state;
      silence(d);
      afterSet(d, now);
      settle(d, now);
      break;
    }
    case 'skipExercise': {
      if ((state.phase !== 'exercise' && state.phase !== 'countdown') || state.pausedAt !== null) return state;
      silence(d);
      bank(d, now);
      unpause(d, now);
      d.stats[d.exIndex] = { ...d.stats[d.exIndex], skipped: true };
      if (d.exIndex >= d.plan.length - 1) {
        // The exercise just skipped is not done, so this is never "finished": no praise, no complete cue.
        complete(d, now, 'ended_early');
      } else {
        d.exIndex += 1;
        d.setIndex = 0;
        enterCountdown(d, now);
        settle(d, now);
      }
      break;
    }
    case 'skipRest': {
      if (state.phase !== 'rest' || state.pausedAt !== null) return state;
      silence(d);
      bank(d, now);
      enterExercise(d, now, { form: false });
      break;
    }
    case 'repeat': {
      // Skip, repeat and done-set act only on a running session: Resume first.
      if (state.pausedAt !== null) return state;
      if (state.phase === 'exercise' || state.phase === 'countdown') {
        silence(d);
        bank(d, now);
        unpause(d, now);
        if (state.phase === 'countdown') {
          enterCountdown(d, now);
        } else {
          enterExercise(d, now, { form: false });
        }
        settle(d, now);
      } else if (state.phase === 'rest' && state.restFrom) {
        silence(d);
        bank(d, now);
        unpause(d, now);
        const { ex, set } = state.restFrom;
        d.stats[ex] = { ...d.stats[ex], setsDone: Math.max(0, d.stats[ex].setsDone - 1) };
        d.exIndex = ex;
        d.setIndex = set;
        enterExercise(d, now, { form: false });
      } else {
        return state;
      }
      break;
    }
    case 'easeOff': {
      if (state.phase !== 'countdown' && state.phase !== 'exercise' && state.phase !== 'rest') return state;
      if (state.pausedAt === null) {
        settle(d, now); // walk any boundary already crossed, then stop the clock
        if (d.phase === 'completed') break;
        d.pausedAt = now;
      }
      silence(d); // a calming word beats whatever was queued
      emit(d, { kind: 'easeOff', group: 'coach', safety: true });
      break;
    }
    case 'end': {
      if (state.phase === 'ready' || state.phase === 'completed') return state;
      silence(d);
      complete(d, now, 'ended_early');
      break;
    }
  }
  if (
    d.phaseId === state.phaseId &&
    d.cueSeq === state.cueSeq &&
    d.cueMark === state.cueMark &&
    d.toneMark === state.toneMark &&
    d.encMark === state.encMark &&
    d.phase === state.phase &&
    d.pausedAt === state.pausedAt &&
    d.speechEpoch === state.speechEpoch
  ) {
    return state; // nothing observable changed: keep the reference so nobody re-renders
  }
  return d;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface SessionSummary {
  outcome: Outcome | null;
  exercisesDone: number;
  exercisesPartial: number;
  exercisesSkipped: number;
  exercisesTotal: number;
  setsDone: number;
  setsPlanned: number;
  /** Wall time from start to end, pauses included. */
  totalMs: number;
  /** Active time: total minus pauses. */
  activeMs: number;
  exerciseMs: number;
  restMs: number;
  pausedMs: number;
  rows: { name: string; status: ExerciseStatus; setsDone: number; sets: number; mediaId?: string }[];
}

export function summarize(s: SessionState, now: number): SessionSummary {
  const rows = s.plan.map((p, i) => ({
    name: p.name,
    status: exerciseStatus(s, i),
    setsDone: s.stats[i].setsDone,
    sets: p.sets,
    mediaId: p.mediaId,
  }));
  const end = s.endedAt ?? now;
  const totalMs = s.startedAt === null ? 0 : Math.max(0, end - s.startedAt);
  return {
    outcome: s.outcome,
    exercisesDone: rows.filter((r) => r.status === 'done').length,
    exercisesPartial: rows.filter((r) => r.status === 'partial').length,
    exercisesSkipped: rows.filter((r) => r.status === 'skipped').length,
    exercisesTotal: rows.length,
    setsDone: rows.reduce((n, r) => n + r.setsDone, 0),
    setsPlanned: rows.reduce((n, r) => n + r.sets, 0),
    totalMs,
    activeMs: Math.max(0, totalMs - s.pausedMs),
    exerciseMs: s.exerciseMs,
    restMs: s.restMs,
    pausedMs: s.pausedMs,
    rows,
  };
}
