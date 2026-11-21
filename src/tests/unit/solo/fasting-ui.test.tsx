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
  usePathname: () => "/dashboard/member/fasting",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Ada", last_name: "A" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({ useRoleGuard: () => ({ isAuthorized: true }) }));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children, activeLabel }: { children: ReactNode; activeLabel: string }) => <main data-active={activeLabel}>{children}</main>,
}));
const fasting = vi.hoisted(() => ({
  screen: vi.fn(), settings: vi.fn(), start: vi.fn(), current: vi.fn(), history: vi.fn(), summary: vi.fn(),
  edit: vi.fn(), end: vi.fn(), undoEnd: vi.fn(), addFeeling: vi.fn(), remove: vi.fn(),
}));
const water = vi.hoisted(() => ({ today: vi.fn(), adjust: vi.fn(), getSettings: vi.fn(), updateSettings: vi.fn() }));
const list = vi.hoisted(() => ({
  today: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  complete: vi.fn(), uncomplete: vi.fn(), addSystem: vi.fn(), removeSystem: vi.fn(),
}));
const progress = vi.hoisted(() => ({ getMyOwnProfiles: vi.fn(), getWeightLogs: vi.fn() }));
vi.mock("@/lib/api/fasting", async (o) => ({ ...(await o<typeof import("@/lib/api/fasting")>()), fastingService: fasting }));
vi.mock("@/lib/api/water", async (o) => ({ ...(await o<typeof import("@/lib/api/water")>()), waterService: water }));
vi.mock("@/lib/api/checklist", async (o) => ({ ...(await o<typeof import("@/lib/api/checklist")>()), checklistService: list }));
vi.mock("@/lib/api/progress", async (o) => ({ ...(await o<typeof import("@/lib/api/progress")>()), progressService: progress }));
vi.mock("@/lib/queries/starter", () => ({
  useActiveStarter: () => ({ data: null, isLoading: false, isError: false, dataUpdatedAt: 0, refetch: vi.fn() }),
}));

import { FastingContent } from "@/app/dashboard/member/_components/solo/FastingPage";
import { FastHistory } from "@/app/dashboard/member/_components/solo/FastHistory";
import { FastStages } from "@/app/dashboard/member/_components/solo/FastStages";
import { SoloToday } from "@/app/dashboard/member/_components/solo/SoloToday";
import FastingRoute from "@/app/dashboard/member/fasting/page";
import TodayListPage from "@/app/dashboard/member/today-list/page";
import { HOUR_MS } from "@/lib/solo/fastingRules";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import type { FastSession } from "@/lib/api/fasting";

const ok = <T,>(data: T) => ({ success: true as const, data });
const fail = (code: string, status = 409, message = "server words") => ({ success: false as const, code, status, message });
const NOW = new Date(2026, 10, 17, 9, 30, 0).getTime();
const iso = (ms: number) => new Date(ms).toISOString();

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
const PASSED = { fasting_screening: { passed: true, at: iso(NOW), version: 1 } };

let qc: QueryClient;
let nowSpy: ReturnType<typeof vi.spyOn>;
const setNow = (ms: number) => nowSpy.mockReturnValue(ms);
const wake = () => act(() => { document.dispatchEvent(new Event("visibilitychange")); });
function renderUi(ui: ReactNode) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
const setOnline = (v: boolean) => Object.defineProperty(window.navigator, "onLine", { value: v, configurable: true });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_PROGRAM", "false");
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  [...Object.values(fasting), ...Object.values(water), ...Object.values(list), ...Object.values(progress)].forEach((f) => f.mockReset());
  fasting.settings.mockResolvedValue(ok(PASSED));
  fasting.current.mockResolvedValue(ok(null));
  fasting.history.mockResolvedValue(ok({ items: [], next_cursor: null }));
  fasting.summary.mockResolvedValue(ok({ tz: "UTC", days: [], totals: { sessions: 0, completed: 0, hours: 0 } }));
  water.today.mockResolvedValue(ok({ local_day: "2026-11-17", glasses: 0, glass_ml: 250, target_glasses: null }));
  list.today.mockResolvedValue(ok({ local_day: "2026-11-17", items: [] }));
  progress.getMyOwnProfiles.mockResolvedValue(ok([]));
  nowSpy = vi.spyOn(Date, "now");
  setNow(NOW);
  setOnline(true);
  resetClientNowForTests();
});
afterEach(() => {
  nowSpy.mockRestore();
  vi.unstubAllEnvs();
  setOnline(true);
  window.dispatchEvent(new Event("online"));
});

