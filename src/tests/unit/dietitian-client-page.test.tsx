import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Web provider parity batch C: the dietitian's client page rebuilt on the
 * coach client page, with mobile CoachClientScreen's dietitian sections
 * (meal plans; meals logged with a reply), and the reused #354 pieces wired.
 */
vi.mock("next/navigation", () => ({ useParams: () => ({ clientId: "cp1" }) }));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({ DietitianDashboardShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/messaging/StartConversationButton", () => ({ StartConversationButton: () => <button type="button">Message</button> }));
vi.mock("@/components/progress-reports/ClientReportsCard", () => ({ ClientReportsCard: () => <div>Progress reports</div> }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "me", role: "DIETITIAN" } }) }));
vi.mock("@/components/programs/results/ProgramResultsSection", () => ({
  default: ({ programsPath }: { programsPath?: string }) => <section data-path={programsPath}>Program results</section>,
}));
vi.mock("@/components/clients/StartProgramDialog", () => ({
  StartProgramDialog: ({ clientName, programsPath }: { clientName: string; programsPath: string }) => (
    <div role="dialog" aria-label={`Program for ${clientName}`} data-path={programsPath} />
  ),
}));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtDate: (s: string) => s.slice(0, 10), fmtDateTime: (s: string) => s.slice(0, 16) }),
}));

const api = vi.hoisted(() => ({
  profile: vi.fn(),
  journals: vi.fn(),
  weights: vi.fn(),
  dietPlans: vi.fn(),
  meals: vi.fn(),
  replyToMeal: vi.fn(),
  deleteMealReply: vi.fn(),
  createWeightLog: vi.fn(),
  overview: vi.fn(),
  bookings: vi.fn(),
  listOneOffTasks: vi.fn(),
}));
vi.mock("@/lib/api/progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/progress")>()),
  progressService: {
    getClientProfile: api.profile,
    getClientJournalEntries: api.journals,
    getWeightLogs: api.weights,
    getDietPlans: api.dietPlans,
    getProviderDietPlans: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    getMealFeedbacks: api.meals,
    replyToMeal: api.replyToMeal,
    deleteMealReply: api.deleteMealReply,
    createClientJournalEntry: vi.fn(),
    createWeightLog: api.createWeightLog,
  },
}));
vi.mock("@/lib/api/programs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/programs")>()),
  programsService: { getClientOverview: api.overview, listOneOffTasks: api.listOneOffTasks },
}));
vi.mock("@/lib/api/consultations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/consultations")>()),
  consultationsService: { getProviderBookings: api.bookings },
}));

import DietitianClientPage from "@/app/dashboard/dietitian/clients/[clientId]/page";
import { DIETITIAN_CLIENT_COPY as C } from "@/app/dashboard/dietitian/clients/[clientId]/copy";
import { ClientMealsCard, MEALS_COPY as M, ratingTone } from "@/components/clients/ClientMealsCard";
import { LOG_WEIGHT_COPY as LW } from "@/components/clients/LogWeightForm";
import { toast } from "@/components/Toast";
import { MealRating } from "@/lib/api/progress";

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const PROFILE = { _id: "cp1", client_id: { _id: "c1", first_name: "Ada", last_name: "Eze", email: "" }, is_active: true, goals: ["Eat more protein"], target_weight_kg: 68, created_at: "2026-10-02T00:00:00Z" };

const meal = (over: Record<string, unknown> = {}) => ({
  _id: "m1",
  client_profile_id: "cp1",
  client_id: "c1",
  meal_date: "2026-11-22T12:00:00Z",
  meal_type: "lunch",
  description: "Jollof rice and chicken",
  rating: "poor",
  calories: 650,
  feedback: "Too much rice",
  logged_by: "c1",
  reply: null,
  created_at: "2026-11-22T12:30:00Z",
  updated_at: "2026-11-22T12:30:00Z",
  ...over,
});

