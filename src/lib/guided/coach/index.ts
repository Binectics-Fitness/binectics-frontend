/**
 * Ported from binectics-mobile src/guided/coach/index.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
export * from './types';
export { LAGOS_STRENGTH_LINES } from './lines.lagos-strength';
export {
  BANKS,
  EMPTY_HISTORY,
  NO_REPEAT,
  ONCE_EVERY_SESSIONS,
  newPickerState,
  pickLine,
  slowPauses,
  startSession,
  type OnceHistory,
  type PickContext,
  type PickerState,
} from './selector';
export { beginCoachSession, loadCoachHistory, saveCoachHistory } from './coachHistory';
