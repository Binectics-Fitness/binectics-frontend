/**
 * Ported from binectics-mobile src/guided/__tests__/cueText.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { cueText, speechFor, toneFor, type CoachContext } from '../cueText';
import { buildPlan, initialState, reduce, type Cue } from '../engine';

const on = { voiceOn: true, countdownCalls: true, formCues: true };
const cue = (c: Partial<Cue>): Cue => ({ id: 1, phaseId: 1, kind: 'count', group: 'count', ...c }) as Cue;

describe('cueText', () => {
  it('reads like a coach', () => {
    expect(cueText(cue({ kind: 'getReady', group: 'core', name: 'Squat' }))).toBe('Get ready for Squat.');
    expect(cueText(cue({ kind: 'count', seconds: 3 }))).toBe('Three');
    expect(cueText(cue({ kind: 'timeLeft', seconds: 10 }))).toBe('Ten seconds left.');
    expect(cueText(cue({ kind: 'exerciseComplete', group: 'core', name: 'Squats' }))).toBe('Squats complete!');
    expect(cueText(cue({ kind: 'restStart', group: 'core', seconds: 20 }))).toBe('Take a 20 second rest.');
    expect(cueText(cue({ kind: 'nextUp', group: 'core', name: 'Push-ups' }))).toBe('Next up, Push-ups.');
    expect(cueText(cue({ kind: 'nextUp', group: 'core', set: 2, sets: 3, sameExercise: true }))).toBe('Next, set 2 of 3.');
    expect(cueText(cue({ kind: 'begin', group: 'core', timed: false, reps: 10, set: 2, sets: 3 }))).toBe('Set 2 of 3. 10 reps. Go.');
    expect(cueText(cue({ kind: 'begin', group: 'core', timed: true }))).toBe('Go.');
  });

  it('joins one transition into one natural utterance', () => {
    const plan = buildPlan([{ name: 'Squats', seconds: 10, sets: 1, restSeconds: 20, cues: [] }, { name: 'Push-ups', reps: 8, cues: [] }]);
    let s = reduce(initialState(plan, 0), { type: 'start', now: 0 });
    const seen = s.cueSeq;
    s = reduce(s, { type: 'tick', now: 10_000 });
    expect(speechFor(s.cues.filter((c) => c.id > seen), on)).toBe('Squats complete! Take a 20 second rest. Next up, Push-ups.');
  });

  it('honours preferences', () => {
    const cues = [cue({ kind: 'count', seconds: 2 }), cue({ kind: 'form', group: 'form', text: 'Chest up' }), cue({ kind: 'begin', group: 'core', timed: true })];
    expect(speechFor(cues, on)).toBe('Two. Chest up. Go.');
    expect(speechFor(cues, { ...on, countdownCalls: false })).toBe('Chest up. Go.');
    expect(speechFor(cues, { ...on, formCues: false })).toBe('Two. Go.');
    expect(speechFor(cues, { ...on, voiceOn: false })).toBe('');
  });
});

describe('toneFor', () => {
  const tone = (t: 'tick' | 'start' | 'end' | 'restEnd') => cue({ kind: 'tone', group: 'tone', tone: t });
  it('plays regardless of voice, and never for the sounds-off setting', () => {
    expect(toneFor([tone('end')], { ...on, voiceOn: false, soundsOn: true })).toBe('end');
    expect(toneFor([tone('end')], { ...on, soundsOn: false })).toBeNull();
  });
  it('leaves ticks to the spoken count when it covers them', () => {
    expect(toneFor([tone('tick')], { ...on, soundsOn: true })).toBeNull();
    expect(toneFor([tone('tick')], { ...on, voiceOn: false, soundsOn: true })).toBe('tick');
    expect(toneFor([tone('tick')], { ...on, countdownCalls: false, soundsOn: true })).toBe('tick');
  });
  it('the last sound in a batch wins; tones are never spoken', () => {
    expect(toneFor([tone('end'), tone('start')], on)).toBe('start');
    expect(speechFor([tone('end')], on)).toBe('');
  });
});

describe('coach cues (no wording until the line bank is wired in)', () => {
  const coach = (kind: Cue['kind']) => cue({ kind, group: 'coach' });
  it('are silent for every new kind', () => {
    for (const k of ['sessionStart', 'encourage', 'easeOff', 'comeback'] as const) expect(cueText(coach(k))).toBe('');
  });

  it('never change what a batch sounds like, with coach lines on or off', () => {
    const batch = [coach('sessionStart'), cue({ kind: 'getReady', group: 'core', name: 'Squat' }), coach('encourage'), coach('easeOff')];
    expect(speechFor(batch, on)).toBe('Get ready for Squat.');
    expect(speechFor(batch, { ...on, coachLines: true })).toBe('Get ready for Squat.');
  });

  it('a coach cue alone says nothing and plays no tone', () => {
    expect(speechFor([coach('encourage')], { ...on, coachLines: true })).toBe('');
    expect(toneFor([coach('easeOff')], on)).toBeNull();
  });
});

describe('coach wording (coach lines on)', () => {
  const line = (text: string, statesSeconds = false) => ({ id: 'x', moment: 'midSet' as const, text, statesSeconds });
  const ctxOf = (map: Partial<Record<string, string>>, calls: unknown[] = []): CoachContext => ({
    enabled: true,
    line: (moment, opts) => {
      calls.push([moment, opts]);
      const t = map[moment];
      return t ? line(t, t === 'Ten seconds. Easy now.') : null;
    },
  });
  const sp = { ...on, coachLines: true };

  it('adds a line next to the numbers, which always come from code', () => {
    const c = ctxOf({ setComplete: 'Clean set.', rest: 'Water. Small sips.', lastReps: 'Almost there.', sessionComplete: 'Well done.' });
    expect(cueText(cue({ kind: 'setComplete', group: 'core', set: 2, sets: 3 }), c, { restSeconds: 30 })).toBe('Set 2 done. Clean set.');
    expect(cueText(cue({ kind: 'restStart', group: 'core', seconds: 30 }), c)).toBe('Take a 30 second rest. Water. Small sips.');
    expect(cueText(cue({ kind: 'timeLeft', seconds: 10 }), c)).toBe('Almost there. Ten seconds left.');
    expect(cueText(cue({ kind: 'complete', group: 'core', allDone: true }), c)).toBe('Well done. Your summary is on screen.');
  });

  it('asks for the right moment and passes the set number, seconds and safety flag', () => {
    const calls: unknown[] = [];
    const c = ctxOf({ setComplete: 'Solid.', lastReps: 'Finish strong.', easeOff: 'Take a rest. No stress.' }, calls);
    cueText(cue({ kind: 'setComplete', group: 'core', set: 3, sets: 3 }), c, { restSeconds: 30 });
    cueText(cue({ kind: 'timeLeft', seconds: 10 }), c);
    cueText(cue({ kind: 'easeOff', group: 'coach', safety: true }), c);
    cueText(cue({ kind: 'easeOff', group: 'coach' }), c);
    expect(calls).toEqual([
      ['setComplete', { setNumber: 3, skipRestating: ['set', 'rest'] }],
      ['lastReps', { secondsLeft: 10, timed: true }],
      ['easeOff', { allowSafety: true }],
      ['easeOff', { allowSafety: false }],
    ]);
  });

  it('never doubles a number: a line that states the seconds stands alone', () => {
    const c = ctxOf({ lastReps: 'Ten seconds. Easy now.' });
    expect(cueText(cue({ kind: 'timeLeft', seconds: 10 }), c)).toBe('Ten seconds. Easy now.');
  });

  it('leaves the five-second call, counts, exercise complete and an unfinished session plain', () => {
    const c = ctxOf({ lastReps: 'X.', setComplete: 'X.', rest: 'X.', sessionComplete: 'X.', midSet: 'X.' });
    expect(cueText(cue({ kind: 'timeLeft', seconds: 5 }), c)).toBe('Five seconds left.');
    expect(cueText(cue({ kind: 'count', seconds: 3 }), c)).toBe('Three');
    expect(cueText(cue({ kind: 'exerciseComplete', group: 'core', name: 'Squats' }), c)).toBe('Squats complete!');
    expect(cueText(cue({ kind: 'complete', group: 'core', allDone: false }), c)).toBe('Workout finished. Your summary is on screen.');
  });

  it('skips the rest line on a rest too short to hear it', () => {
    const c = ctxOf({ rest: 'Water. Small sips.' });
    expect(cueText(cue({ kind: 'restStart', group: 'core', seconds: 15 }), c)).toBe('Take a 15 second rest.');
  });

  it('speaks coach cues from the line bank, and falls back to plain when no line is available', () => {
    const c = ctxOf({ midSet: 'Nice rhythm.', easeOff: 'Slow it down. That\'s fine.' });
    // The opening lines travel on the cue (chosen at Start, only if heard); a cue without text says nothing.
    expect(cueText(cue({ kind: 'sessionStart', group: 'coach', text: "Welcome in. Let's work." }), c)).toBe("Welcome in. Let's work.");
    expect(cueText(cue({ kind: 'sessionStart', group: 'coach' }), c)).toBe('');
    expect(cueText(cue({ kind: 'comeback', group: 'coach' }), c)).toBe('');
    expect(cueText(cue({ kind: 'encourage', group: 'coach' }), c)).toBe('Nice rhythm.');
    expect(cueText(cue({ kind: 'easeOff', group: 'coach', safety: true }), c)).toBe("Slow it down. That's fine.");
    expect(cueText(cue({ kind: 'comeback', group: 'coach', text: 'Welcome back. No stress.' }), c)).toBe('Welcome back. No stress.');
    expect(cueText(cue({ kind: 'setComplete', group: 'core', set: 1, sets: 2 }), ctxOf({}), { restSeconds: 30 })).toBe('Set 1 done.');
    expect(cueText(cue({ kind: 'encourage', group: 'coach' }), ctxOf({}))).toBe('');
  });

  it('drops a coach utterance over 12 words in favour of the plain cue', () => {
    const long = 'One two three four five six seven eight nine ten eleven twelve thirteen.';
    const c = ctxOf({ setComplete: long, midSet: long });
    expect(cueText(cue({ kind: 'setComplete', group: 'core', set: 1, sets: 2 }), c, { restSeconds: 30 })).toBe('Set 1 done.');
    expect(cueText(cue({ kind: 'encourage', group: 'coach' }), c)).toBe('');
    const ok = ctxOf({ setComplete: 'One two three four five six seven eight nine.' });
    expect(cueText(cue({ kind: 'setComplete', group: 'core', set: 1, sets: 2 }), ok, { restSeconds: 30 })).toBe('Set 1 done. One two three four five six seven eight nine.');
  });

  it('does not count a pause marker as a word', () => {
    const c = ctxOf({ setComplete: 'Breathe in. ... Breathe out. Slow. Easy. Calm. Good.' });
    expect(cueText(cue({ kind: 'setComplete', group: 'core', set: 1, sets: 2 }), c, { restSeconds: 30 })).toContain('Breathe in. ... Breathe out.');
  });

  it('needs the pref as well as the context', () => {
    const c = ctxOf({ midSet: 'Nice rhythm.' });
    const enc = cue({ kind: 'encourage', group: 'coach' });
    expect(speechFor([enc], sp, c)).toBe('Nice rhythm.');
    expect(speechFor([enc], { ...sp, coachLines: false }, c)).toBe('');
    expect(speechFor([enc], { ...sp, voiceOn: false }, c)).toBe('');
  });
});