describe("the one-time safety check", () => {
  const form = () => screen.getByRole("button", { name: "Continue" });

  it("asks first when nothing is stored, and Continue waits for a choice", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    renderUi(<FastingContent />);
    expect(await screen.findByText("Before your first fast: fasting is not right for everyone")).toBeInTheDocument();
    expect(form()).toBeDisabled();
    await userEvent.click(screen.getByLabelText("None of these apply to me"));
    expect(form()).toBeEnabled();
    // Ticking one clears "none" and vice versa.
    await userEvent.click(screen.getByLabelText("I am under 18"));
    expect(screen.getByLabelText("None of these apply to me")).not.toBeChecked();
    await userEvent.click(screen.getByLabelText("None of these apply to me"));
    expect(screen.getByLabelText("I am under 18")).not.toBeChecked();
  });

  it("asks again when the stored check is from an older version", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: { passed: true, at: iso(NOW), version: 0 } }));
    renderUi(<FastingContent />);
    expect(await screen.findByText("Before your first fast: fasting is not right for everyone")).toBeInTheDocument();
  });

  it("under 18: no timer, a kind explanation, and the answers can be retaken", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue(ok({ passed: false, reason: "UNDER_18" }));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("I am under 18"));
    await userEvent.click(form());
    expect(fasting.screen).toHaveBeenCalledWith({ under_18: true, eating_disorder_history: false, pregnant_or_breastfeeding: false, diabetes_or_medication: false });
    expect(await screen.findByText("The fasting timer is for adults")).toBeInTheDocument();
    expect(screen.getByText(/Fasting can be hard on growing bodies/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start fast" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go back and change my answers" }));
    expect(screen.getByLabelText("I am under 18")).not.toBeChecked();
  });

  it("eating disorder history: blocked with a kind explanation that says nothing is wrong with the member", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue(ok({ passed: false, reason: "EATING_DISORDER_HISTORY" }));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("I have, or have had, an eating disorder"));
    await userEvent.click(form());
    expect(await screen.findByText("We have not started a timer")).toBeInTheDocument();
    expect(screen.getByText(/You are not doing anything wrong/)).toBeInTheDocument();
  });

  it("pregnancy, diabetes or medication: passes with a 'talk to a doctor first' notice, then continues to the start page", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue(ok({ passed: true, advice: "talk_to_doctor" }));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("I am pregnant or breastfeeding"));
    fasting.settings.mockResolvedValue(ok(PASSED)); // from the moment of the check the API remembers the pass
    await userEvent.click(form());
    expect(await screen.findByText("Talk to a doctor first")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "I will talk to my doctor" }));
    expect(await screen.findByText("How long?")).toBeInTheDocument();
  });

  it("a clean pass goes straight to the start page", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue(ok({ passed: true }));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("None of these apply to me"));
    fasting.settings.mockResolvedValue(ok(PASSED));
    await userEvent.click(form());
    expect(await screen.findByText("How long?")).toBeInTheDocument();
  });

  it("regression: after a pass the start page shows at once, without waiting for the settings re-read or flashing the check again", async () => {
    fasting.settings.mockResolvedValueOnce(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue(ok({ passed: true }));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("None of these apply to me"));
    // The re-read after the check is slow, and still says "not screened".
    fasting.settings.mockReturnValue(new Promise(() => undefined));
    await userEvent.click(form());
    expect(await screen.findByText("How long?")).toBeInTheDocument();
    expect(screen.queryByText("Before your first fast: fasting is not right for everyone")).not.toBeInTheDocument();
  });

  it("a stored 'not passed' is shown as not available, with the check retakeable", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: { passed: false, at: iso(NOW), version: 1 } }));
    renderUi(<FastingContent />);
    expect(await screen.findByText("The fasting timer is not available to you")).toBeInTheDocument();
    expect(screen.getByText(/You can still use water, weight and the rest/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Take the check again" }));
    expect(screen.getByText("Before your first fast: fasting is not right for everyone")).toBeInTheDocument();
  });

  it("keeps the answers nowhere: not in storage, not in the query cache, not after the call", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue(ok({ passed: false, reason: "EATING_DISORDER_HISTORY" }));
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "info"), vi.spyOn(console, "warn"), vi.spyOn(console, "error")];
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("I have, or have had, an eating disorder"));
    await userEvent.click(form());
    await screen.findByText("We have not started a timer");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    const cached = JSON.stringify(qc.getQueryCache().getAll().map((q) => q.state.data));
    expect(cached).not.toMatch(/eating_disorder_history/);
    await waitFor(() => expect(qc.getMutationCache().getAll()).toHaveLength(0));
    for (const spy of logs) expect(JSON.stringify(spy.mock.calls)).not.toMatch(/eating_disorder|under_18/);
    logs.forEach((s) => s.mockRestore());
  });

  it("a failed check says so plainly and can be tried again", async () => {
    fasting.settings.mockResolvedValue(ok({ fasting_screening: null }));
    fasting.screen.mockResolvedValue({ success: false, status: undefined, message: "Network error" });
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByLabelText("None of these apply to me"));
    await userEvent.click(form());
    expect(await screen.findByText("Could not reach Binectics. Check your connection and try again.")).toBeInTheDocument();
    expect(form()).toBeEnabled();
  });
});

