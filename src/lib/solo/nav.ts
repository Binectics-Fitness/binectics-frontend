/**
 * The solo member's top bar: Today, Fasting, Water, Progress, Log, Explore
 * (design: web canvas "Overview and web navigation"). Every link is always
 * shown: the pages are on for everyone.
 */
export interface SoloNavLink {
  label: string;
  href: string;
}

export const SOLO_HREFS = {
  today: "/dashboard/member",
  fasting: "/dashboard/member/fasting",
  fastingStages: "/dashboard/member/fasting/stages",
  fastingHistory: "/dashboard/member/fasting/history",
  water: "/dashboard/member/water",
  progress: "/dashboard/member/progress",
  targets: "/dashboard/member/progress/targets",
  todayList: "/dashboard/member/today-list",
  log: "/dashboard/member/log",
  explore: "/marketplace",
} as const;

export function soloNavLinks(): SoloNavLink[] {
  return [
    { label: "Today", href: SOLO_HREFS.today },
    { label: "Fasting", href: SOLO_HREFS.fasting },
    { label: "Water", href: SOLO_HREFS.water },
    { label: "Progress", href: SOLO_HREFS.progress },
    { label: "Log", href: SOLO_HREFS.log },
    { label: "Explore", href: SOLO_HREFS.explore },
  ];
}

/** The rest of the member app, one step away in the account menu. */
export const SOLO_MENU_LINKS: SoloNavLink[] = [
  { label: "Privacy and sharing", href: "/dashboard/settings/privacy" },
  { label: "Help", href: "/help" },
];

const LOG_PATHS = [
  "/dashboard/member/weight-log",
  "/dashboard/member/meal-log",
  "/dashboard/member/workout-log",
];

/**
 * The solo bar's label for the page on screen. Pages name their label for the
 * full bar ("Home" is Today here); the three existing log pages name none and
 * belong under Log.
 */
export function soloActiveLabel(activeLabel: string, pathname: string | null): string {
  if (activeLabel === "Home") return "Today";
  if (activeLabel) return activeLabel;
  const here = pathname?.replace(/\/$/, "") ?? "";
  if (LOG_PATHS.some((p) => here === p || here.startsWith(`${p}/`))) return "Log";
  return "";
}

/**
 * The member's own tools for a member with a gym or coach (owner answer, 19
 * Nov 2026: own tracking is kept when a member gains a coach). The full bar
 * groups them under one "Tracking" menu so it stays short; the phone menu
 * lists them under the same heading. Same pages as the solo bar.
 */
export const TRACKING_LABEL = "Tracking";

export function trackingNavLinks(): SoloNavLink[] {
  return [
    { label: "Fasting", href: SOLO_HREFS.fasting },
    { label: "Water", href: SOLO_HREFS.water },
    { label: "Progress", href: SOLO_HREFS.progress },
    { label: "Daily list", href: SOLO_HREFS.todayList },
    { label: "Log", href: SOLO_HREFS.log },
  ];
}

/** The labels the tracking pages pass the shell ("Today" is the daily list's). */
const TRACKING_PAGE_LABELS = new Set(["Fasting", "Water", "Progress", "Log", "Today"]);

/** Whether the page on screen is one of the tracking pages, on the full bar. */
export function isTrackingPage(activeLabel: string, pathname: string | null): boolean {
  if (TRACKING_PAGE_LABELS.has(activeLabel)) return true;
  if (activeLabel) return false;
  return soloActiveLabel("", pathname) === "Log";
}
