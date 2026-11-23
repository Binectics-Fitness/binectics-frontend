/**
 * Ported from binectics-mobile src/guided/coach/lines.lagos-strength.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import type { CoachLine, LineTag, Moment } from './types';

/**
 * Persona "lagos-strength": a calm Lagos strength coach, written for a nervous
 * beginner. Source of truth: binectics-plans/coach-voice-lines-lagos-strength.md
 * (approved 2026-10-31). Other personas or levels get their own file, never
 * edits to this one.
 *
 * Ids are `<prefix>-<nn>` by position within the moment. Append only: never
 * reorder or delete (recorded audio will be keyed by id).
 */
type Row = readonly [text: string, ...flags: ('O' | 'S' | 'safe')[]];

function moment(m: Moment, prefix: string, rows: readonly Row[]): CoachLine[] {
  return rows.map(([text, ...flags], i) => {
    const tags: LineTag[] = [];
    if (flags.includes('O')) tags.push('once');
    else tags.push('loop-safe');
    if (flags.includes('S')) tags.push('spoken-slow');
    if (flags.includes('safe')) tags.push('safety');
    return { id: `${prefix}-${String(i + 1).padStart(2, '0')}`, moment: m, text, tags };
  });
}

const sessionStart = moment('sessionStart', 'ss', [
  ['Welcome in. Let\'s work.'],
  ['Good to see you.'],
  ['Shoes on. We\'re starting.'],
  ['No rush. Just begin.'],
  ['Easy start. Easy pace.'],
  ['Water close? Good.'], // local twin applied below
  ['Today counts. Let\'s go.'],
  ['You showed up. That\'s the hard part.', 'O'],
  ['Breathe first. Then we move.', 'S'],
  ['Ready when you are.'],
]);
// The only local-word line today: "Oya" is Nigerian Pidgin for "come on / let's go".
const water = sessionStart[5];
water.tags.push('local');
water.plain = 'Water close? Good.';
water.text = 'Water close? Good. Oya.';

const countdownLead = moment('countdownLead', 'cl', [
  ['Here we go.'],
  ['Get set.'],
  ['Set your feet.'],
  ['Eyes up.'],
  ['Breathe in.', 'S'],
  ['On my count.'],
  ['Last breath. Now go.'],
]);

const midSet = moment('midSet', 'ms', [
  ['Good. Keep it steady.'],
  ['That\'s it.'],
  ['Smooth. Stay with it.'],
  ['Nice rhythm.'],
  ['You\'ve got this pace.'],
  ['Strong and calm.'],
  ['Keep breathing.'],
  ['Don\'t rush it.'],
  ['Looking good. Keep going.'],
  ['Stay tall. Stay steady.'],
]);

const lastReps = moment('lastReps', 'lr', [
  ['Almost there.'],
  ['Last few. Make them clean.'],
  ['Finish strong.'],
  ['Ten seconds. Easy now.', 'O'],
  ['Nearly done. Stay sharp.'],
  ['One more. Good one.'],
  ['Bring it home.'],
  ['Final push. Controlled.'],
  ['You\'re nearly through.'],
  ['Last one. Own it.'],
]);
// States a number of seconds, so it is only ever offered when exactly that many are left.
lastReps[3].bakedSeconds = 10;
// Rep language: the ten-seconds call only happens on timed sets, where these read wrong.
for (const i of [1, 5, 9]) lastReps[i].repOnly = true; // lr-02, lr-06, lr-10

const setComplete = moment('setComplete', 'sc', [
  ['Good. Again when ready.'],
  ['Well done.'],
  ['Clean set.'],
  ['That\'s one down.'], // states the set number: see bakedSet below
  ['Nice work.'],
  ['Solid.'],
  ['Set done. Shake it out.'],
  ['Proud of that one.', 'O'],
  ['You earned a breath.'],
  ['Beautiful. Rest now.'],
]);

// "One down" is only true after the first set.
setComplete[3].bakedSet = 1;
// These repeat what "Set N done." / "Take a N second rest." already say.
setComplete[3].restates = 'set'; // That's one down.
setComplete[6].restates = 'set'; // Set done. Shake it out.
setComplete[9].restates = 'rest'; // Beautiful. Rest now.

const rest = moment('rest', 'rs', [
  ['Breathe in. Breathe out.', 'S'],
  ['Water. Small sips.'],
  ['Shake your hands out.'],
  ['Rest. You\'ve earned it.'],
  ['Slow your breathing.', 'S'],
  ['Walk it off a little.'],
  ['Relax your shoulders.'],
  ['Take your time.'],
  ['Rest well. Next one soon.'],
  ['Roll your neck. Easy.'],
]);

const form = moment('form', 'fm', [
  ['Chest up.'],
  ['Shoulders down and back.'],
  ['Core tight.'],
  ['Breathe out on the effort.'],
  ['Slow down. Control it.'],
  ['Feet flat. Stay grounded.'],
  ['Eyes forward.'],
  ['Don\'t hold your breath.'],
  ['Quality over speed.'],
  ['Neck long. Jaw loose.'],
]);

const easeOff = moment('easeOff', 'eo', [
  ['Too much? Ease off.'],
  ['Slow it down. That\'s fine.'],
  ['Pain means stop. Always.', 'O', 'safe'],
  ['Take a rest. No stress.'],
  ['Smaller range is fine.'],
  ['Your pace is the right pace.'],
  ['Sharp pain? Stop and tell your coach.', 'O', 'safe'],
  ['Pause. Breathe. Then decide.', 'S'],
  ['No guilt. Reset.'],
  ['Listen to your body.'],
]);

const sessionComplete = moment('sessionComplete', 'sd', [
  ['That\'s the session. Well done.'],
  ['You did it.'],
  ['All done. Walk it out.'],
  ['Today is in the bank.', 'O'],
  ['Proud of you. Truly.', 'O'],
  ['Sit. Drink water. Relax.'],
  ['Another one finished.'],
  ['Good work today.'],
  ['You came. You did it. That\'s it.', 'O'],
  ['See you next session.'],
]);

const comeback = moment('comeback', 'cb', [
  ['Welcome back. No stress.'],
  ['Glad you\'re here.'],
  ['Today we start again.'],
  ['Missed days don\'t count.'],
  ['Back is the hard part. You\'re back.', 'O'],
  ['Easy does it today.'],
  ['New day. Clean slate.'],
  ['We pick up from here.'],
  ['No guilt. Just begin.'],
  ['Good to have you back.'],
]);

export const LAGOS_STRENGTH_LINES: readonly CoachLine[] = Object.freeze([
  ...sessionStart,
  ...countdownLead,
  ...midSet,
  ...lastReps,
  ...setComplete,
  ...rest,
  ...form,
  ...easeOff,
  ...sessionComplete,
  ...comeback,
]);