function seed({ empty = false, active = true } = {}) {
  api.profile.mockImplementation(() => ok({ ...PROFILE, is_active: active }));
  api.journals.mockImplementation(() => ok(empty ? [] : [{ _id: "j1", notes: "Swap one rice meal for beans.", entry_date: "2026-11-12T18:00:00Z" }]));
  api.weights.mockImplementation(() => ok(empty ? [] : [
    { _id: "w1", weight_kg: 71.2, recorded_at: "2026-11-16T07:00:00Z" },
    { _id: "w2", weight_kg: 71.9, recorded_at: "2026-11-09T07:00:00Z" },
  ]));
  api.dietPlans.mockImplementation(() => ok(empty ? [] : [
    { _id: "d1", title: "Lower-carb week", status: "active", delivery_type: "platform", meals: [{}, {}, {}], assigned_at: "2026-11-01T00:00:00Z" },
    { _id: "d2", title: "Ramadan plan", status: "inactive", delivery_type: "document", document_file_name: "ramadan.pdf", meals: [], assigned_at: "2026-10-01T00:00:00Z" },
  ]));
  api.meals.mockImplementation(() => ok(empty ? [] : [meal()]));
  api.overview.mockImplementation(() => ok({ programs: empty ? [] : [{ id: "pi1", name: "Nutrition reset", kind: "program", status: "active", progress: { day: 4, total_days: 28, last_7_days: { scheduled: 7, done: 5, done_late: 0, skipped: 0, missed: 1, open: 1 } } }], today: [] }));
  api.bookings.mockImplementation(() => ok(empty ? [] : [{ id: "b1", clientUserId: "c1", consultationTypeName: "Follow-up", startsAt: "2099-11-21T07:30:00Z", endsAt: "2099-11-21T08:00:00Z", status: "CONFIRMED" }]));
  api.listOneOffTasks.mockImplementation(() => ok({ today: "2026-11-23", max_due: "2026-12-31", tasks: empty ? [] : [{ id: "t1", instance_id: "i1", type: "form", title: "Food diary", detail: null, form_id: "f1", due_date: "2026-11-20", status: "done", completed_late: false, actioned_at: "2026-11-20T08:00:00Z", form_response_id: "r2" }] }));
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><DietitianClientPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  onlineManager.setOnline(true);
});

