/**
 * Ported from binectics-mobile src/guided/coach/opening.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { initialState, nextCueInMs, reduce, type PlanItem } from '../engine';
import { speechFor, SPEECH_MARGIN_MS, type CoachContext } from '../cueText';

/** The most the first get-ready countdown is lengthened to make room for a spoken welcome. */
export const OPENING_MAX_MS = 3500;
const STEP_MS = 250;

export interface OpeningPlan {
  /** Say the opening line (it will be heard whole, before "Get ready"). */
  speak: boolean;
  /** Extra time for the first countdown; 0 = none needed. */
  openingMs: number;
}

/**
 * Decides, before Start, whether an opening line (welcome or welcome-back) will
 * be heard, and how much longer the first countdown has to be so it is. It runs
 * the real engine and the real fit rule (`speechFor` with the same budget the
 * speech driver uses) at the member's speaking rate, trying the shortest
 * lengthening first. If even the longest allowed slot does not fit, the line is
 * not spoken at all and nothing is lengthened: the caller must then not take the
 * line (no once-slot used) and the countdown stays exactly as it was.
 *
 * Pure and deterministic: no clock, no randomness.
 */
export function planOpening(args: {
  text: string | null | undefined;
  plan: PlanItem[];
  startAt?: number;
  prepSeconds: number;
  rate: number;
  countdownCalls: boolean;
  formCues: boolean;
  comeback?: boolean;
}): OpeningPlan {
  const { text, plan, startAt, prepSeconds, rate, countdownCalls, formCues, comeback } = args;
  const none: OpeningPlan = { speak: false, openingMs: 0 };
  if (!text || plan.length === 0) return none;
  // No get-ready countdown: the line sits before "Go" with the next call far away.
  if (prepSeconds <= 0) return { speak: true, openingMs: 0 };

  const prefs = { voiceOn: true, countdownCalls, formCues, coachLines: true };
  const stub: CoachContext = { enabled: true, line: () => null };
  const heard = (openingMs: number): boolean => {
    const s = reduce(initialState(plan, prepSeconds), {
      type: 'start',
      now: 0,
      at: startAt,
      openingMs,
      ...(comeback ? { comeback: true, comebackText: text } : { openingText: text }),
    });
    const next = nextCueInMs(s, 0);
    const budgetMs = next === null ? null : next - SPEECH_MARGIN_MS;
    const said = speechFor(s.cues, prefs, stub, { rate, budgetMs });
    // Both orders have the same length, so if it is in at all it was heard whole (and first, when the slot allows).
    return said.includes(text);
  };
  for (let ms = 0; ms <= OPENING_MAX_MS; ms += STEP_MS) {
    if (heard(ms)) return { speak: true, openingMs: ms };
  }
  return none;
}
