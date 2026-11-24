/**
 * Ported from binectics-mobile src/guided/coach/__tests__/useCoachVoice.test.tsx (mobile #299): jest -> vitest, RN testing library -> React.
 */
import { act, renderHook } from '@testing-library/react';
import { useCoachVoice } from '../useCoachVoice';
import { loadCoachHistory, saveCoachHistory } from '../coachHistory';

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const on = { coachLines: true, localWords: false };

describe('useCoachVoice', () => {
  it('is quiet until the saved counter has loaded, then answers', async () => {
    const { result } = renderHook(() => useCoachVoice('cv1', 'o1|1', on));
    expect(result.current.line('midSet')).toBeNull();
    await flush();
    expect(result.current.line('midSet')?.moment).toBe('midSet');
  });

  it('says when it is ready, so a screen can ask for its first line', async () => {
    const { result } = renderHook(() => useCoachVoice('cv0', 'o1|1', on));
    expect(result.current.ready).toBe(false);
    await flush();
    expect(result.current.ready).toBe(true);
    expect(renderHook(() => useCoachVoice(null, 'o1|1', on)).result.current.ready).toBe(true);
  });

  it('peek shows the next line without counting a session or using a once-slot, and line then returns the same one', async () => {
    const { result } = renderHook(() => useCoachVoice('cv5', 'o1|1', on));
    expect(result.current.peek('comeback')).toBeNull(); // not loaded yet
    await flush();
    const peeked = result.current.peek('comeback');
    expect(peeked).not.toBeNull();
    expect(result.current.peek('comeback')?.id).toBe(peeked?.id); // stable
    await flush();
    expect(await loadCoachHistory('cv5')).toEqual({ sessions: 0, lastShown: {} });
    const taken = result.current.line('comeback');
    expect(taken?.id).toBe(peeked?.id);
    await flush();
    expect((await loadCoachHistory('cv5')).sessions).toBe(1);
  });

  it('works without a member (no persistence)', () => {
    const { result } = renderHook(() => useCoachVoice(null, 'o1|1', on));
    expect(result.current.line('rest')?.moment).toBe('rest');
  });

  it('reflects the prefs live: enabled and Local flavour', async () => {
    const { result, rerender } = renderHook(({ p }: { p: typeof on }) => useCoachVoice(null, 'o1|1', p), { initialProps: { p: on } });
    expect(result.current.enabled).toBe(true);
    rerender({ p: { coachLines: false, localWords: false } });
    expect(result.current.enabled).toBe(false);
  });

  it('counts a run as one session on its first line, and a new seed as another', async () => {
    const { result, rerender } = renderHook(({ seed }: { seed: string }) => useCoachVoice('cv2', seed, on), { initialProps: { seed: 'o1|1' } });
    await flush();
    result.current.line('midSet');
    result.current.line('midSet');
    await flush();
    expect((await loadCoachHistory('cv2')).sessions).toBe(1);
    rerender({ seed: 'o1|2' });
    result.current.line('midSet');
    await flush();
    expect((await loadCoachHistory('cv2')).sessions).toBe(2);
  });

  it('saves a once line as shown so the next sessions skip it', async () => {
    // Make the once line the only choice: pre-mark the other session-complete lines is not possible, so play until one shows.
    const { result } = renderHook(() => useCoachVoice('cv3', 'o9|1', on));
    await flush();
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      const l = result.current.line('sessionComplete');
      if (l) seen.push(l.id);
    }
    await flush();
    const h = await loadCoachHistory('cv3');
    const onceIds = ['sd-04', 'sd-05', 'sd-09'];
    const shown = seen.filter((id) => onceIds.includes(id));
    expect(Object.keys(h.lastShown).sort()).toEqual([...new Set(shown)].sort());
    shown.forEach((id) => expect(h.lastShown[id]).toBe(1));
  });

  it('honours a previously saved once history', async () => {
    await saveCoachHistory('cv4', { sessions: 3, lastShown: { 'sd-04': 3, 'sd-05': 3, 'sd-09': 3 } });
    const { result } = renderHook(() => useCoachVoice('cv4', 'o1|1', on));
    await flush();
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const l = result.current.line('sessionComplete');
      if (l) seen.add(l.id);
    }
    ['sd-04', 'sd-05', 'sd-09'].forEach((id) => expect(seen.has(id)).toBe(false));
  });
});
