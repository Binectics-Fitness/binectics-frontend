/**
 * Ported from binectics-mobile src/guided/coach/useCoachVoice.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CoachContext } from '../cueText';
import { loadCoachHistory, saveCoachHistory } from './coachHistory';
import { EMPTY_HISTORY, newPickerState, pickLine, startSession, type OnceHistory, type PickerState } from './selector';

/**
 * Connects the line selector to a guided session. Holds the picker (the
 * no-repeat memory) in a ref, counts the session once for the "once per 5
 * sessions" rule the first time a line is needed, and saves the counter
 * whenever a once-line is spoken. Nothing here touches the clock or the
 * engine: it only answers "which line?" when cueText asks.
 *
 * `seed` identifies the run (task id + start time): a new seed is a new
 * session, with fresh memory and the counter advanced again.
 *
 * A restored (paused) run opens a new picker, so it counts as a second session
 * for the once-per-5 rule. That is deliberate: harmless, and simpler than
 * persisting which run a counter belongs to.
 *
 * `peek` returns the line `line(moment)` would return next, without using it up:
 * nothing is saved, no session is counted and no once-slot is taken. The screen
 * uses it to show the welcome-back line before Start; calling `line` at Start
 * then yields the same line (same seed, same pick count) and does the counting.
 *
 * Until the saved counter has loaded, or if it cannot, `line` returns null and
 * the plain cue is spoken: a missing coach line is never a missing instruction.
 */
export function useCoachVoice(
  userId: string | null,
  seed: string,
  prefs: { coachLines: boolean; localWords: boolean },
): CoachContext & { ready: boolean; peek: CoachContext['line'] } {
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const ready = !userId || loadedFor === userId;
  const prefsRef = useRef(prefs);
  const seedRef = useRef(seed);
  const history = useRef<OnceHistory | null>(userId ? null : EMPTY_HISTORY);
  const picker = useRef<PickerState | null>(null);
  const counted = useRef<OnceHistory | null>(null);

  useEffect(() => {
    prefsRef.current = prefs;
    seedRef.current = seed;
  }, [prefs, seed]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      history.current = EMPTY_HISTORY;
      return;
    }
    history.current = null;
    void loadCoachHistory(userId).then((h) => {
      if (cancelled) return;
      history.current = h;
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return useMemo<CoachContext & { ready: boolean; peek: CoachContext['line'] }>(
    () => ({
      ready,
      peek(moment, opts) {
        if (history.current === null) return null;
        const base =
          picker.current && picker.current.seed === seedRef.current
            ? picker.current
            : newPickerState(seedRef.current, startSession(counted.current ?? history.current));
        return pickLine(moment, base, { localWords: prefsRef.current.localWords, ...opts }).line;
      },
      get enabled() {
        return prefsRef.current.coachLines;
      },
      line(moment, opts) {
        if (history.current === null) return null; // counter not loaded yet
        if (!picker.current || picker.current.seed !== seedRef.current) {
          // First line of this run: it counts as one session.
          counted.current = startSession(counted.current ?? history.current);
          picker.current = newPickerState(seedRef.current, counted.current);
          void saveCoachHistory(userId, counted.current).catch(() => undefined);
        }
        const r = pickLine(moment, picker.current, { localWords: prefsRef.current.localWords, ...opts });
        const before = picker.current;
        picker.current = r.state;
        if (r.state.history !== before.history) {
          counted.current = r.state.history;
          void saveCoachHistory(userId, r.state.history).catch(() => undefined);
        }
        return r.line;
      },
    }),
    [userId, ready],
  );
}
