import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GymContentClient,
  GYM_CONTENT_COPY,
  priceableMealPlans,
  priceablePrograms,
} from "@/app/dashboard/gym-owner/content/GymContentClient";
import { PlanIncludesSection } from "@/components/plans/PlanIncludesSection";
import {
  normalizePlanIncludes,
  pickableMealPlans,
  pickablePrograms,
  planIncludesService,
  sameIds,
  withIncluded,
} from "@/lib/api/planIncludes";
import { apiClient } from "@/lib/api/client";
import { programsService, type ProgramTemplate } from "@/lib/api/programs";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { paidContentService } from "@/lib/api/paidContent";
import { marketplaceService } from "@/lib/api/marketplace";
import { toast } from "@/components/Toast";

/**
 * Web parity batch E (audit 2026-11-23, gaps 4 and 11): a gym prices its
 * programs and meal plans (ruling D10), and every provider edits a plan's
 * Includes from the plan.
 */

let seller = { on: true, flagsLoading: false, ownsWorkspace: true, canPrice: true };
vi.mock("@/hooks/usePaidContentSeller", () => ({ usePaidContentSeller: () => seller }));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({ currentOrg: { _id: "gym1", currency: "NGN" } }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1", role: "GYM_OWNER" } }) }));
// The gym's account sells in NGN only: the pricing offers what the account
// can take, never a hardcoded list.
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({
    data: [{ code: "NGN", name: "Naira", symbol: "₦", minor_unit: 2, selectable: true, route: "platform", reasons: [], payable: {} }],
    providerHint: "Your own payment account",
  }),
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const ok = <T,>(data: T) => ({ success: true as const, data });

const program = (over: Partial<ProgramTemplate>): ProgramTemplate =>
  ({
    _id: "p1",
    created_by: "u1",
    organization_id: "gym1",
    name: "Strength Base",
    status: "published",
    latest_version_no: 1,
    latest_published_version_no: 1,
    created_at: "",
    updated_at: "",
    ...over,
  }) as ProgramTemplate;

const meal = (over: Partial<DietPlan>): DietPlan =>
  ({
    _id: "m1",
    title: "Lean month",
    delivery_type: "platform",
    client_profile_id: null,
    client_id: null,
    status: "active",
    meals: [],
    ...over,
  }) as unknown as DietPlan;

const paidRaw = { mode: "paid", prices: [{ currency: "NGN", amount_minor: 1500000 }], included_in_plan_ids: ["plan1"], show_on_listing: true };

beforeEach(() => {
  vi.restoreAllMocks();
  seller = { on: true, flagsLoading: false, ownsWorkspace: true, canPrice: true };
});

describe("gym content: which items can be priced", () => {
  const rows = [
    program({ _id: "a", name: "Published free" }),
    program({ _id: "b", name: "Draft", status: "draft" }),
    program({ _id: "c", name: "Published paid", access: paidRaw }),
  ];

  it("lists published programs while selling is on", () => {
    expect(priceablePrograms(rows, true).map((p) => p._id)).toEqual(["a", "c"]);
  });

  it("lists only paid items while selling is off, so they can be set back to free", () => {
    expect(priceablePrograms(rows, false).map((p) => p._id)).toEqual(["c"]);
    const meals = [meal({ _id: "x" }), meal({ _id: "y", access: paidRaw })];
    expect(priceableMealPlans(meals, false).map((m) => m._id)).toEqual(["y"]);
  });

  it("leaves out client copies, PDF plans and archived meal plans", () => {
    const meals = [
      meal({ _id: "lib" }),
      meal({ _id: "copy", client_profile_id: "cp1" }),
      meal({ _id: "pdf", delivery_type: "document" as DietPlan["delivery_type"] }),
      meal({ _id: "old", status: "archived" as DietPlan["status"] }),
    ];
    expect(priceableMealPlans(meals, true).map((m) => m._id)).toEqual(["lib"]);
  });
});

describe("GymContentClient", () => {
  beforeEach(() => {
    vi.spyOn(programsService, "listTemplates").mockResolvedValue(
      ok([program({ _id: "p1", name: "Strength Base" }), program({ _id: "p2", name: "Mobility", access: paidRaw })]),
    );
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue(ok([meal({ _id: "m1", title: "Lean month" })]));
    vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue(
      ok([{ _id: "plan1", name: "Gold", is_active: true }]) as never,
    );
    vi.spyOn(paidContentService, "listGrants").mockResolvedValue(ok([]));
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue(ok([]) as never);
  });

  it("lists the gym's programs and meal plans with what each costs", async () => {
    render(<GymContentClient />);
    const programs = within(await screen.findByRole("region", { name: "Programs" }));
    expect(programs.getByRole("button", { name: /Strength Base/ })).toHaveTextContent("Free");
    expect(programs.getByRole("button", { name: /Mobility/ })).toHaveTextContent("₦15,000 · In 1 plan");
    const meals = within(screen.getByRole("region", { name: "Meal plans" }));
    expect(meals.getByRole("button", { name: /Lean month/ })).toHaveTextContent("Free");
  });

  it("prices a program in the account's currency, as integer minor units, and updates the row", async () => {
    const setAccess = vi.spyOn(paidContentService, "setAccess").mockResolvedValue(
      ok({
        access: { mode: "paid", prices: [{ currency: "NGN", amountMinor: 500000 }], includedPlanIds: [], showOnListing: true, sellerOrganizationId: "gym1" },
        warnings: [],
      }),
    );
    render(<GymContentClient />);
    await userEvent.click(await screen.findByRole("button", { name: /Strength Base/ }));
    await userEvent.click(screen.getByRole("button", { name: "Paid" }));
    // Only the account's currency is offered.
    expect(await screen.findByRole("button", { name: "Add NGN" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add USD" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add NGN" }));
    await userEvent.type(screen.getByLabelText("Price in NGN"), "5000");
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    await waitFor(() =>
      expect(setAccess).toHaveBeenCalledWith("program", "p1", {
        mode: "paid",
        prices: [{ currency: "NGN", amountMinor: 500000 }],
        includedPlanIds: [],
        showOnListing: true,
      }),
    );
    // The footer's Close (the header has an X with the same name).
    await userEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
    const programs = within(screen.getByRole("region", { name: "Programs" }));
    expect(programs.getByRole("button", { name: /Strength Base/ })).toHaveTextContent("₦5,000");
  });

  it("sets a paid meal plan back to free", async () => {
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue(ok([meal({ _id: "m1", title: "Lean month", access: paidRaw })]));
    const setAccess = vi.spyOn(paidContentService, "setAccess").mockResolvedValue(ok({ access: null, warnings: [] }));
    render(<GymContentClient />);
    await userEvent.click(await screen.findByRole("button", { name: /Lean month/ }));
    await userEvent.click(screen.getByRole("button", { name: "Free" }));
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    await waitFor(() => expect(setAccess).toHaveBeenCalledWith("meal_plan", "m1", expect.objectContaining({ mode: "free" })));
  });

  it("says selling is not available when the flag is off and nothing is paid", async () => {
    seller = { ...seller, on: false };
    vi.spyOn(programsService, "listTemplates").mockResolvedValue(ok([program({ _id: "p1", name: "Strength Base" })]));
    render(<GymContentClient />);
    expect(await screen.findByText(GYM_CONTENT_COPY.off)).toBeInTheDocument();
  });

  it("asks for nothing to be priced when the viewer may not price", async () => {
    seller = { ...seller, canPrice: false };
    render(<GymContentClient />);
    expect(await screen.findByText(GYM_CONTENT_COPY.noPrice)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Strength Base/ })).not.toBeInTheDocument();
  });

  it("offers a retry when the programs fail to load", async () => {
    const list = vi.spyOn(programsService, "listTemplates").mockResolvedValueOnce({ success: false, message: "Offline" });
    render(<GymContentClient />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: /Strength Base/ })).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });
});

