"use client";

import { Clock, Droplet, Dumbbell, ListChecks, Scale, Utensils, type LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ds/IconTile";
import { useAuth } from "@/contexts/AuthContext";
import type { Tone } from "@/lib/ui/tones";
import { isStartPath, onlySoloTools, saveSoloTools, saveStartPath, type SoloTool, type StartPath } from "@/lib/solo/startChoice";
import type { StepProps } from "./_components";

/**
 * The member track, as the mobile app has it since 20 Nov 2026
 * (binectics-mobile MemberOnboardingScreen + SoloStartScreens, #272 and
 * #249; board trends-2026 14-Onboarding frames 3 and 4):
 *
 *   1. "How would you like to start?": on my own, with a gym or coach, or
 *      an invite. Nothing preselected.
 *   2. Only for "on my own": "What would you like to use?", optional, with
 *      Skip.
 *
 * Nothing about the member is asked up front. Goal, city and date of birth
 * are asked where they are used (the goal in the Starter picker and Explore,
 * the city in Explore, date of birth at the first fast). Permissions are
 * asked in context too, so this track asks for none. The old track asked for
 * a goal, a city and training times, and then said it had "found providers"
 * it never looked for.
 */

// ─── Copy (mobile src/constants/onboardingCopy.ts, screens 3 and 4) ─────────
export const stepOf = (n: 1 | 2): string => `Step ${n} of 2`;
export const startTitle = (firstName?: string): string =>
  firstName ? `Welcome, ${firstName}. How would you like to start?` : "Welcome. How would you like to start?";
export const START_SUB = "You can change this at any time.";
export const MOST_PEOPLE = "Most people start here";
export const PATHS: Record<StartPath, { title: string; body: string }> = {
  own: { title: "On my own", body: "Log weight, meals and activity, and follow a free beginner program." },
  provider: { title: "With a gym or coach", body: "Browse gyms, trainers and dietitians near you." },
  invite: { title: "I have an invite", body: "Join the gym or coach who invited you." },
};
export const PRIVATE_LINE = "Your logs are private. Nothing is shared unless you choose to share it.";
export const CHOOSE_TO_CONTINUE = "Choose one to continue";
export const CONTINUE = "Continue";

export const TOOLS_TITLE = "What would you like to use?";
/**
 * Mobile says "Pick any. They go at the top of Today." Web Today does not
 * read the picks yet (it is owned by the member Today work), so the second
 * sentence would be a claim the page does not keep.
 */
export const TOOLS_SUB = "Pick any.";
export const SKIP = "Skip";
export const CONTINUE_WITHOUT = "Continue without picking";
export const continueWith = (n: number): string => `Continue with ${n}`;
export const TOOLS: Record<SoloTool, { title: string; body: string }> = {
  workouts: { title: "Beginner workouts", body: "A free program you follow on your own" },
  fasting: { title: "Fasting", body: "A timer for a fast you start yourself" },
  water: { title: "Water", body: "Count your glasses" },
  checklist: { title: "A daily list", body: "A few lines to tick off each day" },
  weight: { title: "Weight", body: "Log it and see the trend" },
  logs: { title: "Meals and activity", body: "A simple record, in your own words" },
  journal: { title: "A private journal", body: "Notes only you can read" },
};

// ─── Step data ──────────────────────────────────────────────────────────────
/** Keys this track keeps in the onboarding page's step data. */
export const MEMBER_PATH = "startPath";
export const MEMBER_TOOLS = "soloTools";

export const MEMBER_STEP_COUNT = 2;

export function pickedPath(data: Record<string, unknown>): StartPath | null {
  return isStartPath(data[MEMBER_PATH]) ? (data[MEMBER_PATH] as StartPath) : null;
}

export function pickedTools(data: Record<string, unknown>): SoloTool[] {
  return onlySoloTools(data[MEMBER_TOOLS]);
}

/**
 * The step to show. The old track had four steps; a step past the end of
 * this one (a page open on the old track's step 3 or 4 when the new code
 * loaded) shows the last step instead of an empty stage.
 */
export function clampMemberStep(step: number): number {
  return Math.max(0, Math.min(step, MEMBER_STEP_COUNT));
}

/** Continue on this step finishes onboarding: step 1 for every path but "on my own", and step 2. */
export function memberFinishesAt(step: number, data: Record<string, unknown>): boolean {
  if (step >= MEMBER_STEP_COUNT) return true;
  if (step !== 1) return false;
  const path = pickedPath(data);
  return path !== null && path !== "own";
}

/** Step 1 cannot go on until a path is picked. */
export function memberCanContinue(step: number, data: Record<string, unknown>): boolean {
  return step !== 1 || pickedPath(data) !== null;
}

export function memberContinueLabel(step: number, data: Record<string, unknown>): string {
  if (step === 1) return pickedPath(data) ? CONTINUE : CHOOSE_TO_CONTINUE;
  const n = pickedTools(data).length;
  return n > 0 ? continueWith(n) : CONTINUE_WITHOUT;
}

/**
 * Where each path lands once onboarding is done: on my own, Today; with a
 * gym or coach, Explore; an invite, the page that lists invitations to
 * accept (mobile opens its invite screen).
 */
export function memberLanding(path: StartPath | null): string {
  if (path === "provider") return "/marketplace";
  if (path === "invite") return "/dashboard/member/requests";
  return "/dashboard/member";
}

/**
 * Saves a member step. Only this browser keeps the answers, as only the
 * phone does on mobile: no goal, city or schedule goes to the profile any
 * more. Answers the old track left in the step data are ignored. Never
 * throws.
 */
export function persistMemberStep(step: number, data: Record<string, unknown>, userId: string | null | undefined): void {
  if (!userId) return;
  const path = pickedPath(data);
  if (step === 1 && path) saveStartPath(userId, path);
  if (step === 2 && path === "own") saveSoloTools(userId, pickedTools(data));
}

// ─── Screens ────────────────────────────────────────────────────────────────
const PATH_ORDER: StartPath[] = ["own", "provider", "invite"];

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: 20, height: 20, border: checked ? "1.5px solid var(--ink)" : "1.5px solid var(--border-2)", background: "var(--bg)" }}
    >
      {checked && <span className="rounded-full" style={{ width: 10, height: 10, background: "var(--ink)" }} />}
    </span>
  );
}

