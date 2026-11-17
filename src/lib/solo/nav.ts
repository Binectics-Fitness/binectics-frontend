/**
 * The solo member's top bar: Today, Fasting, Water, Progress, Log, Explore
 * (design: web canvas "Overview and web navigation"). A link appears only
 * when its page exists AND its server flag is on, so a member never lands on
 * a dead link:
 *
 *   Today     always
 *   Fasting   solo_fasting (W2)
 *   Water     solo_water
 *   Progress  solo_history (W2)
 *   Log       always (the hub only links to the existing log pages)
 *   Explore   always
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

export function soloNavLinks(flags: { water: boolean; fasting?: boolean; history?: boolean }): SoloNavLink[] {
  return [
    { label: "Today", href: SOLO_HREFS.today },
    ...(flags.fasting ? [{ label: "Fasting", href: SOLO_HREFS.fasting }] : []),
    ...(flags.water ? [{ label: "Water", href: SOLO_HREFS.water }] : []),
    ...(flags.history ? [{ label: "Progress", href: SOLO_HREFS.progress }] : []),
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
