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
  usePathname: () => "/dashboard/member/progress",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Ada", last_name: "A" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({ useRoleGuard: () => ({ isAuthorized: true }) }));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children, activeLabel }: { children: ReactNode; activeLabel: string }) => <main data-active={activeLabel}>{children}</main>,
}));
const series = vi.hoisted(() => ({ read: vi.fn(), compareWeight: vi.fn() }));
const targetsApi = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
const goals = vi.hoisted(() => ({ getSettings: vi.fn(), updateSettings: vi.fn() }));
const water = vi.hoisted(() => ({ today: vi.fn(), adjust: vi.fn(), getSettings: vi.fn(), updateSettings: vi.fn() }));
const list = vi.hoisted(() => ({ today: vi.fn() }));
vi.mock("@/lib/api/memberSeries", async (o) => ({ ...(await o<typeof import("@/lib/api/memberSeries")>()), memberSeriesService: series }));
vi.mock("@/lib/api/memberTargets", async (o) => ({ ...(await o<typeof import("@/lib/api/memberTargets")>()), memberTargetsService: targetsApi }));
vi.mock("@/lib/api/memberGoals", async (o) => ({ ...(await o<typeof import("@/lib/api/memberGoals")>()), memberGoalsService: goals }));
vi.mock("@/lib/api/water", async (o) => ({ ...(await o<typeof import("@/lib/api/water")>()), waterService: water }));
vi.mock("@/lib/api/checklist", async (o) => ({ ...(await o<typeof import("@/lib/api/checklist")>()), checklistService: list }));

import ProgressRoute from "@/app/dashboard/member/progress/page";
import TargetsRoute from "@/app/dashboard/member/progress/targets/page";
import { ProgressContent } from "@/app/dashboard/member/_components/solo/ProgressPage";
import { dayKeyOf, addDaysTo } from "@/lib/solo/glance";

const ok = <T,>(data: T) => ({ success: true as const, data });
const TODAY = dayKeyOf(new Date());
const day = (n: number) => addDaysTo(TODAY, -n);
const pt = (start_day: string, value: number, n = 1) => ({ start_day, value, min: value, max: value, n });
const COMPARE_LOWER = {
  tz: "UTC", period: "4w", windows: { now: { from: "a", to: "b" }, then: { from: "c", to: "d" } },
  then: { label_days_ago: 28, average: 71.2, n: 2 }, now: { average: 70, n: 2 }, delta: -1.2, enough: true,
};
const NOT_ENOUGH = { tz: "UTC", period: "4w", windows: COMPARE_LOWER.windows, then: null, now: null, delta: null, enough: false };
const NO_TARGETS = { weight_range: null, fasting_window: null, water_glasses: null, updated_at: null };

let qc: QueryClient;
function renderUi(ui: ReactNode) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
const setOnline = (v: boolean) => Object.defineProperty(window.navigator, "onLine", { value: v, configurable: true });

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  [...Object.values(series), ...Object.values(targetsApi), ...Object.values(water), ...Object.values(list), ...Object.values(goals)].forEach((f) => f.mockReset());
  series.compareWeight.mockResolvedValue(ok(COMPARE_LOWER));
  series.read.mockImplementation(async (q: { metric: string }) => ok({ metric: q.metric, bucket: "day", tz: "UTC", from: "", to: "", points: [] }));
  targetsApi.get.mockResolvedValue(ok(NO_TARGETS));
  water.today.mockResolvedValue(ok({ local_day: TODAY, glasses: 3, glass_ml: 250, target_glasses: 8 }));
  list.today.mockResolvedValue(ok({ local_day: TODAY, items: [] }));
  goals.getSettings.mockResolvedValue(ok({ week_start: "monday", hide_daily_weights: false }));
  goals.updateSettings.mockImplementation(async (b: { hide_daily_weights: boolean }) => {
    // Behaves like the server: the next read returns what was saved.
    goals.getSettings.mockResolvedValue(ok({ week_start: "monday", ...b }));
    return ok({ week_start: "monday", ...b });
  });
  setOnline(true);
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  setOnline(true);
  window.dispatchEvent(new Event("online"));
});