describe("planIncludes API", () => {
  it("reads and replaces a plan's includes at the org plan's URL", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(
      ok({ plan_id: "plan1", programs: [{ id: "p1", name: "Strength Base" }], meal_plans: [{ id: "m1", title: "Lean month" }] }),
    );
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(ok({}));
    const res = await planIncludesService.get("gym1", "plan1");
    expect(get).toHaveBeenCalledWith("/marketplace/organizations/gym1/plans/plan1/includes");
    expect(res.data).toEqual({ programs: [{ id: "p1", name: "Strength Base" }], mealPlans: [{ id: "m1", name: "Lean month" }] });
    await planIncludesService.set("gym1", "plan1", ["p1"], []);
    expect(put).toHaveBeenCalledWith("/marketplace/organizations/gym1/plans/plan1/includes", { program_ids: ["p1"], meal_plan_ids: [] });
  });

  it("keeps the pick-lists to paid, live, library items", () => {
    expect(
      pickablePrograms([
        program({ _id: "free" }),
        program({ _id: "paid", access: paidRaw }),
        program({ _id: "gone", status: "archived", access: paidRaw }),
      ]).map((p) => p.id),
    ).toEqual(["paid"]);
    expect(
      pickableMealPlans([
        meal({ _id: "paid", access: paidRaw }),
        meal({ _id: "copy", client_profile_id: "cp", access: paidRaw }),
        meal({ _id: "free" }),
      ]).map((p) => p.id),
    ).toEqual(["paid"]);
  });

  it("never hides an included item, and compares ids in any order", () => {
    expect(withIncluded([{ id: "a", name: "A" }], [{ id: "a", name: "A" }, { id: "b", name: "B" }]).map((i) => i.id)).toEqual(["a", "b"]);
    expect(sameIds(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameIds(["a"], ["a", "b"])).toBe(false);
    expect(normalizePlanIncludes(null)).toEqual({ programs: [], mealPlans: [] });
  });
});

