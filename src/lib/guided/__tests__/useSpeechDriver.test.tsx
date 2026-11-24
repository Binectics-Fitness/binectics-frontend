/**
 * Ported from binectics-mobile src/guided/__tests__/useSpeechDriver.test.tsx (mobile #299): jest -> vitest, RN testing library -> React.
 */
import { vi } from "vitest";
import { renderHook } from '@testing-library/react';
import { buildPlan, initialState, reduce, type SessionState } from '../engine';
import { DEFAULT_GUIDED_PREFS } from '../prefs';
import { speech } from '../speech';
import { sounds, TONE_MS } from '../sounds';
import { useSpeechDriver } from '../useSpeechDriver';
import type { CoachContext } from '../cueText';

vi.mock('../speech', () => ({ speech: { speak: vi.fn(), stop: vi.fn() } }));
vi.mock('../sounds', () => ({ sounds: { play: vi.fn() }, TONE_MS: { tick: 90, start: 220, end: 220, restEnd: 450 } }));

const T0 = 1_000_000;
const plan = buildPlan([{ name: 'Plank', seconds: 20, sets: 1, restSeconds: 10, cues: [] }, { name: 'Squat', reps: 5, cues: [] }]);
const prefs = { ...DEFAULT_GUIDED_PREFS };

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

const play = (initial: SessionState, ...next: SessionState[]) => {
  const hook = renderHook(({ s }: { s: SessionState }) => useSpeechDriver(s, prefs), { initialProps: { s: initial } });
  next.forEach((s) => hook.rerender({ s }));
  return hook;
};

