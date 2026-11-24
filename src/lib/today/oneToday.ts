/**
 * The rules of the "one Today" for a member with a coach or gym (today-canvas
 * Direction C, 19 Nov 2026), as pure functions so each is tested without
 * drawing the page. A port of binectics-mobile src/screens/home/oneToday.ts,
 * reading the web's own API shapes.
 */
import type { MyProviders } from "@/lib/api/marketplace";
import type { AgendaTask, MyProgram } from "@/lib/api/myPrograms";
import { firstNameOf, sheetSeesHeading, coachSees, GYM_SEES, ONLY_YOU_ITEMS, onlyYouItems, SHARE_PROGRESS_FOOT, SHEET_FOOT_COACH, SHEET_FOOT_GYM, type Audience, type NamedAudience } from "./todayCopy";

/** One of the member's providers, as Today names them. */
export interface TodayProvider {
  key: string;
  kind: "trainer" | "dietitian" | "gym";
  name: string;
  /** Trainers and dietitians: their user id (messages, session types). */
  userId?: string;
  /** Gyms: the organization. */
  organizationId?: string;
  imageUrl?: string | null;
  /** Their published listing, where web books a session. */
  listingId?: string | null;
}

export type Coach = TodayProvider & { kind: "trainer" | "dietitian"; userId: string };

/** "Dietitian" reads as a dietitian; any other professional role is coached as a trainer. */
function coachKind(role: string | null | undefined): "trainer" | "dietitian" {
  return /diet/i.test(role ?? "") ? "dietitian" : "trainer";
}

/** GET /marketplace/my-providers as one list: professionals (newest first as the API sends them), then gyms. */
export function providersOf(data: MyProviders | null | undefined): TodayProvider[] {
  const pros: TodayProvider[] = (data?.professionals ?? []).map((p) => ({
    key: `pro:${p.professional_id}`,
    kind: coachKind(p.role),
    name: [p.first_name, p.last_name].filter((s) => s?.trim()).join(" ").trim() || "Your coach",
    userId: p.professional_id,
    imageUrl: p.profile_picture,
    listingId: p.listing?._id ?? null,
  }));
  const gyms: TodayProvider[] = (data?.gyms ?? []).map((g) => ({
    key: `gym:${g.organization_id}`,
    kind: "gym",
    name: g.name?.trim() || "Your gym",
    organizationId: g.organization_id,
    listingId: g.listing?._id ?? null,
  }));
  return [...pros, ...gyms];
}

/** The coach the card names: the newest trainer or dietitian. Gyms are never a coach. */
export function coachOf(providers: readonly TodayProvider[]): Coach | null {
  for (const p of providers) {
    if (p.kind !== "gym" && p.userId) return p as Coach;
  }
  return null;
}

/** Who the privacy line names: one provider by first name (a gym by its name), two or more as "your coaches". */
export function audienceOf(providers: readonly TodayProvider[]): Audience {
  if (providers.length === 0) return { kind: "none" };
  if (providers.length > 1) return { kind: "many" };
  const only = providers[0];
  return { kind: "one", name: only.kind === "gym" ? only.name : firstNameOf(only.name) };
}

export type DarkCard = "program" | "fast" | null;

/** R6: at most one dark card. The program first, then a running fast; the loser is a light row. */
export function darkCard(input: { program: boolean; fastRunning: boolean }): DarkCard {
  if (input.program) return "program";
  if (input.fastRunning) return "fast";
  return null;
}

/** The device's local calendar day, YYYY-MM-DD. */
export function localDay(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** A task's calendar day (the API stores UTC midnight of the program's day). */
export const taskDay = (scheduledFor: string) => scheduledFor.slice(0, 10);

/** A coach's tasks: the member's own Starter sessions are not a coach's plan. */
export function coachTasks(items: readonly AgendaTask[] | null | undefined): AgendaTask[] {
  return (items ?? []).filter((t) => t.source !== "starter");
}

/** R5: the weight cell hides when today's plan already asks for a weight. */
export function planAsksWeightToday(items: readonly AgendaTask[] | null | undefined, now: Date): boolean {
  const today = localDay(now);
  return (items ?? []).some(
    (t) => t.component_type === "measurement" && t.metric === "weight_kg" && taskDay(t.scheduled_for) === today,
  );
}

/** L1-L3: which own-log kinds a coach's task ticks from. */
export function linkedKinds(items: readonly AgendaTask[] | null | undefined): { fast: boolean; water: boolean } {
  const list = items ?? [];
  return {
    fast: list.some((t) => t.auto_metric === "fasting_hours"),
    water: list.some((t) => t.auto_metric === "water_glasses"),
  };
}

