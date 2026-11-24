/**
 * Ported from binectics-mobile src/guided/prefs.ts (feat/simplify-guided-start, mobile #299).
 * Same choices, defaults and sanitising; the store is a small useSyncExternalStore one on localStorage.
 */
import { useSyncExternalStore } from 'react';
import { getCached, setCache } from './storage';

/**
 * Guided-session preferences. Saved per member under the starter prefix, so
 * sign-out wipes them with the rest of the starter data. A preference, not a
 * cache: never expires (TTL ~10 years).
 */
export interface GuidedPrefs {
  voiceOn: boolean;
  /** Short tones (count-in ticks, set start/end, rest over). Independent of voice. */
  soundsOn: boolean;
  countdownCalls: boolean;
  formCues: boolean;
  /** Coach lines ("Good. Keep it steady."): the voice sounds like a coach, not a stopwatch. Off = plain cues only. */
  coachLines: boolean;
  /** "Local flavour": lets coach lines use a local word (e.g. "Oya"). Off by default; each such line has a plain twin. */
  localWords: boolean;
  /** 0.75 - 1.25. */
  rate: number;
  /** 0.4 - 1. */
  volume: number;
  /** Seconds before the first exercise (and after a skip); 0 = none. */
  prepSeconds: number;
  /** Rest used when the plan does not say; 0 = none. */
  defaultRestSeconds: number;
}

export const DEFAULT_GUIDED_PREFS: GuidedPrefs = {
  voiceOn: true,
  soundsOn: true,
  countdownCalls: true,
  formCues: true,
  coachLines: true,
  localWords: false,
  rate: 1,
  volume: 1,
  prepSeconds: 5,
  defaultRestSeconds: 30,
};

export const PREP_CHOICES = [0, 3, 5, 10] as const;
export const REST_CHOICES = [0, 15, 30, 45, 60] as const;
export const RATE_CHOICES: { label: string; value: number }[] = [
  { label: 'Slower', value: 0.8 },
  { label: 'Normal', value: 1 },
  { label: 'Faster', value: 1.2 },
];
export const VOLUME_CHOICES: { label: string; value: number }[] = [
  { label: 'Low', value: 0.5 },
  { label: 'Medium', value: 0.75 },
  { label: 'Full', value: 1 },
];

const TTL = 10 * 365 * 24 * 60 * 60 * 1000;
const key = (userId: string) => `starter_guided_prefs_${userId}`;

const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const num = (v: unknown, d: number, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;

/** Saved values can be old or hand-edited: anything off falls back to the default. */
export function sanitizePrefs(raw: Partial<Record<keyof GuidedPrefs, unknown>> | null | undefined): GuidedPrefs {
  const r = raw ?? {};
  const d = DEFAULT_GUIDED_PREFS;
  return {
    voiceOn: bool(r.voiceOn, d.voiceOn),
    soundsOn: bool(r.soundsOn, d.soundsOn),
    countdownCalls: bool(r.countdownCalls, d.countdownCalls),
    formCues: bool(r.formCues, d.formCues),
    coachLines: bool(r.coachLines, d.coachLines),
    localWords: bool(r.localWords, d.localWords),
    rate: num(r.rate, d.rate, 0.5, 1.5),
    volume: num(r.volume, d.volume, 0, 1),
    prepSeconds: Math.round(num(r.prepSeconds, d.prepSeconds, 0, 30)),
    defaultRestSeconds: Math.round(num(r.defaultRestSeconds, d.defaultRestSeconds, 0, 180)),
  };
}

interface PrefsState {
  userId: string | null;
  prefs: GuidedPrefs;
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  set: (patch: Partial<GuidedPrefs>) => void;
}

/*
 * A tiny store with the same surface as the mobile zustand store
 * (`useGuidedPrefs(selector)`, `.getState()`, `.setState()`), so the screens
 * and tests read the same. The web has no zustand dependency.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let current: PrefsState;
const setState = (patch: Partial<PrefsState>) => {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
};
current = {
  userId: null,
  prefs: DEFAULT_GUIDED_PREFS,
  hydrated: false,
  hydrate: async (userId) => {
    if (current.userId === userId && current.hydrated) return;
    const saved = await getCached<Partial<GuidedPrefs>>(key(userId));
    setState({ userId, prefs: sanitizePrefs(saved), hydrated: true });
  },
  set: (patch) => {
    const prefs = sanitizePrefs({ ...current.prefs, ...patch });
    setState({ prefs });
    const { userId } = current;
    if (userId) void setCache(key(userId), prefs, TTL);
  },
};
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useGuidedPrefs<T>(selector: (s: PrefsState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(current),
    () => selector(current),
  );
}
useGuidedPrefs.getState = (): PrefsState => current;
useGuidedPrefs.setState = setState;