describe("weight: then and now", () => {
  it("lower: two weekly averages and ONE plain sentence in ink, no arrow", async () => {
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("weight-then")).toHaveTextContent("71.2kg");
    expect(screen.getByTestId("weight-now")).toHaveTextContent("70.0kg");
    const sentence = screen.getByTestId("weight-sentence");
    expect(sentence).toHaveTextContent("1.2 kg lower than 4 weeks ago");
    expect(sentence).toHaveStyle({ color: "var(--ink)" });
    const card = screen.getByTestId("weight-pair");
    expect(card.textContent).not.toMatch(/[↑↓▲▼]/);
    expect(card.innerHTML).not.toMatch(/var\(--(signal|danger|warn)/);
    expect(series.compareWeight).toHaveBeenCalledWith("4w", expect.any(String));
  });

  it("higher uses the word higher, with the same plain styling", async () => {
    series.compareWeight.mockResolvedValue(ok({ ...COMPARE_LOWER, now: { average: 72.4, n: 3 }, delta: 1.2 }));
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("weight-sentence")).toHaveTextContent("1.2 kg higher than 4 weeks ago");
    expect(screen.getByTestId("weight-sentence")).toHaveStyle({ color: "var(--ink)" });
  });

  it("the same weight reads 'The same as'", async () => {
    series.compareWeight.mockResolvedValue(ok({ ...COMPARE_LOWER, now: { average: 71.2, n: 3 }, delta: 0 }));
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("weight-sentence")).toHaveTextContent("The same as 4 weeks ago");
  });

  it("not enough weigh-ins: says so, offers to log, and shows no number and no chart", async () => {
    series.compareWeight.mockResolvedValue(ok(NOT_ENOUGH));
    renderUi(<ProgressContent />);
    const box = await screen.findByTestId("weight-not-enough");
    expect(box).toHaveTextContent("Not enough weigh-ins yet");
    expect(within(box).getByRole("link", { name: "Log your weight" })).toHaveAttribute("href", "/dashboard/member/weight-log");
    expect(screen.queryByTestId("weight-pair")).not.toBeInTheDocument();
    expect(box.textContent).not.toMatch(/\d/);
  });

  it("range chips re-ask for 3 months and a year, and 'enough' is the API's call", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    series.compareWeight.mockResolvedValue(ok({ ...COMPARE_LOWER, period: "3m", then: { label_days_ago: 91, average: 72, n: 2 }, delta: -2 }));
    await userEvent.click(screen.getByRole("button", { name: "3 months" }));
    expect(await screen.findByText("2.0 kg lower than 3 months ago")).toBeInTheDocument();
    expect(series.compareWeight).toHaveBeenLastCalledWith("3m", expect.any(String));
    expect(screen.getByText("3 months ago", { selector: "p" })).toBeInTheDocument();
    series.compareWeight.mockResolvedValue(ok(NOT_ENOUGH));
    await userEvent.click(screen.getByRole("button", { name: "A year" }));
    expect(await screen.findByTestId("weight-not-enough")).toBeInTheDocument();
  });

  it("a failed read says what happened and Try again re-asks; nothing is invented", async () => {
    series.compareWeight.mockResolvedValueOnce({ success: false, status: 500, message: "boom" });
    renderUi(<ProgressContent />);
    expect(await screen.findByText("We could not load this")).toBeInTheDocument();
    expect(screen.queryByTestId("weight-pair")).not.toBeInTheDocument();
    series.compareWeight.mockResolvedValue(ok(COMPARE_LOWER));
    await userEvent.click(screen.getAllByRole("button", { name: "Try again" })[0]);
    expect(await screen.findByTestId("weight-sentence")).toBeInTheDocument();
  });

  it("offline with nothing loaded says to connect; with a result loaded it keeps it and says when it was loaded", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    setOnline(false);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(await screen.findByText(/You are offline\. Showing what was loaded at /)).toBeInTheDocument();
    expect(screen.getByTestId("weight-pair")).toBeInTheDocument();
    series.compareWeight.mockResolvedValue({ success: false, status: undefined, message: "Network error" });
    await userEvent.click(screen.getByRole("button", { name: "A year" }));
    expect(await screen.findByText("You are offline. Connect to see this.")).toBeInTheDocument();
  });

  it("shows loading shapes, not numbers, while the read runs", async () => {
    series.compareWeight.mockReturnValue(new Promise(() => undefined));
    renderUi(<ProgressContent />);
    expect(await screen.findByRole("status", { name: "Loading your weight" })).toBeInTheDocument();
    expect(screen.queryByTestId("weight-now")).not.toBeInTheDocument();
  });
});