describe("PlanIncludesSection", () => {
  let set: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.spyOn(planIncludesService, "get").mockResolvedValue(
      ok({ programs: [{ id: "p1", name: "Strength Base" }], mealPlans: [] }),
    );
    set = vi.spyOn(planIncludesService, "set").mockResolvedValue(ok({}));
    vi.spyOn(programsService, "listTemplates").mockResolvedValue(
      ok([program({ _id: "p1", name: "Strength Base", access: paidRaw }), program({ _id: "p2", name: "Mobility", access: paidRaw })]),
    );
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue(ok([meal({ _id: "m1", title: "Lean month", access: paidRaw })]));
  });

  it("shows what the plan includes and adds a meal plan from the plan", async () => {
    render(<PlanIncludesSection orgId="gym1" planId="plan1" planName="Gold" />);
    expect(screen.getByText("Members who buy “Gold” also get these programs and meal plans.")).toBeInTheDocument();
    const included = await screen.findByRole("button", { name: "Program Strength Base" });
    expect(included).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Program Mobility" })).toHaveAttribute("aria-pressed", "false");
    const save = screen.getByRole("button", { name: "Save includes" });
    expect(save).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Meal plan Lean month" }));
    expect(save).toBeEnabled();
    await userEvent.click(save);
    await waitFor(() => expect(set).toHaveBeenCalledWith("gym1", "plan1", ["p1"], ["m1"]));
    expect(toast.success).toHaveBeenCalledWith("Includes saved");
    expect(save).toBeDisabled();
  });

  it("removes a program from the plan, saying current members keep it", async () => {
    render(<PlanIncludesSection orgId="gym1" planId="plan1" planName="Gold" />);
    // Keyboard: tab to the chip and press Space.
    const chip = await screen.findByRole("button", { name: "Program Strength Base" });
    chip.focus();
    await userEvent.keyboard(" ");
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Current members keep what you take out until their plan ends.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save includes" }));
    await waitFor(() => expect(set).toHaveBeenCalledWith("gym1", "plan1", [], []));
  });

  it("shows the API's refusal on save", async () => {
    set.mockResolvedValue({ success: false, message: "Activate the plan before adding items to it." });
    render(<PlanIncludesSection orgId="gym1" planId="plan1" planName="Gold" />);
    await userEvent.click(await screen.findByRole("button", { name: "Program Mobility" }));
    await userEvent.click(screen.getByRole("button", { name: "Save includes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Activate the plan before adding items to it.");
  });

  it("tells the provider to mark something paid when there is nothing to include", async () => {
    vi.spyOn(planIncludesService, "get").mockResolvedValue(ok({ programs: [], mealPlans: [] }));
    vi.spyOn(programsService, "listTemplates").mockResolvedValue(ok([program({ _id: "p1" })]));
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({ success: false, message: "Forbidden" });
    render(<PlanIncludesSection orgId="gym1" planId="plan1" planName="Gold" />);
    expect(await screen.findByText(/You have no paid programs or meal plans yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save includes" })).not.toBeInTheDocument();
  });
});