describe('useSpeechDriver', () => {
  it('plays the tone first and the speech after it, not on top of it', () => {
    const s0 = initialState(plan, 0);
    const s1 = reduce(s0, { type: 'start', now: T0 }); // start tone + "Go."
    play(s0, s1);
    expect(sounds.play).toHaveBeenCalledWith('start', prefs.volume);
    expect(speech.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(TONE_MS.start + 59);
    expect(speech.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });

  it('a re-render with the same state never repeats anything', () => {
    const s0 = initialState(plan, 0);
    const s1 = reduce(s0, { type: 'start', now: T0 });
    const hook = play(s0, s1);
    vi.advanceTimersByTime(1000);
    hook.rerender({ s: s1 });
    hook.rerender({ s: s1 });
    vi.advanceTimersByTime(1000);
    expect(sounds.play).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });

  it('pausing during the tone-then-speech gap cancels the pending line', () => {
    const s0 = initialState(plan, 0);
    const s1 = reduce(s0, { type: 'start', now: T0 });
    const s2 = reduce(s1, { type: 'pause', now: T0 + 50 });
    play(s0, s1, s2);
    vi.advanceTimersByTime(2000);
    expect(speech.speak).not.toHaveBeenCalled();
    expect(speech.stop).toHaveBeenCalled();
  });

  it('voice off still plays tones; sounds off still speaks', () => {
    const s0 = initialState(plan, 0);
    const s1 = reduce(s0, { type: 'start', now: T0 });
    const a = renderHook(({ s }: { s: SessionState }) => useSpeechDriver(s, { ...prefs, voiceOn: false }), { initialProps: { s: s0 } });
    a.rerender({ s: s1 });
    vi.advanceTimersByTime(1000);
    expect(sounds.play).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
    vi.clearAllMocks();
    const b = renderHook(({ s }: { s: SessionState }) => useSpeechDriver(s, { ...prefs, soundsOn: false }), { initialProps: { s: s0 } });
    b.rerender({ s: s1 });
    vi.advanceTimersByTime(1000);
    expect(sounds.play).not.toHaveBeenCalled();
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });

  it('cues already present when mounted (a restored run) are never played', () => {
    const s1 = reduce(initialState(plan, 0), { type: 'start', now: T0 });
    play(s1);
    vi.advanceTimersByTime(2000);
    expect(sounds.play).not.toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it('handles the coach cues: a session start and mid-set encouragement change nothing audible yet', () => {
    const timed = buildPlan([{ name: 'Plank', seconds: 60, sets: 1, restSeconds: 0, cues: [] }]);
    const s0 = initialState(timed, 0);
    const s1 = reduce(s0, { type: 'start', now: T0 }); // sessionStart + start tone + "Go."
    const s2 = reduce(s1, { type: 'tick', now: T0 + 9000 }); // encourage
    expect(s2.cues.some((c) => c.kind === 'encourage')).toBe(true);
    play(s0, s1, s2);
    vi.advanceTimersByTime(TONE_MS.start + 100);
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledWith('Go.', expect.anything());
  });

  it('an ease-off stops what is playing and speaks nothing until lines are wired in', () => {
    const timed = buildPlan([{ name: 'Plank', seconds: 60, sets: 1, restSeconds: 0, cues: [] }]);
    const s1 = reduce(initialState(timed, 0), { type: 'start', now: T0 });
    const s2 = reduce(s1, { type: 'easeOff', now: T0 + 2000 });
    play(s1, s2);
    expect(speech.stop).toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
  });

  describe('coach lines', () => {
    const timed = buildPlan([{ name: 'Plank', seconds: 60, sets: 1, restSeconds: 0, cues: [] }]);
    const coachCtx = (): CoachContext => ({
      enabled: true,
      line: (moment) => ({ id: 'x', moment, text: moment === 'midSet' ? 'Nice rhythm.' : 'Welcome in.', statesSeconds: false }),
    });
    const run3 = (p: typeof prefs, coach?: CoachContext) => {
      const s0 = initialState(timed, 0);
      const s1 = reduce(s0, { type: 'start', now: T0, openingText: 'Welcome in.' });
      const s2 = reduce(s1, { type: 'tick', now: T0 + 9000 }); // encourage
      const hook = renderHook(({ s }: { s: SessionState }) => useSpeechDriver(s, p, coach), { initialProps: { s: s0 } });
      vi.setSystemTime(T0); // the driver sizes speech from the clock; the engine here runs on T0
      hook.rerender({ s: s1 });
      vi.advanceTimersByTime(TONE_MS.start + 100);
      vi.setSystemTime(T0 + 9000);
      hook.rerender({ s: s2 });
      return s2;
    };

    it('speaks the welcome and the mid-set line when coach lines are on', () => {
      run3({ ...prefs, coachLines: true }, coachCtx());
      expect((speech.speak as vi.Mock).mock.calls.map((c) => c[0])).toEqual(['Welcome in. Go.', 'Nice rhythm.']);
    });

    it('speaks exactly the plain cues when the pref is off, whatever context is supplied', () => {
      run3({ ...prefs, coachLines: false }, coachCtx());
      expect((speech.speak as vi.Mock).mock.calls.map((c) => c[0])).toEqual(['Go.']);
    });

    it('a count-down call is spoken at once, never queued behind a coach line', () => {
      const s0 = initialState(timed, 0);
      const s1 = reduce(s0, { type: 'start', now: T0 });
      const s2 = reduce(s1, { type: 'tick', now: T0 + 9000 }); // encourage
      const s3 = reduce(s2, { type: 'tick', now: T0 + 57_000 }); // "Three"
      const hook = renderHook(({ s }: { s: SessionState }) => useSpeechDriver(s, { ...prefs, coachLines: true }, coachCtx()), { initialProps: { s: s2 } });
      vi.clearAllMocks();
      vi.setSystemTime(T0 + 57_000);
      hook.rerender({ s: s3 });
      expect(s3.cues.some((c) => c.kind === 'count')).toBe(true);
      // The tick tone is skipped while the count is spoken, so nothing waits: speak() replaces the line still playing.
      expect(speech.speak).toHaveBeenCalledTimes(1);
      expect((speech.speak as vi.Mock).mock.calls[0][0]).toMatch(/Three\.$/);
    });

    it('turning the pref off mid-session stops asking for lines', () => {
      const ctx = coachCtx();
      const spy = vi.spyOn(ctx, 'line');
      const s0 = initialState(timed, 0);
      const s1 = reduce(s0, { type: 'start', now: T0 });
      const s2 = reduce(s1, { type: 'tick', now: T0 + 9000 });
      const hook = renderHook(({ s, p }: { s: SessionState; p: typeof prefs }) => useSpeechDriver(s, p, ctx), {
        initialProps: { s: s0, p: { ...prefs, coachLines: true } },
      });
      hook.rerender({ s: s1, p: { ...prefs, coachLines: false } });
      hook.rerender({ s: s2, p: { ...prefs, coachLines: false } });
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe('Need a break is always heard', () => {
  const calm: CoachContext = {
    enabled: true,
    line: (moment) => ({ id: 'x', moment, text: 'Take a rest. No stress.', statesSeconds: false }),
  };
  const withCoach = { ...prefs, coachLines: true };
  const spokenAfterEaseOff = (p: Parameters<typeof buildPlan>[0], prep: number, startMs: number, easeAtMs: number) => {
    const s0 = initialState(buildPlan(p, 30), prep);
    let s = reduce(s0, { type: 'start', now: T0 });
    s = reduce(s, { type: 'tick', now: T0 + startMs });
    const hook = renderHook(({ st }: { st: SessionState }) => useSpeechDriver(st, withCoach, calm), { initialProps: { st: s } });
    vi.clearAllMocks();
    vi.setSystemTime(T0 + easeAtMs);
    hook.rerender({ st: reduce(s, { type: 'easeOff', now: T0 + easeAtMs }) });
    return (speech.speak as vi.Mock).mock.calls.map((c) => c[0]);
  };

  it('during the 5 s get-ready, even in its last second (the clock is stopped, so no call is coming)', () => {
    const ex = [{ name: 'Plank', seconds: 40, sets: 1, restSeconds: 20, cues: [] }];
    expect(spokenAfterEaseOff(ex, 5, 0, 4500)).toEqual(['Take a rest. No stress.']);
    expect(spokenAfterEaseOff(ex, 5, 0, 1000)).toEqual(['Take a rest. No stress.']);
  });

  it('mid-set and during a rest', () => {
    const ex = [{ name: 'Plank', seconds: 40, sets: 2, restSeconds: 20, cues: [] }];
    expect(spokenAfterEaseOff(ex, 0, 5000, 5000)).toEqual(['Take a rest. No stress.']);
    expect(spokenAfterEaseOff(ex, 0, 39_500, 39_500)).toEqual(['Take a rest. No stress.']); // last second of the set
    expect(spokenAfterEaseOff(ex, 0, 41_000, 59_000)).toEqual(['Take a rest. No stress.']); // 1 s before the rest ends
  });
});
