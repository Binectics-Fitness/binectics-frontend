/**
 * Web member parity, batch B (fasting): the end action (owner decision B),
 * the start-time control (mobile #261) and the coach note with "Tell <coach>"
 * (mobile #251).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => <a href={href} {...rest}>{children}</a>,
}));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/dashboard/member/fasting",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Ada", last_name: "A" }, isLoading: false, logout: vi.fn() }),
}));
const fasting = vi.hoisted(() => ({
  screen: vi.fn(), settings: vi.fn(), start: vi.fn(), current: vi.fn(), history: vi.fn(), summary: vi.fn(),
  edit: vi.fn(), end: vi.fn(), undoEnd: vi.fn(), addFeeling: vi.fn(), remove: vi.fn(),
}));
const market = vi.hoisted(() => ({ getMyProviders: vi.fn() }));
const progress = vi.hoisted(() => ({ getMyDietPlans: vi.fn() }));
const messaging = vi.hoisted(() => ({ startThread: vi.fn(), sendMessage: vi.fn() }));
vi.mock("@/lib/api/fasting", async (o) => ({ ...(await o<typeof import("@/lib/api/fasting")>()), fastingService: fasting }));
vi.mock("@/lib/api/marketplace", async (o) => ({ ...(await o<typeof import("@/lib/api/marketplace")>()), marketplaceService: market }));
vi.mock("@/lib/api/progress", async (o) => ({ ...(await o<typeof import("@/lib/api/progress")>()), progressService: progress }));
vi.mock("@/lib/api/messaging", async (o) => ({ ...(await o<typeof import("@/lib/api/messaging")>()), messagingService: messaging }));

import { FastingContent } from "@/app/dashboard/member/_components/solo/FastingPage";
import { FastingHero } from "@/app/dashboard/member/_components/solo/FastingHero";
import { FastTodayCard } from "@/app/dashboard/member/_components/solo/FastTodayCard";
import { fastCoachNote } from "@/lib/solo/fastCoachNote";
import { fastDraft } from "@/lib/solo/fastingCopy";
import { HOUR_MS, relativeDay, timeOfDay } from "@/lib/solo/fastingRules";
import { startTimeProblem, timeOnDay } from "@/lib/solo/fastStartTime";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import type { FastSession } from "@/lib/api/fasting";
import type { DietPlan } from "@/lib/api/progress";
import type { MyProviders } from "@/lib/api/marketplace";
import { MealSlot } from "@/lib/types";

const ok = <T,>(data: T) => ({ success: true as const, data });
const NOW = new Date(2026, 10, 17, 9, 30, 0).getTime(); // a Tuesday
const iso = (ms: number) => new Date(ms).toISOString();
const PASSED = { fasting_screening: { passed: true, at: iso(NOW), version: 1 } };

const running = (over: Partial<FastSession> = {}): FastSession => ({
  id: "f1",
  status: "running",
  started_at: iso(NOW - 2 * HOUR_MS),
  target_hours: 16,
  preset: "16_8",
  target_end_at: iso(NOW + 14 * HOUR_MS),
  ended_at: null,
  end_reason: null,
  note: null,
  feelings: [],
  undo_until: null,
  ...over,
});
const ended = (over: Partial<FastSession> = {}): FastSession =>
  running({ status: "ended", ended_at: iso(NOW), end_reason: "ended_early", undo_until: iso(NOW + 10 * 60_000), ...over });

const TUNDE = { professional_id: "tunde", first_name: "Tunde", last_name: "Bakare", profile_picture: null, role: "Personal Trainer", since: null };
const NGOZI = { professional_id: "ngozi", first_name: "Ngozi", last_name: "Okafor", profile_picture: null, role: "Dietitian", since: null };
const meal = (meal_type: MealSlot, order = 0) => ({ meal_type, name: "x", foods: [], order }) as unknown as DietPlan["meals"][number];
const planBy = (author: string, days: DietPlan["days"]): DietPlan =>
  ({ _id: `p-${author}`, created_by: { _id: author, first_name: "N", last_name: "O" }, meals: [], days, status: "active" }) as unknown as DietPlan;

let qc: QueryClient;
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;
function renderUi(ui: ReactNode) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
const setOnline = (v: boolean) => Object.defineProperty(window.navigator, "onLine", { value: v, configurable: true });

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  [...Object.values(fasting), ...Object.values(market), ...Object.values(progress), ...Object.values(messaging)].forEach((f) => f.mockReset());
  router.push.mockReset();
  fasting.settings.mockResolvedValue(ok(PASSED));
  fasting.current.mockResolvedValue(ok(null));
  fasting.history.mockResolvedValue(ok({ items: [], next_cursor: null }));
  market.getMyProviders.mockResolvedValue(ok({ professionals: [], gyms: [] }));
  progress.getMyDietPlans.mockResolvedValue(ok([]));
  setOnline(true);
  resetClientNowForTests();
});
afterEach(() => {
  nowSpy?.mockRestore();
  nowSpy = null;
  vi.useRealTimers();
});
const freezeNow = (ms: number) => {
  nowSpy = vi.spyOn(Date, "now").mockReturnValue(ms);
};

// ─── End action ─────────────────────────────────────────────────────────────

describe("end action: End fast early asks, Finish fast does not", () => {
  it("before the goal: 'End fast early' asks once; Keep going changes nothing, End fast ends it", async () => {
    freezeNow(NOW);
    fasting.current.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(ok(ended()));
    renderUi(<FastingContent />);
    const btn = await screen.findByRole("button", { name: "End fast early" });
    expect(btn).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("button", { name: "Finish fast" })).not.toBeInTheDocument();

    await userEvent.click(btn);
    const dialog = await screen.findByRole("dialog", { name: "End your fast now?" });
    expect(within(dialog).getByTestId("end-early-body")).toHaveTextContent(
      "You are at 2 h 00 min of 16 hours. It is saved as ended early. You can undo for 10 minutes.",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Keep going" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fasting.end).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "End fast early" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "End fast" }));
    expect(fasting.end).toHaveBeenCalledWith("f1", undefined);
    expect(await screen.findByText("Saved to your history at 2 h 00 min")).toBeInTheDocument();
  });

  it("opened after the goal: 'Finish fast' ends at once with no question, and the word 'early' is gone", async () => {
    freezeNow(NOW);
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 17 * HOUR_MS) })));
    fasting.end.mockResolvedValue(ok(ended({ started_at: iso(NOW - 17 * HOUR_MS), end_reason: "completed" })));
    renderUi(<FastingContent />);
    const hero = await screen.findByTestId("fasting-hero");
    expect(screen.getByTestId("fast-eyebrow")).toHaveTextContent("Goal reached · 16 hours");
    expect(screen.getByTestId("fast-sub")).toHaveTextContent(/^Reached at .* · the timer keeps going$/);
    expect(hero.textContent).not.toMatch(/early/i);
    // Opened after the goal: no announcement.
    expect(screen.getByTestId("goal-announce")).toHaveTextContent("");
    await userEvent.click(screen.getByRole("button", { name: "Finish fast" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fasting.end).toHaveBeenCalledWith("f1", undefined);
  });

  it("the goal passing with the page open swaps to 'Finish fast' live, says so once, and closes an open question", () => {
    vi.useFakeTimers({ now: NOW });
    const start = NOW - 16 * HOUR_MS + 30_000; // 30 seconds to go
    const onEnd = vi.fn();
    renderUi(
      <FastingHero
        fast={running({ started_at: iso(start) })}
        nowMs={NOW}
        onEnd={onEnd}
        onFeeling={vi.fn()}
        onEditStart={vi.fn()}
        ending={false}
        feelingError={null}
        endError={null}
        savedFeeling={null}
      />,
    );
    const btn = screen.getByTestId("end-fast");
    expect(btn).toHaveTextContent("End fast early");
    expect(btn).toHaveAttribute("data-reached", "false");
    // The member opens the question just before the goal.
    fireEvent.click(btn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    // Same button, new label: no re-render of the page's clock was needed.
    expect(screen.getByTestId("end-fast")).toBe(btn);
    expect(btn).toHaveTextContent("Finish fast");
    expect(btn).toHaveAttribute("data-reached", "true");
    expect(screen.getByTestId("fast-eyebrow")).toHaveTextContent("Goal reached · 16 hours");
    expect(screen.getByTestId("goal-announce")).toHaveTextContent("Goal reached. Finish fast is available.");
    // "End early?" no longer makes sense: it closes (after its exit transition).
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("Today's card: 'End fast early' asks, and becomes the filled 'Finish fast' at the goal", async () => {
    freezeNow(NOW);
    fasting.end.mockResolvedValue(ok(ended()));
    const onEnded = vi.fn();
    const view = renderUi(<FastTodayCard fast={running()} justEnded={null} onEnded={onEnded} />);
    const card = await screen.findByTestId("fast-today-card");
    await userEvent.click(within(card).getByRole("button", { name: "End fast early" }));
    expect(await screen.findByRole("dialog", { name: "End your fast now?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "End fast" }));
    await waitFor(() => expect(onEnded).toHaveBeenCalled());
    expect(fasting.end).toHaveBeenCalledWith("f1", undefined);

    view.unmount();
    renderUi(<FastTodayCard fast={running({ started_at: iso(NOW - 16 * HOUR_MS - 60_000) })} justEnded={null} onEnded={onEnded} />);
    const done = await screen.findByTestId("fast-today-card");
    expect(done).toHaveTextContent("Goal reached");
    expect(within(done).getByRole("button", { name: "Finish fast" })).toHaveAttribute("data-reached", "true");
    expect(within(done).queryByRole("button", { name: "End fast early" })).not.toBeInTheDocument();
  });
});

// ─── Start time ─────────────────────────────────────────────────────────────

describe("start time: rules", () => {
  it("refuses the future, more than 36 hours back, and a start before the last fast ended", () => {
    expect(startTimeProblem(null, NOW, null)).toBeNull();
    expect(startTimeProblem(NOW + HOUR_MS, NOW, null)).toBe("future");
    expect(startTimeProblem(NOW - 37 * HOUR_MS, NOW, null)).toBe("too_early");
    expect(startTimeProblem(NOW - HOUR_MS, NOW, NOW - 30 * 60_000)).toBe("before_last_end");
    expect(startTimeProblem(NOW - 20 * 60_000, NOW, NOW - 30 * 60_000)).toBeNull();
    expect(new Date(timeOnDay(NOW, 1, 22, 15))).toEqual(new Date(2026, 10, 16, 22, 15));
  });
});

describe("start time: the Starts control", () => {
  const startBtn = () => screen.getByRole("button", { name: "Start fast" });

  it("is keyboard-operable: Enter opens the choices, and they close again", async () => {
    freezeNow(NOW);
    renderUi(<FastingContent />);
    await screen.findByText("How long?");
    const starts = screen.getByTestId("fast-starts-button");
    expect(starts).toHaveAccessibleName(`Starts now, ${timeOfDay(NOW)}. Change when your fast started.`);
    starts.focus();
    await userEvent.keyboard("{Enter}");
    expect(starts).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "When did you start?" })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(starts).toHaveAttribute("aria-expanded", "false");
  });

  it("the last fast's end limits it: earlier choices are unavailable, an earlier picked time is refused", async () => {
    freezeNow(NOW);
    const lastEnd = NOW - 45 * 60_000;
    fasting.history.mockResolvedValue(ok({ items: [ended({ id: "old", ended_at: iso(lastEnd), started_at: iso(lastEnd - 14 * HOUR_MS) })], next_cursor: null }));
    fasting.start.mockResolvedValue(ok(running()));
    renderUi(<FastingContent />);
    await screen.findByText("How long?");
    await userEvent.click(screen.getByTestId("fast-starts-button"));
    expect(await screen.findByTestId("fast-start-last-end")).toHaveTextContent(`Your last fast ended at ${timeOfDay(lastEnd)}. This one can start from then.`);
    expect(screen.getByRole("button", { name: "1 hour ago, not available: before your last fast ended" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "2 hours ago, not available: before your last fast ended" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "30 minutes ago" })).toBeEnabled();
    // Yesterday is out too: the last fast ended today.
    await userEvent.click(screen.getByRole("button", { name: "Pick a time" }));
    expect(screen.getByRole("button", { name: "Yesterday" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "08:00" } });
    expect(await screen.findByTestId("fast-start-error")).toHaveTextContent(`That is before your last fast ended (${timeOfDay(lastEnd)}). Pick a later time.`);
    expect(startBtn()).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "30 minutes ago" }));
    expect(screen.queryByTestId("fast-start-error")).not.toBeInTheDocument();
    await userEvent.click(startBtn());
    await waitFor(() => expect(fasting.start).toHaveBeenCalledWith({ started_at: iso(NOW - 30 * 60_000), target_hours: 16, preset: "16_8" }));
  });

  it("an invalid time typed into the field changes nothing", async () => {
    freezeNow(NOW);
    renderUi(<FastingContent />);
    await screen.findByText("How long?");
    await userEvent.click(screen.getByTestId("fast-starts-button"));
    await userEvent.click(screen.getByRole("button", { name: "Pick a time" }));
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "" } });
    expect(screen.getByTestId("start-label")).toHaveTextContent(`Now · ${timeOfDay(NOW)}`);
    expect(startBtn()).toBeEnabled();
  });
});

// ─── Coach note and "Tell <coach>" ──────────────────────────────────────────

describe("coach note: rules", () => {
  it("names who can't see fasts, prefers the dietitian with a plan today, and lists slots in day order", () => {
    const providers: MyProviders = { professionals: [TUNDE, NGOZI], gyms: [{ organization_id: "g1", name: "Iron Gym" }] };
    const plans = [planBy("ngozi", [{ day_of_week: "every_day", meals: [meal(MealSlot.DINNER), meal(MealSlot.BREAKFAST)] }])];
    const note = fastCoachNote(providers, plans, "tuesday")!;
    expect(note.cantSee).toBe("Ngozi and Tunde can't see your fasts.");
    expect(note.mealPlan).toBe("Your meal plan from Ngozi has breakfast and dinner today. If this fast runs through one of them, tell Ngozi.");
    expect(note.tell).toEqual({ userId: "ngozi", name: "Ngozi Okafor", firstName: "Ngozi", kind: "dietitian" });
    expect(`${note.cantSee} ${note.mealPlan}`).not.toMatch(/Iron Gym/);
  });

  it("is nothing for a member with only a gym, and plain for a trainer", () => {
    expect(fastCoachNote({ professionals: [], gyms: [{ organization_id: "g1", name: "Iron Gym" }] }, [], "tuesday")).toBeNull();
    const note = fastCoachNote({ professionals: [TUNDE], gyms: [] }, [], "tuesday")!;
    expect(note.cantSee).toBe("Tunde can't see your fasts.");
    expect(note.mealPlan).toBeNull();
    expect(fastDraft({ hours: "18", startTime: "8 PM", startDay: "today", endTime: "2 PM", endDay: "tomorrow", mealPlan: false })).toBe(
      "I'm planning an 18-hour fast, 8 PM today to 2 PM tomorrow.",
    );
  });
});

describe("coach note on the start page", () => {
  it("is not shown to a member without a trainer or dietitian", async () => {
    freezeNow(NOW);
    market.getMyProviders.mockResolvedValue(ok({ professionals: [], gyms: [{ organization_id: "g1", name: "Iron Gym" }] }));
    renderUi(<FastingContent />);
    await screen.findByText("How long?");
    await waitFor(() => expect(market.getMyProviders).toHaveBeenCalled());
    expect(screen.queryByTestId("fast-coach-note")).not.toBeInTheDocument();
  });

  it("'Tell Ngozi' opens her conversation with the draft waiting, and nothing is sent", async () => {
    freezeNow(NOW);
    market.getMyProviders.mockResolvedValue(ok({ professionals: [TUNDE, NGOZI], gyms: [] }));
    progress.getMyDietPlans.mockResolvedValue(ok([planBy("ngozi", [{ day_of_week: "tuesday", meals: [meal(MealSlot.LUNCH)] }])]));
    messaging.startThread.mockResolvedValue(ok({ thread_id: "665f00000000000000000001" }));
    renderUi(<FastingContent />);
    const note = await screen.findByTestId("fast-coach-note");
    expect(note).toHaveTextContent(
      "Ngozi and Tunde can't see your fasts. Your meal plan from Ngozi has lunch today. If this fast runs through it, tell Ngozi.",
    );
    // Start is never blocked by the note.
    expect(screen.getByRole("button", { name: "Start fast" })).toBeEnabled();

    await userEvent.click(within(note).getByRole("button", { name: "Tell Ngozi" }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(messaging.startThread).toHaveBeenCalledWith({ recipient_user_id: "ngozi" });
    const url = new URL(router.push.mock.calls[0][0] as string, "http://x");
    expect(url.pathname).toBe("/dashboard/messages");
    expect(url.searchParams.get("thread")).toBe("665f00000000000000000001");
    const end = NOW + 16 * HOUR_MS;
    expect(url.searchParams.get("draft")).toBe(
      `I'm planning a 16-hour fast, ${timeOfDay(NOW)} today to ${timeOfDay(end)} ${relativeDay(end, NOW).toLowerCase()}. Is that OK with my meal plan?`,
    );
    expect(messaging.sendMessage).not.toHaveBeenCalled();
    expect(fasting.start).not.toHaveBeenCalled();
  });

  it("hides 'Tell' while the start time is not usable, and says so when the conversation can't open", async () => {
    freezeNow(NOW);
    market.getMyProviders.mockResolvedValue(ok({ professionals: [TUNDE], gyms: [] }));
    messaging.startThread.mockResolvedValue({ success: false, message: "no" });
    renderUi(<FastingContent />);
    const note = await screen.findByTestId("fast-coach-note");
    await userEvent.click(screen.getByTestId("fast-starts-button"));
    await userEvent.click(screen.getByRole("button", { name: "Pick a time" }));
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "11:00" } });
    expect(within(note).queryByRole("button", { name: "Tell Tunde" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Now" }));
    await userEvent.click(within(note).getByRole("button", { name: "Tell Tunde" }));
    expect(await within(note).findByRole("alert")).toHaveTextContent("We could not open the conversation.");
    expect(router.push).not.toHaveBeenCalled();
    expect(messaging.sendMessage).not.toHaveBeenCalled();
  });
});
