/**
 * Ported from binectics-mobile src/guided/__tests__/useGuidedSession.test.tsx (mobile #299).
 * AppState background/active is document visibility hidden/visible; storage is localStorage.
 */
import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { buildPlan, initialState, reduce, remainingMs } from '../engine';
import * as persistence from '../persistence';

// ESM exports cannot be spied on directly: wrap saveActive in a spy that calls the real one.
vi.mock('../persistence', async (importOriginal) => {
  const real = await importOriginal<typeof import('../persistence')>();
  return { ...real, saveActive: vi.fn(real.saveActive) };
});
import { AWAY_PAUSE_MS, HEARTBEAT_MS, useGuidedSession } from '../useGuidedSession';

const plan = buildPlan([{ name: 'Plank', seconds: 600, sets: 1, restSeconds: 10, cues: [] }, { name: 'B', reps: 5, cues: [] }]);
const make = () => initialState(plan, 0);

// The web's AppState: document visibility.
let visibility: DocumentVisibilityState = 'visible';
const appStateHandler = (s: 'background' | 'active') => {
  visibility = s === 'background' ? 'hidden' : 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
};
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  vi.mocked(persistence.saveActive).mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

const setup = () => renderHook(() => useGuidedSession(make, { userId: 'u1', occurrenceId: 'o1' }));

describe('useGuidedSession', () => {
  it('polls the clock while running: remaining time follows timestamps', () => {
    const { result } = setup();
    act(() => result.current.send('start'));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(remainingMs(result.current.state, Date.now())).toBe(590_000);
  });

  it('opening the intro writes nothing and never clears another session\'s saved run', async () => {
    const other = reduce(make(), { type: 'start', now: 1_000_000 });
    await persistence.saveActive('u1', 'other-session', other, 1_000_500);
    const spy = vi.mocked(persistence.saveActive);
    setup();
    await act(async () => {});
    expect(await persistence.loadActive('u1', 'other-session')).not.toBeNull();
    expect(spy).toHaveBeenCalled(); // called with the ready state, which persists nothing
  });

  it('saves on phase and pause changes and every heartbeat, not on every tick', async () => {
    const spy = vi.mocked(persistence.saveActive);
    const { result } = setup();
    act(() => result.current.send('start'));
    const afterStart = spy.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(HEARTBEAT_MS - 100);
    });
    expect(spy.mock.calls.length).toBe(afterStart); // ticks alone do not write
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(spy.mock.calls.length).toBe(afterStart + 1); // the heartbeat
    act(() => result.current.send('pause'));
    expect(spy.mock.calls.length).toBe(afterStart + 2); // pause is a change
    await act(async () => {});
    const saved = await persistence.loadActive('u1', 'o1');
    expect(saved?.state.pausedAt).not.toBeNull();
  });

  it('back from the background after a short time catches up and keeps running', () => {
    const { result } = setup();
    act(() => result.current.send('start'));
    act(() => appStateHandler('background'));
    vi.setSystemTime(Date.now() + 30_000);
    act(() => appStateHandler('active'));
    expect(result.current.state.pausedAt).toBeNull();
    expect(remainingMs(result.current.state, Date.now())).toBe(570_000);
  });

  it('away longer than the limit returns PAUSED at the moment the member left', () => {
    const { result } = setup();
    act(() => result.current.send('start'));
    const left = Date.now();
    act(() => appStateHandler('background'));
    vi.setSystemTime(left + AWAY_PAUSE_MS + 5_000);
    act(() => appStateHandler('active'));
    expect(result.current.state.pausedAt).toBe(left);
    expect(remainingMs(result.current.state, Date.now())).toBe(600_000);
    act(() => result.current.send('resume'));
    expect(remainingMs(result.current.state, Date.now())).toBe(600_000);
  });
});
