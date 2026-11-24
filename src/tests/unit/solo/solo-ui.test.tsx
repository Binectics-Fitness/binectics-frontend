import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Ada", last_name: "A" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({ useRoleGuard: () => ({ isAuthorized: true }) }));
// The shell is covered below; here a plain frame keeps the page under test.
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children, activeLabel }: { children: ReactNode; activeLabel: string }) => <main data-active={activeLabel}>{children}</main>,
}));

const water = vi.hoisted(() => ({ today: vi.fn(), adjust: vi.fn(), getSettings: vi.fn(), updateSettings: vi.fn() }));
const list = vi.hoisted(() => ({
  today: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  complete: vi.fn(), uncomplete: vi.fn(), addSystem: vi.fn(), removeSystem: vi.fn(),
}));
const progress = vi.hoisted(() => ({ getMyOwnProfiles: vi.fn(), getWeightLogs: vi.fn() }));
const starterQ = vi.hoisted(() => ({ program: null as null | { name: string }, failed: false }));
vi.mock("@/lib/api/water", async (o) => ({ ...(await o<typeof import("@/lib/api/water")>()), waterService: water }));
vi.mock("@/lib/api/checklist", async (o) => ({ ...(await o<typeof import("@/lib/api/checklist")>()), checklistService: list }));
vi.mock("@/lib/api/progress", async (o) => ({ ...(await o<typeof import("@/lib/api/progress")>()), progressService: progress }));
vi.mock("@/lib/queries/starter", () => ({
  useActiveStarter: () => ({ data: starterQ.program ? { program: starterQ.program, tasks: [] } : null, isLoading: false, isError: starterQ.failed, dataUpdatedAt: 0, refetch: vi.fn() }),
}));

import { SoloToday } from "@/app/dashboard/member/_components/solo/SoloToday";
import WaterPage from "@/app/dashboard/member/water/page";
import TodayListPage from "@/app/dashboard/member/today-list/page";
import LogHubPage from "@/app/dashboard/member/log/page";
import { ChecklistItemKind, ChecklistSystemKey } from "@/lib/api/checklist";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";

const ok = <T,>(data: T) => ({ success: true as const, data });
const fail = (message: string) => ({ success: false as const, message, status: 500 });
const WATER = { local_day: "2026-11-17", glasses: 3, glass_ml: 250, target_glasses: 8 };

let qc: QueryClient;
function renderUi(ui: ReactNode) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
const setOnline = (v: boolean) => Object.defineProperty(window.navigator, "onLine", { value: v, configurable: true });

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  starterQ.program = null;
  starterQ.failed = false;
  [...Object.values(water), ...Object.values(list), ...Object.values(progress)].forEach((f) => f.mockReset());
  water.today.mockResolvedValue(ok(WATER));
  water.getSettings.mockResolvedValue(ok({ target_glasses: 8, glass_ml: 250 }));
  list.today.mockResolvedValue(ok({ local_day: WATER.local_day, items: [] }));
  list.list.mockResolvedValue(ok({ items: [] }));
  progress.getMyOwnProfiles.mockResolvedValue(ok([]));
  setOnline(true);
  resetClientNowForTests();
});
afterEach(() => {
  vi.unstubAllEnvs();
  setOnline(true);
  window.dispatchEvent(new Event("online"));
});

const emptyEverything = () => {
  water.today.mockResolvedValue(ok({ ...WATER, glasses: 0, target_glasses: null }));
};

describe("Today: first day", () => {
  it("offers where to start and invents nothing", async () => {
    emptyEverything();
    renderUi(<SoloToday />);
    // The tool cards are the choice: no "pick one" instruction above them (text audit, 19 Nov 2026).
    expect(await screen.findByRole("link", { name: "Start a fast" })).toBeInTheDocument();
    expect(screen.queryByText(/Pick one thing to begin with/)).toBeNull();
    expect(screen.getByRole("link", { name: "Open water" })).toHaveAttribute("href", "/dashboard/member/water");
    expect(screen.getByRole("link", { name: "Log weight" })).toHaveAttribute("href", "/dashboard/member/weight-log");
    expect(screen.getByRole("link", { name: "Build your list" })).toBeInTheDocument();
    expect(screen.getByText("Only you can see what you log")).toBeInTheDocument();
    // Each card says its state, not how to use it (mobile #271 text cuts).
    for (const line of ["16:8 or your own length", "No glasses yet", "Not yet", "A few things you want to do most days."]) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    expect(screen.queryByText(/kept for you|Tap once for each glass|Once a week is plenty|Tool lines tick/)).toBeNull();
    expect(screen.getByRole("link", { name: "Find a gym or coach" })).toHaveAttribute("href", "/marketplace");
    expect(screen.getByText("Reminders are set in the mobile app")).toBeInTheDocument();
    // No fabricated figures, streaks or scores.
    expect(screen.queryByText(/streak|score|badge|missed/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "+ 1 glass" })).toBeNull();
  });

  it("offers the Starter Program with no env set (no feature flag)", async () => {
    emptyEverything();
    vi.stubEnv("NODE_ENV", "production");
    renderUi(<SoloToday />);
    expect(await screen.findByRole("link", { name: "Find a program" })).toHaveAttribute("href", "/dashboard/member/starter");
  });
});

