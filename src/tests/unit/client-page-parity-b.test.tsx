import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { OneOffTask, ProgramTemplate } from "@/lib/api/programs";

/**
 * Web provider parity batch B (gaps 8-10): a sent form's Answers deep link
 * and the responses page it opens, Start a program from the client, and the
 * coach logging a client's weight.
 */

const api = vi.hoisted(() => ({
  listOneOffTasks: vi.fn(),
  listTemplates: vi.fn(),
  startClient: vi.fn(),
  publishTemplate: vi.fn(),
  createWeightLog: vi.fn(),
  grant: vi.fn(),
  askToPay: vi.fn(),
  getFormById: vi.fn(),
  getFormQuestions: vi.fn(),
  getFormResponses: vi.fn(),
  getFormAnalytics: vi.fn(),
  search: { value: "" },
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@/components/Toast", () => ({ toast }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(api.search.value),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/forms/f1/responses",
}));
vi.mock("@/components/ds/WorkspaceShell", () => ({ WorkspaceShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/ds/PlanGate", () => ({ PlanGate: () => <div>Plan gate</div> }));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtDate: (s: string) => s.slice(0, 10), fmtDateTime: (s: string) => s.slice(0, 16), fmtNumber: (n: number) => String(n) }),
}));
vi.mock("@/lib/api/programs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/programs")>()),
  programsService: {
    listOneOffTasks: api.listOneOffTasks,
    listTemplates: api.listTemplates,
    startClient: api.startClient,
    publishTemplate: api.publishTemplate,
  },
}));
vi.mock("@/lib/api/progress", () => ({ progressService: { createWeightLog: api.createWeightLog } }));
vi.mock("@/lib/api/paidContent", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/paidContent")>()),
  paidContentService: { grant: api.grant, askToPay: api.askToPay },
}));
vi.mock("@/lib/api/forms", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/forms")>()),
  formsService: {
    getFormById: api.getFormById,
    getFormQuestions: api.getFormQuestions,
    getFormResponses: api.getFormResponses,
    getFormAnalytics: api.getFormAnalytics,
  },
}));

import OneOffTasksCard, { answersHref } from "@/components/programs/OneOffTasksCard";
import FormResponsesPage from "@/app/dashboard/forms/[formId]/responses/page";
import { RESPONSE_GONE, THIS_SUBMISSION } from "@/app/dashboard/forms/[formId]/responses/copy";
import { StartProgramDialog, START_PROGRAM_COPY as SP, startOptions, startablePrograms } from "@/components/clients/StartProgramDialog";
import { LogWeightForm, LOG_WEIGHT_COPY as LW, parseWeightKg } from "@/components/clients/LogWeightForm";

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const fail = (over: Record<string, unknown>) => Promise.resolve({ success: false, ...over });

beforeEach(() => {
  vi.clearAllMocks();
  api.search.value = "";
});

// ── Gap 8: Answers ──────────────────────────────────────────────────

const task = (over: Partial<OneOffTask>): OneOffTask => ({
  id: "t1",
  instance_id: "i1",
  type: "form",
  title: "Weekly check-in",
  detail: null,
  form_id: "f1",
  due_date: "2026-11-20",
  status: "done",
  completed_late: false,
  actioned_at: "2026-11-20T08:00:00Z",
  form_response_id: "r2",
  ...over,
});

describe("Answers on a sent form", () => {
  it("links a submitted form to its response, and nothing else", () => {
    expect(answersHref(task({}))).toBe("/dashboard/forms/f1/responses?response=r2");
    expect(answersHref(task({ form_response_id: null }))).toBe("/dashboard/forms/f1/responses");
    expect(answersHref(task({ status: "pending" }))).toBeNull();
    expect(answersHref(task({ type: "instruction", form_id: null }))).toBeNull();
    expect(answersHref(task({ form_id: null }))).toBeNull();
  });

  it("shows Answers on the submitted row of the card", async () => {
    api.listOneOffTasks.mockReturnValue(ok({ today: "2026-11-23", max_due: "2026-12-31", tasks: [task({}), task({ id: "t2", title: "Food diary", status: "pending", form_response_id: null })] }));
    render(<OneOffTasksCard clientProfileId="cp1" />);
    const link = await screen.findByRole("link", { name: "See answers to Weekly check-in" });
    expect(link.getAttribute("href")).toBe("/dashboard/forms/f1/responses?response=r2");
    expect(screen.queryByRole("link", { name: "See answers to Food diary" })).toBeNull();
  });
});