describe("start page", () => {
  const start = () => screen.getByRole("button", { name: "Start fast" });
  const renderStart = async () => {
    renderUi(<FastingContent />);
    await screen.findByText("How long?");
  };

  it("offers every preset, defaults to 16 hours and shows when it starts and ends", async () => {
    await renderStart();
    for (const name of ["12 hours", "14 hours", "16 hours", "18 hours", "20 hours", "One meal a day", "Custom length"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "16 hours" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("16 hours fasting, 8 hours to eat. Fasts can be up to 24 hours.")).toBeInTheDocument();
    expect(screen.getByTestId("start-label")).toHaveTextContent(/^Today · /);
    expect(screen.getByTestId("end-label")).toHaveTextContent(/^Tomorrow · /);
  });

  it.each([
    ["12 hours", "12_12", 12],
    ["14 hours", "14_10", 14],
    ["18 hours", "18_6", 18],
    ["20 hours", "20_4", 20],
    ["One meal a day", "one_meal", 23],
  ])("%s starts a %s fast of %s hours", async (name, preset, hours) => {
    fasting.start.mockResolvedValue(ok(running({ preset, target_hours: hours })));
    await renderStart();
    await userEvent.click(screen.getByRole("button", { name }));
    await userEvent.click(start());
    await waitFor(() => expect(fasting.start).toHaveBeenCalledWith({ started_at: iso(NOW), target_hours: hours, preset }));
  });

  it("the start time is read at the tap, not from the last tick that drew the page", async () => {
    fasting.start.mockResolvedValue(ok(running()));
    await renderStart();
    setNow(NOW + 25_000); // 25 seconds pass with no re-render
    await userEvent.click(start());
    await waitFor(() => expect(fasting.start).toHaveBeenCalledWith({ started_at: iso(NOW + 25_000), target_hours: 16, preset: "16_8" }));
  });

  it("custom: more than 24 hours gets the plain cap message and cannot be started", async () => {
    await renderStart();
    await userEvent.click(screen.getByRole("button", { name: "Custom length" }));
    const input = screen.getByLabelText(/Hours \(1 to 24/);
    await userEvent.clear(input);
    await userEvent.type(input, "25");
    expect(await screen.findByText("Fasts can be up to 24 hours. Pick 24 or fewer.")).toBeInTheDocument();
    expect(start()).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "24");
    expect(start()).toBeEnabled();
    expect(screen.getByText("24 hours fasting. Fasts can be up to 24 hours.")).toBeInTheDocument();
  });

  it("custom hours are sent as the custom preset, halves allowed", async () => {
    fasting.start.mockResolvedValue(ok(running({ preset: "custom", target_hours: 18.5 })));
    await renderStart();
    await userEvent.click(screen.getByRole("button", { name: "Custom length" }));
    const input = screen.getByLabelText(/Hours \(1 to 24/);
    await userEvent.clear(input);
    await userEvent.type(input, "18.5");
    await userEvent.click(start());
    await waitFor(() => expect(fasting.start).toHaveBeenCalledWith({ started_at: iso(NOW), target_hours: 18.5, preset: "custom" }));
  });

  it("'started earlier' accepts up to 36 hours back, refuses older and refuses the future", async () => {
    fasting.start.mockResolvedValue(ok(running()));
    await renderStart();
    await userEvent.click(screen.getByRole("button", { name: "Started earlier? Change the start time" }));
    const field = screen.getByLabelText("I started at");
    const local = (ms: number) => {
      const d = new Date(ms);
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    fireEvent.change(field, { target: { value: local(NOW - 40 * HOUR_MS) } });
    expect(await screen.findByText("A fast can start at most 36 hours ago.")).toBeInTheDocument();
    expect(start()).toBeDisabled();
    fireEvent.change(field, { target: { value: local(NOW + 3 * HOUR_MS) } });
    expect(await screen.findByText("A fast cannot start in the future.")).toBeInTheDocument();
    fireEvent.change(field, { target: { value: local(NOW - 2 * HOUR_MS) } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(start());
    await waitFor(() => expect(fasting.start).toHaveBeenCalled());
    const sent = fasting.start.mock.calls[0][0];
    expect(new Date(sent.started_at).getTime()).toBe(new Date(local(NOW - 2 * HOUR_MS)).getTime());
  });

  it("an API refusal is read in the page's own words", async () => {
    fasting.start.mockResolvedValue(fail("FASTING_OVERLAP", 409, "ugly server text"));
    await renderStart();
    await userEvent.click(start());
    expect(await screen.findByText("That time overlaps another fast. Pick a time that does not.")).toBeInTheDocument();
    expect(screen.queryByText(/ugly server text/)).not.toBeInTheDocument();
  });

  it("the daily limit refusal (api #344) is shown plainly", async () => {
    fasting.start.mockResolvedValue(fail("FASTING_DAILY_LIMIT_REACHED"));
    await renderStart();
    await userEvent.click(start());
    expect(await screen.findByText("You have logged the most fasts allowed in a day. Try again later.")).toBeInTheDocument();
  });

  it("a start that lost a race re-reads the running fast", async () => {
    fasting.start.mockResolvedValue(fail("FASTING_ALREADY_RUNNING"));
    await renderStart();
    fasting.current.mockResolvedValue(ok(running()));
    await userEvent.click(start());
    expect(await screen.findByTestId("fasting-hero")).toBeInTheDocument();
  });

  it("offline: says nothing was changed and sends nothing", async () => {
    await renderStart();
    setOnline(false);
    act(() => { window.dispatchEvent(new Event("offline")); });
    await userEvent.click(start());
    expect(await screen.findAllByText(/does not save while offline/)).not.toHaveLength(0);
    expect(fasting.start).not.toHaveBeenCalled();
  });
});

describe("the running fast", () => {
  it("shows the time from the saved start, the stage, the arc sentence and no extras", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    renderUi(<FastingContent />);
    const hero = await screen.findByTestId("fasting-hero");
    expect(screen.getByTestId("fast-numerals")).toHaveTextContent("2:00");
    expect(screen.getByTestId("fast-stage-title")).toHaveTextContent("Digesting");
    expect(screen.getByTestId("fast-sub")).toHaveTextContent(/^14 h 00 min to go · ends /);
    expect(hero).toHaveAttribute("data-tone", "light");
    expect(screen.getByTestId("fast-arc")).toHaveAttribute("aria-label", expect.stringMatching(/2 hours fasted, 14 hours to go/));
    expect(screen.getByText("How do you feel right now?")).toBeInTheDocument();
    expect(screen.getByText("Reminders are set in the mobile app")).toBeInTheDocument();
    expect(hero.textContent).not.toMatch(/streak|badge|score|missed/i);
  });

  it("after the tab sleeps or the clock changes, the next read shows the true elapsed time, and never goes negative", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    renderUi(<FastingContent />);
    await screen.findByTestId("fasting-hero");
    expect(screen.getByTestId("fast-numerals")).toHaveTextContent("2:00");
    setNow(NOW + 6 * HOUR_MS + 5 * 60_000); // the tab slept for six hours
    wake();
    await waitFor(() => expect(screen.getByTestId("fast-numerals")).toHaveTextContent("8:05"));
    expect(screen.getByTestId("fast-stage-title")).toHaveTextContent("Switching over");
    expect(screen.getByTestId("fasting-hero")).toHaveAttribute("data-tone", "dark"); // past halfway of 16 h
    setNow(NOW - 9 * HOUR_MS); // the clock is put back before the start
    wake();
    await waitFor(() => expect(screen.getByTestId("fast-numerals")).toHaveTextContent("0:00"));
  });

  it("the arc marker sits on the end of the drawn stroke", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 8 * HOUR_MS) })));
    renderUi(<FastingContent />);
    await screen.findByTestId("fasting-hero");
    const marker = screen.getByTestId("fast-arc-marker");
    expect(Number(marker.getAttribute("cx"))).toBeCloseTo(195, 3);
    expect(Number(marker.getAttribute("cy"))).toBeCloseTo(200 - 165, 3);
    const dash = screen.getByTestId("fast-arc-progress").getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(dash[0] / dash[1]).toBeCloseTo(0.5, 3);
  });

  it("End fast ends it and shows the saved summary with Undo", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(ok(ended()));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByTestId("end-fast"));
    expect(fasting.end).toHaveBeenCalledWith("f1", undefined);
    expect(await screen.findByText("Saved to your history at 2 h 00 min")).toBeInTheDocument();
    expect(screen.getByText("Goal was 16 hours. You ended 14 h 00 min before it.")).toBeInTheDocument();
    expect(screen.getByText(/You can undo this for 10 minutes/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See history" })).toHaveAttribute("href", "/dashboard/member/fasting/history");
  });

  it("Undo reopens the fast at once (optimistic) and the server answer replaces it", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(ok(ended()));
    let settle!: (v: unknown) => void;
    fasting.undoEnd.mockReturnValue(new Promise((r) => { settle = r; }));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByTestId("end-fast"));
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    // The server has not answered yet: the running fast is already back.
    expect(await screen.findByTestId("fasting-hero")).toBeInTheDocument();
    expect(fasting.undoEnd).toHaveBeenCalledWith("f1");
    await act(async () => settle(ok(running())));
    expect(screen.getByTestId("fasting-hero")).toBeInTheDocument();
    expect(qc.getQueryData(["solo", "fasting", "current"])).toMatchObject({ id: "f1", ended_at: null });
  });

  it("a refused Undo puts the ended view back and says why, never pretending it worked", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(ok(ended()));
    fasting.undoEnd.mockResolvedValue(fail("FASTING_UNDO_UNAVAILABLE"));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByTestId("end-fast"));
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByText("This fast can no longer be reopened.")).toBeInTheDocument();
    expect(screen.queryByTestId("fasting-hero")).not.toBeInTheDocument();
    expect(screen.getByText("Saved to your history at 2 h 00 min")).toBeInTheDocument();
    expect(qc.getQueryData(["solo", "fasting", "current"])).toBeNull();
  });

  it("no Undo is offered once the server's window has passed", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(ok(ended({ undo_until: iso(NOW - 1) })));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByTestId("end-fast"));
    await screen.findByText("Saved to your history at 2 h 00 min");
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("a failed End says so and keeps the fast running", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(fail("FASTING_BAD_TIME"));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByTestId("end-fast"));
    expect(await screen.findByText(/That time does not work/)).toBeInTheDocument();
    expect(screen.getByTestId("fasting-hero")).toBeInTheDocument();
  });

  it("'How do you feel right now?' saves a private feeling and says Saved", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.addFeeling.mockResolvedValue(ok(running({ feelings: [{ at: iso(NOW), value: "hungry" }] })));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByRole("button", { name: "Hungry" }));
    expect(fasting.addFeeling).toHaveBeenCalledWith("f1", "hungry");
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(screen.getByText("Hungry", { selector: "button" })).toHaveAttribute("aria-pressed", "true");
  });

  it("'Unwell' shows stop-and-eat guidance with an End fast action", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.addFeeling.mockResolvedValue(ok(running()));
    fasting.end.mockResolvedValue(ok(ended()));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByRole("button", { name: "Unwell" }));
    const box = await screen.findByTestId("unwell-guidance");
    expect(within(box).getByText("Please stop and eat")).toBeInTheDocument();
    expect(box).toHaveTextContent(/stop and eat something/);
    await userEvent.click(within(box).getByRole("button", { name: "End fast now" }));
    expect(fasting.end).toHaveBeenCalledWith("f1", undefined);
    expect(await screen.findByText("Saved to your history at 2 h 00 min")).toBeInTheDocument();
  });

  it("a full feelings list is said plainly", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.addFeeling.mockResolvedValue(fail("FASTING_FEELINGS_FULL"));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByRole("button", { name: "Fine" }));
    expect(await screen.findByText("This fast already has 20 notes.")).toBeInTheDocument();
  });

  it("edits the start time of the running fast", async () => {
    fasting.current.mockResolvedValue(ok(running()));
    fasting.edit.mockResolvedValue(ok(running({ started_at: iso(NOW - 3 * HOUR_MS) })));
    renderUi(<FastingContent />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit start time" }));
    const start = await screen.findByLabelText("Started");
    const p = (n: number) => String(n).padStart(2, "0");
    const d = new Date(NOW - 3 * HOUR_MS);
    fireEvent.change(start, { target: { value: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` } });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fasting.edit).toHaveBeenCalled());
    expect(fasting.edit.mock.calls[0][0]).toBe("f1");
    expect(Object.keys(fasting.edit.mock.calls[0][1])).toEqual(["started_at"]);
  });

  it("past 24 hours it is never extended: the member says when they stopped, and it is saved", async () => {
    fasting.current.mockResolvedValue(ok(running({ status: "expired_unclosed", started_at: iso(NOW - 30 * HOUR_MS) })));
    fasting.end.mockResolvedValue(ok(ended()));
    renderUi(<FastingContent />);
    expect(await screen.findByText("This fast ran past 24 hours")).toBeInTheDocument();
    expect(screen.queryByTestId("fasting-hero")).not.toBeInTheDocument();
    expect(screen.getByText(/We never extend a fast or delete one/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close this fast" }));
    await waitFor(() => expect(fasting.end).toHaveBeenCalled());
    const [id, endedAt] = fasting.end.mock.calls[0];
    expect(id).toBe("f1");
    expect(new Date(endedAt).getTime()).toBe(NOW - 30 * HOUR_MS + 16 * HOUR_MS);
  });

  it("a fast that crosses the 24 h 15 min limit while the page is open switches to the close view", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 24 * HOUR_MS) })));
    renderUi(<FastingContent />);
    await screen.findByTestId("fasting-hero");
    setNow(NOW + 20 * 60_000);
    wake();
    expect(await screen.findByText("This fast ran past 24 hours")).toBeInTheDocument();
  });

  it("past 24 hours, a stop time that is not allowed cannot be sent", async () => {
    fasting.current.mockResolvedValue(ok(running({ status: "expired_unclosed", started_at: iso(NOW - 30 * HOUR_MS) })));
    renderUi(<FastingContent />);
    const field = await screen.findByLabelText("I stopped at");
    const p = (n: number) => String(n).padStart(2, "0");
    const d = new Date(NOW - 31 * HOUR_MS);
    fireEvent.change(field, { target: { value: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` } });
    expect(await screen.findByText("The end must be after the start.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close this fast" })).toBeDisabled();
  });

  it("when the fast cannot be read it says so and offers Try again", async () => {
    fasting.current.mockResolvedValueOnce({ success: false, status: 500, message: "boom" });
    renderUi(<FastingContent />);
    expect(await screen.findByText("We could not load your fast")).toBeInTheDocument();
    fasting.current.mockResolvedValue(ok(running()));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("fasting-hero")).toBeInTheDocument();
  });
});

