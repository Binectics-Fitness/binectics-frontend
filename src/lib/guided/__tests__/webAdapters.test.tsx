import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { speech } from "../speech";
import { sounds } from "../sounds";
import { useWakeLock } from "../useWakeLock";

/** The browser adapters: Web Speech, Web Audio and the Screen Wake Lock API, each optional. */

type W = Record<string, unknown>;
const w = window as unknown as W;

describe("speech (Web Speech)", () => {
  afterEach(() => {
    delete w.speechSynthesis;
    delete w.SpeechSynthesisUtterance;
    speech.reset();
  });

  it("is unavailable, and silent, where the browser has no speech synthesis", () => {
    speech.reset();
    expect(speech.isUnavailable()).toBe(true);
    expect(() => speech.speak("Go.")).not.toThrow();
    expect(() => speech.stop()).not.toThrow();
  });

  it("speaks with the rate and volume, replaces what is playing, and cancels on stop", () => {
    const synth = { speak: vi.fn(), cancel: vi.fn(), resume: vi.fn(), getVoices: () => [] };
    class Utterance {
      rate = 1;
      volume = 1;
      lang = "";
      voice: unknown = null;
      onerror: ((e: unknown) => void) | null = null;
      constructor(public text: string) {}
    }
    w.speechSynthesis = synth;
    w.SpeechSynthesisUtterance = Utterance;
    speech.reset();
    expect(speech.isUnavailable()).toBe(false);
    speech.speak("Get ready for Squat.", { rate: 1.2, volume: 0.5 });
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    const u = synth.speak.mock.calls[0][0] as Utterance;
    expect(u).toMatchObject({ text: "Get ready for Squat.", rate: 1.2, volume: 0.5 });
    // A cancel reported as an error is not a failure; a real error is.
    u.onerror?.({ error: "interrupted" });
    expect(speech.isUnavailable()).toBe(false);
    u.onerror?.({ error: "synthesis-failed" });
    expect(speech.isUnavailable()).toBe(true);
    speech.stop();
    expect(synth.cancel).toHaveBeenCalledTimes(2);
  });
});

describe("sounds (Web Audio)", () => {
  afterEach(() => {
    delete w.AudioContext;
    sounds.reset();
  });

  it("stays silent until the Start click unlocks audio, then plays oscillator tones", () => {
    const started: number[] = [];
    const param = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
    class Ctx {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        return { type: "", frequency: param(), connect: (g: unknown) => g, start: (t: number) => started.push(t), stop: vi.fn() };
      }
      createGain() {
        return { gain: param(), connect: (d: unknown) => d };
      }
      resume = vi.fn().mockResolvedValue(undefined);
      close = vi.fn().mockResolvedValue(undefined);
    }
    w.AudioContext = Ctx;
    sounds.play("start");
    expect(started).toHaveLength(0); // no context yet: autoplay rules
    sounds.warmUp();
    sounds.play("start");
    expect(started).toHaveLength(2); // two notes
  });
});

describe("useWakeLock", () => {
  let visibility: DocumentVisibilityState = "visible";
  beforeEach(() => {
    visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  });
  afterEach(() => {
    delete (navigator as unknown as W).wakeLock;
  });

  it("holds the screen on while active, takes it again when the tab returns, and lets go after", async () => {
    const locks: { released: boolean; release: () => Promise<void> }[] = [];
    const request = vi.fn(async () => {
      const l = { released: false, release: vi.fn(async () => void (l.released = true)) };
      locks.push(l);
      return l;
    });
    (navigator as unknown as W).wakeLock = { request };
    const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } });
    await act(async () => {});
    expect(request).toHaveBeenCalledWith("screen");
    // The browser drops the lock when the tab is hidden.
    locks[0].released = true;
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    visibility = "visible";
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(request).toHaveBeenCalledTimes(2);
    rerender({ on: false });
    expect(locks[1].release).toHaveBeenCalled();
  });

  it("does nothing where the API is missing", () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