describe("form responses page deep link", () => {
  const responses = [
    { _id: "r1", form_id: "f1", submitted_by_id: "u1", submitted_by: "Ada Eze", submitted_at: "2026-11-21T09:00:00Z", is_complete: true, answers: [] },
    { _id: "r2", form_id: "f1", submitted_by_id: "u2", submitted_by: "Chidi Obi", submitted_at: "2026-11-20T08:00:00Z", is_complete: true, answers: [{ _id: "a1", response_id: "r2", question_id: "q1", value: "Slept 7 hours" }] },
  ];

  function seedForm() {
    api.getFormById.mockReturnValue(ok({ _id: "f1", title: "Weekly check-in" }));
    api.getFormQuestions.mockReturnValue(ok([{ _id: "q1", label: "How did you sleep?" }]));
    api.getFormResponses.mockReturnValue(ok(responses));
    api.getFormAnalytics.mockReturnValue(ok({ total_responses: 2, completion_rate: 1, average_completion_time: 0, questions: [] }));
  }

  async function renderPage() {
    const params = Promise.resolve({ formId: "f1" });
    await act(async () => {
      render(<FormResponsesPage params={params} />);
    });
  }

  it("selects the submission asked for and scrolls to it", async () => {
    seedForm();
    api.search.value = "response=r2";
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    await renderPage();
    expect(await screen.findByText(THIS_SUBMISSION)).toBeTruthy();
    expect(screen.getByText("Chidi Obi")).toBeTruthy();
    expect(screen.getByText("Slept 7 hours")).toBeTruthy();
    expect(screen.queryByText("Ada Eze")).toBeNull();
    const detail = document.querySelector('[data-response-id="r2"]');
    await waitFor(() => expect(scroll).toHaveBeenCalled());
    expect(document.activeElement).toBe(detail);
  });

  it("says so when the submission is gone, and lists them all", async () => {
    seedForm();
    api.search.value = "response=gone";
    await renderPage();
    expect(await screen.findByText(RESPONSE_GONE)).toBeTruthy();
    expect(screen.getByText("Ada Eze")).toBeTruthy();
    expect(screen.getByText("Chidi Obi")).toBeTruthy();
  });

  it("without a link it opens on analytics as before", async () => {
    seedForm();
    await renderPage();
    await screen.findByText("No question analytics yet.");
    expect(screen.queryByText(THIS_SUBMISSION)).toBeNull();
  });
});

// ── Gap 9: Start a program ──────────────────────────────────────────

const template = (over: Partial<ProgramTemplate>): ProgramTemplate => ({
  _id: "p1",
  created_by: "me",
  organization_id: null,
  name: "Strength base",
  status: "published",
  latest_version_no: 2,
  latest_published_version_no: 1,
  task_count: 6,
  publish_state: { sold_or_listed: false, published_version_no: 1, has_unpublished_changes: true, needs_publish: false },
  created_at: "",
  updated_at: "",
  ...over,
});

function renderDialog() {
  const onStarted = vi.fn();
  const onClose = vi.fn();
  render(<StartProgramDialog clientProfileId="cp1" clientName="Chidi" programsPath="/dashboard/trainer/programs" onClose={onClose} onStarted={onStarted} />);
  return { onStarted, onClose };
}

