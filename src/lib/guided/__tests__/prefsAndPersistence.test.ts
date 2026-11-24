/**
 * Ported from binectics-mobile src/guided/__tests__/prefsAndPersistence.test.ts (mobile #299).
 * Storage is localStorage (jsdom) instead of AsyncStorage.
 */
import { DEFAULT_GUIDED_PREFS, sanitizePrefs, useGuidedPrefs } from '../prefs';
import { buildPlan, initialState, reduce } from '../engine';
import { clearActive, loadActive, restoreAsPaused, samePlan, saveActive } from '../persistence';

const plan = buildPlan([{ name: 'Plank', seconds: 30, sets: 2, restSeconds: 10, cues: [] }]);

describe('prefs', () => {
  it('falls back and clamps bad saved values', () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_GUIDED_PREFS);
    expect(sanitizePrefs({ rate: 9, volume: -1, prepSeconds: 'x', voiceOn: 'yes' })).toMatchObject({
      rate: 1.5,
      volume: 0,
      prepSeconds: 5,
      voiceOn: true,
    });
  });

  it('coach lines are on and local flavour off by default, and old saved prefs get those defaults', () => {
    expect(DEFAULT_GUIDED_PREFS).toMatchObject({ coachLines: true, localWords: false });
    expect(sanitizePrefs({ voiceOn: false, rate: 1.2 })).toMatchObject({ voiceOn: false, rate: 1.2, coachLines: true, localWords: false });
    expect(sanitizePrefs({ coachLines: 'no', localWords: 1 })).toMatchObject({ coachLines: true, localWords: false });
    expect(sanitizePrefs({ coachLines: false, localWords: true })).toMatchObject({ coachLines: false, localWords: true });
  });

  it('saves per member and reads back', async () => {
    await useGuidedPrefs.getState().hydrate('u1');
    useGuidedPrefs.getState().set({ voiceOn: false, prepSeconds: 10 });
    await new Promise((r) => setTimeout(r, 0));
    useGuidedPrefs.setState({ hydrated: false, userId: null, prefs: DEFAULT_GUIDED_PREFS });
    await useGuidedPrefs.getState().hydrate('u1');
    expect(useGuidedPrefs.getState().prefs).toMatchObject({ voiceOn: false, prepSeconds: 10 });
    useGuidedPrefs.setState({ hydrated: false, userId: null, prefs: DEFAULT_GUIDED_PREFS });
    await useGuidedPrefs.getState().hydrate('u2');
    expect(useGuidedPrefs.getState().prefs.voiceOn).toBe(true);
  });
});

describe('active session persistence', () => {
  it('round-trips a running session and restores it PAUSED at the last time it was seen', async () => {
    let s = reduce(initialState(plan, 0), { type: 'start', now: 1_000 });
    await saveActive('u1', 'o1', s, 11_000);
    const saved = await loadActive('u1', 'o1');
    expect(saved).not.toBeNull();
    const back = restoreAsPaused(saved!);
    expect(back.pausedAt).toBe(11_000);
    expect(back.phase).toBe('exercise');
    // An hour later the member resumes: 10 s were used, 20 s remain.
    s = reduce(back, { type: 'resume', now: 11_000 + 3_600_000 });
    expect(s.phaseStartedAt! + s.phaseDurationMs! - (11_000 + 3_600_000)).toBe(20_000);
  });

  it('is per member and per session; ready/completed states are never saved', async () => {
    const running = reduce(initialState(plan, 0), { type: 'start', now: 0 });
    await saveActive('u1', 'o1', running, 5);
    expect(await loadActive('u2', 'o1')).toBeNull();
    expect(await loadActive('u1', 'other')).toBeNull();
    await saveActive('u1', 'o1', reduce(running, { type: 'end', now: 9 }), 9);
    expect(await loadActive('u1', 'o1')).toBeNull();
    await saveActive('u1', 'o1', running, 5);
    await clearActive('u1');
    expect(await loadActive('u1', 'o1')).toBeNull();
  });

  it('a ready intro never touches storage; a completed run clears only its own entry', async () => {
    const running = reduce(initialState(plan, 0), { type: 'start', now: 0 });
    await saveActive('u1', 'A', running, 5);
    await saveActive('u1', 'B', initialState(plan, 0), 6); // B's intro opens
    expect(await loadActive('u1', 'A')).not.toBeNull();
    const done = reduce(reduce(initialState(plan, 0), { type: 'start', now: 0 }), { type: 'end', now: 9 });
    await saveActive('u1', 'B', done, 9); // B completes: not A's run
    expect(await loadActive('u1', 'A')).not.toBeNull();
    await saveActive('u1', 'A', done, 9);
    expect(await loadActive('u1', 'A')).toBeNull();
  });

  it('clearActive with an occurrence id leaves another session\'s run alone', async () => {
    await saveActive('u1', 'A', reduce(initialState(plan, 0), { type: 'start', now: 0 }), 5);
    await clearActive('u1', 'B');
    expect(await loadActive('u1', 'A')).not.toBeNull();
    await clearActive('u1', 'A');
    expect(await loadActive('u1', 'A')).toBeNull();
  });

  it('a changed dose is not resumable (sets, reps, seconds or rest)', () => {
    const base = [{ name: 'A', reps: 8, sets: 2, restSeconds: 30, cues: [] as string[] }];
    const saved = initialState(buildPlan(base), 0);
    const keys = (e: object) => buildPlan([{ ...base[0], ...e }]).map((p) => p.key);
    expect(samePlan(saved, keys({}))).toBe(true);
    for (const change of [{ reps: 12 }, { sets: 3 }, { restSeconds: 45 }, { seconds: 20, reps: undefined }]) {
      expect(samePlan(saved, keys(change))).toBe(false);
    }
  });

  it('a changed plan is not resumable', () => {
    const s = initialState(plan, 0);
    expect(samePlan(s, plan.map((p) => p.key))).toBe(true);
    expect(samePlan(s, ['x'])).toBe(false);
  });
});
