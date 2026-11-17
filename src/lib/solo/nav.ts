/**
 * The solo member's top bar: Today, Fasting, Water, Progress, Log, Explore
 * (design: web canvas "Overview and web navigation"). A link appears only
 * when its page exists AND its server flag is on, so a member never lands on
 * a dead link:
 *
 *   Today     always
 *   Water     solo_water
 *   Log       always (the hub only links to the existing log pages)
 *   Explore   always
 *   Fasting   later milestone (W2): not built, never shown in W1
 *   Progress  later milestone (W4): not built, never shown in W1
 *
 * When Fasting and Progress ship they join here behind solo_fasting and
 * solo_history respectively.
 */
export interface SoloNavLink {
  label: string;
  href: string;
}

export const SOLO_HREFS = {
  today: "/dashboard/member",
  water: "/dashboard/member/water",
  todayList: "/dashboard/member/today-list",
  log: "/dashboard/member/log",
  explore: "/marketplace",
} as const;

export function soloNavLinks(flags: { water: boolean }): SoloNavLink[] {
  return [
    { label: "Today", href: SOLO_HREFS.today },
    ...(flags.water ? [{ label: "Water", href: SOLO_HREFS.water }] : []),
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
