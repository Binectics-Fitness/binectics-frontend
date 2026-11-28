/**
 * The member navigation under the runtime flag `member_shell_v2` (API default
 * OFF; the mobile app reads the same flag). Tab bar A from the product-direction
 * package: Today, Train, Log or Check in (centre), Progress, Me. Explore leaves
 * the bar and is reached from Today and Me. Messages stays on the web bar
 * (board A10) because the web has no inbox tab.
 *
 * Nothing here moves a page: every old route keeps answering, the bar only
 * groups them. Mirrors binectics-mobile src/utils/memberShell.ts and
 * src/utils/centreTab.ts.
 */
import { AccountType, MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { SOLO_HREFS } from "@/lib/solo/nav";

export const MEMBER_SHELL_V2_FLAG = "member_shell_v2";

export type MemberNavKey = "today" | "train" | "progress" | "messages" | "me";

export interface MemberNavLinkV2 {
  key: MemberNavKey;
  label: string;
  href: string;
}

export const MEMBER_ME_HREF = "/dashboard/member/me";
export const MEMBER_TRAIN_HREF = "/dashboard/member/workouts";

/** The bar, left to right. The centre action (Log or Check in) is drawn beside it. */
export const MEMBER_NAV_V2: readonly MemberNavLinkV2[] = [
  { key: "today", label: "Today", href: "/dashboard/member" },
  { key: "train", label: "Train", href: MEMBER_TRAIN_HREF },
  { key: "progress", label: "Progress", href: SOLO_HREFS.progress },
  { key: "messages", label: "Messages", href: "/dashboard/messages" },
  { key: "me", label: "Me", href: MEMBER_ME_HREF },
];

/** Train's sections: the plan, the starter program, meal plans and sessions (bookings). */
export const TRAIN_SEGMENTS: readonly { key: string; label: string; href: string; matches: readonly string[] }[] = [
  { key: "plan", label: "Plan", href: MEMBER_TRAIN_HREF, matches: ["/dashboard/member/workouts"] },
  { key: "starter", label: "Starter", href: "/dashboard/member/starter", matches: ["/dashboard/member/starter"] },
  { key: "meals", label: "Meal plans", href: "/dashboard/member/meal-plans", matches: ["/dashboard/member/meal-plans"] },
  { key: "sessions", label: "Sessions", href: "/dashboard/bookings", matches: ["/dashboard/bookings", "/dashboard/sessions"] },
];

const LOG_PATHS = [
  "/dashboard/member/log",
  "/dashboard/member/weight-log",
  "/dashboard/member/meal-log",
  "/dashboard/member/workout-log",
  "/dashboard/member/journal",
  "/dashboard/member/goals",
  "/dashboard/member/history",
];
const ME_PATHS = [
  MEMBER_ME_HREF,
  "/dashboard/member/billing",
  "/dashboard/member/payments",
  "/dashboard/member/purchases",
  "/dashboard/member/reports",
  "/dashboard/member/requests",
  "/dashboard/member/content",
  "/dashboard/saved-providers",
  "/dashboard/settings",
  "/dashboard/notifications",
  "/dashboard/loyalty",
];

function under(here: string, paths: readonly string[]): boolean {
  return paths.some((p) => here === p || here.startsWith(`${p}/`));
}

function trimmed(pathname: string | null): string {
  return pathname?.replace(/\/$/, "") ?? "";
}

/** Which item of the new bar the page on screen belongs to; "log" is the centre action; null highlights nothing. */
export function memberNavActiveV2(pathname: string | null): MemberNavKey | "log" | null {
  const here = trimmed(pathname);
  if (here === "/dashboard/member") return "today";
  if (under(here, TRAIN_SEGMENTS.flatMap((s) => s.matches))) return "train";
  if (under(here, LOG_PATHS)) return "log";
  if (under(here, ["/dashboard/member/progress", "/dashboard/member/activity"])) return "progress";
  if (under(here, ["/dashboard/member/fasting", "/dashboard/member/water", "/dashboard/member/today-list"])) return "today";
  if (under(here, ["/dashboard/messages"])) return "messages";
  if (under(here, ME_PATHS)) return "me";
  return null;
}

/** The Train section the page is in, or null off Train. */
export function trainSegmentFor(pathname: string | null): string | null {
  const here = trimmed(pathname);
  return TRAIN_SEGMENTS.find((s) => under(here, s.matches))?.key ?? null;
}

export type CentreMode = "checkin" | "log";

export interface CentreAction {
  mode: CentreMode;
  label: string;
  href: string;
}

export const LOG_ACTION: CentreAction = { mode: "log", label: "Log", href: SOLO_HREFS.log };
export const CHECK_IN_ACTION: CentreAction = { mode: "checkin", label: "Check in", href: "/check-in" };

function isGym(sub: MembershipSubscription): boolean {
  const org = sub.organization_id;
  const type = typeof org === "string" ? undefined : org?.account_type;
  // An API older than the account type sent none: those were gyms (as on mobile).
  return !type || type === AccountType.GYM_OWNER;
}

function opensDoor(sub: MembershipSubscription, nowMs: number): boolean {
  if (sub.status === MembershipSubscriptionStatus.ACTIVE || sub.status === MembershipSubscriptionStatus.PAST_DUE) return true;
  if (sub.status === MembershipSubscriptionStatus.CANCELLED) {
    const end = sub.end_date ? Date.parse(sub.end_date) : NaN;
    return Number.isFinite(end) && end > nowMs;
  }
  return false;
}

/**
 * Check in when a gym membership opens the door (active, past due, cancelled
 * with paid time left) or is paused; Log for everyone else. Same rule as the
 * mobile centre tab.
 */
export function centreActionFor(subs: readonly MembershipSubscription[] | null | undefined, nowMs: number): CentreAction {
  const gyms = (subs ?? []).filter(isGym);
  if (gyms.some((s) => opensDoor(s, nowMs) || s.status === MembershipSubscriptionStatus.PAUSED)) return CHECK_IN_ACTION;
  return LOG_ACTION;
}
