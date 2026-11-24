/**
 * Ported from binectics-mobile src/guided/coach/selector.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { LAGOS_STRENGTH_LINES } from './lines.lagos-strength';
import type { CoachLine, Moment, PickedLine, Persona } from './types';

/**
 * Picks which coach line to say. Pure: the same state and inputs always give the
 * same line, so a session is reproducible and testable. No Math.random, no
 * clock; variety comes from a seeded generator (seed = the session id).
 *
 * Rules:
 *  - never repeats any of the last 3 lines of a moment;
 *  - a `once` line plays at most once per session and at most once per 5
 *    sessions (the counter in `OnceHistory` is persisted by coachHistory.ts);
 *  - `local` lines show their local wording only when "Local flavour" is on,
 *    otherwise their plain twin;
 *  - `safety` lines are never offered unless the caller says this is the
 *    ease-off button or a long mid-set pause;
 *  - a line that states a number (seconds left, which set) is only offered at that number.
 */
export const BANKS: Record<Persona, readonly CoachLine[]> = {
  'lagos-strength': LAGOS_STRENGTH_LINES,
};

export const NO_REPEAT = 3;
export const ONCE_EVERY_SESSIONS = 5;

export interface OnceHistory {
  /** Sessions started so far, including the current one. */
  sessions: number;
  /** Line id -> session number it was last shown in. */
  lastShown: Record<string, number>;
}

export const EMPTY_HISTORY: OnceHistory = { sessions: 0, lastShown: {} };

export interface PickerState {
  persona: Persona;
  seed: string;
  history: OnceHistory;
  recent: Partial<Record<Moment, string[]>>;
  usedOnce: string[];
  picks: Partial<Record<Moment, number>>;
}

export interface PickContext {
  /** The "Local flavour" preference. */
  localWords: boolean;
  /** True only for the ease-off button or a long mid-set pause. */
  allowSafety?: boolean;
  /** Seconds left, for lines that state a number. */
  secondsLeft?: number;
  /** The set just finished (1-based), for lines that state which set it was. */
  setNumber?: number;
  /** The set is timed: rep-language lines are left out. */
  timed?: boolean;
  /** Things the plain cue in the same utterance already says. */
  skipRestating?: ('set' | 'rest')[];
}

export function newPickerState(seed: string, history: OnceHistory = EMPTY_HISTORY, persona: Persona = 'lagos-strength'): PickerState {
  return { persona, seed, history, recent: {}, usedOnce: [], picks: {} };
}

/** Starting a session advances the persisted counter; call once, then save the result. */
export function startSession(history: OnceHistory): OnceHistory {
  return { sessions: history.sessions + 1, lastShown: history.lastShown };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: one deterministic float in [0, 1) from a 32-bit seed. */
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Add a pause between sentences using punctuation only: TTS engines treat an ellipsis as a beat. */
export function slowPauses(text: string): string {
  return text.replace(/([.?!])\s+/g, '$1 ... ');
}

export function pickLine(
  moment: Moment,
  state: PickerState,
  ctx: PickContext,
): { line: PickedLine | null; state: PickerState } {
  const bank = (BANKS[state.persona] ?? []).filter((l) => l.moment === moment);
  const { history } = state;
  const recent = state.recent[moment] ?? [];

  const eligible = (l: CoachLine): boolean => {
    if (l.tags.includes('safety') && !ctx.allowSafety) return false;
    if (l.bakedSeconds !== undefined && l.bakedSeconds !== ctx.secondsLeft) return false;
    if (l.bakedSet !== undefined && l.bakedSet !== ctx.setNumber) return false;
    if (l.repOnly && ctx.timed) return false;
    if (l.restates && ctx.skipRestating?.includes(l.restates)) return false;
    if (l.tags.includes('once')) {
      if (state.usedOnce.includes(l.id)) return false;
      const last = history.lastShown[l.id];
      if (last !== undefined && history.sessions - last < ONCE_EVERY_SESSIONS) return false;
    }
    return true;
  };

  const base = bank.filter(eligible);
  // Prefer a line outside the last 3; if the bank is too small, relax gradually rather than go silent.
  let pool: CoachLine[] = [];
  for (let n = NO_REPEAT; n >= 0 && pool.length === 0; n--) {
    const avoid = recent.slice(-n || recent.length);
    pool = n === 0 ? base : base.filter((l) => !avoid.includes(l.id));
  }
  if (pool.length === 0) return { line: null, state };

  const count = state.picks[moment] ?? 0;
  const chosen = pool[Math.floor(rand(hash(`${state.seed}|${moment}|${count}`)) * pool.length)];

  const useLocal = chosen.tags.includes('local') && ctx.localWords;
  let text = chosen.tags.includes('local') && !useLocal ? (chosen.plain as string) : chosen.text;
  if (chosen.tags.includes('spoken-slow')) text = slowPauses(text);

  const once = chosen.tags.includes('once');
  const next: PickerState = {
    ...state,
    recent: { ...state.recent, [moment]: [...recent, chosen.id].slice(-NO_REPEAT) },
    picks: { ...state.picks, [moment]: count + 1 },
    usedOnce: once ? [...state.usedOnce, chosen.id] : state.usedOnce,
    history: once ? { ...history, lastShown: { ...history.lastShown, [chosen.id]: history.sessions } } : history,
  };
  return { line: { id: chosen.id, moment, text, statesSeconds: chosen.bakedSeconds !== undefined }, state: next };
}
