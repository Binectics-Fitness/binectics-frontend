import type { HealthFormAnswer, HealthFormQuestion } from "@/lib/api/healthForms";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";

/** What the member has typed or picked, keyed by question index. */
export type HealthFormDraft = Record<number, string>;

/** The yes/no screening questions (the API's MULTIPLE_CHOICE). */
export function isChoice(q: Pick<HealthFormQuestion, "type">): boolean {
  return q.type === "MULTIPLE_CHOICE";
}

const filled = (v: string | undefined) => (v ?? "").trim() !== "";

/** How many questions have an answer: "7 of 8 answered". */
export function answeredCount(questions: HealthFormQuestion[], draft: HealthFormDraft): number {
  return questions.filter((q) => filled(draft[q.index])).length;
}

/**
 * The answers to send and what is wrong, question by question. Mirrors the
 * API's check (submitMine) and mobile's buildAnswers: every required yes/no
 * must be one of its options; an empty optional answer (the details) is
 * left out rather than sent blank.
 */
export function buildHealthFormAnswers(
  questions: HealthFormQuestion[],
  draft: HealthFormDraft,
): { answers: HealthFormAnswer[]; errors: Record<number, string> } {
  const answers: HealthFormAnswer[] = [];
  const errors: Record<number, string> = {};
  for (const q of questions) {
    const v = (draft[q.index] ?? "").trim();
    if (!v) {
      if (q.is_required) errors[q.index] = C.required;
      continue;
    }
    if (isChoice(q) && q.options.length > 0 && !q.options.some((o) => o.value === v)) {
      errors[q.index] = C.chooseOption;
      continue;
    }
    answers.push({ index: q.index, value: v });
  }
  return { answers, errors };
}
