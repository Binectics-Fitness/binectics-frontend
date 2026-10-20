import type { MealFeedback, MealReply } from "@/lib/api/progress";

/** The API's limit on a reply (ReplyToMealDto). */
export const MAX_MEAL_REPLY = 1000;

/** Who wrote a reply, as the reads populate it; "Your dietitian" otherwise. */
export function mealReplyAuthorName(reply: MealReply | null | undefined): string {
  const author = reply?.author_id;
  if (author && typeof author === "object") {
    const name = [author.first_name, author.last_name].filter(Boolean).join(" ").trim();
    if (name) return name;
  }
  return "Your dietitian";
}

/** True when `userId` wrote the reply (only its author may edit it). */
export function isOwnMealReply(reply: MealReply | null | undefined, userId: string | null | undefined): boolean {
  if (!reply || !userId) return false;
  const author = reply.author_id;
  const id = typeof author === "object" && author ? author._id : author;
  return String(id ?? "") === String(userId);
}

/** Why a reply can't be sent, or null. */
export function mealReplyError(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Write a reply first.";
  if (trimmed.length > MAX_MEAL_REPLY) return `Keep it under ${MAX_MEAL_REPLY} characters.`;
  return null;
}

/**
 * Every client's meals in one list, newest meal first, each meal once (a
 * meal is read through each link to its member, so two links can return
 * the same one).
 */
export function mergeMealFeed<T extends MealFeedback>(groups: T[][], size: number): T[] {
  const seen = new Set<string>();
  return groups
    .flat()
    .filter((m) => (seen.has(m._id) ? false : (seen.add(m._id), true)))
    .sort((a, b) => new Date(b.meal_date).getTime() - new Date(a.meal_date).getTime())
    .slice(0, size);
}
