/**
 * The coach note on the fasting start page (Today board 07-Risks, R1; a port
 * of binectics-mobile src/utils/fastCoachNote.ts, #251).
 *
 * Fasts are private: no trainer or dietitian can see them. When a member who
 * has one starts a fast, the page says so, lists today's meal slots from a
 * dietitian's meal plan, and offers to tell that person. Pure: the page
 * passes in what it read from GET /marketplace/my-providers and
 * GET /progress/my-diet-plans.
 *
 * Rules (owner, 19 Nov 2026):
 *  - only a trainer or dietitian the member is a client of counts; gyms (and
 *    memberships sold by a practice) never count and are never named;
 *  - "Tell" goes to the dietitian with a meal plan today first, else any
 *    dietitian, else the trainer;
 *  - meal slots only (DietMeal.meal_type): plans have no meal times, so the
 *    note never says which meal the fast runs through.
 */
import type { DayOfWeek, DietPlan } from "@/lib/api/progress";
import type { MyProviders } from "@/lib/api/marketplace";
import { SLOT_LABELS, SLOT_ORDER, mealsForWeekday } from "@/lib/progress/weeklyPlan";
import { coachesCantSee, mealPlanToday } from "./fastingCopy";

export interface FastCoachNote {
  /** "Ngozi and Tunde can't see your fasts." */
  cantSee: string;
  /** "Your meal plan from Ngozi has ...", or null without one today. */
  mealPlan: string | null;
  /** Who "Tell <name>" messages. */
  tell: { userId: string; name: string; firstName: string; kind: "trainer" | "dietitian" };
}

type Professional = MyProviders["professionals"][number];
type Weekday = Exclude<DayOfWeek, "every_day">;

const kindOf = (p: Professional): "trainer" | "dietitian" =>
  /dietitian/i.test(p.role ?? "") || p.listing?.account_type === "dietitian" ? "dietitian" : "trainer";

const fullName = (p: Professional): string => [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.listing?.headline || "Your coach";

const firstNameOf = (p: Professional): string => p.first_name?.trim() || fullName(p).split(/\s+/)[0] || fullName(p);

const authorIdOf = (plan: Pick<DietPlan, "created_by">): string | null => {
  const a = plan.created_by;
  if (typeof a === "string") return a;
  return a && typeof a === "object" && a._id ? String(a._id) : null;
};

/** Today's meal slots, lowercased and in day order, across the plans this person wrote. */
export function todaysSlots(plans: readonly Pick<DietPlan, "created_by" | "meals" | "days">[], authorId: string, weekday: Weekday): string[] {
  const slots = new Set(
    plans.filter((p) => authorIdOf(p) === authorId).flatMap((p) => mealsForWeekday(p, weekday).map((meal) => meal.meal_type)),
  );
  return SLOT_ORDER.filter((s) => slots.has(s)).map((s) => SLOT_LABELS[s].toLowerCase());
}

export function fastCoachNote(
  providers: MyProviders | null | undefined,
  plans: readonly Pick<DietPlan, "created_by" | "meals" | "days">[] | null | undefined,
  weekday: Weekday,
): FastCoachNote | null {
  const seen = new Set<string>();
  const coaches = (providers?.professionals ?? []).filter((p) => {
    if (!p.professional_id || seen.has(p.professional_id)) return false;
    seen.add(p.professional_id);
    return true;
  });
  if (coaches.length === 0) return null;

  const slotsBy = new Map(coaches.map((p) => [p.professional_id, kindOf(p) === "dietitian" ? todaysSlots(plans ?? [], p.professional_id, weekday) : []]));
  // Dietitian with a meal plan today, then any dietitian, then trainers; the
  // API's order (newest first) within each.
  const rank = (p: Professional) => (kindOf(p) === "dietitian" ? (slotsBy.get(p.professional_id)!.length ? 0 : 1) : 2);
  const ordered = coaches
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map((x) => x.p);

  const tell = ordered[0];
  const tellFirst = firstNameOf(tell);
  const slots = slotsBy.get(tell.professional_id)!;
  return {
    cantSee: coachesCantSee(ordered.map(firstNameOf)),
    mealPlan: slots.length ? mealPlanToday(tellFirst, slots) : null,
    tell: { userId: tell.professional_id, name: fullName(tell), firstName: tellFirst, kind: kindOf(tell) },
  };
}