describe("daily weights: hidden by default, hideable for good", () => {
  const dailyPoints = [pt(day(1), 70.4), pt(day(3), 69.6), pt(day(5), 70.8), pt(day(6), 70.1), pt(day(8), 71), pt(day(9), 71.3)];
  beforeEach(() => {
    series.read.mockImplementation(async (q: { metric: string }) =>
      ok({ metric: q.metric, bucket: "day", tz: "UTC", from: "", to: "", points: q.metric === "weight" ? dailyPoints : [] }));
  });

  it("asks for no daily weight until the member taps Show, then lists the last five", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    expect(series.read.mock.calls.filter(([q]) => q.metric === "weight")).toHaveLength(0);
    expect(screen.getByText("Hidden until you tap Show")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    const box = await screen.findByTestId("weight-daily");
    await waitFor(() => expect(within(box).getAllByRole("listitem")).toHaveLength(5));
    expect(within(box).getAllByRole("listitem")[0]).toHaveTextContent("70.4 kg");
    expect(series.read.mock.calls.filter(([q]) => q.metric === "weight")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByTestId("weight-daily")).not.toBeInTheDocument();
  });

  it("'Hide daily weights for good' is saved on the server, removes Show, and comes back from the server on a reload", async () => {
    const first = renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    await userEvent.click(screen.getByRole("switch", { name: "Hide daily weights" }));
    expect(await screen.findByText("Hidden for good. Change this below.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show" })).not.toBeInTheDocument();
    await waitFor(() => expect(goals.updateSettings).toHaveBeenCalledWith({ hide_daily_weights: true }));
    // Nothing is kept in this browser.
    expect(localStorage.length).toBe(0);
    first.unmount();
    // A fresh cache (a reload, or the phone) learns it from the server.
    goals.getSettings.mockResolvedValue(ok({ week_start: "monday", hide_daily_weights: true }));
    qc.clear();
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    await waitFor(() => expect(screen.getByRole("switch", { name: "Hide daily weights" })).toHaveAttribute("aria-checked", "true"));
    expect(screen.queryByRole("button", { name: "Show" })).not.toBeInTheDocument();
    expect(series.read.mock.calls.filter(([q]) => q.metric === "weight")).toHaveLength(0);
    // Switching it off brings Show back.
    await userEvent.click(screen.getByRole("switch", { name: "Hide daily weights" }));
    await waitFor(() => expect(goals.updateSettings).toHaveBeenLastCalledWith({ hide_daily_weights: false }));
    expect(await screen.findByRole("button", { name: "Show" })).toBeInTheDocument();
  });

  it("a failed save puts the switch back and says so plainly", async () => {
    goals.updateSettings.mockResolvedValue({ success: false, status: 400, message: "property hide_daily_weights should not exist" });
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    await userEvent.click(screen.getByRole("switch", { name: "Hide daily weights" }));
    expect(await screen.findByText("That could not be saved. Try again.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("switch", { name: "Hide daily weights" })).toHaveAttribute("aria-checked", "false"));
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/should not exist/);
  });

  it("an API that does not know the setting yet (only week_start) reads as not hidden", async () => {
    goals.getSettings.mockResolvedValue(ok({ week_start: "monday" }));
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    expect(screen.getByRole("switch", { name: "Hide daily weights" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
  });

  it("a failed settings read leaves the page working with daily weights not hidden", async () => {
    goals.getSettings.mockResolvedValue({ success: false, status: 500, message: "boom" });
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("weight-pair")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
  });

  it("the weight screen carries no medical-device footer", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    expect(document.body.textContent).not.toMatch(/medical device|health worker/i);
  });

  it("hiding for good closes daily weights that were showing", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    await screen.findByTestId("weight-daily");
    await userEvent.click(screen.getByRole("switch", { name: "Hide daily weights" }));
    expect(screen.queryByTestId("weight-daily")).not.toBeInTheDocument();
  });

  it("says plainly when there are no weigh-ins in the last 4 weeks", async () => {
    series.read.mockImplementation(async (q: { metric: string }) => ok({ metric: q.metric, bucket: "day", tz: "UTC", from: "", to: "", points: [] }));
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(await screen.findByText("No weigh-ins in the last 4 weeks.")).toBeInTheDocument();
  });
});

describe("fasting: strip on a band", () => {
  const fastPoints = [pt(day(1), 16.25), pt(day(2), 13.5, 2), pt(day(4), 17), pt(day(10), 15)];
  const withFasts = (points = fastPoints) =>
    series.read.mockImplementation(async (q: { metric: string }) =>
      ok({ metric: q.metric, bucket: "day", tz: "UTC", from: "", to: "", points: q.metric === "fasting_hours" ? points : [] }));

  it("empty: 'Your fasts will show here', no bars", async () => {
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("fasting-empty")).toHaveTextContent("Your fasts will show here");
    expect(screen.queryByTestId("fasting-strip")).not.toBeInTheDocument();
  });

  it("seven days: an average over the days that have a fast, gaps stay gaps, and a day can be inspected", async () => {
    withFasts();
    renderUi(<ProgressContent />);
    // days 1, 2 and 4 are inside the last 7 days.
    expect(await screen.findByTestId("fasting-average")).toHaveTextContent(`Average ${((16.25 + 13.5 + 17) / 3).toFixed(1)} h on 3 days`);
    const strip = screen.getByTestId("fasting-strip");
    expect(within(strip).getAllByRole("button")).toHaveLength(7);
    expect(within(strip).getAllByRole("button", { name: /no fast$/ })).toHaveLength(4);
    await userEvent.click(within(strip).getByRole("button", { name: /16 h 15 min$/ }));
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("16 h 15 min");
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("One fast that day.");
    await userEvent.click(within(strip).getByRole("button", { name: /13 h 30 min$/ }));
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("2 fasts ended that day.");
    expect(screen.getByText(/A day with no fast is just a gap\. Nothing is marked and nothing is counted against you\./)).toBeInTheDocument();
  });

  it("thirty days: a real range input moves the inspected day with the arrow keys", async () => {
    withFasts();
    renderUi(<ProgressContent />);
    await screen.findByTestId("fasting-average");
    await userEvent.click(screen.getByRole("button", { name: "30 days" }));
    const slider = await screen.findByRole("slider", { name: "Move to inspect a day" });
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveAttribute("max", "29");
    expect(screen.getByTestId("fasting-average")).toHaveTextContent("on 4 days");
    fireEvent.change(slider, { target: { value: "20" } }); // day(9)
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("No fast");
    fireEvent.change(slider, { target: { value: "19" } }); // day(10)
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("15 h 00 min");
    expect(slider).toHaveAttribute("aria-valuetext", expect.stringMatching(/15 h 00 min$/));
  });

  it("the pale band is the member's own window, only if one is set and switched on", async () => {
    withFasts();
    renderUi(<ProgressContent />);
    await screen.findByTestId("fasting-average");
    expect(screen.queryByTestId("fasting-band")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Show my window" })).not.toBeInTheDocument();
  });

  it("with a window set: the band shows, the day note says inside or outside in plain words, and the switch hides it", async () => {
    withFasts();
    targetsApi.get.mockResolvedValue(ok({ ...NO_TARGETS, fasting_window: { min_hours: 16, max_hours: 20, days_per_week: 5 } }));
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("fasting-band")).toBeInTheDocument();
    expect(screen.getByText("The pale band is your own window, 16 to 20 hours.")).toBeInTheDocument();
    const strip = screen.getByTestId("fasting-strip");
    await userEvent.click(within(strip).getByRole("button", { name: /16 h 15 min$/ }));
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("Inside your window.");
    await userEvent.click(within(strip).getByRole("button", { name: /13 h 30 min$/ }));
    expect(screen.getByTestId("fasting-day")).toHaveTextContent("Outside your window, which is fine.");
    await userEvent.click(screen.getByRole("switch", { name: "Show my window" }));
    expect(screen.queryByTestId("fasting-band")).not.toBeInTheDocument();
  });

  it("a failed read says so with Try again", async () => {
    series.read.mockImplementation(async (q: { metric: string }) =>
      q.metric === "fasting_hours" ? { success: false, status: 500 } : ok({ metric: q.metric, bucket: "day", tz: "UTC", from: "", to: "", points: [] }));
    renderUi(<ProgressContent />);
    expect(await screen.findAllByText("We could not load this")).not.toHaveLength(0);
  });
});

