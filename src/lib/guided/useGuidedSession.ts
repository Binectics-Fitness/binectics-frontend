/**
 * Ported from binectics-mobile src/guided/useGuidedSession.ts (feat/simplify-guided-start, mobile #299).
 * Same clock (Date.now) and save rules; AppState is replaced by document visibilitychange.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { isRunning, reduce, type Event, type SessionState } from './engine';
import { saveActive } from './persistence';

export const TICK_MS = 200;
/** A poll, not a decrement: remaining time always comes from timestamps. */
export const HEARTBEAT_MS = 5000;
/** Away from the app longer than this: come back paused where the member left. */
export const AWAY_PAUSE_MS = 120_000;

/*
 * Clock: Date.now (wall time) on purpose. A monotonic clock (performance.now)
 * may stop advancing while the device sleeps on some platforms, which would
 * freeze the timer during a screen lock. Gaps are clamped at zero in the
 * engine, so a manual clock change cannot crash it, only shift the timer.
 */
type Action = Event | { type: 'replace'; state: SessionState };
const reducer = (s: SessionState, a: Action): SessionState => (a.type === 'replace' ? a.state : reduce(s, a));

type Send = (
  type: Exclude<Event['type'], 'tick'>,
  extra?: { at?: number; comeback?: boolean; comebackText?: string; openingText?: string; openingMs?: number },
) => void;

/**
 * Runs the engine in React. One interval polls `tick` while a timed phase is
 * running (idempotent: the reducer works from timestamps and returns the same
 * state when nothing changed). Returning from the background ticks at once so
 * boundaries crossed while locked are walked through; a long absence instead
 * returns paused at the moment the member left.
 */
export function useGuidedSession(
  initial: () => SessionState,
  save: { userId: string | null; occurrenceId: string } | null,
) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const running = isRunning(state);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    // The web's AppState: a hidden tab is "background", a visible one "active".
    let leftAt: number | null = null;
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        leftAt = Date.now();
      } else {
        const now = Date.now();
        if (leftAt !== null && now - leftAt > AWAY_PAUSE_MS && isRunning(stateRef.current)) {
          dispatch({ type: 'pause', now: leftAt });
        } else {
          dispatch({ type: 'tick', now });
        }
        leftAt = null;
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  // Save when the phase changes or the member pauses/resumes (not on every
  // in-phase tick cue), plus a heartbeat while running so a kill restores to
  // within a few seconds of where the member was.
  const saveKey = save ? `${save.userId}|${save.occurrenceId}` : null;
  useEffect(() => {
    if (!save?.userId) return;
    void saveActive(save.userId, save.occurrenceId, stateRef.current, Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the phase/pause markers are the change signal
  }, [state.phase, state.phaseId, state.pausedAt, saveKey]);
  useEffect(() => {
    if (!running || !save?.userId) return;
    const id = setInterval(() => {
      void saveActive(save.userId as string, save.occurrenceId, stateRef.current, Date.now());
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, saveKey]);

  const send: Send = useCallback((type, extra) => dispatch({ type, now: Date.now(), ...extra } as Event), []);
  const replace = useCallback((next: SessionState) => dispatch({ type: 'replace', state: next }), []);
  return { state, send, replace };
}
