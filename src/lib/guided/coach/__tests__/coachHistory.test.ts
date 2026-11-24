/**
 * Ported from binectics-mobile src/guided/coach/__tests__/coachHistory.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { beginCoachSession, loadCoachHistory, saveCoachHistory } from '../coachHistory';
import { EMPTY_HISTORY } from '../selector';

describe('coach history', () => {
  it('counts sessions per member and persists the once history', async () => {
    expect(await loadCoachHistory('h1')).toEqual(EMPTY_HISTORY);
    expect((await beginCoachSession('h1')).sessions).toBe(1);
    await saveCoachHistory('h1', { sessions: 1, lastShown: { 'sd-04': 1 } });
    const second = await beginCoachSession('h1');
    expect(second).toEqual({ sessions: 2, lastShown: { 'sd-04': 1 } });
    expect((await beginCoachSession('h2')).sessions).toBe(1);
  });

  it('repairs a damaged record instead of throwing', async () => {
    await saveCoachHistory('h3', { sessions: -4, lastShown: { a: 'x' as never, b: 2 } });
    expect(await loadCoachHistory('h3')).toEqual({ sessions: 0, lastShown: { b: 2 } });
  });

  it('does nothing without a member', async () => {
    expect(await loadCoachHistory(null)).toEqual(EMPTY_HISTORY);
    await expect(saveCoachHistory(undefined, EMPTY_HISTORY)).resolves.toBeUndefined();
  });
});
