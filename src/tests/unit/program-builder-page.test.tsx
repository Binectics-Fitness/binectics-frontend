import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProgramBuilderPage from "@/components/programs/builder/ProgramBuilderPage";
import { NewProgramDialog } from "@/components/programs/builder/NewProgramDialog";
import { BUILDER_COPY, TASK_TYPE_COPY } from "@/components/programs/builder/copy";
import { programsService, type ProgramTemplateVersion } from "@/lib/api/programs";
import { progressService } from "@/lib/api/progress";
import { formsService } from "@/lib/api/forms";
import { exerciseLibraryService } from "@/lib/api/exerciseLibrary";

/**
 * The program page (owner-approved Create Program redesign, 20 Nov 2026):
 * every string it shows comes from builder/copy.ts.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer/programs/t1",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner1", first_name: "Tunde" }, isLoading: false }) }));
const org = { _id: "o1", name: "Tunde Coaching", owner_id: "owner1", currency: "NGN" };
const orgState = { currentOrg: org, organizations: [org], isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => orgState, useOptionalOrganization: () => orgState }));
vi.mock("@/components/Toast", () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() });
  return { toast };
});

const Shell = ({ children }: { children: ReactNode }) => <main>{children}</main>;
const config = { Shell, navItem: "Programs", basePath: "/dashboard/trainer/programs", accentSoft: "var(--trainer-soft)", mealPlans: false };
const C = BUILDER_COPY;

const template = {
  _id: "t1", created_by: "owner1", organization_id: "o1", name: "Strength base", status: "draft" as const,
  latest_version_no: 1, latest_published_version_no: 0, created_at: "", updated_at: "",
};
const unsold = { sold_or_listed: false, published_version_no: 0, has_unpublished_changes: true, needs_publish: false };
function version(blocks: ProgramTemplateVersion["phases"][number]["blocks"] = []): ProgramTemplateVersion {
  return {
    _id: "v1", template_id: "t1", version_no: 1, published_at: null, name: "Strength base", catch_up_days: 1,
    duration_days: 28, phases: [{ name: "Phase 1", order: 0, duration_days: 28, blocks }], goals: [],
  };
}

function mockApi(v = version(), publishState = unsold) {
  vi.spyOn(programsService, "getTemplate").mockResolvedValue({ success: true, data: { template, version: v, publish_state: publishState } });
  vi.spyOn(programsService, "listAssignments").mockResolvedValue({ success: true, data: [] });
  vi.spyOn(formsService, "getMyForms").mockResolvedValue({ success: true, data: [{ _id: "f1", title: "Session readiness", is_published: true }] } as never);
  vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({ success: true, data: [] } as never);
  vi.spyOn(exerciseLibraryService, "getLibrary").mockResolvedValue({ success: false } as never);
  return vi
    .spyOn(programsService, "updateTemplate")
    .mockImplementation(async () => ({ success: true, data: { template, version: v, publish_state: publishState } }));
}

function renderPage() {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ProgramBuilderPage config={config} id="t1" />
    </QueryClientProvider>,
  );
  return user;
}

async function addTask(user: ReturnType<typeof userEvent.setup>, kind: keyof typeof TASK_TYPE_COPY) {
  await user.click(screen.getByRole("button", { name: C.plan.addTask }));
  await user.click(screen.getByRole("menuitem", { name: new RegExp(TASK_TYPE_COPY[kind].label) }));
}

const lastBlocks = (update: ReturnType<typeof mockApi>) => {
  const calls = update.mock.calls;
  return calls[calls.length - 1][1].phases![0].blocks;
};

beforeEach(() => {
  vi.restoreAllMocks();
  push.mockClear();
});

describe("program page", () => {
  it("shows the plan, what the client sees, and why Start a client can't run yet", async () => {
    mockApi();
    renderPage();
    expect(await screen.findByRole("textbox", { name: C.header.nameLabel })).toHaveValue("Strength base");
    expect(screen.getByText(C.header.draftSaved)).toBeInTheDocument();
    expect(screen.getByText(C.clientView.eyebrow)).toBeInTheDocument();
    expect(screen.getAllByText(C.clientView.rest)).toHaveLength(7);
    expect(screen.getByText(C.plan.empty)).toBeInTheDocument();
  });

  it("offers the task types (no meal plan for a trainer), each with its defaults", async () => {
    mockApi();
    const user = renderPage();
    await screen.findByText(C.plan.empty);
    await user.click(screen.getByRole("button", { name: C.plan.addTask }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem").map((m) => m.textContent)).toEqual(
      (["workout", "habit", "checkin", "measure", "note"] as const).map((k) => TASK_TYPE_COPY[k].label + TASK_TYPE_COPY[k].meta),
    );
    await user.click(within(menu).getByRole("menuitem", { name: /Check-in form/ }));
    // The coach's only form is picked, weekly.
    expect(screen.getByRole("button", { name: "Session readiness" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: C.inspector.howOften }).querySelector("[aria-pressed=true]")).toHaveTextContent("Weekly");
  });

  it("saves by itself, and a task arrives selected with its defaults", async () => {
    const update = mockApi();
    const user = renderPage();
    await screen.findByText(C.plan.empty);
    await addTask(user, "workout");
    expect(screen.getByLabelText(C.inspector.title)).toHaveValue("Workout A");
    expect(screen.getByText("3 times a week")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: C.inspector.moreFrom }));
    expect(screen.getByText("3 times a week · weeks 2–4")).toBeInTheDocument();
    await waitFor(() => expect(update).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() =>
      expect(lastBlocks(update)[0]).toMatchObject({ type: "workout_plan", cadence: "n_per_week", times_per_week: 3, title: "Workout A", start_offset_days: 7 }),
    );
    await waitFor(() => expect(screen.getByText(C.header.draftSaved)).toBeInTheDocument());
  });

  it("shows what the client sees, by week, with the API's spread", async () => {
    mockApi(version([{ type: "workout_plan", order: 0, cadence: "n_per_week", times_per_week: 3, title: "Workout A" }]));
    renderPage();
    const week = await screen.findByTestId("client-week");
    const days = within(week).getAllByRole("listitem").map((li) => li.textContent);
    expect(days).toEqual(["Day 1Workout A", "Day 2Rest", "Day 3Workout A", "Day 4Rest", "Day 5Workout A", "Day 6Rest", "Day 7Rest"]);
  });

  it("says why a task isn't finished on its row", async () => {
    mockApi(version([{ type: "form", order: 0, cadence: "weekly" }]));
    renderPage();
    expect(await screen.findByText(C.issue.form)).toBeInTheDocument();
  });
  it("saves by itself: a habit that ticks itself from the water log", async () => {
    const update = mockApi();
    const user = renderPage();
    await screen.findByText(C.plan.empty);
    await addTask(user, "habit");
    await user.type(screen.getByLabelText(C.inspector.title), "Drink water");
    await user.click(screen.getByRole("button", { name: C.ticks.water }));
    expect(screen.getByRole("textbox", { name: C.ticks.waterSuffix })).toHaveValue("8");
    expect(screen.getByText(C.ticks.ownLogHelp)).toBeInTheDocument();
    await waitFor(() => expect(update).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() =>
      expect(lastBlocks(update)[0]).toMatchObject({
        type: "habit", cadence: "daily", title: "Drink water",
        auto_rule: { metric: "water_glasses", comparator: "gte", threshold: 8, window: "scheduled_day" },
      }),
    );
    await waitFor(() => expect(screen.getByText(C.header.draftSaved)).toBeInTheDocument());
  });

  it("ticks from a health app: sleep asked in hours, sent in minutes; says when Health Connect is needed", async () => {
    const update = mockApi();
    const user = renderPage();
    await screen.findByText(C.plan.empty);
    await addTask(user, "habit");
    await user.type(screen.getByLabelText(C.inspector.title), "Sleep");
    await user.click(screen.getByRole("button", { name: C.ticks.health }));
    expect(screen.getByText(C.ticks.healthHelp)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sleep" }));
    expect(screen.getByRole("textbox", { name: "hours of sleep" })).toHaveValue("7");
    await waitFor(() => expect(lastBlocks(update)[0].auto_rule).toEqual({ metric: "sleep_minutes", comparator: "gte", threshold: 420 }), { timeout: 3000 });
    await user.clear(screen.getByRole("textbox", { name: "hours of sleep" }));
    await user.type(screen.getByRole("textbox", { name: "hours of sleep" }), "20");
    expect(screen.getByText("Set the hours, 1 to 16.")).toBeInTheDocument();
  });

  it("sends a measurement's target on the task (the API makes the goal)", async () => {
    const update = mockApi();
    const user = renderPage();
    await screen.findByText(C.plan.empty);
    await addTask(user, "measure");
    expect(screen.getByLabelText(C.inspector.title)).toHaveValue("Weigh in");
    await user.type(screen.getByLabelText(C.measure.target), "78");
    expect(screen.getByText(C.measure.byTheEnd("kg"))).toBeInTheDocument();
    await waitFor(() => expect(lastBlocks(update)[0]).toMatchObject({ type: "measurement", metric: "weight_kg", target: 78, cadence: "weekly" }), { timeout: 3000 });
  });

});

describe("New program dialog", () => {
  it("asks for a name inline, then creates name + length and opens the page", async () => {
    const create = vi.spyOn(programsService, "createTemplate").mockResolvedValue({ success: true, data: { template: { ...template, _id: "new1" }, version: version() } });
    const user = userEvent.setup();
    render(<NewProgramDialog programs={[]} basePath="/dashboard/trainer/programs" onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: C.create.submit }));
    expect(screen.getByText(C.create.nameError)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText(C.create.nameLabel), "Strength base");
    await user.click(screen.getByRole("button", { name: C.create.weeks(8) }));
    await user.click(screen.getByRole("button", { name: C.create.submit }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: "Strength base", duration_days: 56 })));
    expect(create.mock.calls[0][0].phases).toEqual([{ name: "Phase 1", order: 0, duration_days: 56, blocks: [] }]);
    expect(push).toHaveBeenCalledWith("/dashboard/trainer/programs/new1");
  });

  it("offers a copy of the coach's own programs only", () => {
    render(
      <NewProgramDialog
        programs={[{ ...template, _id: "a", name: "Fat loss reset" }, { ...template, _id: "b", name: "Old", status: "archived" }]}
        basePath="/x"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: C.create.copyOf("Fat loss reset") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: C.create.copyOf("Old") })).toBeNull();
  });
});