describe("stages page", () => {
  it("lists the five stages with no autophagy times, and marks where the member is", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 9 * HOUR_MS) })));
    renderUi(<FastStages />);
    expect(await screen.findByText("Switching over")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Digesting", "Settling", "Switching over", "Fat burning likely", "Deeper into fat burning",
    ]);
    expect(await screen.findByText(/8 to 12 hours · you are here/i)).toBeInTheDocument();
    expect(screen.getByText(/You may notice: hunger in waves/)).toBeInTheDocument();
    expect(screen.getByText(/We do not show times for autophagy/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/autophagy (starts|begins|kicks|at|from)/i);
  });

  it("the last stage says when it is past the member's own length", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 5 * HOUR_MS), target_hours: 12, preset: "12_12" })));
    renderUi(<FastStages />);
    // Both stages that begin at or after the 12 hour length say so.
    expect(await screen.findAllByText("Not part of your 12 hour fast.")).toHaveLength(2);
  });

  it("with no fast running, nothing says 'you are here'", async () => {
    renderUi(<FastStages />);
    await screen.findByText("Digesting");
    expect(screen.queryByText(/you are here/i)).not.toBeInTheDocument();
  });
});

describe("history", () => {
  const row = (i: number, over: Partial<FastSession> = {}): FastSession =>
    ended({ id: `h${i}`, started_at: iso(NOW - (i + 1) * 30 * HOUR_MS), ended_at: iso(NOW - (i + 1) * 30 * HOUR_MS + 16 * HOUR_MS), end_reason: "completed", undo_until: null, ...over });

  it("shows the week strip with totals from the summary endpoint and the first page of fasts", async () => {
    fasting.summary.mockResolvedValue(ok({
      tz: "UTC",
      days: [{ date: "2026-11-16", sessions: 1, completed: 1, hours: 16 }],
      totals: { sessions: 4, completed: 3, hours: 61.4 },
    }));
    fasting.history.mockResolvedValue(ok({ items: [row(0), row(1, { end_reason: "ended_early", ended_at: iso(NOW - 60 * HOUR_MS + 10 * HOUR_MS) })], next_cursor: null }));
    renderUi(<FastHistory />);
    expect(await screen.findByText("3 fasts completed, 61 h fasted in total")).toBeInTheDocument();
    const rows = await screen.findAllByTestId("history-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Length reached");
    expect(rows[1]).toHaveTextContent("Ended early");
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Mon 16 Nov, a fast was completed/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Tue 17 Nov, no completed fast/ })).toBeInTheDocument();
    // The summary was asked for a Monday-to-Sunday range in the device zone.
    const [from, to, tz] = fasting.summary.mock.calls[0];
    expect([from, to].every((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))).toBe(true);
    expect(new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()).toBe(6 * 24 * HOUR_MS);
    expect(typeof tz).toBe("string");
  });

  it("an edited fast reads as 'Times edited', a plain label", async () => {
    fasting.history.mockResolvedValue(ok({ items: [row(0, { end_reason: "edited" })], next_cursor: null }));
    renderUi(<FastHistory />);
    expect(await screen.findByText("Times edited")).toBeInTheDocument();
  });

  it("pages with a cursor: Show more adds the next page and disappears at the end", async () => {
    fasting.history
      .mockResolvedValueOnce(ok({ items: [row(0), row(1)], next_cursor: "c1" }))
      .mockResolvedValueOnce(ok({ items: [row(2)], next_cursor: null }));
    renderUi(<FastHistory />);
    await screen.findAllByTestId("history-row");
    expect(screen.getAllByTestId("history-row")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    await waitFor(() => expect(screen.getAllByTestId("history-row")).toHaveLength(3));
    expect(fasting.history).toHaveBeenLastCalledWith(10, "c1");
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
  });

  it("empty: says where fasts will appear, with no zero-filled chart", async () => {
    renderUi(<FastHistory />);
    expect(await screen.findByText("Your fasts will appear here")).toBeInTheDocument();
    expect(screen.getByText(/Ended early is a plain label, not a mark against you/)).toBeInTheDocument();
  });

  it("a failed read says so with Try again", async () => {
    fasting.history.mockResolvedValueOnce({ success: false, status: 500 });
    renderUi(<FastHistory />);
    expect(await screen.findByText("We could not load your fasts.")).toBeInTheDocument();
    fasting.history.mockResolvedValue(ok({ items: [row(0)], next_cursor: null }));
    await userEvent.click(screen.getAllByRole("button", { name: "Try again" })[0]);
    expect(await screen.findByTestId("history-row")).toBeInTheDocument();
  });

  it("edits a fast: sends only what changed, and a rule-breaking time is refused on the page before it is sent", async () => {
    fasting.history.mockResolvedValue(ok({ items: [row(0)], next_cursor: null }));
    fasting.edit.mockResolvedValue(ok(row(0, { note: "Felt fine" })));
    renderUi(<FastHistory />);
    await userEvent.click(await screen.findByRole("button", { name: /Edit the fast that started/ }));
    const end = await screen.findByLabelText("Ended");
    const p = (n: number) => String(n).padStart(2, "0");
    const local = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
    const startMs = NOW - 30 * HOUR_MS;
    fireEvent.change(end, { target: { value: local(startMs + 26 * HOUR_MS) } });
    expect(await screen.findByText("A fast can last at most 24 hours.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    fireEvent.change(end, { target: { value: local(startMs + 16 * HOUR_MS) } });
    fireEvent.change(screen.getByLabelText("Note, only you see it"), { target: { value: "Felt fine" } });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fasting.edit).toHaveBeenCalledWith("h0", { note: "Felt fine" }));
  });

  it("an overlap refusal from the API is shown in plain words inside the drawer", async () => {
    fasting.history.mockResolvedValue(ok({ items: [row(0)], next_cursor: null }));
    fasting.edit.mockResolvedValue(fail("FASTING_OVERLAP"));
    renderUi(<FastHistory />);
    await userEvent.click(await screen.findByRole("button", { name: /Edit the fast that started/ }));
    fireEvent.change(await screen.findByLabelText("Note, only you see it"), { target: { value: "x" } });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("That time overlaps another fast. Pick a time that does not.")).toBeInTheDocument();
  });

  it("deleting asks first; Keep it keeps the fast; Delete removes it", async () => {
    fasting.history.mockResolvedValue(ok({ items: [row(0)], next_cursor: null }));
    fasting.remove.mockResolvedValue(ok({ deleted: true }));
    renderUi(<FastHistory />);
    await userEvent.click(await screen.findByRole("button", { name: /Edit the fast that started/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete this fast" }));
    expect(await screen.findByText("Delete this fast?")).toBeInTheDocument();
    expect(screen.getByText("It is removed from your history. This cannot be undone.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(fasting.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Delete this fast" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete", exact: true }));
    await waitFor(() => expect(fasting.remove).toHaveBeenCalledWith("h0"));
  });
});

describe("Today: the fast", () => {
  it("shows the running fast on a plain ink card (no gradient) with a way in", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 3 * HOUR_MS) })));
    water.today.mockResolvedValue(ok({ local_day: "2026-11-17", glasses: 2, glass_ml: 250, target_glasses: null }));
    renderUi(<SoloToday />);
    const card = await screen.findByTestId("fast-today-card");
    expect(card).toHaveTextContent("3:00");
    expect(card).toHaveTextContent("Fasting · 16 hour fast");
    expect(within(card).getByRole("link", { name: "Open fast" })).toHaveAttribute("href", "/dashboard/member/fasting");
    expect(card.getAttribute("style")).not.toMatch(/gradient/);
    expect(card).toHaveTextContent("13 h 00 min to go");
  });

  it("End fast on Today ends it, says it is saved, and Undo brings it back", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 3 * HOUR_MS) })));
    fasting.end.mockResolvedValue(ok(ended({ started_at: iso(NOW - 3 * HOUR_MS) })));
    fasting.undoEnd.mockResolvedValue(ok(running({ started_at: iso(NOW - 3 * HOUR_MS) })));
    water.today.mockResolvedValue(ok({ local_day: "2026-11-17", glasses: 2, glass_ml: 250, target_glasses: null }));
    renderUi(<SoloToday />);
    const card = await screen.findByTestId("fast-today-card");
    await userEvent.click(within(card).getByRole("button", { name: "End fast" }));
    expect(fasting.end).toHaveBeenCalledWith("f1", undefined);
    const note = await screen.findByTestId("fast-today-ended");
    expect(note).toHaveTextContent("Saved to your history at 3 h 00 min");
    await userEvent.click(within(note).getByRole("button", { name: "Undo" }));
    expect(fasting.undoEnd).toHaveBeenCalledWith("f1");
    expect(await screen.findByTestId("fast-today-card")).toBeInTheDocument();
  });

  it("regression: ending the only thing the member has used keeps the page on its in-use layout so Undo stays", async () => {
    fasting.current.mockResolvedValue(ok(running({ started_at: iso(NOW - 3 * HOUR_MS) })));
    fasting.end.mockResolvedValue(ok(ended({ started_at: iso(NOW - 3 * HOUR_MS) })));
    // Nothing else used today: no water, no list, no weight.
    water.today.mockResolvedValue(ok({ local_day: "2026-11-17", glasses: 0, glass_ml: 250, target_glasses: null }));
    renderUi(<SoloToday />);
    await userEvent.click(within(await screen.findByTestId("fast-today-card")).getByRole("button", { name: "End fast" }));
    const note = await screen.findByTestId("fast-today-ended");
    expect(within(note).getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("offers 'Start a fast' when none is running (and the member has used something else)", async () => {
    water.today.mockResolvedValue(ok({ local_day: "2026-11-17", glasses: 2, glass_ml: 250, target_glasses: null }));
    renderUi(<SoloToday />);
    const link = await screen.findByRole("link", { name: "Start a fast" });
    expect(link).toHaveAttribute("href", "/dashboard/member/fasting");
  });

  it("a fast past its limit says so and points to closing it", async () => {
    fasting.current.mockResolvedValue(ok(running({ status: "expired_unclosed", started_at: iso(NOW - 30 * HOUR_MS) })));
    renderUi(<SoloToday />);
    const card = await screen.findByTestId("fast-today-card");
    expect(card).toHaveTextContent("This fast ran past 24 hours");
    expect(within(card).getByRole("link", { name: "Close this fast" })).toBeInTheDocument();
  });
});

describe("daily list: the fasting tool line", () => {
  it("offers a 'Finish a fast' switch", async () => {
    list.list.mockResolvedValue(ok({ items: [] }));
    renderUi(<TodayListPage />);
    expect(await screen.findByRole("switch", { name: /Finish a fast/ })).toBeInTheDocument();
  });
});

describe("always on", () => {
  it("the Fasting page renders with no flag or switch of any kind", async () => {
    renderUi(<FastingRoute />);
    expect(await screen.findByText("Start a fast")).toBeInTheDocument();
    expect(screen.queryByText(/not available yet|coming to your account/i)).not.toBeInTheDocument();
    expect(fasting.settings).toHaveBeenCalled();
  });
});
