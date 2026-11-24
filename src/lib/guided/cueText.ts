/**
 * Ported from binectics-mobile src/guided/cueText.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import type { Cue, ToneName } from './engine';
import type { Moment, PickedLine } from './coach/types';
import type { PickContext } from './coach/selector';

export interface SpeechPrefs {
  voiceOn: boolean;
  /** "Ten seconds left", "Three, two, one", halfway, rest warnings. */
  countdownCalls: boolean;
  formCues: boolean;
  /** Short sounds (independent of voice). */
  soundsOn?: boolean;
  /** Coach voice lines (session start, encouragement, ease off, comeback). Off/absent = silent. */
  coachLines?: boolean;
}

/**
 * How the coach lines reach cueText. `line` asks the selector for a line for a
 * moment (it keeps its own no-repeat state), or null when none is available.
 * Absent or `enabled: false` = the plain cues, byte for byte as before.
 */
export interface CoachContext {
  enabled: boolean;
  line: (
    moment: Moment,
    opts?: Pick<PickContext, 'allowSafety' | 'secondsLeft' | 'setNumber' | 'timed' | 'skipRestating'>,
  ) => PickedLine | null;
}

/** A coach utterance longer than this falls back to the plain cue: a long line must never crowd out the timer. */
export const MAX_UTTERANCE_WORDS = 12;
/** A rest shorter than this is too short to also hear a rest line. */
export const REST_LINE_MIN_S = 20;
/** Leave this much slack before the next scheduled call when fitting speech into the time available. */
export const SPEECH_MARGIN_MS = 300;
/** Not worth picking a coach line for less room than this beyond the plain cues. */
const MIN_COACH_ROOM_MS = 700;

/**
 * A deliberately cautious estimate of how long a text takes to say: about 420 ms
 * a word plus a beat per sentence and per written pause, scaled by the speaking
 * rate. Used to keep coach additions from running into the next scheduled call.
 */
export function estimateSpeechMs(text: string, rate = 1): number {
  const words = text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const sentences = (text.match(/[.!?]+(\s|$)/g) ?? []).length;
  const pauses = (text.match(/\.\.\./g) ?? []).length;
  return ((words * 420 + sentences * 200 + pauses * 300) / Math.max(0.5, rate)) | 0;
}

/** What else is in the same utterance, for lines that must not repeat it. */
export interface BatchInfo {
  /** Seconds of the rest announced in this batch; null = none announced. */
  restSeconds: number | null;
}

