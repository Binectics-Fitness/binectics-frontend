/**
 * Ported from binectics-mobile src/guided/coach/__tests__/selector.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import {
  EMPTY_HISTORY, newPickerState, pickLine, slowPauses, startSession, BANKS, type OnceHistory, type PickerState,
} from '../selector';
import type { Moment } from '../types';

const ctx = { localWords: false };
const fresh = (seed: string) => newPickerState(seed, startSession(EMPTY_HISTORY));
function run(moment: Moment, n: number, seed = 's1', c = ctx, history: OnceHistory = startSession(EMPTY_HISTORY)) {
  let st: PickerState = newPickerState(seed, history);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = pickLine(moment, st, c);
    st = r.state;
    out.push(r.line?.id ?? 'none');
  }
  return { out, st };
}
const srcOf = (id?: string) => BANKS['lagos-strength'].find((l) => l.id === id);

describe('pickLine', () => {
  it('is deterministic for the same seed and different for another', () => {
    expect(run('midSet', 12, 'abc').out).toEqual(run('midSet', 12, 'abc').out);
    expect(run('midSet', 12, 'abc').out).not.toEqual(run('midSet', 12, 'xyz').out);
  });

  it('never repeats any of the last 3 lines of a moment', () => {
    for (const m of ['midSet', 'rest', 'form', 'setComplete', 'countdownLead'] as Moment[]) {
      for (const seed of ['a', 'b', 'c', 'd']) {
        const { out } = run(m, 60, seed);
        out.forEach((id, i) => {
          expect(id).not.toBe('none');
          expect(out.slice(Math.max(0, i - 3), i)).not.toContain(id);
        });
      }
    }
  });

  it('keeps moments independent', () => {
    let st = fresh('m');
    const a = pickLine('midSet', st, ctx);
    st = a.state;
    expect(st.recent.rest).toBeUndefined();
    expect(a.line?.moment).toBe('midSet');
  });

  it('does not mutate the state it is given', () => {
    const st = fresh('s');
    const frozen = JSON.stringify(st);
    pickLine('midSet', st, ctx);
    expect(JSON.stringify(st)).toBe(frozen);
  });

  it('plays a once line at most once per session', () => {
    const { out } = run('sessionComplete', 40);
    const onceIds = BANKS['lagos-strength'].filter((l) => l.moment === 'sessionComplete' && l.tags.includes('once')).map((l) => l.id);
    for (const id of onceIds) expect(out.filter((x) => x === id).length).toBeLessThanOrEqual(1);
  });

  it('plays a once line at most once per 5 sessions (persisted counter)', () => {
    let history = EMPTY_HISTORY;
    const shownIn: Record<string, number[]> = {};
    for (let session = 1; session <= 30; session++) {
      history = startSession(history);
      let st = newPickerState(`sess-${session}`, history);
      for (let i = 0; i < 30; i++) {
        const r = pickLine('sessionComplete', st, ctx);
        st = r.state;
        if (r.line && srcOf(r.line.id)?.tags.includes('once')) (shownIn[r.line.id] ??= []).push(session);
      }
      history = st.history; // what coachHistory would save
    }
    const ids = Object.keys(shownIn);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      shownIn[id].forEach((s, i) => {
        if (i > 0) expect(s - shownIn[id][i - 1]).toBeGreaterThanOrEqual(5);
      });
    }
  });

  it('goes quiet (null) rather than throwing when nothing is eligible', () => {
    const r = pickLine('midSet', { ...fresh('s'), persona: 'nope' as never }, ctx);
    expect(r.line).toBeNull();
  });

  describe('local words', () => {
    const find = (localWords: boolean) => {
      for (let i = 0; i < 400; i++) {
        const r = pickLine('sessionStart', fresh(`k${i}`), { localWords });
        if (r.line?.id === 'ss-06') return r.line.text;
      }
      return null;
    };
    it('speaks the plain twin by default', () => expect(find(false)).toBe('Water close? Good.'));
    it('speaks the local wording only when Local flavour is on', () => expect(find(true)).toBe('Water close? Good. Oya.'));
    it('never lets "Oya" through with the pref off', () => {
      for (let i = 0; i < 200; i++) expect(pickLine('sessionStart', fresh(`z${i}`), ctx).line?.text).not.toMatch(/oya/i);
    });
  });

  describe('safety lines', () => {
    const SAFE = ['Pain means stop. Always.', 'Sharp pain? Stop and tell your coach.'];
    it('are never offered without allowSafety', () => {
      for (let i = 0; i < 300; i++) {
        let st = fresh(`e${i}`);
        for (let j = 0; j < 8; j++) {
          const r = pickLine('easeOff', st, ctx);
          st = r.state;
          expect(SAFE).not.toContain(r.line?.text);
        }
      }
    });
    it('exist only in the ease-off moment, so no other moment can ever play them', () => {
      for (const l of BANKS['lagos-strength'].filter((x) => x.tags.includes('safety'))) expect(l.moment).toBe('easeOff');
      for (const m of ['sessionStart', 'midSet', 'lastReps', 'setComplete', 'rest', 'form', 'sessionComplete', 'comeback'] as Moment[]) {
        for (let i = 0; i < 50; i++) expect(SAFE).not.toContain(pickLine(m, fresh(`q${i}`), { localWords: true, allowSafety: true }).line?.text);
      }
    });
    it('can be offered with allowSafety, respecting the once rules', () => {
      const seen = new Set<string>();
      for (let i = 0; i < 300; i++) {
        let st = fresh(`e${i}`);
        const here: string[] = [];
        for (let j = 0; j < 12; j++) {
          const r = pickLine('easeOff', st, { localWords: false, allowSafety: true });
          st = r.state;
          if (r.line && SAFE.includes(r.line.text)) {
            seen.add(r.line.text);
            here.push(r.line.text);
          }
        }
        expect(new Set(here).size).toBe(here.length);
      }
      expect(seen.size).toBe(2);
    });
  });

  describe('spoken-slow', () => {
    it('adds a pause between sentences with punctuation only', () => {
      expect(slowPauses('Breathe in. Breathe out.')).toBe('Breathe in. ... Breathe out.');
      expect(slowPauses('Hello.')).toBe('Hello.');
    });
    it('is applied to slow lines and to no others', () => {
      let slowSeen = 0;
      for (let i = 0; i < 300; i++) {
        const r = pickLine('rest', fresh(`r${i}`), ctx).line;
        const src = srcOf(r?.id);
        const expectPause = !!src?.tags.includes('spoken-slow') && /[.?!]\s/.test(src.text);
        expect(r?.text.includes('...')).toBe(expectPause);
        if (expectPause) slowSeen++;
      }
      expect(slowSeen).toBeGreaterThan(0);
    });
  });

  describe('baked set number', () => {
    const texts = (setNumber?: number) => {
      const s = new Set<string>();
      for (let i = 0; i < 400; i++) {
        const r = pickLine('setComplete', fresh(`u${i}`), { localWords: false, setNumber });
        if (r.line) s.add(r.line.text);
      }
      return s;
    };
    it('offers "That\'s one down." only after set 1', () => {
      expect(texts(1).has("That's one down.")).toBe(true);
      expect(texts(2).has("That's one down.")).toBe(false);
      expect(texts().has("That's one down.")).toBe(false);
    });
  });

  describe('baked seconds', () => {
    const texts = (secondsLeft?: number) => {
      const s = new Set<string>();
      for (let i = 0; i < 400; i++) {
        const r = pickLine('lastReps', fresh(`t${i}`), { localWords: false, secondsLeft });
        if (r.line) s.add(r.line.text);
      }
      return s;
    };
    it('offers "Ten seconds. Easy now." only at exactly ten seconds left', () => {
      expect(texts(10).has('Ten seconds. Easy now.')).toBe(true);
      expect(texts(5).has('Ten seconds. Easy now.')).toBe(false);
      expect(texts().has('Ten seconds. Easy now.')).toBe(false);
    });
  });
});

describe('gates for the timed ten-seconds call and for restating lines', () => {
  const offered = (moment: Moment, c: Parameters<typeof pickLine>[2]) => {
    const s = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const r = pickLine(moment, newPickerState(`g${i}`, startSession(EMPTY_HISTORY)), c);
      if (r.line) s.add(r.line.id);
    }
    return s;
  };
  it('never offers rep language on a timed set, but does on a rep set', () => {
    const timed = offered('lastReps', { localWords: false, secondsLeft: 10, timed: true });
    for (const id of ['lr-02', 'lr-06', 'lr-10']) expect(timed.has(id)).toBe(false);
    expect(timed.has('lr-04')).toBe(true); // "Ten seconds. Easy now." is fine on a hold
    const reps = offered('lastReps', { localWords: false });
    for (const id of ['lr-02', 'lr-06', 'lr-10']) expect(reps.has(id)).toBe(true);
  });
  it('skips lines that restate the set or the rest when the plain cue already says it', () => {
    const got = offered('setComplete', { localWords: false, setNumber: 1, skipRestating: ['set', 'rest'] });
    for (const id of ['sc-04', 'sc-07', 'sc-10']) expect(got.has(id)).toBe(false);
    expect(got.size).toBeGreaterThanOrEqual(6);
    const open = offered('setComplete', { localWords: false, setNumber: 1 });
    for (const id of ['sc-07', 'sc-10']) expect(open.has(id)).toBe(true);
  });
});