/** L1: today's linked kinds leave the compact card (the task carries them). */
export function linkedKindsToday(items: readonly AgendaTask[] | null | undefined, now: Date) {
  const today = localDay(now);
  return linkedKinds((items ?? []).filter((t) => taskDay(t.scheduled_for) === today));
}

const HEALTH_METRICS = new Set(["steps", "sleep_minutes", "resting_hr_bpm", "weight_kg", "exercise_minutes", "exercise_session"]);

/** A task a health app settles (not the member's own fasting or water logs). */
export function hasHealthTask(items: readonly AgendaTask[] | null | undefined): boolean {
  return (items ?? []).some((t) => !!t.auto_metric && HEALTH_METRICS.has(t.auto_metric));
}

export interface StartsLater {
  instanceId: string;
  name: string;
  startsOn: Date;
}

/**
 * S2: a coach's program assigned to start on a later day (status "assigned"
 * with a future started_at). Without a start date nothing is said.
 */
export function startsLater(programs: readonly MyProgram[] | null | undefined, now: Date): StartsLater | null {
  const today = localDay(now);
  const ahead = (programs ?? [])
    .filter((p) => p.status === "assigned" && p.kind !== "one_off" && p.source !== "starter" && !!p.started_at)
    .map((p) => ({ p, at: new Date(p.started_at as string) }))
    .filter(({ at }) => !Number.isNaN(at.getTime()) && localDay(at) > today)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const first = ahead[0];
  return first ? { instanceId: first.p._id, name: first.p.name, startsOn: first.at } : null;
}

/** "Mon 23 Nov", local. */
export function shortDay(at: Date): string {
  return at.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
}

/**
 * A plan from a coach is running: an active program or one-off tasks (not the
 * member's own Starter), or tasks on today's agenda.
 */
export function hasCoachPlan(programs: readonly MyProgram[] | null | undefined, tasks: readonly AgendaTask[]): boolean {
  return tasks.length > 0 || (programs ?? []).some((p) => p.status === "active" && p.source !== "starter");
}

/**
 * The coaches list (C4, S7; mobile showPeople): with two or more coaches;
 * with one, only when nothing else on Today already leads to them (no coach
 * card, no plan from them).
 */
export function showCoachList(input: { coaches: number; coachCard: boolean; hasPlan: boolean }): boolean {
  if (input.coaches >= 2) return true;
  return input.coaches === 1 && !input.coachCard && !input.hasPlan;
}

// ─── "What Tunde sees" (R4, L3) ─────────────────────────────────────────────

export interface SheetFacts {
  linked: boolean;
  healthTask: boolean;
  shareProgress: boolean;
}

export interface SheetSection {
  heading: string;
  items: string[];
}

/** What each provider can read, by who they are (mobile WhatTheySeeSheet.sheetSections). */
export function sheetSections(
  audience: NamedAudience,
  providers: readonly TodayProvider[],
  facts: SheetFacts = { linked: false, healthTask: false, shareProgress: true },
): { sees: SheetSection[]; only: string[]; foot: string } {
  const gyms = providers.filter((p) => p.kind === "gym");
  const coaches = providers.filter((p) => p.kind !== "gym");
  if (coaches.length === 0) {
    const sees =
      gyms.length <= 1 && audience.kind === "one"
        ? [{ heading: sheetSeesHeading(audience), items: GYM_SEES }]
        : gyms.map((g) => ({ heading: sheetSeesHeading({ kind: "one", name: g.name }), items: GYM_SEES }));
    return { sees, only: ONLY_YOU_ITEMS, foot: SHEET_FOOT_GYM };
  }
  const one = audience.kind === "one" && coaches.length === 1 && gyms.length === 0;
  const items = coachSees(one ? (audience as { name: string }).name : null, {
    ...facts,
    dietitian: one && coaches[0].kind === "dietitian",
  });
  const sees: SheetSection[] = [{ heading: sheetSeesHeading(audience), items }];
  for (const g of gyms) sees.push({ heading: sheetSeesHeading({ kind: "one", name: g.name }), items: GYM_SEES });
  const foot = facts.shareProgress ? `${SHEET_FOOT_COACH} ${SHARE_PROGRESS_FOOT}` : SHEET_FOOT_COACH;
  return { sees, only: onlyYouItems(facts), foot };
}
