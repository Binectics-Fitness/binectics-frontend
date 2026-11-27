import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import type { ReactNode } from "react";
import ClientDetailPage from "@/app/dashboard/trainer/clients/[clientId]/page";
import { CLIENT_PAGE_COPY as C } from "@/app/dashboard/trainer/clients/[clientId]/copy";

/**
 * Coach client page (board binectics-plans/design/coach-client-page): the
 * owner's order with weight last, and the four states.
 */
vi.mock("next/navigation", () => ({ useParams: () => ({ clientId: "cp1" }) }));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({ TrainerDashboardShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/messaging/StartConversationButton", () => ({ StartConversationButton: () => <button type="button">Message</button> }));
vi.mock("@/components/programs/OneOffTasksCard", () => ({ default: () => <div>Forms and tasks</div> }));
vi.mock("@/components/programs/results/ProgramResultsSection", () => ({ default: () => <section>Program results</section> }));
vi.mock("@/components/progress-reports/ClientReportsCard", () => ({ ClientReportsCard: () => <div>Progress reports</div> }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/clients/StartProgramDialog", () => ({
  StartProgramDialog: ({ clientName, onStarted }: { clientName: string; onStarted: () => void }) => (
    <div role="dialog" aria-label={`Program for ${clientName}`}>
      <button type="button" onClick={onStarted}>Start program</button>
    </div>
  ),
}));
vi.mock("@/components/coachSessions/SessionLogsSection", () => ({ SessionLogsSection: () => <section>Session logs</section> }));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtDate: (s: string) => s.slice(0, 10), fmtDateTime: (s: string) => s.slice(0, 16) }),
}));

const api = vi.hoisted(() => ({
  profile: vi.fn(),
  journals: vi.fn(),
  weights: vi.fn(),
  overview: vi.fn(),
  bookings: vi.fn(),
  createWeightLog: vi.fn(),
}));
vi.mock("@/lib/api/progress", () => ({
  progressService: {
    getClientProfile: api.profile,
    getClientJournalEntries: api.journals,
    getWeightLogs: api.weights,
    createClientJournalEntry: vi.fn(),
    createWeightLog: api.createWeightLog,
  },
}));
vi.mock("@/lib/api/programs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/programs")>()),
  programsService: { getClientOverview: api.overview },
}));
vi.mock("@/lib/api/consultations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/consultations")>()),
  consultationsService: { getProviderBookings: api.bookings },
}));

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const PROFILE = { _id: "cp1", client_id: { _id: "c1", first_name: "Chidi", last_name: "Obi", email: "" }, is_active: true, goals: ["Get stronger"], target_weight_kg: 70, created_at: "2026-10-02T00:00:00Z" };

function seed(empty = false) {
  api.profile.mockImplementation(() => ok(PROFILE));
  api.journals.mockImplementation(() => ok(empty ? [] : [
    { _id: "j1", notes: "Good depth on the squats.", entry_date: "2026-11-12T18:00:00Z" },
    { _id: "j2", notes: "Keep the first week light.", entry_date: "2026-11-03T09:00:00Z" },
  ]));
  api.weights.mockImplementation(() => ok(empty ? [] : [
    { _id: "w1", weight_kg: 74, recorded_at: "2026-11-16T07:00:00Z" },
    { _id: "w2", weight_kg: 74.6, recorded_at: "2026-11-09T07:00:00Z" },
  ]));
  api.overview.mockImplementation(() => ok({ programs: empty ? [] : [{ id: "pi1", name: "Strength base", kind: "program", status: "active", progress: { day: 4, total_days: 28, last_7_days: { scheduled: 12, done: 8, done_late: 0, skipped: 1, missed: 1, open: 2 } }, counts: { done: 8, missed: 1, skipped: 1, pending: 2 }, adherence_pct: 80 }], today: [] }));
  api.bookings.mockImplementation(() => ok(empty ? [] : [{ id: "b1", clientUserId: "c1", consultationTypeName: "Strength session", startsAt: "2099-11-21T07:30:00Z", endsAt: "2099-11-21T08:30:00Z", status: "CONFIRMED" }]));
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ClientDetailPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  // React Query's online manager is shared: tell it we are back online.
  onlineManager.setOnline(true);
});