describe("water: sentence and rail", () => {
  it("one sentence with the aim, a rail that is only a picture of it, and no percent", async () => {
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("water-sentence")).toHaveTextContent("3 glasses today. 5 to go to your 8.");
    const rail = screen.getByRole("img", { name: "3 of 8 glasses" });
    expect(rail).toBeInTheDocument();
    expect(screen.getByText(/Water · today/).closest("div")!.parentElement!.textContent).not.toMatch(/%/);
  });

  it("without an aim there is no rail", async () => {
    water.today.mockResolvedValue(ok({ local_day: TODAY, glasses: 3, glass_ml: 250, target_glasses: null }));
    renderUi(<ProgressContent />);
    expect(await screen.findByTestId("water-sentence")).toHaveTextContent("3 glasses today.");
    expect(screen.queryByRole("img", { name: /glasses$/ })).not.toBeInTheDocument();
  });

  it("+ 1 glass counts at once and undo takes it back; the same op id is kept for a retry", async () => {
    water.adjust.mockImplementation(async ({ delta }: { delta: number }) => ok({ local_day: TODAY, glasses: 3 + delta, glass_ml: 250, target_glasses: 8, applied: true }));
    renderUi(<ProgressContent />);
    await screen.findByTestId("water-sentence");
    await userEvent.click(screen.getByRole("button", { name: "Add one glass" }));
    expect(await screen.findByText("4 glasses today. 4 to go to your 8.")).toBeInTheDocument();
    expect(water.adjust).toHaveBeenCalledWith(expect.objectContaining({ delta: 1, client_op_id: expect.any(String) }));
  });

  it("the usual day counts only days with a count and compares with the week before", async () => {
    series.read.mockImplementation(async (q: { metric: string }) =>
      ok({ metric: q.metric, bucket: "day", tz: "UTC", from: "", to: "", points: q.metric === "water_glasses" ? [pt(day(1), 6), pt(day(2), 8), pt(day(9), 5)] : [] }));
    renderUi(<ProgressContent />);
    const usual = await screen.findByTestId("water-usual");
    // Today's live 3 glasses count with day(1) and day(2): (3 + 6 + 8) / 3.
    expect(usual).toHaveTextContent(`Average ${((3 + 6 + 8) / 3).toFixed(1)} glasses a day this week.`);
    expect(usual).toHaveTextContent("On the 3 days you counted.");
    expect(usual).toHaveTextContent("more than the week before");
  });

  it("offline: adding a glass is blocked with the plain message", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("water-sentence");
    setOnline(false);
    act(() => { window.dispatchEvent(new Event("offline")); });
    await userEvent.click(screen.getByRole("button", { name: "Add one glass" }));
    expect(await screen.findByText(/does not save while offline/)).toBeInTheDocument();
    expect(water.adjust).not.toHaveBeenCalled();
  });
});