const wordCount = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n: number) => WORDS[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Spoken text for one cue; short, encouraging, plain. With coach lines on, a line is added or substituted. */
export function cueText(c: Cue, coach?: CoachContext, batch?: BatchInfo): string {
  return cueParts(c, coach, batch).full;
}

/** The plain cue and the cue with its coach wording (equal when there is none), so a budget can drop just the coach part. */
function cueParts(c: Cue, coach?: CoachContext, batch?: BatchInfo): { plain: string; full: string } {
  const plain = plainCueText(c);
  if (!coach?.enabled) return { plain, full: plain };
  const text = coachCueText(c, plain, coach, batch);
  return { plain, full: text !== null && wordCount(text) <= MAX_UTTERANCE_WORDS ? text : plain };
}

/**
 * The coach wording for one cue, or null to use the plain cue. Numbers (counts,
 * set numbers, rest seconds) always come from the plain, code-generated text;
 * a line only ever sits next to them.
 */
function coachCueText(c: Cue, plain: string, coach: CoachContext, batch?: BatchInfo): string | null {
  switch (c.kind) {
    // The screen chooses the opening line at Start (and only takes it if it will be heard); it travels on the cue.
    case 'sessionStart':
    case 'comeback':
      return c.text || null;
    case 'encourage':
      return coach.line('midSet')?.text ?? null;
    case 'easeOff':
      return coach.line('easeOff', { allowSafety: c.safety === true })?.text ?? null;
    case 'timeLeft': {
      // "Almost there. Ten seconds left." Only at ten; the five-second call stays plain.
      if (c.seconds !== 10) return null;
      const l = coach.line('lastReps', { secondsLeft: 10, timed: true }); // timeLeft only exists on timed sets
      if (!l) return null;
      return l.statesSeconds ? l.text : `${l.text} ${plain}`;
    }
    case 'setComplete': {
      // Only when the rest that follows is long enough to hear a line as well; the plain text already says set and rest.
      if (batch?.restSeconds == null || batch.restSeconds < REST_LINE_MIN_S) return null;
      const l = coach.line('setComplete', { setNumber: c.set, skipRestating: ['set', 'rest'] });
      return l ? `${plain} ${l.text}` : null;
    }
    case 'restStart': {
      if ((c.seconds ?? 0) < REST_LINE_MIN_S) return null;
      const l = coach.line('rest');
      return l ? `${plain} ${l.text}` : null;
    }
    case 'complete': {
      if (c.allDone === false) return null; // no praise for a session that was not finished
      const l = coach.line('sessionComplete');
      return l ? `${l.text} Your summary is on screen.` : null;
    }
    default:
      return null;
  }
}

function plainCueText(c: Cue): string {
  switch (c.kind) {
    case 'getReady':
      return `Get ready for ${c.name}.`;
    case 'form':
      return c.text ?? '';
    case 'count':
      return cap(word(c.seconds ?? 0));
    case 'begin':
      if (c.timed) return 'Go.';
      return `${c.sets && c.sets > 1 ? `Set ${c.set} of ${c.sets}. ` : ''}${
        c.reps !== undefined ? `${c.reps} reps. Go.` : 'Go.'
      }`.trim();
    case 'timeLeft':
      return `${cap(word(c.seconds ?? 0))} seconds left.`;
    case 'halfway':
      return 'Halfway.';
    case 'setComplete':
      return `Set ${c.set} done.`;
    case 'exerciseComplete':
      return `${c.name} complete!`;
    case 'restStart':
      return `Take a ${c.seconds} second rest.`;
    case 'nextUp':
      return c.sameExercise
        ? `Next, set ${c.set} of ${c.sets}.`
        : `Next up, ${c.name}.`;
    case 'restWarn':
      return `${cap(word(c.seconds ?? 0))} seconds. Get ready.`;
    case 'tone':
      return '';
    // Coach voice: wording comes only from the coach lines (coachCueText); without them, silence.
    case 'sessionStart':
    case 'encourage':
    case 'easeOff':
    case 'comeback':
      return '';
    case 'complete':
      return c.allDone === false
        ? 'Workout finished. Your summary is on screen.'
        : 'Workout complete. Great work! Your summary is on screen.';
  }
}

/** One utterance for a batch of cues, after the member's preferences. Empty string = say nothing. */
export function speechFor(
  cues: readonly Cue[],
  prefs: SpeechPrefs,
  coach?: CoachContext,
  /**
   * budgetMs: time before the next scheduled call (a count, "ten seconds left", a rest warning), already net of
   * any tone that plays first. Coach additions are dropped, last first, until the speech fits; the plain
   * instruction is never dropped. null/absent = no limit.
   */
  fit?: { rate?: number; budgetMs?: number | null },
): string {
  if (!prefs.voiceOn) return '';
  // Coach wording needs the member's say-so here too, not only in the caller.
  let ctx = prefs.coachLines === true ? coach : undefined;
  const kept = cues
    .filter((c) => c.group !== 'tone')
    .filter((c) =>
      c.group === 'count'
        ? prefs.countdownCalls
        : c.group === 'form'
          ? prefs.formCues
          : c.group === 'coach'
            ? prefs.coachLines === true
            : true,
    )
  ;
  const rest = kept.find((c) => c.kind === 'restStart');
  const batch: BatchInfo = { restSeconds: rest ? (rest.seconds ?? 0) : null };
  // The welcome (or welcome-back) goes BEFORE "Get ready for X" only when the whole thing fits the time before
  // the first count (the countdown is lengthened for it); otherwise the instruction comes first and the welcome
  // is the droppable tail. The instruction itself is never dropped.
  const isOpening = (c: Cue) => c.kind === 'sessionStart' || c.kind === 'comeback';
  const emitted = kept.map((c) => ({ c }));
  const hasOpening = kept.some(isOpening) && kept.some((c) => c.kind === 'getReady');
  const instructionFirst = hasOpening
    ? [...emitted.filter((i) => !isOpening(i.c)), ...emitted.filter((i) => isOpening(i.c))]
    : emitted;
  const say = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
  const join = (texts: string[]) => texts.filter(Boolean).map(say).join(' ');
  const rate = fit?.rate ?? 1;
  const budget = fit?.budgetMs ?? null;

  // No room for anything beyond the plain cues: do not even pick a line (it would use up a once-slot).
  if (ctx && budget !== null) {
    const plainMs = estimateSpeechMs(join(emitted.map((i) => cueParts(i.c, undefined).plain)), rate);
    if (budget - plainMs < MIN_COACH_ROOM_MS) ctx = undefined;
  }
  const partOf = new Map(emitted.map((i) => [i.c, cueParts(i.c, ctx, batch)] as const));
  let order = instructionFirst;
  if (hasOpening && budget !== null && estimateSpeechMs(join(emitted.map((i) => (partOf.get(i.c) as { full: string }).full)), rate) <= budget) {
    order = emitted;
  }
  const parts = order.map((i) => partOf.get(i.c) as { plain: string; full: string });
  const texts = parts.map((p) => p.full);
  if (ctx && budget !== null) {
    for (let i = parts.length - 1; i >= 0 && estimateSpeechMs(join(texts), rate) > budget; i--) texts[i] = parts[i].plain;
  }
  return join(texts);
}

/**
 * The one sound to play for a batch of cues, or null. Tones do not depend on
 * voice. A count-down tick is left out when the spoken count already covers
 * that second (voice on and countdown calls on), so a beep never talks over
 * "three". If a batch holds several sounds (set end, then the next set's
 * start with no rest between) the last one wins.
 */
export function toneFor(cues: readonly Cue[], prefs: SpeechPrefs): ToneName | null {
  if (prefs.soundsOn === false) return null;
  const spokenCount = prefs.voiceOn && prefs.countdownCalls;
  let pick: ToneName | null = null;
  for (const c of cues) {
    if (c.kind !== 'tone' || !c.tone) continue;
    if (c.tone === 'tick' && spokenCount) continue;
    pick = c.tone;
  }
  return pick;
}
