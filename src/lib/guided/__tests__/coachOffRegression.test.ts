/**
 * Ported from binectics-mobile src/guided/__tests__/coachOffRegression.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { buildPlan, initialState, reduce, type SessionState } from '../engine';
import { speechFor, type CoachContext } from '../cueText';

/**
 * With coach lines off, the spoken output must be byte-identical to what the
 * guided session said before coach lines existed. GOLDEN was captured from the
 * pre-coach build for this exact script; do not regenerate it to make a
 * failing change pass.
 */
const GOLDEN = [
  'Get ready for Squat. Chest up.',
  'Three.',
  'Two.',
  'One.',
  'Set 1 of 2. 10 reps. Go.',
  'Set 1 done. Take a 20 second rest. Next, set 2 of 2.',
  'Five seconds. Get ready.',
  'Set 2 of 2. 10 reps. Go.',
  'Squat complete! Take a 20 second rest. Next up, Plank.',
  'Five seconds. Get ready.',
  'Go. Straight line.',
  'Halfway.',
  'Ten seconds left.',
  'Five seconds left.',
  'Three.',
  'Two.',
  'One.',
  'Set 1 done. Take a 12 second rest. Next, set 2 of 2.',
  'Five seconds. Get ready.',
  'Go.',
  'Halfway.',
  'Ten seconds left.',
  'Five seconds left.',
  'Three.',
  'Two.',
  'One.',
  'Plank complete! Take a 12 second rest. Next up, Lunge.',
  'Five seconds. Get ready.',
  '8 reps. Go.',
  'Lunge complete! Go.',
  'Five seconds left.',
  'Three.',
  'Two.',
  'One.',
  'Workout complete. Great work! Your summary is on screen.',
];

const plan = buildPlan(
  [
    { name: 'Squat', sets: 2, reps: 10, restSeconds: 20, cues: ['Chest up'] },
    { name: 'Plank', sets: 2, seconds: 45, restSeconds: 12, cues: ['Straight line'] },
    { name: 'Lunge', sets: 1, reps: 8, restSeconds: 0, cues: [] },
    { name: 'Wall sit', sets: 1, seconds: 12, cues: [] },
  ],
  30,
);
const prefs = { voiceOn: true, countdownCalls: true, formCues: true };

function script(coachLines: boolean | undefined, coach: CoachContext | undefined): string[] {
  let s: SessionState = initialState(plan, 8);
  const out: string[] = [];
  let last = 0;
  let t = 1_000_000;
  const take = () => {
    const fresh = s.cues.filter((c) => c.id > last);
    last = s.cueSeq;
    const x = speechFor(fresh, coachLines === undefined ? prefs : { ...prefs, coachLines }, coach);
    if (x) out.push(x);
  };
  s = reduce(s, { type: 'start', now: t });
  take();
  for (let i = 0; i < 7000; i++) {
    t += 100;
    if (s.phase === 'exercise' && s.plan[s.exIndex].kind === 'reps' && t - (s.phaseStartedAt ?? 0) > 3000) {
      s = reduce(s, { type: 'doneSet', now: t });
    } else {
      s = reduce(s, { type: 'tick', now: t });
    }
    take();
    if (s.phase === 'completed') break;
  }
  return out;
}

/** A context that would add words everywhere if it were ever consulted. */
const loud: CoachContext = {
  enabled: true,
  line: (moment) => ({ id: 'x', moment, text: 'Loud line.', statesSeconds: false }),
};
const spy = (): CoachContext & { calls: number } => {
  const c = { enabled: false, calls: 0, line: () => { c.calls++; return null; } };
  return c;
};

describe('coach lines off: byte-identical to the plain cues', () => {
  it('matches the pre-coach golden script with no coach context at all', () => {
    expect(script(undefined, undefined)).toEqual(GOLDEN);
  });
  it('matches it with the pref off even if a loud coach context is supplied', () => {
    expect(script(false, loud)).toEqual(GOLDEN);
  });
  it('matches it with a disabled context, which is never asked for a line', () => {
    const c = spy();
    expect(script(true, c)).toEqual(GOLDEN);
    expect(c.calls).toBe(0);
  });
  it('coach cues alone are silent without coach lines', () => {
    expect(script(true, undefined)).toEqual(GOLDEN);
  });
});