describe("start a program from the client", () => {
  it("offers today, tomorrow and next Monday, dropping Monday when it is tomorrow", () => {
    // Wed 25 Nov 2026
    expect(startOptions(new Date(2026, 10, 25)).map((o) => o.date)).toEqual(["2026-11-25", "2026-11-26", "2026-11-30"]);
    // Sun 29 Nov: Monday is tomorrow
    expect(startOptions(new Date(2026, 10, 29)).map((o) => o.label)).toEqual([SP.today, SP.tomorrow]);
  });

  it("lists drafts and published programs with tasks, never archived or empty ones", () => {
    const rows = [
      template({ _id: "a", status: "draft", latest_published_version_no: 0 }),
      template({ _id: "b", status: "archived" }),
      template({ _id: "c", task_count: 0 }),
      template({ _id: "d", task_count: undefined, latest_published_version_no: 0 }),
      template({ _id: "e", task_count: undefined, latest_published_version_no: 1 }),
    ];
    expect(startablePrograms(rows).map((t) => t._id)).toEqual(["a", "e"]);
  });

  it("starts a draft with publish_latest in one call, toasts and reports back", async () => {
    api.listTemplates.mockReturnValue(ok([template({ _id: "d1", name: "Mobility draft", status: "draft", latest_published_version_no: 0 })]));
    api.startClient.mockReturnValue(ok({ instance: { _id: "i9" }, template: {}, version: {}, published: true, publish_state: {} }));
    const { onStarted } = renderDialog();
    // One program: picked for you.
    const radio = await screen.findByRole("radio", { name: /Mobility draft/ });
    expect((radio as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: SP.tomorrow }));
    fireEvent.click(screen.getByRole("button", { name: SP.start }));
    await waitFor(() => expect(onStarted).toHaveBeenCalled());
    // programsService.startClient always sends publish_latest: true.
    expect(api.startClient).toHaveBeenCalledWith("d1", expect.objectContaining({ client_profile_id: "cp1", start_date: startOptions()[1].date, timezone: expect.any(String) }));
    expect(toast.success).toHaveBeenCalledWith(SP.started("Chidi"));
  });

  it("a sold program with unpublished edits needs Publish changes first", async () => {
    api.listTemplates.mockReturnValue(ok([template({ publish_state: { sold_or_listed: true, published_version_no: 1, has_unpublished_changes: true, needs_publish: true } })]));
    api.publishTemplate.mockReturnValue(ok({ template: template({}), version: {}, publish_state: { sold_or_listed: true, published_version_no: 2, has_unpublished_changes: false, needs_publish: false } }));
    renderDialog();
    await screen.findByRole("radio", { name: /Strength base/ });
    expect(screen.getByText(SP.publishNote)).toBeTruthy();
    expect((screen.getByRole("button", { name: SP.start }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: SP.publishChanges }));
    await waitFor(() => expect(screen.queryByText(SP.publishNote)).toBeNull());
    expect(api.publishTemplate).toHaveBeenCalledWith("p1");
    expect(toast.success).toHaveBeenCalledWith(SP.published);
    expect((screen.getByRole("button", { name: SP.start }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("a 409 PROGRAM_UNPUBLISHED_CHANGES turns into Publish changes", async () => {
    api.listTemplates.mockReturnValue(ok([template({})]));
    api.startClient.mockReturnValue(fail({ status: 409, code: "PROGRAM_UNPUBLISHED_CHANGES", message: "Publish first" }));
    const { onStarted } = renderDialog();
    await screen.findByRole("radio", { name: /Strength base/ });
    fireEvent.click(screen.getByRole("button", { name: SP.start }));
    expect(await screen.findByRole("button", { name: SP.publishChanges })).toBeTruthy();
    expect(onStarted).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("other refusals show the API's words; a paid program offers Give for free, then starts", async () => {
    api.listTemplates.mockReturnValue(ok([template({})]));
    api.startClient.mockReturnValueOnce(fail({ status: 400, message: "Start date is too far away." }));
    const { onStarted } = renderDialog();
    await screen.findByRole("radio", { name: /Strength base/ });
    fireEvent.click(screen.getByRole("button", { name: SP.start }));
    expect((await screen.findByRole("alert")).textContent).toBe("Start date is too far away.");

    api.startClient.mockReturnValueOnce(fail({ status: 403, code: "CONTENT_ENTITLEMENT_REQUIRED", message: "", details: {} }));
    fireEvent.click(screen.getByRole("button", { name: SP.start }));
    expect(await screen.findByText(SP.needsTitle("Chidi"))).toBeTruthy();
    api.grant.mockReturnValue(ok({}));
    api.startClient.mockReturnValueOnce(ok({ instance: { _id: "i1" }, template: {}, version: {}, published: false, publish_state: {} }));
    fireEvent.click(screen.getByRole("button", { name: SP.give }));
    await waitFor(() => expect(onStarted).toHaveBeenCalled());
    expect(api.grant).toHaveBeenCalledWith("program", "p1", "cp1");
  });

  it("no programs: points to creating one; a failed load offers Try again", async () => {
    api.listTemplates.mockReturnValue(ok([]));
    renderDialog();
    expect((await screen.findByRole("link", { name: SP.create })).getAttribute("href")).toBe("/dashboard/trainer/programs?new=1");
  });

  it("a failed load offers Try again", async () => {
    api.listTemplates.mockReturnValueOnce(fail({ message: "" }));
    renderDialog();
    expect(await screen.findByText(SP.loadFailed)).toBeTruthy();
    api.listTemplates.mockReturnValueOnce(ok([template({})]));
    fireEvent.click(screen.getByRole("button", { name: SP.retry }));
    expect(await screen.findByRole("radio", { name: /Strength base/ })).toBeTruthy();
  });
});

// ── Gap 10: Log weight ──────────────────────────────────────────────

describe("the coach logs a client's weight", () => {
  it("reads a decimal comma or point, to one decimal, between 20 and 400 kg", () => {
    expect(parseWeightKg("81,5")).toBe(81.5);
    expect(parseWeightKg(" 81.5 ")).toBe(81.5);
    expect(parseWeightKg("82.46")).toBe(82.5);
    expect(parseWeightKg("19.9")).toBeNull();
    expect(parseWeightKg("401")).toBeNull();
    expect(parseWeightKg("")).toBeNull();
    expect(parseWeightKg("abc")).toBeNull();
    expect(parseWeightKg("8,1,5")).toBeNull();
  });

  function renderForm() {
    const onSaved = vi.fn();
    const onCancel = vi.fn();
    render(<LogWeightForm clientProfileId="cp1" clientName="Chidi" onSaved={onSaved} onCancel={onCancel} />);
    return { onSaved, onCancel, input: screen.getByLabelText(LW.label) as HTMLInputElement, save: screen.getByRole("button", { name: LW.save }) as HTMLButtonElement };
  }

  it("says what's wrong and keeps Save off for a weight out of range", () => {
    const { input, save } = renderForm();
    expect(save.disabled).toBe(true);
    fireEvent.change(input, { target: { value: "8" } });
    expect(screen.getByText(LW.invalid)).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(save.disabled).toBe(true);
  });

  it("saves 81,5 as 81.5 kg for today and toasts", async () => {
    api.createWeightLog.mockReturnValue(ok({ _id: "w9", weight_kg: 81.5, recorded_at: "2026-11-23T10:00:00Z" }));
    const { input, save, onSaved } = renderForm();
    fireEvent.change(input, { target: { value: "81,5" } });
    expect(save.disabled).toBe(false);
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ weight_kg: 81.5 })));
    expect(api.createWeightLog).toHaveBeenCalledWith("cp1", { weight_kg: 81.5, recorded_at: expect.any(String) });
    expect(toast.success).toHaveBeenCalledWith(LW.saved("Chidi"));
    expect(screen.getByText(LW.help("Chidi"))).toBeTruthy();
  });

  it("a failed save stays open with the reason", async () => {
    api.createWeightLog.mockReturnValue(fail({ message: "" }));
    const { input, onSaved } = renderForm();
    fireEvent.change(input, { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: LW.save }));
    expect((await screen.findByRole("alert")).textContent).toBe(LW.failed);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("Escape and Cancel close it", () => {
    const { input, onCancel } = renderForm();
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: LW.cancel }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