describe("coach client page", () => {
  it("leads with next session and this week, and puts body measurements last", async () => {
    seed();
    renderPage();
    await screen.findByText("Chidi Obi");
    const text = document.body.textContent ?? "";
    const order = [C.nextSession, C.thisWeek, "Session logs", "Program results", C.noteTo("Chidi"), C.body].map((s) => text.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text.indexOf(C.latestWeight)).toBeGreaterThan(text.indexOf(C.body));
    expect(screen.getByText(C.weekDone(8, 12))).toBeTruthy();
    expect(screen.getByText("Strength base · 1 missed")).toBeTruthy();
    expect(screen.getByText("Strength session · confirmed")).toBeTruthy();
    expect(screen.getByRole("link", { name: C.openProgram }).getAttribute("href")).toMatch(/instances\/pi1$/);
    expect(screen.getByText(C.noteHint("Chidi"))).toBeTruthy();
  });

  it("shows the last note, with every note one tap away", async () => {
    seed();
    renderPage();
    expect(await screen.findByText(C.lastNote("2026-11-12"))).toBeTruthy();
    expect(screen.queryByText("Keep the first week light.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: C.allNotes(2) }));
    expect(screen.getByText("Keep the first week light.")).toBeTruthy();
  });

  it("opens the weight trend in one tap", async () => {
    seed();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: C.showTrend }));
    expect(screen.getByText("74.6 kg")).toBeTruthy();
    expect(screen.getByRole("button", { name: C.hideTrend })).toBeTruthy();
  });

  it("loading draws a skeleton of the page", () => {
    seed();
    api.profile.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status", { name: C.loading })).toBeTruthy();
  });

  it("an error with nothing loaded offers one action", async () => {
    seed();
    api.profile.mockImplementation(() => Promise.resolve({ success: false, message: "x" }));
    renderPage();
    expect(await screen.findByText(C.errorTitle)).toBeTruthy();
    api.profile.mockImplementation(() => ok(PROFILE));
    fireEvent.click(screen.getByRole("button", { name: C.retry }));
    expect(await screen.findByText("Chidi Obi")).toBeTruthy();
  });

  it("offline keeps what was loaded and says when", async () => {
    seed();
    renderPage();
    await screen.findByText("Chidi Obi");
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(await screen.findByText(/You are offline\. Showing what was loaded at/)).toBeTruthy();
    expect(screen.getByText("Chidi Obi")).toBeTruthy();
  });

  it("a new client is empty with one action: start a program", async () => {
    seed(true);
    renderPage();
    expect(await screen.findByRole("button", { name: C.startProgram })).toBeTruthy();
    expect(screen.queryByRole("button", { name: C.startAnother })).toBeNull();
    expect(screen.getAllByText(C.notOnProgram).length).toBeGreaterThan(0);
    expect(screen.getByText(C.noneBooked)).toBeTruthy();
    expect(screen.getByText(C.noNotes)).toBeTruthy();
    expect(screen.getByText(C.noWeight)).toBeTruthy();
    expect(screen.queryByRole("button", { name: C.showTrend })).toBeNull();
    await waitFor(() => expect(screen.queryByText(C.allNotes(0))).toBeNull());
  });

  it("Start a program opens the picker for this client and reloads the page once started", async () => {
    seed(true);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: C.startProgram }));
    expect(screen.getByRole("dialog", { name: "Program for Chidi" })).toBeTruthy();
    const calls = api.overview.mock.calls.length;
    seed();
    fireEvent.click(screen.getByRole("button", { name: "Start program" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(api.overview.mock.calls.length).toBeGreaterThan(calls));
    expect(await screen.findByRole("link", { name: C.openProgram })).toBeTruthy();
  });

  it("a client on a program can start another one", async () => {
    seed();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: C.startAnother }));
    expect(screen.getByRole("dialog", { name: "Program for Chidi" })).toBeTruthy();
  });

  it("Log weight saves for today and shows it as the latest weight", async () => {
    seed();
    api.createWeightLog.mockImplementation(() => ok({ _id: "w9", weight_kg: 81.5, recorded_at: "2026-11-23T10:00:00Z" }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Log weight" }));
    const input = screen.getByLabelText("Weight (kg)");
    fireEvent.change(input, { target: { value: "81,5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save weight" }));
    expect(await screen.findByText(C.logged("2026-11-23"), { exact: false })).toBeTruthy();
    expect(api.createWeightLog).toHaveBeenCalledWith("cp1", { weight_kg: 81.5, recorded_at: expect.any(String) });
    expect(screen.queryByLabelText("Weight (kg)")).toBeNull();
    expect(screen.getByRole("button", { name: "Log weight" })).toBeTruthy();
  });

  it("a former client has no Start or Log weight", async () => {
    seed(true);
    api.profile.mockImplementation(() => ok({ ...PROFILE, is_active: false }));
    renderPage();
    await screen.findByText("Chidi Obi");
    expect(screen.queryByRole("button", { name: C.startProgram })).toBeNull();
    expect(screen.queryByRole("button", { name: "Log weight" })).toBeNull();
  });
});