describe("dietitian client page", () => {
  it("follows the coach page order with the dietitian's sections, body measurements last", async () => {
    seed();
    renderPage();
    await screen.findByText("Ada Eze");
    await screen.findByText("Jollof rice and chicken");
    const text = document.body.textContent ?? "";
    const order = [C.nextSession, C.thisWeek, "Program results", M.title, C.noteTo("Ada"), C.mealPlans, C.sessions, C.body].map((s) => text.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(screen.getByText(C.weekDone(5, 7))).toBeTruthy();
    expect(screen.getByText("Nutrition reset · 1 missed")).toBeTruthy();
    expect(screen.getByText("Follow-up · confirmed")).toBeTruthy();
    expect(screen.getByPlaceholderText(C.notePlaceholder)).toBeTruthy();
  });

  it("links programs, results and sessions to the dietitian's own pages", async () => {
    seed();
    renderPage();
    expect((await screen.findByRole("link", { name: C.openProgram })).getAttribute("href")).toBe("/dashboard/dietitian/programs/instances/pi1");
    expect(screen.getByText("Program results").getAttribute("data-path")).toBe("/dashboard/dietitian/programs");
    expect(screen.getByRole("link", { name: C.allSessions }).getAttribute("href")).toBe("/dashboard/dietitian/consultations");
    fireEvent.click(screen.getByRole("button", { name: C.startAnother }));
    expect(screen.getByRole("dialog", { name: "Program for Ada" }).getAttribute("data-path")).toBe("/dashboard/dietitian/programs");
  });

  it("lists meal plans with a paused badge and offers another", async () => {
    seed();
    renderPage();
    expect(await screen.findByText("Lower-carb week")).toBeTruthy();
    expect(screen.getByText(`${C.mealCount(3)} · ${C.assigned("2026-11-01")}`)).toBeTruthy();
    expect(screen.getByText(`${C.document("ramadan.pdf")} · ${C.assigned("2026-10-01")}`)).toBeTruthy();
    expect(screen.getAllByText(C.paused)).toHaveLength(1);
    expect(screen.getByRole("button", { name: C.giveAnother })).toBeTruthy();
  });

  it("a new client: no plan, no meals, no program, Start a program", async () => {
    seed({ empty: true });
    renderPage();
    expect(await screen.findByText(C.noMealPlan)).toBeTruthy();
    expect(screen.getByRole("button", { name: C.giveMealPlan })).toBeTruthy();
    expect(await screen.findByText(M.none)).toBeTruthy();
    expect(screen.getByRole("button", { name: C.startProgram })).toBeTruthy();
    expect(screen.getByText(C.noWeight)).toBeTruthy();
  });

  it("a failed meal plan read says so instead of 'none'", async () => {
    seed();
    api.dietPlans.mockImplementation(() => Promise.resolve({ success: false, message: "x" }));
    renderPage();
    expect(await screen.findByText(C.mealPlansLoadFailed)).toBeTruthy();
    expect(screen.queryByRole("button", { name: C.giveMealPlan })).toBeNull();
  });

  it("logs a weight with the shared form and shows it first", async () => {
    seed();
    api.createWeightLog.mockReturnValue(ok({ _id: "w3", weight_kg: 70.8, recorded_at: "2026-11-23T07:00:00Z" }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: LW.open }));
    const input = screen.getByLabelText(LW.label);
    fireEvent.change(input, { target: { value: "70,8" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(api.createWeightLog).toHaveBeenCalledWith("cp1", expect.objectContaining({ weight_kg: 70.8 })));
    expect(await screen.findByText("70.8")).toBeTruthy();
  });

  it("shows the forms-and-tasks card with Answers on a returned form", async () => {
    seed();
    renderPage();
    const link = await screen.findByRole("link", { name: "See answers to Food diary" });
    expect(link.getAttribute("href")).toBe("/dashboard/forms/f1/responses?response=r2");
  });

  it("a former client: read-only, no reply, no start, no log weight", async () => {
    seed({ active: false });
    renderPage();
    expect(await screen.findByText(C.formerClient)).toBeTruthy();
    await screen.findByText("Jollof rice and chicken");
    expect(screen.queryByRole("button", { name: /^Reply/ })).toBeNull();
    expect(screen.queryByRole("button", { name: C.startProgram })).toBeNull();
    expect(screen.queryByRole("button", { name: LW.open })).toBeNull();
    expect(screen.queryByText("Program results")).toBeNull();
  });

  it("an error with nothing loaded offers one action", async () => {
    seed();
    api.profile.mockImplementation(() => Promise.resolve({ success: false, message: "x" }));
    renderPage();
    expect(await screen.findByText(C.errorTitle)).toBeTruthy();
    api.profile.mockImplementation(() => ok(PROFILE));
    fireEvent.click(screen.getByRole("button", { name: C.retry }));
    expect(await screen.findByText("Ada Eze")).toBeTruthy();
  });

  it("loading draws a skeleton of the page", () => {
    seed();
    api.profile.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status", { name: C.loading })).toBeTruthy();
  });
});

describe("meals logged card", () => {
  const renderCard = (canReply = true) => render(<ClientMealsCard clientProfileId="cp1" clientFirstName="Ada" canReply={canReply} />);

  it("lists the latest five with rating, details and note, and links to the feed", async () => {
    api.meals.mockImplementation(() => ok([meal()]));
    renderCard();
    expect(await screen.findByText("Jollof rice and chicken")).toBeTruthy();
    expect(api.meals).toHaveBeenCalledWith("cp1", 5);
    expect(screen.getByText("Lunch · 2026-11-22 · 650 kcal")).toBeTruthy();
    expect(screen.getByText("Too much rice")).toBeTruthy();
    expect(screen.getByText("Poor").closest("[data-tone]")?.getAttribute("data-tone")).toBe("danger");
    expect(screen.getByRole("link", { name: M.across }).getAttribute("href")).toBe("/dashboard/dietitian/feedback");
  });

  it("rates poor as danger, okay as warn, the rest as success", () => {
    expect(ratingTone(MealRating.POOR)).toBe("danger");
    expect(ratingTone(MealRating.OKAY)).toBe("warn");
    expect(ratingTone(MealRating.GOOD)).toBe("success");
    expect(ratingTone(MealRating.GREAT)).toBe("success");
  });

  it("empty: says no meals yet", async () => {
    api.meals.mockImplementation(() => ok([]));
    renderCard();
    expect(await screen.findByText(M.none)).toBeTruthy();
  });

  it("a failed read offers Try again", async () => {
    api.meals.mockImplementationOnce(() => Promise.resolve({ success: false }));
    renderCard();
    expect(await screen.findByText(M.loadFailed)).toBeTruthy();
    api.meals.mockImplementation(() => ok([meal()]));
    fireEvent.click(screen.getByRole("button", { name: M.retry }));
    expect(await screen.findByText("Jollof rice and chicken")).toBeTruthy();
  });

  it("replies in place, shows it as Your reply, and toasts", async () => {
    api.meals.mockImplementation(() => ok([meal()]));
    api.replyToMeal.mockReturnValue(ok(meal({ reply: { text: "Try half the rice, add beans.", author_id: { _id: "me" }, created_at: "", updated_at: "" } })));
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: `${M.reply}: Jollof rice and chicken` }));
    expect(screen.getByText(M.helpNew("Ada"))).toBeTruthy();
    const box = screen.getByLabelText(M.replyLabel("Ada"));
    expect(screen.getByRole("button", { name: M.send }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(box, { target: { value: "  Try half the rice, add beans.  " } });
    fireEvent.click(screen.getByRole("button", { name: M.send }));
    await waitFor(() => expect(api.replyToMeal).toHaveBeenCalledWith("m1", "Try half the rice, add beans."));
    expect(await screen.findByText(M.yourReply)).toBeTruthy();
    expect(screen.getByText("Try half the rice, add beans.")).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith(M.sent("Ada"));
  });

  it("a refused reply stays open with the API's words", async () => {
    api.meals.mockImplementation(() => ok([meal()]));
    api.replyToMeal.mockReturnValue(Promise.resolve({ success: false, message: "You no longer look after this member." }));
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: `${M.reply}: Jollof rice and chicken` }));
    fireEvent.change(screen.getByLabelText(M.replyLabel("Ada")), { target: { value: "Nice" } });
    fireEvent.click(screen.getByRole("button", { name: M.send }));
    expect((await screen.findByRole("alert")).textContent).toBe("You no longer look after this member.");
    expect(screen.getByLabelText(M.replyLabel("Ada"))).toBeTruthy();
  });

  it("edits and removes my own reply after a confirm", async () => {
    api.meals.mockImplementation(() => ok([meal({ reply: { text: "Good choice.", author_id: { _id: "me" }, created_at: "", updated_at: "" } })]));
    api.deleteMealReply.mockReturnValue(ok(undefined));
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: `${M.edit}: Jollof rice and chicken` }));
    expect((screen.getByLabelText(M.replyLabel("Ada")) as HTMLTextAreaElement).value).toBe("Good choice.");
    expect(screen.getByRole("button", { name: M.save })).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText(M.replyLabel("Ada")), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: M.remove }));
    const group = screen.getByRole("group", { name: M.remove });
    expect(within(group).getByText(M.removeAsk("Ada"))).toBeTruthy();
    fireEvent.click(within(group).getByRole("button", { name: M.removeConfirm }));
    await waitFor(() => expect(api.deleteMealReply).toHaveBeenCalledWith("m1"));
    expect(await screen.findByRole("button", { name: `${M.reply}: Jollof rice and chicken` })).toBeTruthy();
    expect(screen.queryByText("Good choice.")).toBeNull();
  });

  it("another dietitian's reply is shown, not editable", async () => {
    api.meals.mockImplementation(() => ok([meal({ reply: { text: "Less oil.", author_id: { _id: "other", first_name: "Bola", last_name: "Ade" }, created_at: "", updated_at: "" } })]));
    renderCard();
    expect(await screen.findByText(M.replyFrom("Bola Ade"))).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Reply|Edit/ })).toBeNull();
  });

  it("without canReply, replies are read-only", async () => {
    api.meals.mockImplementation(() => ok([meal()]));
    renderCard(false);
    await screen.findByText("Jollof rice and chicken");
    expect(screen.queryByRole("button", { name: /Reply/ })).toBeNull();
  });
});
