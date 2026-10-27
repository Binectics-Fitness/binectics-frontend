/**
 * Starter Program copy shown before a member starts. Same wording as the
 * mobile app (src/utils/starterCopy.ts) so both clients say the same thing.
 *
 * DRAFT: the safety wording is pending review by a qualified coach, a
 * physiotherapist and counsel. Do not describe the programs or the exercise
 * art as approved, cleared or reviewed.
 */
export const STARTER_NOT_MEDICAL_ADVICE =
  "These programs are general fitness guidance for healthy adults. They are not medical advice and do not replace your doctor.";

export const STARTER_SCREENING_QUESTION =
  "Do you have a heart condition, chest pain when active, dizziness, a bone or joint problem, are you pregnant or recently gave birth, have you had recent surgery, or has a doctor said you should only exercise under supervision?";

/** Shown after a "yes". The member can still start: a warning, not a block. */
export const STARTER_SCREENING_WARNING =
  "Please talk to a doctor before you start. You can still look at the program.";

export const STARTER_STOP_NOTE =
  "Stop and rest if you feel sharp pain, chest pain, dizziness or you cannot breathe. If it does not settle, get medical help.";

export const STARTER_AGE_NOTE = "I am 18 or older.";

/** Shown with the exercise pictures. Plain, never claims review or approval. */
export const STARTER_ART_NOTE =
  "Exercise pictures are simple illustrated demos to help you picture each move. They have not been professionally reviewed, so follow the written cues and go easy.";

const dayWord = (n: number) => `${n} day${n === 1 ? "" : "s"} a week`;

/** "4 weeks, 3 days a week, about 25 minutes a session": only what the API sent. */
export function starterFactsLine(t: {
  durationWeeks: number;
  daysPerWeek: number;
  sessionMinutes: number;
}): string {
  const parts: string[] = [];
  if (t.durationWeeks > 0) parts.push(`${t.durationWeeks} week${t.durationWeeks === 1 ? "" : "s"}`);
  if (t.daysPerWeek > 0) parts.push(dayWord(t.daysPerWeek));
  if (t.sessionMinutes > 0) parts.push(`about ${t.sessionMinutes} minutes a session`);
  return parts.join(", ");
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/**
 * The "Before you start" paragraphs without repeats. A cautions text that
 * carries the stop-and-rest advice replaces the fixed stop note.
 */
export function safetyParagraphs(cautions?: string | null): string[] {
  const out: string[] = [STARTER_NOT_MEDICAL_ADVICE];
  const c = (cautions ?? "").trim();
  const cn = norm(c);
  let added = false;
  if (c && cn !== norm(STARTER_NOT_MEDICAL_ADVICE) && cn !== norm(STARTER_STOP_NOTE)) {
    const rest = c.startsWith(STARTER_NOT_MEDICAL_ADVICE)
      ? c.slice(STARTER_NOT_MEDICAL_ADVICE.length).trim()
      : c;
    if (rest) {
      out.push(rest);
      added = true;
    }
  }
  const coversStop = added && /\bstop\b/.test(cn) && /\bpain\b/.test(cn) && /dizz/.test(cn);
  if (!coversStop) out.push(STARTER_STOP_NOTE);
  return out;
}

/** "Week 2" label and its one-line name, without "Week 2 Week 2". */
export function laterWeekParts(w: { week: number; name: string }): { label: string; name: string } {
  const name = w.name
    .replace(new RegExp(`^week\\s*${w.week}\\b\\s*[:.\\-\u2013\u2014]*\\s*`, "i"), "")
    .trim();
  return { label: `Week ${w.week}`, name };
}
