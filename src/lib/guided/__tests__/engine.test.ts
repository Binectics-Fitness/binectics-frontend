/**
 * Ported from binectics-mobile src/guided/__tests__/engine.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import {
  buildPlan,
  elapsedMs,
  estimateSeconds,
  exerciseStatus,
  initialState,
  isPaused,
  reduce,
  remainingMs,
  summarize,
  type Cue,
  type Event,
  type SessionState,
} from '../engine';
import type { StarterExercise } from '@/lib/starter/types';

const T0 = 1_000_000;
const S = 1000;

const exercises: StarterExercise[] = [
  { name: 'Squat', sets: 2, reps: 10, restSeconds: 20, cues: ['Chest up'], mediaId: 'squat' },
  { name: 'Plank', sets: 1, seconds: 30, restSeconds: 15, cues: ['Straight line'] },
  { name: 'Push-up', sets: 1, reps: 8, restSeconds: 10, cues: [] },
];

const make = (prep = 5, ex: StarterExercise[] = exercises) => initialState(buildPlan(ex, 30), prep);
const run = (s: SessionState, ...events: Event[]) => events.reduce(reduce, s);
const kinds = (s: SessionState) => s.cues.filter((c) => c.kind !== 'tone').map((c) => c.kind);
const tones = (s: SessionState, after = 0) => s.cues.filter((c) => c.kind === 'tone' && c.id > after).map((c) => c.tone);

describe('buildPlan', () => {
  it('maps real exercises: timed vs reps, set cap, rest default only where the plan is silent', () => {
    const plan = buildPlan(
      [
        { name: 'A', seconds: 40, cues: [] },
        { name: 'B', reps: 12, sets: 99, cues: ['x'], restSeconds: 45 },
        { name: 'C', cues: [] },
      ],
      30,
    );
    expect(plan[0]).toMatchObject({ kind: 'timed', seconds: 40, sets: 1, restSeconds: 30 });
    expect(plan[1]).toMatchObject({ kind: 'reps', reps: 12, sets: 10, restSeconds: 45 });
    expect(plan[2]).toMatchObject({ kind: 'reps', reps: undefined, sets: 1 });
  });

  it('estimates a length', () => {
    expect(estimateSeconds(buildPlan(exercises, 30))).toBeGreaterThan(100);
  });
});

describe('start and countdown', () => {
  it('ready does nothing until started; empty plans never start', () => {
    const s = make();
    expect(reduce(s, { type: 'tick', now: T0 })).toBe(s);
    expect(reduce(initialState([], 5), { type: 'start', now: T0 }).phase).toBe('ready');
  });

  it('start enters the prep countdown and says only "get ready" when the prep is short', () => {
    const s = run(make(), { type: 'start', now: T0 });
    expect(s.phase).toBe('countdown');
    expect(kinds(s)).toEqual(['sessionStart', 'getReady']);
    expect(remainingMs(s, T0)).toBe(5 * S);
  });

  it('a long prep (8 s or more) also speaks the form cue; a short one speaks it after "Go"', () => {
    const long = run(make(10), { type: 'start', now: T0 });
    expect(kinds(long)).toEqual(['sessionStart', 'getReady', 'form']);
    let short = run(make(5), { type: 'start', now: T0 });
    const seen = short.cueSeq;
    short = reduce(short, { type: 'tick', now: T0 + 5 * S });
    expect(short.phase).toBe('exercise');
    expect(short.cues.filter((c) => c.id > seen && c.kind !== 'tone').map((c) => c.kind)).toEqual(['begin', 'form']);
  });

  it('counts 3, 2, 1 once each and then starts the exercise', () => {
    let s = run(make(), { type: 'start', now: T0 });
    const counts: (number | undefined)[] = [];
    let last = 0;
    for (let t = 0; t <= 5200; t += 100) {
      s = reduce(s, { type: 'tick', now: T0 + t });
      s.cues.filter((c) => c.id > last && c.kind === 'count').forEach((c) => counts.push(c.seconds));
      last = s.cueSeq;
    }
    expect(counts).toEqual([3, 2, 1]);
    expect(s.phase).toBe('exercise');
    expect(kinds(s)).toContain('begin');
  });

  it('prep of 0 skips the countdown', () => {
    const s = run(make(0), { type: 'start', now: T0 });
    expect(s.phase).toBe('exercise');
    expect(kinds(s)).toEqual(['sessionStart', 'begin', 'form']);
  });

  it('prep of 3 still says three, two, one', () => {
    let s = run(make(3), { type: 'start', now: T0 });
    for (let t = 0; t <= 3000; t += 250) s = reduce(s, { type: 'tick', now: T0 + t });
    expect(s.phase).toBe('exercise');
  });
});

describe('timestamps, not decrement', () => {
  it('a tick with no change returns the same reference', () => {
    const s = run(make(), { type: 'start', now: T0 });
    expect(reduce(s, { type: 'tick', now: T0 + 1 })).toBe(s);
  });

  it('remaining time depends only on timestamps, however many ticks happened', () => {
    const a = run(make(0), { type: 'start', now: T0 });
    const b = run(a, { type: 'tick', now: T0 + 1 * S }, { type: 'tick', now: T0 + 2 * S });
    const c = run(a, { type: 'tick', now: T0 + 2 * S });
    expect(remainingMs(b, T0 + 2 * S)).toBe(remainingMs(c, T0 + 2 * S));
  });

  it('a long gap (lock/background) walks through the boundaries at their own times without drift', () => {
    const s0 = run(make(5), { type: 'start', now: T0 });
    // Jump to 5 s prep + 5 s into the first rep set... reps are untimed, so go to the plank instead.
    const s1 = run(make(0, [exercises[1]]), { type: 'start', now: T0 });
    expect(s1.phase).toBe('exercise');
    const s2 = reduce(s1, { type: 'tick', now: T0 + 30 * S + 4 * S });
    // single exercise, single set: finished
    expect(s2.phase).toBe('completed');
    expect(s2.endedAt).toBe(T0 + 30 * S);
    expect(s2.exerciseMs).toBe(30 * S);
    expect(s0.phase).toBe('countdown');
  });

  it('after a gap only the landed phase is announced (no backlog)', () => {
    const plan = [
      { name: 'Plank', seconds: 20, sets: 3, restSeconds: 10, cues: [] },
    ];
    let s = run(make(0, plan), { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + 75 * S }); // 20+10+20+10 = 60 s done; 15 s into set 3
    expect(s.phase).toBe('exercise');
    expect(s.setIndex).toBe(2);
    expect(s.cues.every((c) => c.phaseId === s.phaseId)).toBe(true);
    expect(remainingMs(s, T0 + 75 * S)).toBe(5 * S);
  });

  it('small lateness (busy thread) keeps the cues that fired', () => {
    let s = run(make(0, [{ name: 'Plank', seconds: 20, sets: 2, restSeconds: 10, cues: [] }]), { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + 20 * S + 800 });
    expect(s.phase).toBe('rest');
    expect(kinds(s)).toEqual(expect.arrayContaining(['setComplete', 'restStart', 'nextUp']));
  });
});

describe('timed exercise', () => {
  const plank = [{ name: 'Plank', seconds: 30, sets: 1, restSeconds: 15, cues: ['Straight line'] }, exercises[2]];

  it('says halfway only for holds of 40 s or more', () => {
    let s = run(make(0, [{ name: 'Wall sit', seconds: 60, sets: 1, cues: [] }]), { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + 30 * S });
    expect(kinds(s)).toContain('halfway');
    const id = s.cues.find((c) => c.kind === 'halfway')?.id;
    s = reduce(s, { type: 'tick', now: T0 + 31 * S });
    expect(s.cues.filter((c) => c.kind === 'halfway').map((c) => c.id)).toEqual([id]);
  });

  it('announces 10, 5, 3-2-1 once each; completes; rests; introduces next', () => {
    let s = run(make(0, plank), { type: 'start', now: T0 });
    const spoken: Cue[] = [];
    let last = 0;
    for (let t = 0; t <= 30 * S + 200; t += 100) {
      s = reduce(s, { type: 'tick', now: T0 + t });
      s.cues.filter((c) => c.id > last && c.kind !== 'tone').forEach((c) => spoken.push(c));
      last = s.cueSeq;
    }
    const texts = spoken.map((c) => (c.kind === 'count' || c.kind === 'timeLeft' ? `${c.kind}${c.seconds}` : c.kind));
    expect(texts).toEqual([
      'sessionStart',
      'begin',
      'form',
      'encourage',
      'timeLeft10',
      'timeLeft5',
      'count3',
      'count2',
      'count1',
      'exerciseComplete',
      'restStart',
      'nextUp',
    ]);
    expect(s.phase).toBe('rest');
    expect(s.restKind).toBe('exercise');
    expect(s.exIndex).toBe(1);
    const ids = spoken.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rest warns at 5 s and then starts the next exercise', () => {
    let s = run(make(0, plank), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 30 * S });
    expect(s.phase).toBe('rest');
    s = reduce(s, { type: 'tick', now: T0 + 30 * S + 10 * S });
    expect(kinds(s)).toContain('restWarn');
    const warnId = s.cues.find((c) => c.kind === 'restWarn')?.id;
    s = reduce(s, { type: 'tick', now: T0 + 30 * S + 10.5 * S });
    expect(s.cues.filter((c) => c.kind === 'restWarn').map((c) => c.id)).toEqual([warnId]);
    s = reduce(s, { type: 'tick', now: T0 + 45 * S });
    expect(s.phase).toBe('exercise');
    expect(s.exIndex).toBe(1);
    expect(s.restMs).toBe(15 * S);
  });

  it('a short timer (3 s) does not fire thresholds it cannot honour', () => {
    let s = run(make(0, [{ name: 'Hold', seconds: 3, sets: 1, restSeconds: 0, cues: [] }]), { type: 'start', now: T0 });
    expect(s.cues.filter((c) => c.kind === 'timeLeft')).toHaveLength(0);
    s = reduce(s, { type: 'tick', now: T0 + 3 * S });
    expect(s.phase).toBe('completed');
  });
});

describe('rep-based and sets', () => {
  it('a rep set has no timer and waits for Done; rests between sets; says set and next set', () => {
    let s = run(make(0), { type: 'start', now: T0 });
    expect(s.phaseDurationMs).toBeNull();
    expect(remainingMs(s, T0 + 999 * S)).toBeNull();
    s = reduce(s, { type: 'tick', now: T0 + 3600 * S });
    expect(s.phase).toBe('exercise'); // never auto-completes
    expect(elapsedMs(s, T0 + 10 * S)).toBe(10 * S);
    s = reduce(s, { type: 'doneSet', now: T0 + 10 * S });
    expect(s.phase).toBe('rest');
    expect(s.restKind).toBe('set');
    expect([s.exIndex, s.setIndex]).toEqual([0, 1]);
    expect(kinds(s)).toEqual(['setComplete', 'restStart', 'nextUp']);
    expect(s.cues.filter((c) => c.kind === 'nextUp')[0]).toMatchObject({ sameExercise: true, set: 2, sets: 2 });
    s = reduce(s, { type: 'tick', now: T0 + 30 * S });
    expect(s.phase).toBe('exercise');
    expect(s.setIndex).toBe(1);
    expect(s.cues.filter((c) => c.kind === 'begin').at(-1)).toMatchObject({ set: 2, sets: 2, reps: 10 });
  });

  it('last set of an exercise rests then introduces the next exercise', () => {
    let s = run(make(0), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + 1000 }, { type: 'skipRest', now: T0 + 2000 });
    s = reduce(s, { type: 'doneSet', now: T0 + 3000 });
    expect(s.restKind).toBe('exercise');
    expect([s.exIndex, s.setIndex]).toEqual([1, 0]);
    expect(kinds(s)).toEqual(['exerciseComplete', 'restStart', 'nextUp']);
    expect(s.cues.find((c) => c.kind === 'nextUp')).toMatchObject({ name: 'Plank', sameExercise: false });
  });

  it('zero rest goes straight on', () => {
    let s = run(make(0, [{ name: 'A', reps: 5, sets: 2, restSeconds: 0, cues: [] }]), { type: 'start', now: T0 });
    // restSeconds 0 falls back to the default (30); build explicitly with default 0
    const plan = buildPlan([{ name: 'A', reps: 5, sets: 2, cues: [] }], 0);
    s = run(initialState(plan, 0), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + 1000 });
    expect(s.phase).toBe('exercise');
    expect(s.setIndex).toBe(1);
  });

  it('finishing the last set completes the session with the complete cue', () => {
    const s = run(make(0, [{ name: 'A', reps: 5, sets: 1, cues: [] }]), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + 5 * S });
    expect(s.phase).toBe('completed');
    expect(s.outcome).toBe('finished');
    expect(kinds(s)).toContain('complete');
    expect(exerciseStatus(s, 0)).toBe('done');
  });

  it('doneSet ends a timed set early', () => {
    const s = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + 12 * S });
    expect(s.phase).toBe('rest');
    expect(s.exerciseMs).toBe(12 * S);
  });
});

describe('pause and resume', () => {
  it('pause freezes remaining time; resume continues from the same remaining', () => {
    let s = run(make(0, [exercises[1]]), { type: 'start', now: T0 });
    s = reduce(s, { type: 'pause', now: T0 + 10 * S });
    expect(isPaused(s)).toBe(true);
    expect(remainingMs(s, T0 + 500 * S)).toBe(20 * S);
    expect(reduce(s, { type: 'tick', now: T0 + 500 * S })).toBe(s);
    s = reduce(s, { type: 'resume', now: T0 + 100 * S });
    expect(remainingMs(s, T0 + 100 * S)).toBe(20 * S);
    expect(s.pausedMs).toBe(90 * S);
    s = reduce(s, { type: 'tick', now: T0 + 120 * S });
    expect(s.phase).toBe('completed');
    expect(s.exerciseMs).toBe(30 * S);
    expect(summarize(s, T0 + 120 * S).activeMs).toBe(30 * S);
  });

  it('pause silences speech (epoch bumps, queued cues dropped)', () => {
    const a = run(make(), { type: 'start', now: T0 });
    expect(a.cues.length).toBeGreaterThan(0);
    const b = reduce(a, { type: 'pause', now: T0 + 1 });
    expect(b.speechEpoch).toBe(a.speechEpoch + 1);
    expect(b.cues).toEqual([]);
  });

  it('pause and resume in rest and in the countdown', () => {
    let s = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 30 * S });
    expect(s.phase).toBe('rest');
    s = run(s, { type: 'pause', now: T0 + 35 * S }, { type: 'resume', now: T0 + 60 * S });
    expect(remainingMs(s, T0 + 60 * S)).toBe(10 * S);
    let c = run(make(5), { type: 'start', now: T0 }, { type: 'pause', now: T0 + 2 * S }, { type: 'resume', now: T0 + 9 * S });
    expect(remainingMs(c, T0 + 9 * S)).toBe(3 * S);
    c = reduce(c, { type: 'tick', now: T0 + 12 * S });
    expect(c.phase).toBe('exercise');
  });

  it('double pause / resume of a running session are no-ops', () => {
    const s = run(make(0, [exercises[1]]), { type: 'start', now: T0 });
    expect(reduce(s, { type: 'resume', now: T0 + 1 })).toBe(s);
    const p = reduce(s, { type: 'pause', now: T0 + 1 });
    expect(reduce(p, { type: 'pause', now: T0 + 2 })).toBe(p);
  });

  it('pause exactly at a boundary settles first', () => {
    const s = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 });
    const p = reduce(s, { type: 'pause', now: T0 + 31 * S });
    expect(p.phase).toBe('rest');
    expect(p.pausedAt).toBe(T0 + 31 * S);
  });
});

describe('skip, repeat, end', () => {
  it('skip exercise marks it skipped and starts the next with a get-ready', () => {
    const s = run(make(5), { type: 'start', now: T0 }, { type: 'skipExercise', now: T0 + S });
    expect(s.stats[0].skipped).toBe(true);
    expect(s.exIndex).toBe(1);
    expect(s.phase).toBe('countdown');
    expect(kinds(s)[0]).toBe('getReady');
    expect(exerciseStatus(s, 0)).toBe('skipped');
  });

  it('skipping the last exercise is never "finished": ended early, no complete cue; partial sets show partial', () => {
    let s = run(make(0), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + S }, { type: 'skipRest', now: T0 + 2 * S });
    s = reduce(s, { type: 'skipExercise', now: T0 + 3 * S });
    expect(exerciseStatus(s, 0)).toBe('partial');
    s = run(s, { type: 'skipExercise', now: T0 + 4 * S }, { type: 'skipExercise', now: T0 + 5 * S });
    expect(s.phase).toBe('completed');
    expect(s.outcome).toBe('ended_early');
    expect(kinds(s)).not.toContain('complete');
    const sum = summarize(s, T0 + 6 * S);
    expect(sum.exercisesSkipped).toBe(2);
    expect(sum.exercisesPartial).toBe(1);
    expect(sum.setsDone).toBe(1);
  });

  it('skip rest starts the next set without waiting and stops speech', () => {
    let s = run(make(0), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + S });
    const e = s.speechEpoch;
    s = reduce(s, { type: 'skipRest', now: T0 + 2 * S });
    expect(s.phase).toBe('exercise');
    expect(s.setIndex).toBe(1);
    expect(s.speechEpoch).toBe(e + 1);
    expect(s.restMs).toBe(S);
    expect(reduce(s, { type: 'skipRest', now: T0 + 3 * S })).toBe(s);
  });

  it('repeat restarts a timed set; repeat in rest goes back to the set just done', () => {
    let s = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 12 * S });
    s = reduce(s, { type: 'repeat', now: T0 + 12 * S });
    expect(remainingMs(s, T0 + 12 * S)).toBe(30 * S);
    s = reduce(s, { type: 'tick', now: T0 + 42 * S });
    expect(s.phase).toBe('rest');
    expect(s.stats[0].setsDone).toBe(1);
    s = reduce(s, { type: 'repeat', now: T0 + 43 * S });
    expect(s.phase).toBe('exercise');
    expect(s.exIndex).toBe(0);
    expect(s.stats[0].setsDone).toBe(0);
    expect(exerciseStatus(s, 0)).toBe('pending');
  });

  it('end early records the outcome and silences speech, never "finished"', () => {
    let s = run(make(0), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + S });
    s = reduce(s, { type: 'end', now: T0 + 5 * S });
    expect(s.phase).toBe('completed');
    expect(s.outcome).toBe('ended_early');
    expect(s.cues).toEqual([]);
    expect(summarize(s, T0 + 9 * S).totalMs).toBe(5 * S);
    expect(reduce(s, { type: 'end', now: T0 + 6 * S })).toBe(s);
    expect(reduce(make(), { type: 'end', now: T0 })).toEqual(make());
  });

  it('end while paused counts the pause', () => {
    let s = run(make(0, [exercises[1]]), { type: 'start', now: T0 }, { type: 'pause', now: T0 + 5 * S });
    s = reduce(s, { type: 'end', now: T0 + 25 * S });
    expect(s.pausedMs).toBe(20 * S);
    expect(summarize(s, T0 + 25 * S).activeMs).toBe(5 * S);
  });

  it('events after completion are ignored', () => {
    const s = run(make(0, [{ name: 'A', reps: 5, sets: 1, cues: [] }]), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + 1000 });
    for (const type of ['tick', 'pause', 'resume', 'doneSet', 'skipExercise', 'skipRest', 'repeat', 'start'] as const) {
      expect(reduce(s, { type, now: T0 + 5 })).toBe(s);
    }
  });
});

describe('cue integrity under rapid transitions', () => {
  it('cue ids are strictly increasing and unique across a hammered session', () => {
    let s = run(make(3), { type: 'start', now: T0 });
    const seen: number[] = [];
    let t = T0;
    const events: Event['type'][] = ['tick', 'doneSet', 'skipRest', 'repeat', 'pause', 'resume', 'skipExercise', 'tick', 'tick'];
    for (let i = 0; i < 200 && s.phase !== 'completed'; i++) {
      t += 137;
      const type = events[i % events.length];
      const before = s.cueSeq;
      s = reduce(s, { type, now: t });
      s.cues.filter((c) => c.id > before).forEach((c) => seen.push(c.id));
    }
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('1-second timers and zero-length rests do not skip or double a set', () => {
    const plan = buildPlan([{ name: 'Blink', seconds: 1, sets: 3, cues: [] }], 0);
    let s = run(initialState(plan, 0), { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + 10 * S });
    expect(s.phase).toBe('completed');
    expect(s.stats[0].setsDone).toBe(3);
    expect(s.exerciseMs).toBe(3 * S);
  });

  it('never loses the plan position when interleaving pause with expiry', () => {
    let s = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 });
    s = run(s, { type: 'pause', now: T0 + 29.9 * S }, { type: 'resume', now: T0 + 40 * S }, { type: 'tick', now: T0 + 40.2 * S });
    expect(s.phase).toBe('rest');
    expect(s.exIndex).toBe(1);
    expect(s.stats[0].setsDone).toBe(1);
  });
});

describe('summary', () => {
  it('totals the full example workout', () => {
    let s = run(make(0), { type: 'start', now: T0 });
    let t = T0;
    const step = (type: Event['type'], dt: number) => {
      t += dt;
      s = reduce(s, { type, now: t } as Event);
    };
    step('doneSet', 20 * S); // squat set 1
    step('tick', 20 * S); // rest 20
    step('doneSet', 20 * S); // squat set 2
    step('tick', 20 * S); // rest 20 -> plank
    step('tick', 30 * S); // plank 30 -> rest 15
    step('tick', 15 * S); // -> push-up
    step('doneSet', 20 * S);
    expect(s.phase).toBe('completed');
    const sum = summarize(s, t);
    expect(sum).toMatchObject({
      outcome: 'finished',
      exercisesDone: 3,
      exercisesTotal: 3,
      setsDone: 4,
      setsPlanned: 4,
      exerciseMs: 90 * S,
      restMs: 55 * S,
    });
    expect(sum.totalMs).toBe(145 * S);
  });
});

describe('tones', () => {
  const plank = [{ name: 'Plank', seconds: 12, sets: 2, restSeconds: 6, cues: [] }, exercises[2]];

  it('start of a set, last three seconds, end of a set, rest ticks, rest over: each once, in order', () => {
    let s = run(make(0, plank), { type: 'start', now: T0 });
    const heard: (string | undefined)[] = [];
    let last = 0;
    for (let t = 0; t <= 12 * S + 6 * S + 300; t += 100) {
      s = reduce(s, { type: 'tick', now: T0 + t });
      heard.push(...tones(s, last));
      last = s.cueSeq;
    }
    expect(heard).toEqual(['start', 'tick', 'tick', 'tick', 'end', 'tick', 'tick', 'tick', 'restEnd']);
  });

  it('a manual finish plays the end tone; skipping rest plays the start tone', () => {
    let s = run(make(0), { type: 'start', now: T0 });
    let seen = s.cueSeq;
    s = reduce(s, { type: 'doneSet', now: T0 + S });
    expect(tones(s, seen)).toEqual(['end']);
    seen = s.cueSeq;
    s = reduce(s, { type: 'skipRest', now: T0 + 2 * S });
    expect(tones(s, seen)).toEqual(['start']);
  });

  it('no ticks for phases under 4 s; none while paused; a tick is never repeated', () => {
    let s = run(make(0, [{ name: 'Hold', seconds: 3, sets: 1, cues: [] }]), { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + 2.5 * S });
    expect(tones(s)).toEqual(['start']);
    let p = run(make(0, plank), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 9.2 * S });
    const n = tones(p).filter((t) => t === 'tick').length;
    expect(n).toBe(1);
    p = reduce(p, { type: 'tick', now: T0 + 9.4 * S });
    expect(tones(p).filter((t) => t === 'tick').length).toBe(1);
    const paused = reduce(p, { type: 'pause', now: T0 + 9.5 * S });
    expect(tones(paused)).toEqual([]);
  });

  it('after a long gap only the landed phase can make a sound', () => {
    let s = run(make(0, plank), { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + 15 * S });
    expect(s.cues.every((c) => c.phaseId === s.phaseId)).toBe(true);
  });
});

describe('guards', () => {
  const reps = [{ name: 'A', reps: 5, sets: 3, restSeconds: 0, cues: [] }];

  it('a double tap on Set done cannot skip the next set (zero rest)', () => {
    let s = run(make(0, reps), { type: 'start', now: T0 });
    s = reduce(s, { type: 'doneSet', now: T0 + 5 * S });
    expect(s.setIndex).toBe(1);
    const again = reduce(s, { type: 'doneSet', now: T0 + 5 * S + 150 });
    expect(again).toBe(s);
    expect(reduce(s, { type: 'doneSet', now: T0 + 5 * S + 800 }).setIndex).toBe(2);
  });

  it('an explicit zero rest is honoured; a missing one takes the default', () => {
    const plan = buildPlan([{ name: 'A', reps: 5, restSeconds: 0, cues: [] }, { name: 'B', reps: 5, cues: [] }], 30);
    expect(plan[0].restSeconds).toBe(0);
    expect(plan[1].restSeconds).toBe(30);
  });

  it('a changed dose changes the plan key', () => {
    const a = buildPlan([{ name: 'A', reps: 8, sets: 2, cues: [] }]);
    const b = buildPlan([{ name: 'A', reps: 12, sets: 2, cues: [] }]);
    const c = buildPlan([{ name: 'A', reps: 8, sets: 2, restSeconds: 45, cues: [] }]);
    expect(new Set([a[0].key, b[0].key, c[0].key]).size).toBe(3);
  });

  it('skip, repeat, skip rest and done do nothing while paused (resume first); end still works', () => {
    const running = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 }, { type: 'pause', now: T0 + 2 * S });
    for (const type of ['doneSet', 'skipExercise', 'skipRest', 'repeat'] as const) {
      expect(reduce(running, { type, now: T0 + 5 * S })).toBe(running);
    }
    expect(reduce(running, { type: 'end', now: T0 + 5 * S }).outcome).toBe('ended_early');
    let rest = run(make(0, [exercises[1], exercises[2]]), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 30 * S }, { type: 'pause', now: T0 + 31 * S });
    expect(reduce(rest, { type: 'skipRest', now: T0 + 32 * S })).toBe(rest);
    rest = reduce(rest, { type: 'resume', now: T0 + 40 * S });
    expect(reduce(rest, { type: 'skipRest', now: T0 + 41 * S }).phase).toBe('exercise');
  });
});

describe('start at an exercise and honest finishing', () => {
  it('start with `at` begins there; earlier exercises stay not started; out-of-range is clamped', () => {
    const s = run(make(0), { type: 'start', now: T0, at: 2 });
    expect([s.exIndex, s.setIndex]).toEqual([2, 0]);
    expect(exerciseStatus(s, 0)).toBe('pending');
    expect(run(make(0), { type: 'start', now: T0, at: 99 }).exIndex).toBe(2);
    expect(run(make(0), { type: 'start', now: T0, at: -3 }).exIndex).toBe(0);
  });

  it('finishing the plan with earlier exercises left out says "finished", not "complete"', () => {
    let s = run(make(0, [{ name: 'A', reps: 5, sets: 1, cues: [] }, { name: 'B', reps: 5, sets: 1, cues: [] }]), { type: 'start', now: T0, at: 1 });
    s = reduce(s, { type: 'doneSet', now: T0 + 2 * S });
    expect(s.outcome).toBe('finished');
    expect(s.cues.find((c) => c.kind === 'complete')?.allDone).toBe(false);
  });

  it('doing everything says complete', () => {
    const s = run(make(0, [{ name: 'A', reps: 5, sets: 1, cues: [] }]), { type: 'start', now: T0 }, { type: 'doneSet', now: T0 + 2 * S });
    expect(s.cues.find((c) => c.kind === 'complete')?.allDone).toBe(true);
  });
});

describe('coach cues', () => {
  const timedSet = (seconds: number, ex: Partial<StarterExercise> = {}) =>
    make(0, [{ name: 'Plank', seconds, sets: 2, restSeconds: 10, cues: [], ...ex }]);

  /** Tick every 100 ms through `seconds` of a running set; return what fired and when (ms since start). */
  const walk = (s0: SessionState, seconds: number, from = 0) => {
    let s = s0;
    const fired: { kind: string; at: number }[] = [];
    let last = s.cueSeq;
    for (let t = from; t <= seconds * S; t += 100) {
      s = reduce(s, { type: 'tick', now: T0 + t });
      s.cues.filter((c) => c.id > last && c.kind !== 'tone').forEach((c) => fired.push({ kind: c.kind, at: t }));
      last = s.cueSeq;
    }
    return { s, fired };
  };

  describe('sessionStart', () => {
    it('fires once, at the start, before get ready, and never again in the session', () => {
      const s0 = run(make(5), { type: 'start', now: T0 });
      expect(kinds(s0)).toEqual(['sessionStart', 'getReady']);
      expect(s0.cues[0]).toMatchObject({ kind: 'sessionStart', group: 'coach' });
      const { s, fired } = walk(s0, 60);
      expect([...kinds(s0), ...fired.map((f) => f.kind)].filter((k) => k === 'sessionStart')).toHaveLength(1);
      expect(s.cueSeq).toBeGreaterThan(s0.cueSeq);
    });

    it('is not emitted by skip, repeat or rest transitions', () => {
      let s = run(make(0), { type: 'start', now: T0 }, { type: 'skipExercise', now: T0 + S });
      s = run(s, { type: 'repeat', now: T0 + 2 * S });
      expect(s.cues.filter((c) => c.kind === 'sessionStart')).toHaveLength(0);
    });

    it('a comeback start replaces the welcome and carries the chosen line', () => {
      const s = run(make(5), { type: 'start', now: T0, comeback: true, comebackText: 'Welcome back. No stress.' });
      expect(kinds(s)).toEqual(['comeback', 'getReady']);
      expect(s.cues[0]).toMatchObject({ group: 'coach', text: 'Welcome back. No stress.' });
    });
  });

  describe('encourage', () => {
    it('never fires in a rep-based set', () => {
      const s0 = run(make(0, [{ name: 'Push-up', reps: 10, sets: 1, cues: [] }]), { type: 'start', now: T0 });
      const { fired } = walk(s0, 120);
      expect(fired.filter((f) => f.kind === 'encourage')).toHaveLength(0);
    });

    it('waits for the first 8 s, then at most every 20 s', () => {
      const { fired } = walk(run(timedSet(120), { type: 'start', now: T0 }), 120);
      const at = fired.filter((f) => f.kind === 'encourage').map((f) => f.at);
      expect(at.length).toBeGreaterThan(2);
      expect(at[0]).toBeGreaterThanOrEqual(8000);
      at.forEach((t, i) => i > 0 && expect(t - at[i - 1]).toBeGreaterThanOrEqual(20_000));
    });

    it('never comes within 6 s of any other spoken cue, nor in the final 10 s (and the 6 s before it)', () => {
      for (const dur of [20, 30, 40, 45, 60, 90, 120, 180]) {
        const { fired } = walk(run(timedSet(dur), { type: 'start', now: T0 }), dur);
        const enc = fired.filter((f) => f.kind === 'encourage');
        for (const e of enc) {
          expect(dur * S - e.at).toBeGreaterThanOrEqual(16_000);
          for (const o of fired.filter((f) => f.kind !== 'encourage' && f.kind !== 'begin' && f.kind !== 'sessionStart')) {
            expect(Math.abs(o.at - e.at)).toBeGreaterThanOrEqual(6000);
          }
          expect(e.at).toBeGreaterThanOrEqual(8000);
        }
      }
    });

    it('a 20 s set has no encouragement (too short to fit one safely)', () => {
      const { fired } = walk(run(timedSet(20), { type: 'start', now: T0 }), 20);
      expect(fired.filter((f) => f.kind === 'encourage')).toHaveLength(0);
    });

    it('is deterministic: the same timeline gives the same cues', () => {
      const a = walk(run(timedSet(90), { type: 'start', now: T0 }), 90).fired;
      const b = walk(run(timedSet(90), { type: 'start', now: T0 }), 90).fired;
      expect(a).toEqual(b);
    });

    it('does not fire while paused and does not count paused time', () => {
      let s = run(timedSet(120), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 7 * S }, { type: 'pause', now: T0 + 7 * S });
      const before = s.cueSeq;
      s = reduce(s, { type: 'tick', now: T0 + 60 * S });
      expect(s.cueSeq).toBe(before);
      s = reduce(s, { type: 'resume', now: T0 + 60 * S });
      expect(kinds(s)).not.toContain('encourage');
      s = reduce(s, { type: 'tick', now: T0 + 60 * S + 1.5 * S });
      expect(kinds(s)).toContain('encourage'); // 7 s + 1.5 s of active time
    });

    it('one encouragement per tick at most, even after a long gap, and the mark resets each set', () => {
      let s = run(timedSet(120), { type: 'start', now: T0 });
      s = reduce(s, { type: 'tick', now: T0 + 100 * S }); // locked screen: one jump
      expect(s.cues.filter((c) => c.kind === 'encourage').length).toBeLessThanOrEqual(1);
      s = reduce(s, { type: 'tick', now: T0 + 120 * S }); // set 1 ends, rest begins
      s = reduce(s, { type: 'tick', now: T0 + 130 * S }); // rest ends, set 2 begins
      expect(s.phase).toBe('exercise');
      expect(s.encMark).toBeNull();
    });

    it('a saved state from before this change (no encMark) keeps working', () => {
      const old = { ...run(timedSet(120), { type: 'start', now: T0 }) } as Partial<SessionState>;
      delete old.encMark;
      const s = reduce(old as SessionState, { type: 'tick', now: T0 + 9 * S });
      expect(kinds(s)).toContain('encourage');
    });
  });

  describe('easeOff', () => {
    it('pauses the session and emits one safety-eligible coach cue, silencing what was queued', () => {
      let s = run(timedSet(60), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 3 * S });
      const epoch = s.speechEpoch;
      s = reduce(s, { type: 'easeOff', now: T0 + 4 * S });
      expect(s.pausedAt).toBe(T0 + 4 * S);
      expect(s.speechEpoch).toBe(epoch + 1);
      expect(s.cues).toHaveLength(1);
      expect(s.cues[0]).toMatchObject({ kind: 'easeOff', group: 'coach', safety: true });
      // Resuming continues the clock as for any pause.
      s = reduce(s, { type: 'resume', now: T0 + 14 * S });
      expect(remainingMs(s, T0 + 14 * S)).toBe(56 * S);
    });

    it('works from a rest and from the get-ready countdown, and while already paused', () => {
      expect(reduce(run(make(5), { type: 'start', now: T0 }), { type: 'easeOff', now: T0 + S }).cues.at(-1)?.kind).toBe('easeOff');
      let s = run(timedSet(10), { type: 'start', now: T0 }, { type: 'tick', now: T0 + 10 * S });
      expect(s.phase).toBe('rest');
      s = reduce(s, { type: 'easeOff', now: T0 + 11 * S });
      expect(s.cues.at(-1)?.kind).toBe('easeOff');
      const p = run(timedSet(60), { type: 'start', now: T0 }, { type: 'pause', now: T0 + 2 * S }, { type: 'easeOff', now: T0 + 3 * S });
      expect(p.cues.at(-1)?.kind).toBe('easeOff');
      expect(p.pausedAt).toBe(T0 + 2 * S);
    });

    it('is ignored before the start and after the end', () => {
      const ready = make(5);
      expect(reduce(ready, { type: 'easeOff', now: T0 })).toBe(ready);
      const done = run(timedSet(60), { type: 'start', now: T0 }, { type: 'end', now: T0 + S });
      expect(reduce(done, { type: 'easeOff', now: T0 + 2 * S })).toBe(done);
    });

    it('walks a boundary crossed while away before pausing (a finished set is not lost)', () => {
      const s = run(timedSet(20), { type: 'start', now: T0 }, { type: 'easeOff', now: T0 + 25 * S });
      expect(s.stats[0].setsDone).toBe(1);
      expect(s.cues.at(-1)?.kind).toBe('easeOff');
    });
  });
});
