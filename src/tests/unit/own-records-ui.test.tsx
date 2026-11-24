import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member/journal",
  useSearchParams: () => new URLSearchParams(),
}));
const auth = vi.hoisted(() => ({ user: { id: "u1", role: "USER", first_name: "Ada", last_name: "A" } as { id: string; role: string; first_name: string; last_name: string } | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user, isLoading: false, logout: vi.fn() }) }));
vi.mock("@/components/Toast", () => ({ toast: vi.fn() }));

const notes = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));
const goals = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), progress: vi.fn(), getSettings: vi.fn(), updateSettings: vi.fn() }));
const history = vi.hoisted(() => ({ read: vi.fn() }));
const starter = vi.hoisted(() => ({ downloadExport: vi.fn() }));
vi.mock("@/lib/api/memberNotes", async (o) => ({ ...(await o<typeof import("@/lib/api/memberNotes")>()), memberNotesService: notes }));
vi.mock("@/lib/api/memberGoals", async (o) => ({ ...(await o<typeof import("@/lib/api/memberGoals")>()), memberGoalsService: goals }));
vi.mock("@/lib/api/memberHistory", async (o) => ({ ...(await o<typeof import("@/lib/api/memberHistory")>()), memberHistoryService: history }));
vi.mock("@/lib/api/starter", async (o) => ({ ...(await o<typeof import("@/lib/api/starter")>()), starterService: starter }));

import { JournalPage } from "@/app/dashboard/member/_components/records/JournalPage";
import { GoalsPage } from "@/app/dashboard/member/_components/records/GoalsPage";
import { HistoryPage } from "@/app/dashboard/member/_components/records/HistoryPage";
import { ExportDataCard } from "@/app/dashboard/settings/privacy/ExportDataCard";
import { dayKeyOf, addDaysTo } from "@/lib/solo/glance";
import { draftKey } from "@/lib/records/journal";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import type { MemberNote } from "@/lib/api/memberNotes";
import type { MemberGoal } from "@/lib/api/memberGoals";

const ok = <T,>(data: T) => ({ success: true as const, data });
const TODAY = dayKeyOf(new Date());
const YESTERDAY = addDaysTo(TODAY, -1);
const note = (id: string, body: string, day = TODAY, mood: MemberNote["mood"] = null): MemberNote => ({
  id, local_day: day, body, mood, linked_kind: null, linked_id: null, created_at: `${day}T09:00:00.000Z`, updated_at: null,
});
const goal = (over: Partial<MemberGoal>): MemberGoal => ({
  id: "g1", text: "Feel stronger by January", kind: "free_text", metric: null, target: null, active: true, archived_at: null,
  created_at: "2026-11-17T10:00:00.000Z", updated_at: null, ...over,
});

let qc: QueryClient;
const renderUi = (ui: ReactNode) => render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
const setOnline = (v: boolean) => Object.defineProperty(window.navigator, "onLine", { value: v, configurable: true });

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  [...Object.values(notes), ...Object.values(goals), ...Object.values(history), ...Object.values(starter)].forEach((f) => f.mockReset());
  auth.user = { id: "u1", role: "USER", first_name: "Ada", last_name: "A" };
  localStorage.clear();
  setOnline(true);
  resetClientNowForTests();
});
afterEach(() => setOnline(true));

