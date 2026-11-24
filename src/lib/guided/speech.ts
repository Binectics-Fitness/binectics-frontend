import { useEffect, useSyncExternalStore } from 'react';

/**
 * Web adapter for binectics-mobile src/guided/speech.ts: the same surface
 * (speak, stop, warmUp, isUnavailable, subscribe, reset) over the browser's
 * Web Speech API (window.speechSynthesis).
 *
 * Every call is wrapped: speech synthesis may be missing (some browsers, a
 * locked-down device), may have no voices, or may fail asynchronously. None
 * of that may break the session; the visual timer is the product, voice is
 * extra. There is no music ducking on the web: the browser cannot lower
 * another app's audio.
 */

export interface SpeakOptions {
  /** 0.5 - 1.5 (1 = normal). */
  rate?: number;
  /** 0 - 1. */
  volume?: number;
}

function synth(): SpeechSynthesis | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return null;
    return window.speechSynthesis;
  } catch {
    return null;
  }
}

let unavailable = false;
const listeners = new Set<(unavailable: boolean) => void>();

function setUnavailable(v: boolean) {
  if (unavailable === v) return;
  unavailable = v;
  listeners.forEach((l) => l(v));
}

/** Pick an English voice once voices have loaded; the browser default otherwise. */
function englishVoice(s: SpeechSynthesis): SpeechSynthesisVoice | null {
  try {
    const voices = s.getVoices();
    return voices.find((v) => v.lang?.toLowerCase().startsWith('en') && v.localService) ?? voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ?? null;
  } catch {
    return null;
  }
}

export const speech = {
  /** True when the browser has no speech synthesis, or a speak call failed; the UI says voice is not available. */
  isUnavailable: () => unavailable,
  subscribe(l: (unavailable: boolean) => void): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Say `text`, replacing anything still playing (a newer instruction beats a stale one). */
  speak(text: string, opts: SpeakOptions = {}): void {
    if (!text) return;
    const s = synth();
    if (!s) {
      setUnavailable(true);
      return;
    }
    try {
      s.cancel();
      const u = new window.SpeechSynthesisUtterance(text);
      u.rate = opts.rate ?? 1;
      u.volume = opts.volume ?? 1;
      u.lang = 'en';
      const v = englishVoice(s);
      if (v) u.voice = v;
      u.onerror = (e) => {
        // A cancel (pause, skip, a newer cue) reports as an error in some browsers: that is not a failure.
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err === 'canceled' || err === 'interrupted') return;
        setUnavailable(true);
      };
      s.speak(u);
      // Chrome can leave the queue paused after the tab was hidden; resume is harmless otherwise.
      s.resume();
    } catch {
      setUnavailable(true);
    }
  },
  /**
   * Touch the engine inside the Start click so its first real use is not in the countdown, and so browsers
   * that only allow speech after a user gesture (Safari, iOS) let later calls through. No sound.
   */
  warmUp(): void {
    const s = synth();
    if (!s) {
      setUnavailable(true);
      return;
    }
    try {
      s.getVoices();
      const u = new window.SpeechSynthesisUtterance('');
      u.volume = 0;
      s.speak(u);
    } catch {
      /* best effort */
    }
  },
  /** Stop whatever is playing. */
  stop(): void {
    try {
      synth()?.cancel();
    } catch {
      /* nothing to stop */
    }
  },
  /** Reset the availability flag (tests, and a fresh session). Stays unavailable where the browser has none. */
  reset(): void {
    setUnavailable(synth() === null);
  },
};

/**
 * React view of `speech.isUnavailable()`. Checks the browser on mount (a
 * fresh session), then follows failures as they happen.
 */
export function useSpeechUnavailable(): boolean {
  useEffect(() => {
    speech.reset();
  }, []);
  return useSyncExternalStore(speech.subscribe, speech.isUnavailable, () => false);
}