describe("Today: in use", () => {
  it("shows water, the list, and the latest weight with no change or arrow", async () => {
    list.today.mockResolvedValue(ok({
      local_day: WATER.local_day,
      items: [
        { id: "a", label: "Morning walk", kind: ChecklistItemKind.CUSTOM, system_key: null, done: false },
        { id: "w", label: "Drink water", kind: ChecklistItemKind.SYSTEM, system_key: ChecklistSystemKey.WATER, done: false },
      ],
    }));
    progress.getMyOwnProfiles.mockResolvedValue(ok([{ _id: "cp1" }]));
    progress.getWeightLogs.mockResolvedValue(ok([{ _id: "l1", weight_kg: 73.4, recorded_at: "2026-11-16T08:00:00.000Z" }]));
    renderUi(<SoloToday />);

    expect(await screen.findByText("3 of 8")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 1 glass" })).toBeInTheDocument();
    expect(await screen.findByText("73.4")).toBeInTheDocument();
    expect(screen.queryByText(/[↑↓]/)).toBeNull();
    expect(screen.getByRole("button", { name: "Morning walk" })).toHaveAttribute("aria-pressed", "false");
    // A tool line ticks itself: not a button.
    expect(screen.queryByRole("button", { name: /Drink water/ })).toBeNull();
    expect(screen.getByRole("img", { name: "Drink water, not done" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/dashboard/member/today-list");
    expect(screen.getByRole("link", { name: "Log today" })).toHaveAttribute("href", "/dashboard/member/weight-log");
    expect(screen.getByRole("link", { name: "Find a gym or coach" })).toBeInTheDocument();
    expect(screen.getByText("Reminders are set in the mobile app")).toBeInTheDocument();
  });

  it("adds a glass at once and rolls it back when the write fails", async () => {
    water.adjust.mockResolvedValue(fail("down"));
    renderUi(<SoloToday />);
    await screen.findByText("3 of 8");
    await userEvent.click(screen.getByRole("button", { name: "+ 1 glass" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We could not save that glass. Your count is still 3.");
    expect(screen.getByText("3 of 8")).toBeInTheDocument();
    water.adjust.mockResolvedValue(ok({ ...WATER, glasses: 4, applied: true }));
    await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("4 of 8")).toBeInTheDocument();
    expect(water.adjust.mock.calls[0][0].client_op_id).toBe(water.adjust.mock.calls[1][0].client_op_id);
  });

  it("Undo is disabled at zero glasses", async () => {
    water.today.mockResolvedValue(ok({ ...WATER, glasses: 0 }));
    progress.getMyOwnProfiles.mockResolvedValue(ok([{ _id: "cp1" }]));
    progress.getWeightLogs.mockResolvedValue(ok([{ _id: "l1", weight_kg: 70, recorded_at: "2026-11-16T08:00:00.000Z" }]));
    renderUi(<SoloToday />);
    expect(await screen.findByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("blocks writes while offline and says why, without calling the API", async () => {
    renderUi(<SoloToday />);
    await screen.findByText("3 of 8");
    setOnline(false);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(await screen.findByText(/You are offline\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "+ 1 glass" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You are offline");
    expect(water.adjust).not.toHaveBeenCalled();
  });

  it("ticks a custom line optimistically and puts it back on failure", async () => {
    list.today.mockResolvedValue(ok({
      local_day: WATER.local_day,
      items: [{ id: "a", label: "Morning walk", kind: ChecklistItemKind.CUSTOM, system_key: null, done: false }],
    }));
    list.complete.mockResolvedValue(fail("nope"));
    renderUi(<SoloToday />);
    const tick = await screen.findByRole("button", { name: "Morning walk" });
    await userEvent.click(tick);
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not save that tick");
    expect(screen.getByRole("button", { name: "Morning walk" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Today: states", () => {
  it("shows shapes while loading", () => {
    water.today.mockReturnValue(new Promise(() => {}));
    renderUi(<SoloToday />);
    expect(screen.getByRole("status", { name: "Loading Today" })).toBeInTheDocument();
  });

  it("shows one clear error with a retry when every read fails", async () => {
    water.today.mockResolvedValue(fail("down"));
    list.today.mockResolvedValue(fail("down"));
    progress.getMyOwnProfiles.mockResolvedValue(fail("down"));
    starterQ.failed = true;
    renderUi(<SoloToday />);
    expect(await screen.findByText("We could not load Today")).toBeInTheDocument();
    water.today.mockResolvedValue(ok(WATER));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(water.today.mock.calls.length).toBeGreaterThan(1));
  });
});

describe("pages", () => {
  it("Water page: set and remove the aim; the aim is never preset", async () => {
    water.getSettings.mockResolvedValue(ok({ target_glasses: null, glass_ml: 250 }));
    water.today.mockResolvedValue(ok({ ...WATER, target_glasses: null }));
    water.updateSettings.mockResolvedValue(ok({ target_glasses: 8, glass_ml: 250 }));
    renderUi(<WaterPage />);
    expect(await screen.findByText("No aim set. The counter just counts.")).toBeInTheDocument();
    expect(screen.getByText("3 glasses today.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Set an aim" }));
    expect(water.updateSettings).toHaveBeenCalledWith({ target_glasses: 8 });
    expect(await screen.findByRole("button", { name: "Remove my aim" })).toBeInTheDocument();
    expect(screen.getByText(/no recommended amount/i)).toBeInTheDocument();
  });

  it("Daily list page: adds a line, ticks it, removes it, and shows the 12-line cap", async () => {
    const line = (i: number) => ({ id: `c${i}`, label: `Line ${i}`, kind: ChecklistItemKind.CUSTOM, system_key: null, days: [0, 1, 2, 3, 4, 5, 6], active: true, order: i });
    list.list.mockResolvedValue(ok({ items: Array.from({ length: 12 }, (_, i) => line(i)) }));
    renderUi(<TodayListPage />);
    expect(await screen.findByText("12 of 12 lines")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/most/);
    await userEvent.type(screen.getByLabelText("New line"), "One too many");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(list.create).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Remove or pause one to add another/).length).toBeGreaterThan(0);
  });

  it("Daily list page: custom line add, weekday chip, tool switch", async () => {
    list.create.mockResolvedValue(ok({}));
    list.update.mockResolvedValue(ok({}));
    list.addSystem.mockResolvedValue(ok({}));
    list.list.mockResolvedValue(ok({
      items: [{ id: "c1", label: "Stretch", kind: ChecklistItemKind.CUSTOM, system_key: null, days: [1, 2], active: true, order: 0 }],
    }));
    renderUi(<TodayListPage />);
    await screen.findByText("Stretch");
    await userEvent.type(screen.getByLabelText("New line"), "Walk");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(list.create).toHaveBeenCalledWith({ label: "Walk" });
    const group = screen.getByRole("group", { name: "Days for Stretch" });
    await userEvent.click(within(group).getByRole("button", { name: "Wednesday" }));
    expect(list.update).toHaveBeenCalledWith("c1", { days: [1, 2, 3] });
    await userEvent.click(screen.getByRole("switch", { name: "Show Log my weight in my list" }));
    expect(list.addSystem).toHaveBeenCalledWith("weight");
    expect(screen.getByRole("switch", { name: /Finish a fast/ })).toBeInTheDocument();
  });

  it("Daily list page: a tool-line tick comes from the API, not from a button", async () => {
    list.list.mockResolvedValue(ok({
      items: [{ id: "s1", label: "Log my weight", kind: ChecklistItemKind.SYSTEM, system_key: ChecklistSystemKey.WEIGHT, days: [0, 1, 2, 3, 4, 5, 6], active: true, order: 0 }],
    }));
    list.today.mockResolvedValue(ok({
      local_day: WATER.local_day,
      items: [{ id: "s1", label: "Log my weight", kind: ChecklistItemKind.SYSTEM, system_key: ChecklistSystemKey.WEIGHT, done: true }],
    }));
    renderUi(<TodayListPage />);
    expect(await screen.findByRole("img", { name: "Log my weight, done" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Show Log my weight in my list" })).toHaveAttribute("aria-checked", "true");
  });

  it("Log hub links to every log (as the mobile Log sheet), the journal, goals and history", async () => {
    renderUi(<LogHubPage />);
    const href = (name: RegExp) => screen.getByRole("link", { name }).getAttribute("href");
    expect(await screen.findByRole("link", { name: /^Weight/ })).toHaveAttribute("href", "/dashboard/member/weight-log");
    expect(href(/^Fast/)).toBe("/dashboard/member/fasting");
    expect(href(/^Water/)).toBe("/dashboard/member/water");
    expect(href(/^Meal/)).toBe("/dashboard/member/meal-log");
    expect(href(/^Activity/)).toBe("/dashboard/member/workout-log");
    expect(href(/^Note/)).toBe("/dashboard/member/journal");
    expect(href(/^Goals/)).toBe("/dashboard/member/goals");
    expect(href(/^History/)).toBe("/dashboard/member/history");
  });
});

void fireEvent;