export function MemberStartStep({ data, setField }: StepProps) {
  const { user } = useAuth();
  const firstName = user?.first_name?.trim().split(/\s+/)[0] || undefined;
  const picked = pickedPath(data);
  return (
    <>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em" }}>{stepOf(1)}</div>
        <h1 style={{ fontSize: 36, letterSpacing: "-0.025em", fontWeight: 500, marginTop: 10, color: "var(--ink)" }}>{startTitle(firstName)}</h1>
        <p style={{ fontSize: "15.5px", color: "var(--fg-2)", marginTop: 12, lineHeight: 1.55 }}>{START_SUB}</p>
      </div>
      <div role="radiogroup" aria-label="How would you like to start?" className="flex flex-col gap-2.5">
        {PATH_ORDER.map((id, i) => {
          const on = picked === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setField(MEMBER_PATH, id)}
              className="flex w-full items-center gap-3.5 rounded-(--r-3) text-left"
              style={{
                minHeight: 44,
                padding: 16,
                background: "var(--bg)",
                // Selected is ink (Sep 29 ruling), a heavier edge as the board draws it.
                border: on ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                {i === 0 && (
                  <span
                    className="mb-1 self-start rounded-(--r-1) px-2 py-0.5"
                    style={{ background: "var(--signal-soft)", color: "var(--signal-ink)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}
                  >
                    {MOST_PEOPLE}
                  </span>
                )}
                <span style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{PATHS[id].title}</span>
                <span style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.45 }}>{PATHS[id].body}</span>
              </span>
              <Radio checked={on} />
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.5 }}>{PRIVATE_LINE}</p>
    </>
  );
}

interface ToolOption {
  id: SoloTool;
  icon: LucideIcon;
  /** Colour by meaning: fasting amber, water blue, workouts move, meals violet; the rest neutral. */
  tone: Tone;
}

/**
 * Only tools web has: workouts (the Starter Program), fasting, water, the
 * daily list, weight, and meals and activity. The journal is not on web yet,
 * so it is not offered here.
 */
export function availableTools(): ToolOption[] {
  return [
    { id: "workouts", icon: Dumbbell, tone: "move" },
    { id: "fasting", icon: Clock, tone: "fast" },
    { id: "water", icon: Droplet, tone: "water" },
    { id: "checklist", icon: ListChecks, tone: "neutral" },
    { id: "weight", icon: Scale, tone: "neutral" },
    { id: "logs", icon: Utensils, tone: "meal" },
  ];
}

export function MemberToolsStep({ data, setField }: StepProps) {
  const picked = pickedTools(data);
  const toggle = (id: SoloTool) => setField(MEMBER_TOOLS, picked.includes(id) ? picked.filter((t) => t !== id) : [...picked, id]);
  return (
    <>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em" }}>{stepOf(2)}</div>
        <h1 style={{ fontSize: 36, letterSpacing: "-0.025em", fontWeight: 500, marginTop: 10, color: "var(--ink)" }}>{TOOLS_TITLE}</h1>
        <p style={{ fontSize: "15.5px", color: "var(--fg-2)", marginTop: 12, lineHeight: 1.55 }}>{TOOLS_SUB}</p>
      </div>
      <fieldset className="m-0 rounded-(--r-3) border p-0" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <legend className="sr-only">{TOOLS_TITLE}</legend>
        {availableTools().map((o, i) => {
          const on = picked.includes(o.id);
          return (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-2"
              style={{ minHeight: 56, borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
            >
              <IconTile icon={o.icon} tone={o.tone} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{TOOLS[o.id].title}</span>
                <span style={{ fontSize: 14, color: "var(--fg-3)" }}>{TOOLS[o.id].body}</span>
              </span>
              {/* Square: more than one can be picked. */}
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(o.id)}
                className="h-5 w-5 shrink-0 cursor-pointer"
                style={{ accentColor: "var(--ink)" }}
              />
            </label>
          );
        })}
      </fieldset>
    </>
  );
}

export const MEMBER_STEPS = [MemberStartStep, MemberToolsStep];