describe("Journal", () => {
  it("empty: says nothing is written and that notes are private", async () => {
    notes.list.mockResolvedValue(ok({ items: [], next_cursor: null }));
    renderUi(<JournalPage />);
    expect(await screen.findByTestId("journal-empty")).toHaveTextContent("Nothing written yet");
    expect(screen.getByText("Only you can read your notes.")).toBeInTheDocument();
  });

  it("writes a note with its mood, the device zone and one op id; clears the draft", async () => {
    notes.list.mockResolvedValue(ok({ items: [], next_cursor: null }));
    notes.create.mockResolvedValue(ok(note("n1", "Felt good")));
    const user = userEvent.setup();
    renderUi(<JournalPage />);
    const box = await screen.findByRole("textbox", { name: "Write a note" });
    await user.type(box, "  Felt good ");
    expect(localStorage.getItem(draftKey("u1"))).toContain("Felt good");
    await user.click(screen.getByRole("button", { name: "Good" }));
    await user.click(screen.getByRole("button", { name: "Save note" }));
    await waitFor(() => expect(notes.create).toHaveBeenCalledTimes(1));
    const sent = notes.create.mock.calls[0][0];
    expect(sent).toMatchObject({ body: "Felt good", mood: "good", tz: expect.any(String) });
    expect(sent.client_op_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    await waitFor(() => expect(box).toHaveValue(""));
    expect(localStorage.getItem(draftKey("u1"))).toBeNull();
  });

  it("starts from the draft this browser kept", async () => {
    localStorage.setItem(draftKey("u1"), JSON.stringify({ body: "Half written", mood: "low" }));
    notes.list.mockResolvedValue(ok({ items: [], next_cursor: null }));
    renderUi(<JournalPage />);
    expect(await screen.findByRole("textbox", { name: "Write a note" })).toHaveValue("Half written");
  });

  it("lists notes under day headings, then edits and deletes one (delete asks first)", async () => {
    notes.list.mockResolvedValue(ok({ items: [note("n1", "Walked", TODAY, "good"), note("n2", "Long day", YESTERDAY)], next_cursor: null }));
    notes.update.mockResolvedValue(ok(note("n1", "Walked far")));
    notes.remove.mockResolvedValue(ok({}));
    const user = userEvent.setup();
    renderUi(<JournalPage />);
    expect(await screen.findByText("Walked")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeInTheDocument();

    const first = screen.getByTestId("note-n1");
    await user.click(within(first).getByRole("button", { name: /^Edit/ }));
    const editBox = within(first).getByRole("textbox", { name: "Edit your note" });
    await user.clear(editBox);
    await user.type(editBox, "Walked far");
    await user.click(within(first).getByRole("button", { name: "Good" })); // clears the mood
    await user.click(within(first).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(notes.update).toHaveBeenCalledWith("n1", { body: "Walked far", mood: null }));

    await user.click(within(screen.getByTestId("note-n2")).getByRole("button", { name: /^Delete/ }));
    expect(await screen.findByText("It will be gone for good.")).toBeInTheDocument();
    expect(notes.remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(notes.remove).toHaveBeenCalledWith("n2"));
  });

  it("at 5 notes today, says so and will not save", async () => {
    notes.list.mockResolvedValue(ok({ items: [1, 2, 3, 4, 5].map((i) => note(`n${i}`, `note ${i}`)), next_cursor: null }));
    const user = userEvent.setup();
    renderUi(<JournalPage />);
    await user.type(await screen.findByRole("textbox", { name: "Write a note" }), "one more");
    expect(screen.getByTestId("note-limit")).toHaveTextContent("the most for one day");
    expect(screen.getByRole("button", { name: "Save note" })).toBeDisabled();
  });

  it("pages with Show older notes", async () => {
    notes.list.mockResolvedValueOnce(ok({ items: [note("n1", "new")], next_cursor: "c1" }));
    notes.list.mockResolvedValueOnce(ok({ items: [note("n9", "older", YESTERDAY)], next_cursor: null }));
    const user = userEvent.setup();
    renderUi(<JournalPage />);
    await user.click(await screen.findByRole("button", { name: "Show older notes" }));
    expect(await screen.findByText("older")).toBeInTheDocument();
    expect(notes.list).toHaveBeenLastCalledWith({ limit: 20, cursor: "c1" });
  });
});

describe("Goals", () => {
  const PROGRESS = { tz: "UTC", week_start: "monday", week: { from: "a", to: "b" }, goals: [{ id: "g2", text: "Walk", metric: "walks", target: 4, count: 2 }] };
  beforeEach(() => {
    goals.progress.mockResolvedValue(ok(PROGRESS));
    goals.create.mockResolvedValue(ok(goal({})));
    goals.update.mockResolvedValue(ok(goal({})));
    goals.remove.mockResolvedValue(ok({}));
    goals.updateSettings.mockResolvedValue(ok({ week_start: "sunday" }));
  });

  it("shows N of M for a weekly goal, no number for words, and archived goals apart", async () => {
    goals.list.mockResolvedValue(
      ok([goal({}), goal({ id: "g2", text: "Walk", kind: "weekly_target", metric: "walks", target: 4 }), goal({ id: "g3", text: "Old", active: false })]),
    );
    const user = userEvent.setup();
    renderUi(<GoalsPage />);
    expect(await screen.findByTestId("goal-count-g2")).toHaveTextContent("2 of 4");
    expect(screen.getByText(/A goal without a number\. Written 17 Nov\./)).toBeInTheDocument();
    expect(screen.getByText("This week, Monday to Sunday. Resets each week.")).toBeInTheDocument();
    expect(screen.queryByText("Old")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archived goals (1)" }));
    expect(screen.getByTestId("archived-g3")).toHaveTextContent("Archived");
    expect(document.body.textContent).not.toMatch(/missed|streak|%/i);
  });

  it("adds a goal in words and a weekly goal with what to count and how often", async () => {
    goals.list.mockResolvedValue(ok([]));
    const user = userEvent.setup();
    renderUi(<GoalsPage />);
    expect(await screen.findByTestId("goals-empty")).toHaveTextContent("No goals yet");
    await user.click(screen.getByRole("button", { name: "Add a goal" }));
    const add = screen.getByRole("button", { name: "Add goal" });
    expect(add).toBeDisabled();
    await user.type(screen.getByLabelText("Your goal, in your own words"), "  Feel   stronger ");
    await user.click(add);
    await waitFor(() => expect(goals.create).toHaveBeenCalledWith({ text: "Feel stronger", kind: "free_text" }));

    await user.click(await screen.findByRole("button", { name: "Add a goal" }));
    await user.type(screen.getByLabelText("Your goal, in your own words"), "Fast on weekdays");
    await user.click(screen.getByRole("button", { name: "A number each week" }));
    await user.click(screen.getByRole("button", { name: "Days with water" }));
    await user.click(screen.getByRole("button", { name: "5 times a week" }));
    await user.click(screen.getByRole("button", { name: "Add goal" }));
    await waitFor(() => expect(goals.create).toHaveBeenLastCalledWith({ text: "Fast on weekdays", kind: "weekly_target", metric: "water_days", target: 5 }));
  });

  it("edits, archives, restores and deletes (delete asks first)", async () => {
    goals.list.mockResolvedValue(ok([goal({}), goal({ id: "g3", text: "Old", active: false })]));
    const user = userEvent.setup();
    renderUi(<GoalsPage />);
    await user.click(await screen.findByRole("button", { name: "Edit Feel stronger by January" }));
    const field = screen.getByLabelText("Your goal, in your own words");
    await user.clear(field);
    await user.type(field, "Feel strong");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(goals.update).toHaveBeenCalledWith("g1", { text: "Feel strong" }));

    await user.click(await screen.findByRole("button", { name: "Archive Feel stronger by January" }));
    await waitFor(() => expect(goals.update).toHaveBeenLastCalledWith("g1", { active: false }));

    await user.click(screen.getByRole("button", { name: "Archived goals (1)" }));
    await user.click(screen.getByRole("button", { name: "Restore Old" }));
    await waitFor(() => expect(goals.update).toHaveBeenLastCalledWith("g3", { active: true }));

    await user.click(screen.getByRole("button", { name: "Delete Old" }));
    expect(await screen.findByText("It will be gone for good.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(goals.remove).toHaveBeenCalledWith("g3"));
  });

  it("at 10 active goals, Add is off and says why; the week start saves", async () => {
    goals.list.mockResolvedValue(ok(Array.from({ length: 10 }, (_, i) => goal({ id: `g${i}`, text: `Goal ${i}` }))));
    const user = userEvent.setup();
    renderUi(<GoalsPage />);
    expect(await screen.findByTestId("goals-limit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a goal" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Sunday" }));
    await waitFor(() => expect(goals.updateSettings).toHaveBeenCalledWith({ week_start: "sunday" }));
  });

  it("a failed read says so and retries", async () => {
    goals.list.mockResolvedValue({ success: false, status: 500 });
    renderUi(<GoalsPage />);
    expect(await screen.findByTestId("goals-error")).toHaveTextContent("We could not load your goals");
  });
});

describe("History", () => {
  const at = (day: string, hh: string) => `${day}T${hh}:00:00`;
  const page1 = {
    tz: "UTC",
    items: [
      { kind: "weight", id: "w1", at: at(TODAY, "07"), local_day: TODAY, title: "", weight_kg: 73.1, source: "manual" },
      { kind: "water", id: "wa1", at: at(YESTERDAY, "20"), local_day: YESTERDAY, title: "", glasses: 7 },
    ],
    next_cursor: "cur-2",
  };
  const page2 = { tz: "UTC", items: [{ kind: "note", id: "n1", at: at(addDaysTo(TODAY, -3), "09"), local_day: addDaysTo(TODAY, -3), title: "", preview: "Headache", mood: "tired", linked_kind: null }], next_cursor: null };

  it("renders rows under day headings; earlier water is read only; Show older reads the next page", async () => {
    history.read.mockResolvedValueOnce(ok(page1)).mockResolvedValueOnce(ok(page2));
    const user = userEvent.setup();
    renderUi(<HistoryPage />);
    const weight = await screen.findByTestId("history-weight-w1");
    expect(weight).toHaveTextContent("73.1 kg");
    expect(within(weight).getByRole("link")).toHaveAttribute("href", "/dashboard/member/weight-log");
    expect(within(screen.getByTestId("history-water-wa1")).queryByRole("link")).toBeNull();
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeInTheDocument();
    expect(history.read).toHaveBeenCalledWith(expect.objectContaining({ types: null, limit: 30, cursor: undefined }));

    await user.click(screen.getByTestId("history-more"));
    expect(await screen.findByText("Headache")).toBeInTheDocument();
    expect(history.read).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "cur-2" }));
    expect(screen.queryByTestId("history-more")).toBeNull();
  });

  it("a filter chip asks for that kind only, and an empty filter says so", async () => {
    history.read.mockResolvedValueOnce(ok(page1)).mockResolvedValueOnce(ok({ tz: "UTC", items: [], next_cursor: null }));
    const user = userEvent.setup();
    renderUi(<HistoryPage />);
    await screen.findByTestId("history-weight-w1");
    await user.click(screen.getByRole("button", { name: "Fasts" }));
    expect(await screen.findByTestId("history-empty")).toHaveTextContent("Nothing here yet");
    expect(history.read).toHaveBeenLastCalledWith(expect.objectContaining({ types: ["fast"] }));
  });

  it("nothing logged at all", async () => {
    history.read.mockResolvedValue(ok({ tz: "UTC", items: [], next_cursor: null }));
    renderUi(<HistoryPage />);
    expect(await screen.findByTestId("history-empty")).toHaveTextContent("Nothing logged yet");
  });
});

describe("Export my data (Settings, Privacy)", () => {
  let created: HTMLAnchorElement[] = [];
  beforeEach(() => {
    created = [];
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      created.push(this);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("lists what is in the file, says meals are not, and downloads the CSV (all of it)", async () => {
    starter.downloadExport.mockResolvedValue(ok({ blob: new Blob(["a,b"]), filename: "binectics-history-2026-11-23.csv" }));
    const user = userEvent.setup();
    renderUi(<ExportDataCard />);
    const included = screen.getByTestId("export-included");
    for (const line of ["Fasts", "Water and your daily list", "Weight", "Activity", "Program sessions and tasks", "Journal notes and goals"]) {
      expect(within(included).getByText(line)).toBeInTheDocument();
    }
    expect(screen.getByTestId("export-not-included")).toHaveTextContent("Meals are not in the file yet.");
    await user.click(screen.getByRole("button", { name: "Create my file" }));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(starter.downloadExport).toHaveBeenCalledWith("csv", {});
    expect(created[0].download).toBe("binectics-history-2026-11-23.csv");
    expect(created[0].href).toBe("blob:x");
  });

  it("JSON, and a file too large offers a shorter time that is sent as from", async () => {
    starter.downloadExport
      .mockResolvedValueOnce({ success: false, status: 413, code: "EXPORT_TOO_LARGE" })
      .mockResolvedValueOnce(ok({ blob: new Blob(["{}"]), filename: "binectics-history-2026-11-23.json" }));
    const user = userEvent.setup();
    renderUi(<ExportDataCard />);
    await user.click(screen.getByRole("button", { name: "JSON" }));
    await user.click(screen.getByRole("button", { name: "Create my file" }));
    expect(await screen.findByTestId("export-error")).toHaveTextContent("too large");
    await user.click(screen.getByRole("button", { name: "Last 3 months" }));
    await user.click(screen.getByRole("button", { name: "Create my file" }));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(starter.downloadExport).toHaveBeenLastCalledWith("json", { from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T00:00:00.000Z$/) });
  });

  it("is not shown to providers", () => {
    auth.user = { id: "p1", role: "TRAINER", first_name: "T", last_name: "R" };
    const { container } = renderUi(<ExportDataCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
