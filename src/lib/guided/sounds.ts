import type { ToneName } from './engine';

/**
 * Web adapter for binectics-mobile src/guided/sounds.ts: the same tones, made
 * with a Web Audio oscillator instead of bundled .wav files (nothing to
 * download, nothing to license).
 *
 * Browsers only let a page start audio after a user gesture, so the
 * AudioContext is created (or resumed) by `warmUp()`, which the Start click
 * calls. Before that, and wherever Web Audio is missing, `play` is silent.
 * A failure costs that one tone: further tones are skipped for
 * RETRY_AFTER_MS and then tried again.
 */
export const TONE_MS: Record<ToneName, number> = { tick: 90, start: 220, end: 220, restEnd: 450 };
export const RETRY_AFTER_MS = 30_000;

/** Pitch steps per tone: a short tick, a rising start, a falling end, a two-note "rest over". */
const SHAPES: Record<ToneName, { hz: number; ms: number }[]> = {
  tick: [{ hz: 880, ms: 90 }],
  start: [{ hz: 660, ms: 90 }, { hz: 990, ms: 130 }],
  end: [{ hz: 990, ms: 90 }, { hz: 660, ms: 130 }],
  restEnd: [{ hz: 784, ms: 180 }, { hz: 1047, ms: 270 }],
};

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let failedAt: number | null = null;

const blocked = () => failedAt !== null && Date.now() - failedAt < RETRY_AFTER_MS;

function AudioCtor(): (new () => Ctx) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: new () => Ctx; webkitAudioContext?: new () => Ctx };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export const sounds = {
  /** True while sounds are paused after a recent failure. */
  isUnavailable: () => blocked(),
  play(tone: ToneName, volume = 1): void {
    if (blocked() || !ctx) return;
    try {
      const c = ctx;
      if (c.state === 'suspended') void c.resume().catch(() => undefined);
      let t = c.currentTime;
      const peak = 0.25 * Math.max(0, Math.min(1, volume));
      for (const step of SHAPES[tone]) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(step.hz, t);
        const end = t + step.ms / 1000;
        // A short attack and release: no click at either edge.
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(peak, t + 0.01);
        gain.gain.setValueAtTime(peak, Math.max(t + 0.01, end - 0.03));
        gain.gain.linearRampToValueAtTime(0, end);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(end + 0.01);
        t = end;
      }
    } catch {
      failedAt = Date.now();
    }
  },
  /** Create or resume the audio context. Call from a click (autoplay policy). No sound. */
  warmUp(): void {
    if (blocked()) return;
    try {
      if (!ctx) {
        const C = AudioCtor();
        if (!C) return;
        ctx = new C();
      }
      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    } catch {
      failedAt = Date.now();
    }
  },
  /** Tests. */
  reset(): void {
    failedAt = null;
    try {
      void ctx?.close();
    } catch {
      /* already closed */
    }
    ctx = null;
  },
};
