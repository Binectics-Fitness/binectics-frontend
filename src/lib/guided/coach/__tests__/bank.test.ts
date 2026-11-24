/**
 * Ported from binectics-mobile src/guided/coach/__tests__/bank.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { LAGOS_STRENGTH_LINES as LINES } from '../lines.lagos-strength';
import type { Moment } from '../types';

const MOMENTS: Moment[] = [
  'sessionStart', 'countdownLead', 'midSet', 'lastReps', 'setComplete', 'rest', 'form', 'easeOff', 'sessionComplete', 'comeback',
];
const words = (s: string) => s.trim().split(/\s+/).length;
const BANNED = [
  // body / weight / results / medical claims
  'weight', 'weights', 'calorie', 'calories', 'kcal', 'burn', 'burned', 'fat', 'lose', 'slim', 'shred', 'result', 'results',
  'cure', 'heal', 'medical', 'doctor', 'diagnose', 'injury', 'therapy', 'guarantee', 'guaranteed',
  // profanity
  'damn', 'hell', 'shit', 'fuck', 'ass', 'crap', 'bitch', 'bastard',
];

describe('lagos-strength line bank', () => {
  it('covers all 10 moments, 7 to 10 lines each', () => {
    for (const m of MOMENTS) {
      const n = LINES.filter((l) => l.moment === m).length;
      expect(n).toBeGreaterThanOrEqual(7);
      expect(n).toBeLessThanOrEqual(10);
    }
    expect(LINES.length).toBe(97);
  });

  it('has unique, well-formed ids and no duplicate wording within a moment', () => {
    expect(new Set(LINES.map((l) => l.id)).size).toBe(LINES.length);
    for (const l of LINES) expect(l.id).toMatch(/^[a-z]{2}-\d{2}$/);
    for (const m of MOMENTS) {
      const t = LINES.filter((l) => l.moment === m).map((l) => l.text);
      expect(new Set(t).size).toBe(t.length);
    }
  });

  it('keeps every line short: <= 12 words, and most <= 6', () => {
    for (const l of LINES) {
      expect(words(l.text)).toBeLessThanOrEqual(12);
      if (l.plain) expect(words(l.plain)).toBeLessThanOrEqual(12);
    }
    const short = LINES.filter((l) => words(l.text) <= 6).length;
    expect(short / LINES.length).toBeGreaterThanOrEqual(0.85);
  });

  it('is TTS-safe: letters, digits, apostrophes and . , ? ! only; no emoji or symbols', () => {
    for (const l of LINES) {
      for (const t of [l.text, l.plain].filter((x): x is string => !!x)) {
        expect(t).toMatch(/^[A-Za-z0-9 '.,?!]+$/);
        expect(t).toMatch(/[.?!]$/);
      }
    }
  });

  it('bakes no digits, and the one spoken number is tagged bakedSeconds', () => {
    for (const l of LINES) expect(/\d/.test(l.text)).toBe(false);
    expect(LINES.filter((l) => l.bakedSeconds !== undefined).map((l) => [l.id, l.text, l.bakedSeconds])).toEqual([
      ['lr-04', 'Ten seconds. Easy now.', 10],
    ]);
    // The one line that names a set number is tagged too.
    expect(LINES.filter((l) => l.bakedSet !== undefined).map((l) => [l.id, l.text, l.bakedSet])).toEqual([
      ['sc-04', "That's one down.", 1],
    ]);
    // No other line names a number of seconds.
    for (const l of LINES.filter((x) => x.bakedSeconds === undefined)) expect(l.text).not.toMatch(/\bseconds?\b/i);
  });

  it('passes the banned-word guard (no weight, calorie, results, medical claims, profanity)', () => {
    for (const l of LINES) {
      for (const t of [l.text, l.plain].filter((x): x is string => !!x)) {
        const toks = t.toLowerCase().match(/[a-z']+/g) ?? [];
        for (const b of BANNED) expect(toks).not.toContain(b);
      }
    }
  });

  it('gives every local line a plain twin that is really free of the local word', () => {
    const local = LINES.filter((l) => l.tags.includes('local'));
    expect(local.map((l) => l.text)).toEqual(['Water close? Good. Oya.']);
    for (const l of local) {
      expect(l.plain).toBeTruthy();
      expect(l.plain).not.toMatch(/oya/i);
    }
    for (const l of LINES.filter((x) => !x.tags.includes('local'))) {
      expect(l.text).not.toMatch(/\boya\b/i);
      expect(l.plain).toBeUndefined();
    }
  });

  it('tags once and spoken-slow lines as approved, and the safety lines as safety + once', () => {
    const texts = (tag: string) => LINES.filter((l) => l.tags.includes(tag as never)).map((l) => l.text);
    expect(texts('safety')).toEqual(['Pain means stop. Always.', 'Sharp pain? Stop and tell your coach.']);
    for (const l of LINES.filter((x) => x.tags.includes('safety'))) expect(l.tags).toContain('once');
    expect(texts('spoken-slow')).toEqual([
      'Breathe first. Then we move.', 'Breathe in.', 'Breathe in. Breathe out.', 'Slow your breathing.', 'Pause. Breathe. Then decide.',
    ]);
    expect(texts('once')).toHaveLength(9);
    for (const l of LINES) expect(l.tags.includes('once') !== l.tags.includes('loop-safe')).toBe(true);
  });

  it('contains the approved top 10 verbatim', () => {
    const texts = new Set(LINES.map((l) => l.text));
    for (const t of [
      'Good. Again when ready.', 'Your pace is the right pace.', 'Pain means stop. Always.', "You showed up. That's the hard part.",
      "Missed days don't count.", 'Quality over speed.', 'Water. Small sips.', 'Breathe in. Breathe out.', 'No guilt. Reset.', 'Today is in the bank.',
    ]) expect(texts.has(t)).toBe(true);
  });
});