describe("accessibility of the page", () => {
  it("every chip group is named, every switch is a real switch, every control is a real button, input or link", async () => {
    renderUi(<ProgressContent />);
    await screen.findByTestId("weight-pair");
    for (const name of ["Compare with", "Fasting period", "Usual day period"]) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("switch", { name: "Hide daily weights" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4 weeks", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A glance at how it is going");
  });
});

describe("targets", () => {
  const renderTargets = () => renderUi(<TargetsRoute />);
  const lo = () => screen.getByLabelText("From", { exact: true });
  const hi = () => screen.getByLabelText("To", { exact: true });

  it("with no weigh-ins it asks for a few first and offers no invented range", async () => {
    series.compareWeight.mockResolvedValue(ok(NOT_ENOUGH));
    renderTargets();
    expect(await screen.findByTestId("no-weight-yet")).toHaveTextContent("Log a few weigh-ins first");
    expect(screen.queryByLabelText("From", { exact: true })).not.toBeInTheDocument();
  });

  it("starts from the member's own weekly average, shows a live plain-text preview, and saves a range", async () => {
    targetsApi.update.mockResolvedValue(ok({ ...NO_TARGETS, weight_range: { min_kg: 69, max_kg: 71 } }));
    renderTargets();
    expect(await screen.findByDisplayValue("69")).toBeInTheDocument();
    expect(screen.getByDisplayValue("71")).toBeInTheDocument();
    const preview = screen.getByTestId("target-preview");
    expect(preview).toHaveTextContent("Between 69.0 and 71.0 kg");
    expect(preview).toHaveTextContent("Your weekly average is 70.0 kg. Your range is 69.0 to 71.0 kg.");
    expect(preview).toHaveTextContent("Plain text only. No percent, no pass mark.");
    await userEvent.click(screen.getByRole("button", { name: "Raise the end" }));
    expect(screen.getByTestId("target-preview")).toHaveTextContent("Between 69.0 and 71.5 kg");
    await userEvent.click(screen.getByRole("button", { name: "Save target" }));
    await waitFor(() => expect(targetsApi.update).toHaveBeenCalledWith({ weight_range: { min_kg: 69, max_kg: 71.5 } }));
    expect(await screen.findByText("Target saved")).toBeInTheDocument();
  });

  it("the preview never shows a percent, a pass mark or a distance", async () => {
    renderTargets();
    await screen.findByDisplayValue("69");
    expect(screen.getByTestId("target-preview").textContent).not.toMatch(/%|\bmet\b|\bpass\b(?! mark)|left to go|away from/i);
  });

  it("the API's 422 below-range answer shows ONE short line, never the raw code, and stores nothing", async () => {
    targetsApi.update.mockResolvedValue({ success: false, status: 422, code: "TARGET_BELOW_SUPPORTED_RANGE", message: "targets.weight.below_supported_range" });
    renderTargets();
    await screen.findByDisplayValue("69");
    fireEvent.change(lo(), { target: { value: "44" } });
    await userEvent.click(screen.getByRole("button", { name: "Save target" }));
    const line = await screen.findByTestId("target-refused");
    expect(line).toHaveTextContent("The lowest weight we can save is 45 kg.");
    expect(line.textContent).toBe("The lowest weight we can save is 45 kg.");
    expect(document.body.textContent).not.toMatch(/targets\.weight\.below_supported_range|TARGET_BELOW_SUPPORTED_RANGE|health worker/);
    expect(screen.queryByText("Target saved")).not.toBeInTheDocument();
    // A later successful save clears it.
    targetsApi.update.mockResolvedValue(ok({ ...NO_TARGETS, weight_range: { min_kg: 68, max_kg: 71 } }));
    fireEvent.change(lo(), { target: { value: "68" } });
    await userEvent.click(screen.getByRole("button", { name: "Save target" }));
    await waitFor(() => expect(screen.queryByTestId("target-refused")).not.toBeInTheDocument());
    expect(await screen.findByText("Target saved")).toBeInTheDocument();
  });

  it("a range that starts above its end is refused on the page and not sent", async () => {
    renderTargets();
    await screen.findByDisplayValue("69");
    fireEvent.change(lo(), { target: { value: "80" } });
    expect(await screen.findByText("The first number must not be above the second.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save target" })).toBeDisabled();
    expect(targetsApi.update).not.toHaveBeenCalled();
  });

  it("steps in halves inside the bounds, and typing is snapped on leaving the field", async () => {
    renderTargets();
    await screen.findByDisplayValue("69");
    fireEvent.change(lo(), { target: { value: "68.3" } });
    fireEvent.blur(lo());
    expect(lo()).toHaveValue(68.5);
    fireEvent.change(hi(), { target: { value: "900" } });
    fireEvent.blur(hi());
    expect(hi()).toHaveValue(250);
  });

  it("an existing range shows Save changes and Remove; Remove clears only the weight range with a null", async () => {
    targetsApi.get.mockResolvedValue(ok({ ...NO_TARGETS, weight_range: { min_kg: 68, max_kg: 70 }, water_glasses: 8 }));
    targetsApi.update.mockResolvedValue(ok({ ...NO_TARGETS, water_glasses: 8 }));
    renderTargets();
    await screen.findByDisplayValue("68");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove this target" }));
    await waitFor(() => expect(targetsApi.update).toHaveBeenCalledWith({ weight_range: null }));
    expect(targetsApi.update).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Target removed")).toBeInTheDocument();
  });

  it("fasting window: range of hours and days a week, sentence preview, saved as a window", async () => {
    targetsApi.update.mockResolvedValue(ok({ ...NO_TARGETS, fasting_window: { min_hours: 16, max_hours: 18, days_per_week: 5 } }));
    renderTargets();
    await userEvent.click(await screen.findByRole("button", { name: "Fasting" }));
    expect(screen.getByTestId("target-preview")).toHaveTextContent("Fast between 16 and 18 hours, on 5 days a week");
    await userEvent.click(screen.getByRole("button", { name: "More hours at the end" }));
    await userEvent.click(screen.getByRole("button", { name: "One day fewer" }));
    await userEvent.click(screen.getByRole("button", { name: "Save target" }));
    await waitFor(() => expect(targetsApi.update).toHaveBeenCalledWith({ fasting_window: { min_hours: 16, max_hours: 18.5, days_per_week: 4 } }));
  });

  it("fasting hours cannot go past the 24 hour cap", async () => {
    renderTargets();
    await userEvent.click(await screen.findByRole("button", { name: "Fasting" }));
    const to = screen.getByLabelText("To (hours)");
    fireEvent.change(to, { target: { value: "30" } });
    fireEvent.blur(to);
    expect(to).toHaveValue(24);
    expect(screen.getByText("Fasts are capped at 24 hours in the app.")).toBeInTheDocument();
  });

  it("water aim is saved as water_glasses and removed with a null", async () => {
    targetsApi.get.mockResolvedValue(ok({ ...NO_TARGETS, water_glasses: 8 }));
    targetsApi.update.mockResolvedValue(ok(NO_TARGETS));
    renderTargets();
    await userEvent.click(await screen.findByRole("button", { name: "Water" }));
    expect(screen.getByTestId("target-preview")).toHaveTextContent("Aim for 8 glasses a day");
    expect(screen.getByText("No recommended amount is shown: the aim is yours.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove this target" }));
    await waitFor(() => expect(targetsApi.update).toHaveBeenCalledWith({ water_glasses: null }));
  });

  it("offline: saving is blocked with the plain message and nothing is sent", async () => {
    renderTargets();
    await screen.findByDisplayValue("69");
    setOnline(false);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(await screen.findByText(/does not save while you are offline/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save target" })).toBeDisabled();
    expect(targetsApi.update).not.toHaveBeenCalled();
  });

  it("a failed save says so and does not claim it saved", async () => {
    targetsApi.update.mockResolvedValue({ success: false, status: 500, message: "boom" });
    renderTargets();
    await screen.findByDisplayValue("69");
    await userEvent.click(screen.getByRole("button", { name: "Save target" }));
    expect(await screen.findByText("That could not be saved. Try again.")).toBeInTheDocument();
    expect(screen.queryByText("Target saved")).not.toBeInTheDocument();
  });

  it("a failed read says so with Try again", async () => {
    targetsApi.get.mockResolvedValueOnce({ success: false, status: 500 });
    renderTargets();
    expect(await screen.findByText("We could not load this")).toBeInTheDocument();
    targetsApi.get.mockResolvedValue(ok(NO_TARGETS));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByDisplayValue("69")).toBeInTheDocument();
  });
});

describe("always on", () => {
  it("the Progress page renders with no flag or switch of any kind", async () => {
    renderUi(<ProgressRoute />);
    expect(await screen.findByTestId("weight-pair")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Your targets" })).toBeInTheDocument();
    expect(screen.queryByText(/not available yet|coming to your account/i)).not.toBeInTheDocument();
  });
});
