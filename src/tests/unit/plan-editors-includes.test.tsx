import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrainerPlansClient from "@/app/dashboard/trainer/plans/PlansClient";
import DietitianPlansClient from "@/app/dashboard/dietitian/plans/PlansClient";
import { GymPlansClient } from "@/app/dashboard/gym-owner/plans/GymPlansClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipPlanType } from "@/lib/types";

/**
 * Gap 11 (web parity audit 2026-11-23): a plan's Includes is edited from the
 * plan on the gym, trainer and dietitian Plans pages, while selling is on and
 * the viewer may price. The section itself is tested in
 * gym-content-plan-includes.test.tsx; here, only where it mounts.
 */

let seller = { on: true, flagsLoading: false, ownsWorkspace: true, canPrice: true };
vi.mock("@/hooks/usePaidContentSeller", () => ({ usePaidContentSeller: () => seller }));
vi.mock("@/components/plans/PlanIncludesSection", () => ({
  PlanIncludesSection: ({ orgId, planId, planName }: { orgId: string; planId: string; planName: string }) => (
    <div data-testid="includes">{`${orgId}/${planId}/${planName}`}</div>
  ),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({ data: [], isLoading: false, isError: false, providerHint: null }),
}));
const org = vi.hoisted(() => ({ currentOrg: { _id: "org-1", currency: "NGN" }, isLoading: false }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => org, useOptionalOrganization: () => org }));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const plan = {
  _id: "p1",
  organization_id: "org-1",
  name: "Gold",
  description: "",
  plan_type: MembershipPlanType.SUBSCRIPTION,
  duration_days: 30,
  price_minor: 2_500_000,
  currency: "NGN",
  features: [],
  is_active: true,
  is_public: true,
  created_at: "",
  updated_at: "",
} as never;

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  seller = { on: true, flagsLoading: false, ownsWorkspace: true, canPrice: true };
  vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({ success: true, data: [plan] });
  vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] });
});

describe.each([
  ["trainer", TrainerPlansClient],
  ["dietitian", DietitianPlansClient],
  ["gym", GymPlansClient],
])("%s plan editor: Includes", (_role, Client) => {
  it("shows the plan's Includes when editing a saved plan", async () => {
    wrap(<Client />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByTestId("includes")).toHaveTextContent("org-1/p1/Gold");
  });

  it("hides it while selling is off", async () => {
    seller = { ...seller, on: false };
    wrap(<Client />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.queryByTestId("includes")).not.toBeInTheDocument();
  });

  it("hides it from a viewer who may not price (a staff trainer, D10)", async () => {
    seller = { ...seller, canPrice: false };
    wrap(<Client />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.queryByTestId("includes")).not.toBeInTheDocument();
  });
});

describe.each([
  ["trainer", TrainerPlansClient],
  ["dietitian", DietitianPlansClient],
])("%s plan editor: a new plan", (_role, Client) => {
  it("has no Includes until the plan exists", async () => {
    wrap(<Client />);
    await screen.findByRole("button", { name: "Edit" });
    await userEvent.click(screen.getAllByRole("button", { name: /New plan/ })[0]);
    expect(await screen.findByRole("heading", { name: "New plan" })).toBeInTheDocument();
    expect(screen.queryByTestId("includes")).not.toBeInTheDocument();
  });
});
