/**
 * Ported from binectics-mobile src/guided/__tests__/coachBudget.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { buildPlan, initialState, nextCueInMs, reduce } from '../engine';
import { estimateSpeechMs, speechFor, SPEECH_MARGIN_MS, type CoachContext } from '../cueText';
import { LAGOS_STRENGTH_LINES } from '../coach/lines.lagos-strength';
import { OPENING_MAX_MS, planOpening } from '../coach/opening';

const T0 = 1_000_000;
const on = { voiceOn: true, countdownCalls: true, formCues: true, coachLines: true };
const plan = buildPlan([{ name: 'Plank', seconds: 40, sets: 3, restSeconds: 30, cues: ['Straight line'] }]);

const WELCOME = "Welcome in. Let's work.";
const COMEBACK = "Back is the hard part. You're back."; // the longest line in the bank
const stub: CoachContext = { enabled: true, line: () => null };

/** Start as the screen would: plan the opening, lengthen the first countdown if needed, speak the first batch. */
function opening(prep: number, rate: number, text = WELCOME, comeback = false) {
  const o = planOpening({ text, plan, prepSeconds: prep, rate, countdownCalls: true, formCues: true, comeback });
  const ev = o.speak
    ? { openingMs: o.openingMs, ...(comeback ? { comeback: true, comebackText: text } : { openingText: text }) }
    : {};
  const s = reduce(initialState(plan, prep), { type: 'start', now: T0, ...ev });
  const budgetMs = (nextCueInMs(s, T0) as number) - SPEECH_MARGIN_MS;
  const spoken = speechFor(s.cues, on, stub, { rate, budgetMs });
  return { o, s, spoken, budgetMs };
}

describe('the first countdown call', () => {
  it('arrives at 2 s with the default 5 s get-ready (3 s prep: 1 s)', () => {
    expect(nextCueInMs(reduce(initialState(plan, 5), { type: 'start', now: T0 }), T0)).toBe(2000);
    expect(nextCueInMs(reduce(initialState(plan, 3), { type: 'start', now: T0 }), T0)).toBe(1000); // "Three" is already in the first batch
  });
  it('is null while paused: nothing is coming until Resume', () => {
    const s = reduce(initialState(plan, 5), { type: 'start', now: T0 });
    expect(nextCueInMs(reduce(s, { type: 'pause', now: T0 + 1000 }), T0 + 1000)).toBeNull();
  });
});

describe('the opening line gets its own slot before the countdown', () => {
  const cases = [3, 5, 10].flatMap((prep) => [0.75, 1, 1.25].map((rate) => [prep, rate] as const));

  it.each(cases)('prep %i s at rate %f: heard whole BEFORE "Get ready", or dropped with the countdown untouched', (prep, rate) => {
    const { o, s, spoken, budgetMs } = opening(prep, rate);
    // Never clipped: the exercise instruction is always there, whole.
    expect(spoken).toContain('Get ready for Plank.');
    if (o.speak) {
      expect(spoken.startsWith(WELCOME)).toBe(true);
      expect(estimateSpeechMs(spoken, rate)).toBeLessThanOrEqual(budgetMs);
      expect(o.openingMs).toBeLessThanOrEqual(OPENING_MAX_MS);
      expect(s.phaseDurationMs).toBe(prep * 1000 + o.openingMs);
    } else {
      expect(spoken).not.toContain('Welcome');
      expect(o.openingMs).toBe(0);
      expect(s.phaseDurationMs).toBe(prep * 1000); // unchanged
    }
  });

  it('the default 5 s prep gets the welcome, with the countdown lengthened by only what it needs', () => {
    const r = opening(5, 1);
    expect(r.o.speak).toBe(true);
    expect(r.o.openingMs).toBeGreaterThan(0);
    expect(r.o.openingMs).toBeLessThanOrEqual(OPENING_MAX_MS);
    expect(r.spoken).toBe("Welcome in. Let's work. Get ready for Plank.");
    // One step shorter would not have fit.
    const shorter = reduce(initialState(plan, 5), { type: 'start', now: T0, openingText: WELCOME, openingMs: r.o.openingMs - 250 });
    const b = (nextCueInMs(shorter, T0) as number) - SPEECH_MARGIN_MS;
    expect(speechFor(shorter.cues, on, stub, { rate: 1, budgetMs: b })).not.toContain('Welcome');
  });

  it('prep 10 needs no lengthening: welcome, instruction and form tip fit as they are', () => {
    const r = opening(10, 1);
    expect(r.o).toEqual({ speak: true, openingMs: 0 });
    expect(r.spoken).toBe("Welcome in. Let's work. Get ready for Plank. Straight line.");
  });

  it('the long welcome-back line fits at prep 10 and otherwise is dropped, never clipping the instruction', () => {
    const ten = opening(10, 1, COMEBACK, true);
    expect(ten.spoken.startsWith(COMEBACK)).toBe(true);
    expect(ten.spoken).toContain('Get ready for Plank. Straight line.');
    const five = opening(5, 1, COMEBACK, true);
    expect(five.o.speak).toBe(false);
    expect(five.spoken).toBe('Get ready for Plank.');
    const slow = opening(10, 0.75, COMEBACK, true);
    expect(slow.spoken).toContain('Get ready for Plank.');
  });

  it('a start with no opening line is exactly as before (5 s prep, 2 s to the first count)', () => {
    const s = reduce(initialState(plan, 5), { type: 'start', now: T0 });
    expect(s.phaseDurationMs).toBe(5000);
    expect(speechFor(s.cues, on, stub, { rate: 1, budgetMs: 1700 })).toBe('Get ready for Plank.');
  });

  it('with no timer to size against, the instruction still comes first', () => {
    const s = reduce(initialState(plan, 5), { type: 'start', now: T0, openingText: WELCOME });
    expect(speechFor(s.cues, on, stub)).toBe("Get ready for Plank. Welcome in. Let's work.");
  });

  it('the welcome is dropped last-first when the budget is too tight for it', () => {
    const s = reduce(initialState(plan, 5), { type: 'start', now: T0, openingText: WELCOME });
    expect(speechFor(s.cues, on, stub, { rate: 1, budgetMs: 1700 })).toBe('Get ready for Plank.');
  });

  it('coach off: nothing changes, whatever the budget', () => {
    const s = reduce(initialState(plan, 5), { type: 'start', now: T0, openingText: WELCOME });
    expect(speechFor(s.cues, { ...on, coachLines: false }, stub, { rate: 1, budgetMs: 0 })).toBe('Get ready for Plank.');
  });

  it('planOpening says nothing is spoken for no text, and never lengthens in that case', () => {
    expect(planOpening({ text: null, plan, prepSeconds: 5, rate: 1, countdownCalls: true, formCues: true })).toEqual({ speak: false, openingMs: 0 });
  });

  it('with no get-ready countdown the line sits before "Go" and nothing is lengthened', () => {
    expect(planOpening({ text: WELCOME, plan, prepSeconds: 0, rate: 1, countdownCalls: true, formCues: true })).toEqual({ speak: true, openingMs: 0 });
  });

  it('is deterministic', () => {
    expect(opening(5, 1).o).toEqual(opening(5, 1).o);
  });
});

