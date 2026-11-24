/**
 * Ported from binectics-mobile src/guided/useSpeechDriver.ts (feat/simplify-guided-start, mobile #299).
 * Unchanged logic; speech and sounds are the web adapters (Web Speech, Web Audio).
 */
import { useEffect, useRef } from 'react';
import { nextCueInMs, type SessionState } from './engine';
import { speechFor, toneFor, SPEECH_MARGIN_MS, type CoachContext } from './cueText';
import { speech } from './speech';
import { sounds, TONE_MS } from './sounds';
import type { GuidedPrefs } from './prefs';

/**
 * Plays the engine's cues: speech and tones. Dedupe is by cue id: a cue is
 * handled once, the first time this hook sees an id above the last one
 * handled, so a re-render with the same state can never repeat anything. A
 * change in `speechEpoch` (pause, skip, repeat, end) stops what is playing
 * first. Cues present at mount (a restored session) are marked handled, never
 * played. Nothing here keeps time: every sound is the consequence of a state
 * transition the engine already decided on.
 *
 * When a tone and speech arrive together the tone plays first and the speech
 * follows it, so they do not overlap. Preferences are read through a ref:
 * changing a setting mid-session neither replays nor re-triggers anything.
 */
export function useSpeechDriver(state: SessionState, prefs: GuidedPrefs, coach?: CoachContext): void {
  const handled = useRef(state.cueSeq);
  const epoch = useRef(state.speechEpoch);
  const prefsRef = useRef(prefs);
  const coachRef = useRef(coach);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);
  useEffect(() => {
    coachRef.current = coach;
  }, [coach]);

  const clearPending = () => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
  };

  useEffect(() => {
    if (state.speechEpoch !== epoch.current) {
      epoch.current = state.speechEpoch;
      clearPending();
      speech.stop();
    }
    if (state.cueSeq === handled.current) return;
    const fresh = state.cues.filter((c) => c.id > handled.current);
    handled.current = state.cueSeq;
    const p = prefsRef.current;
    const sp = {
      voiceOn: p.voiceOn,
      countdownCalls: p.countdownCalls,
      formCues: p.formCues,
      soundsOn: p.soundsOn,
      coachLines: p.coachLines,
    };
    const tone = toneFor(fresh, sp);
    // Coach lines only when the member has them on; otherwise the plain cues, exactly as before.
    // Coach additions must finish before the next scheduled call (and after the tone that plays first).
    const next = nextCueInMs(state, Date.now());
    const budgetMs = next === null ? null : next - (tone ? TONE_MS[tone] + 60 : 0) - SPEECH_MARGIN_MS;
    const text = speechFor(fresh, sp, p.coachLines ? coachRef.current : undefined, { rate: p.rate, budgetMs });
    if (tone) sounds.play(tone, p.volume);
    if (text) {
      const say = () => {
        pending.current = null;
        speech.speak(text, { rate: p.rate, volume: p.volume });
      };
      clearPending();
      if (tone) pending.current = setTimeout(say, TONE_MS[tone] + 60);
      else say();
    }
  }, [state, state.cues, state.cueSeq, state.speechEpoch]);

  // Turning voice off silences what is playing right now.
  useEffect(() => {
    if (!prefs.voiceOn) {
      clearPending();
      speech.stop();
    }
  }, [prefs.voiceOn]);

  useEffect(
    () => () => {
      clearPending();
      speech.stop();
    },
    [],
  );
}
