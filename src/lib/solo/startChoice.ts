import { SOLO_STORAGE_PREFIX } from "./storage";

/**
 * What a new member said on the two onboarding screens, kept in this browser
 * only, as the mobile app keeps it on the phone (binectics-mobile
 * src/utils/solo.ts saveStartPath / saveSoloTools). Nothing goes to the
 * server. The keys start with `solo:`, so sign-out wipes them.
 */

/** "How would you like to start?" */
export type StartPath = "own" | "provider" | "invite";
export const START_PATHS: readonly StartPath[] = ["own", "provider", "invite"];

/** "What would you like to use?" Same ids as mobile. */
export type SoloTool = "workouts" | "fasting" | "water" | "checklist" | "weight" | "logs" | "journal";
export const SOLO_TOOLS: readonly SoloTool[] = ["workouts", "fasting", "water", "checklist", "weight", "logs", "journal"];

const pathKey = (userId: string) => `${SOLO_STORAGE_PREFIX}start-path:${userId}`;
const toolsKey = (userId: string) => `${SOLO_STORAGE_PREFIX}tools:${userId}`;

export function isStartPath(value: unknown): value is StartPath {
  return typeof value === "string" && (START_PATHS as readonly string[]).includes(value);
}

export function onlySoloTools(value: unknown): SoloTool[] {
  return Array.isArray(value) ? value.filter((t): t is SoloTool => (SOLO_TOOLS as readonly string[]).includes(t as string)) : [];
}

/** Never throws: the choice only shapes the first screens. */
export function saveStartPath(userId: string, path: StartPath): void {
  try {
    window.localStorage.setItem(pathKey(userId), path);
  } catch {
    /* storage blocked */
  }
}

export function loadStartPath(userId: string): StartPath | null {
  try {
    const raw = window.localStorage.getItem(pathKey(userId));
    return isStartPath(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveSoloTools(userId: string, tools: readonly SoloTool[]): void {
  try {
    window.localStorage.setItem(toolsKey(userId), JSON.stringify(onlySoloTools(tools)));
  } catch {
    /* storage blocked */
  }
}

export function loadSoloTools(userId: string): SoloTool[] {
  try {
    const raw = window.localStorage.getItem(toolsKey(userId));
    return raw ? onlySoloTools(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}