describe('a set-complete batch', () => {
  const rested = (restSeconds: number) =>
    buildPlan([{ name: 'Squat', reps: 10, sets: 3, restSeconds, cues: [] }]);
  const batch = (restSeconds: number) => {
    let s = reduce(initialState(rested(restSeconds), 0), { type: 'start', now: T0 });
    const seen = s.cueSeq;
    s = reduce(s, { type: 'doneSet', now: T0 + 2000 });
    return { s, fresh: s.cues.filter((c) => c.id > seen) };
  };
  const everything: CoachContext = {
    enabled: true,
    line: (m) => ({ id: 'x', moment: m, text: m === 'setComplete' ? 'Clean set.' : m === 'rest' ? 'Water. Small sips.' : 'x.', statesSeconds: false }),
  };

  it('adds the praise and the rest line only for a rest of 20 s or more', () => {
    expect(speechFor(batch(30).fresh, on, everything)).toBe('Set 1 done. Clean set. Take a 30 second rest. Water. Small sips. Next, set 2 of 3.');
    expect(speechFor(batch(15).fresh, on, everything)).toBe('Set 1 done. Take a 15 second rest. Next, set 2 of 3.');
    expect(speechFor(batch(10).fresh, on, everything)).toBe('Set 1 done. Take a 10 second rest. Next, set 2 of 3.');
  });

  it('with the rest warning five seconds from the end, a short rest stays plain and a long one fits', () => {
    const { s, fresh } = batch(30);
    const budgetMs = (nextCueInMs(s, T0 + 2000) as number) - SPEECH_MARGIN_MS; // 25 s to the warning
    const said = speechFor(fresh, on, everything, { rate: 0.75, budgetMs });
    expect(estimateSpeechMs(said, 0.75)).toBeLessThanOrEqual(budgetMs);
  });

  it('drops the last coach addition first when the budget is tight', () => {
    const { fresh } = batch(30);
    const full = speechFor(fresh, on, everything);
    const noRestLine = speechFor(fresh, on, everything, { rate: 1, budgetMs: estimateSpeechMs(full, 1) - 100 });
    expect(noRestLine).toBe('Set 1 done. Clean set. Take a 30 second rest. Next, set 2 of 3.');
  });
});

describe('bank gates used by the wording', () => {
  it('the rep-language lines are flagged and the restating ones too', () => {
    const flagged = (k: 'repOnly' | 'restates') => LAGOS_STRENGTH_LINES.filter((l) => l[k]).map((l) => l.id);
    expect(flagged('repOnly')).toEqual(['lr-02', 'lr-06', 'lr-10']);
    expect(flagged('restates')).toEqual(['sc-04', 'sc-07', 'sc-10']);
  });
});
