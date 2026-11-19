import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProgramsManager from "@/components/programs/ProgramsManager";
import {
  blocksWithBadOwnLogNumber,
  emptyBlockRow,
  phaseRowsToPayload,
  versionToForm,
  type PhaseFormRow,
} from "@/components/programs/mapper";
import { OWN_LOG_COPY, parseOwnLogThreshold } from "@/components/programs/ownLogRules";
import { programsService, type ProgramTemplateVersion } from "@/lib/api/programs";
import { providerBillingApi } from "@/lib/api/providerBilling";
import { progressService } from "@/lib/api/progress";
import { formsService } from "@/lib/api/forms";
import { toast } from "@/components/Toast";

/**
 * A habit task that ticks itself from the client's own fasting or water log
 * (binectics-api #349). The coach sees only that day's done-or-not and one
 * number, and the editor says so next to the option.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer/programs",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
const authState: { user: { id: string; first_name?: string }; isLoading: boolean } = {
  user: { id: "owner1", first_name: "Tunde" },
  isLoading: false,
};
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const org = { _id: "o1", name: "Iron Temple", owner_id: "owner1", currency: "NGN" };
const orgState = { currentOrg: org, organizations: [org], isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const habit = (patch: Partial<ReturnType<typeof emptyBlockRow>>) => ({ ...emptyBlockRow("habit"), ...patch });
const phases = (...blocks: ReturnType<typeof emptyBlockRow>[]): PhaseFormRow[] => [
  { name: "Base", duration_days: "28", blocks },
];

describe("own-log threshold bounds", () => {
  it("takes whole hours 1-24 and whole glasses 1-30 only", () => {
    expect(parseOwnLogThreshold("fasting_hours", "1")).toBe(1);
    expect(parseOwnLogThreshold("fasting_hours", "24")).toBe(24);
    expect(parseOwnLogThreshold("fasting_hours", "0")).toBeNull();
    expect(parseOwnLogThreshold("fasting_hours", "25")).toBeNull();
    expect(parseOwnLogThreshold("fasting_hours", "16.5")).toBeNull();
    expect(parseOwnLogThreshold("fasting_hours", "")).toBeNull();
    expect(parseOwnLogThreshold("water_glasses", "30")).toBe(30);
    expect(parseOwnLogThreshold("water_glasses", "31")).toBeNull();
    expect(parseOwnLogThreshold("water_glasses", "-1")).toBeNull();
  });
});

describe("own-log rules in the payload", () => {
  it("sends a gte, scheduled_day rule with the whole number", () => {
    const [p] = phaseRowsToPayload(
      phases(
        habit({ title: "Fast 16 hours", own_log_metric: "fasting_hours", own_log_threshold: "16" }),
        habit({ title: "Water", own_log_metric: "water_glasses", own_log_threshold: "8" }),
      ),
    );
    expect(p.blocks[0].auto_rule).toEqual({ metric: "fasting_hours", comparator: "gte", threshold: 16, window: "scheduled_day" });
    expect(p.blocks[1].auto_rule).toEqual({ metric: "water_glasses", comparator: "gte", threshold: 8, window: "scheduled_day" });
  });

  it("names a blank task after its rule", () => {
    const [p] = phaseRowsToPayload(phases(habit({ own_log_metric: "water_glasses", own_log_threshold: "8" })));
    expect(p.blocks[0].title).toBe("Drink at least 8 glasses");
  });

  it("sends no rule for a habit without one, or for another task type", () => {
    const [p] = phaseRowsToPayload(
      phases(
        habit({ title: "Walk" }),
        { ...emptyBlockRow("instruction"), title: "Read", own_log_metric: "fasting_hours", own_log_threshold: "16" },
      ),
    );
    expect(p.blocks.map((b) => b.auto_rule)).toEqual([undefined, undefined]);
  });

  it("lists tasks whose number is missing or out of bounds", () => {
    expect(
      blocksWithBadOwnLogNumber(
        phases(
          habit({ own_log_metric: "fasting_hours", own_log_threshold: "25" }),
          habit({ own_log_metric: "water_glasses", own_log_threshold: "" }),
          habit({ own_log_metric: "water_glasses", own_log_threshold: "30" }),
          habit({ title: "Walk" }),
        ),
      ),
    ).toEqual(["phase 1, task 1", "phase 1, task 2"]);
  });

  it("round-trips a saved rule and keeps a health-app rule it doesn't edit", () => {
    const version = {
      _id: "v1", template_id: "t1", version_no: 1, published_at: null, name: "Base", goals: [],
      phases: [
        {
          name: "Base", order: 0,
          blocks: [
            { type: "habit", order: 0, title: "Fast", auto_rule: { metric: "fasting_hours", comparator: "gte", threshold: 14, window: "scheduled_day" } },
            { type: "habit", order: 1, title: "Steps", auto_rule: { metric: "steps", comparator: "gte", threshold: 8000, window: "scheduled_day" } },
          ],
        },
      ],
    } as ProgramTemplateVersion;
    const form = versionToForm(version);
    expect(form.phases[0].blocks[0]).toMatchObject({ own_log_metric: "fasting_hours", own_log_threshold: "14" });
    const [p] = phaseRowsToPayload(form.phases);
    expect(p.blocks[0].auto_rule).toEqual(version.phases[0].blocks[0].auto_rule);
    expect(p.blocks[1].auto_rule).toEqual(version.phases[0].blocks[1].auto_rule);
  });
});

describe("the template editor", () => {
  const Shell = ({ children }: { children: ReactNode }) => <main>{children}</main>;
  const config = { Shell, navItem: "Programs", basePath: "/dashboard/trainer/programs", accentSoft: "var(--trainer-soft)" };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast.error).mockClear();
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({ success: true, data: [] } as never);
    vi.spyOn(formsService, "getMyForms").mockResolvedValue({ success: true, data: [] } as never);
    authState.user = { id: "owner1", first_name: "Tunde" };
  });

  async function openHabit() {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ProgramsManager config={config} />
      </QueryClientProvider>,
    );
    await user.click((await screen.findAllByRole("button", { name: /New program/ }))[0]);
    await user.type(screen.getByPlaceholderText("e.g. 12-week gut reset"), "Lean 28");
    await user.click(screen.getByRole("button", { name: "Instruction" }));
    await user.click(await screen.findByText("Habit", { selector: "li *, li" }));
    return user;
  }

  async function pick(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.click(screen.getByRole("button", { name: OWN_LOG_COPY.none }));
    await user.click(await screen.findByText(label, { selector: "li *, li" }));
  }

  it("offers fasting and water only on a habit, and says what the coach sees", async () => {
    const user = await openHabit();
    expect(screen.getByText(OWN_LOG_COPY.label)).toBeInTheDocument();
    await pick(user, OWN_LOG_COPY.option.fasting_hours);
    expect(screen.getByText(`${OWN_LOG_COPY.privacy.fasting_hours} ${OWN_LOG_COPY.clientSees("Tunde")}`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: OWN_LOG_COPY.option.fasting_hours }));
    await user.click(await screen.findByText(OWN_LOG_COPY.option.water_glasses, { selector: "li *, li" }));
    expect(screen.getByText(`${OWN_LOG_COPY.privacy.water_glasses} ${OWN_LOG_COPY.clientSees("Tunde")}`)).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: OWN_LOG_COPY.thresholdLabel.water_glasses })).toBeInTheDocument();
  });

  it("says when the number is out of bounds and won't save", async () => {
    const create = vi.spyOn(programsService, "createTemplate");
    const user = await openHabit();
    await pick(user, OWN_LOG_COPY.option.fasting_hours);
    const hours = screen.getByRole("spinbutton", { name: OWN_LOG_COPY.thresholdLabel.fasting_hours });
    await user.type(hours, "25");
    expect(screen.getByText(OWN_LOG_COPY.boundsError.fasting_hours)).toBeInTheDocument();
    expect(hours).toHaveAttribute("aria-invalid", "true");
    // The browser's own range check stops this save (min/max on the input).
    expect((hours as HTMLInputElement).validity.rangeOverflow).toBe(true);
    await user.click(screen.getByRole("button", { name: "Create draft" }));
    expect(create).not.toHaveBeenCalled();
  });

  it("won't save a rule with no number, and says so on the field", async () => {
    const create = vi.spyOn(programsService, "createTemplate");
    const user = await openHabit();
    await pick(user, OWN_LOG_COPY.option.water_glasses);
    expect(screen.queryByText(OWN_LOG_COPY.boundsError.water_glasses)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Create draft" }));
    expect(toast.error).toHaveBeenCalledWith(OWN_LOG_COPY.saveError("phase 1, task 1"));
    expect(screen.getByText(OWN_LOG_COPY.boundsError.water_glasses)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("saves the rule the API expects", async () => {
    const create = vi
      .spyOn(programsService, "createTemplate")
      .mockResolvedValue({ success: true, data: { template: { _id: "t1" }, version: {} } as never });
    const user = await openHabit();
    await user.type(screen.getByPlaceholderText("Task title"), "Fast 16 hours");
    await pick(user, OWN_LOG_COPY.option.fasting_hours);
    await user.type(screen.getByRole("spinbutton", { name: OWN_LOG_COPY.thresholdLabel.fasting_hours }), "16");
    expect(screen.queryByText(OWN_LOG_COPY.boundsError.fasting_hours)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const block = create.mock.calls[0][0].phases[0].blocks[0];
    expect(block).toMatchObject({
      type: "habit",
      title: "Fast 16 hours",
      auto_rule: { metric: "fasting_hours", comparator: "gte", threshold: 16, window: "scheduled_day" },
    });
  });
});

describe("copy", () => {
  it("names the coach in what the client sees, and says you only without a name", () => {
    expect(OWN_LOG_COPY.clientSees("Tunde")).toBe('Your client sees "Shared with Tunde" on this task.');
    expect(OWN_LOG_COPY.clientSees("")).toBe('Your client sees "Shared with you" on this task.');
    expect(OWN_LOG_COPY.clientSees(undefined)).toBe('Your client sees "Shared with you" on this task.');
  });

  it("labels the options by what is counted", () => {
    expect(OWN_LOG_COPY.option).toEqual({ fasting_hours: "Fasting hours", water_glasses: "Glasses of water" });
    expect(OWN_LOG_COPY.none).toBe("No, the client ticks it");
  });
});

describe("plan gating (owner, 19 Nov 2026: fasting and water are ungated)", () => {
  const Shell = ({ children }: { children: ReactNode }) => <main>{children}</main>;
  const config = { Shell, navItem: "Programs", basePath: "/dashboard/trainer/programs", accentSoft: "var(--trainer-soft)" };

  it("a plan without health-app tasks can pick and save fasting and water", async () => {
    vi.restoreAllMocks();
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({ success: true, data: [] } as never);
    vi.spyOn(formsService, "getMyForms").mockResolvedValue({ success: true, data: [] } as never);
    vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({
      success: true,
      data: { plan_tier: "free", features: { health_auto_tasks_enabled: false } },
    } as never);
    const create = vi
      .spyOn(programsService, "createTemplate")
      .mockResolvedValue({ success: true, data: { template: { _id: "t1" }, version: {} } as never });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ProgramsManager config={config} />
      </QueryClientProvider>,
    );
    await user.click((await screen.findAllByRole("button", { name: /New program/ }))[0]);
    await user.type(screen.getByPlaceholderText("e.g. 12-week gut reset"), "Lean 28");
    await user.click(screen.getByRole("button", { name: "Instruction" }));
    await user.click(await screen.findByText("Habit", { selector: "li *, li" }));
    await user.click(screen.getByRole("button", { name: "+ Add task" }));
    const types = screen.getAllByRole("button", { name: "Instruction" });
    await user.click(types[types.length - 1]);
    await user.click(await screen.findByText("Habit", { selector: "li *, li" }));
    const pickers = () => screen.getAllByRole("button", { name: OWN_LOG_COPY.none });
    await user.click(pickers()[0]);
    await user.click(await screen.findByText(OWN_LOG_COPY.option.fasting_hours, { selector: "li *, li" }));
    await user.type(screen.getByRole("spinbutton", { name: OWN_LOG_COPY.thresholdLabel.fasting_hours }), "16");
    await user.click(pickers()[0]);
    await user.click(await screen.findByText(OWN_LOG_COPY.option.water_glasses, { selector: "li *, li" }));
    await user.type(screen.getByRole("spinbutton", { name: OWN_LOG_COPY.thresholdLabel.water_glasses }), "8");
    await user.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const blocks = create.mock.calls[0][0].phases[0].blocks;
    expect(blocks.map((b) => b.auto_rule?.metric)).toEqual(["fasting_hours", "water_glasses"]);
    expect(screen.queryByTestId("plan-gate")).toBeNull();
    expect(screen.queryByText(/health apps/)).toBeNull();
  });
});
