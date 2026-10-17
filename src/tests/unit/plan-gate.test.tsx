import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PLAN_GATE_HREF, PlanGate, planGateSentence } from "@/components/ds/PlanGate";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { ScheduleClient } from "@/app/dashboard/gym-owner/schedule/ScheduleClient";
import RevenueClient from "@/app/dashboard/gym-owner/revenue/RevenueClient";
import { GymTaxClient } from "@/app/dashboard/gym-owner/tax/GymTaxClient";
import { InviteClientModal } from "@/components/clients/InviteClientModal";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";
import { classesService } from "@/lib/api/classes";
import { providerBillingApi, type ProviderBillingStatus } from "@/lib/api/providerBilling";
import { progressService } from "@/lib/api/progress";
import { teamsService } from "@/lib/api/teams";
import ProgramsManager from "@/components/programs/ProgramsManager";
import { programsService } from "@/lib/api/programs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer/programs",
  useSearchParams: () => new URLSearchParams(),
}));

// Who is signed in, and the gym they're working in. The owner unless a test
// signs in a member of staff (who holds the permissions given).
const authState = { user: { id: "owner1", role: "GYM_OWNER" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const org: Record<string, unknown> = { _id: "o1", name: "Iron Temple", owner_id: "owner1", currency: "NGN" };
const orgState = { currentOrg: org, organizations: [org], isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));
vi.mock("@/components/ds/GymDashboardShell", async () => {
  const { useGymViewer } = await import("@/hooks/useGymViewer");
  return {
    GymDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
      <div>
        {actions}
        {children}
      </div>
    ),
    useGymViewer,
  };
});
vi.mock("@/app/dashboard/gym-owner/schedule/TeamSessionsCard", () => ({ TeamSessionsCard: () => null }));

const signInStaff = (permissions: string[]) => {
  authState.user.id = "staff1";
  org.my_permissions = permissions;
};

/** The API's refusal when a plan leaves a feature out (BillingFeatureDisabledException). */
const featureRefusal = (feature: string) => ({
  success: false as const,
  status: 403,
  code: "BILLING_FEATURE_DISABLED",
  message: `Feature ${feature} is not included in the free plan. Upgrade to unlock.`,
  details: { feature, plan_tier: "free" },
});

const freeStatus = (features: Partial<ProviderBillingStatus["features"]>) =>
  ({
    success: true,
    data: { plan_tier: "free", features: { analytics_enabled: false, classes_enabled: false, ...features } },
  }) as unknown as Awaited<ReturnType<typeof providerBillingApi.getStatus>>;

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.restoreAllMocks();
  authState.user.id = "owner1";
  delete org.my_permissions;
});

describe("planGateSentence", () => {
  it("names what the plan leaves out, in one sentence", () => {
    expect(planGateSentence(parseBillingError(featureRefusal("classes_enabled"))!)).toBe(
      "Your Free plan doesn't include class schedules.",
    );
  });

  it("says what a capped plan includes", () => {
    const gate: BillingError = {
      kind: "limit",
      message: "",
      resource: "max_active_members",
      planTier: "free",
      limit: 10,
      currentUsage: 10,
    };
    expect(planGateSentence(gate)).toBe("Your Free plan includes 10 active members, and you're using all of them.");
    expect(planGateSentence({ ...gate, limit: 0 })).toBe("Your Free plan doesn't include active members.");
  });
});

describe("PlanGate", () => {
  const gate = parseBillingError(featureRefusal("analytics_enabled"))!;

  it("gives the owner one link, to Billing", () => {
    renderWithQuery(<PlanGate gate={gate} />);
    const link = screen.getByRole("link", { name: "See plans" });
    expect(link).toHaveAttribute("href", PLAN_GATE_HREF);
    expect(screen.getByRole("status")).toHaveTextContent("Your Free plan doesn't include analytics.");
  });

  it("tells staff who to ask instead of sending them to Billing", () => {
    signInStaff(["marketplace:manage_listing"]);
    renderWithQuery(<PlanGate gate={gate} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Ask the gym’s owner.")).toBeInTheDocument();
  });
});

describe("Schedule on a plan without classes", () => {
  beforeEach(() => {
    vi.spyOn(classesService, "listClasses").mockResolvedValue({ success: true, data: [] });
  });

  it("tells a Free owner when they reach for + New class, before the form", async () => {
    const status = vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue(freeStatus({}));
    renderWithQuery(<ScheduleClient />);
    await waitFor(() => expect(status).toHaveBeenCalledWith("o1"));
    // Nothing up front: no pre-emptive upsell on the page.
    expect(screen.queryByTestId("plan-gate")).toBeNull();
    await userEvent.click(screen.getAllByRole("button", { name: "+ New class" })[0]);
    expect(await screen.findByTestId("plan-gate")).toHaveTextContent("Your Free plan doesn't include class schedules.");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/dashboard/billing");
    expect(screen.queryByRole("button", { name: "Create class" })).toBeNull();
  });

  it("opens the form as before when the plan has classes", async () => {
    vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue(freeStatus({ classes_enabled: true }));
    renderWithQuery(<ScheduleClient />);
    await userEvent.click((await screen.findAllByRole("button", { name: "+ New class" }))[0]);
    expect(await screen.findByRole("button", { name: "Create class" })).toBeInTheDocument();
    expect(screen.queryByTestId("plan-gate")).toBeNull();
  });

  it("never reads the owner-only plan for staff", async () => {
    signInStaff(["team:view_members", "team:manage_organization"]);
    const status = vi.spyOn(providerBillingApi, "getStatus");
    renderWithQuery(<ScheduleClient />);
    await userEvent.click((await screen.findAllByRole("button", { name: "+ New class" }))[0]);
    expect(await screen.findByRole("button", { name: "Create class" })).toBeInTheDocument();
    expect(status).not.toHaveBeenCalled();
  });
});

describe("Revenue on a plan without analytics", () => {
  beforeEach(() => {
    vi.spyOn(checkinsService, "getOrgDashboardStats").mockResolvedValue({
      success: true,
      data: {
        today_check_ins: 0, week_check_ins: 0, month_check_ins: 0, active_members: 3,
        average_rating: 0, review_count: 0, revenue_today: 0, revenue_week: 0, revenue_month: 0,
        recent_check_ins: [],
      } as never,
    });
    vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(checkinsService, "getOrgRevenueStats").mockResolvedValue(featureRefusal("analytics_enabled"));
  });

  it("says what the Free plan leaves out where the chart would be, with Billing for the owner", async () => {
    renderWithQuery(<RevenueClient />);
    expect(await screen.findByTestId("plan-gate")).toHaveTextContent("Your Free plan doesn't include analytics.");
    expect(screen.getByRole("link", { name: "See plans" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Refunds and disputes" })).toBeInTheDocument();
    // The tiles the plan does include are still there.
    expect(screen.getByText("Active members")).toBeInTheDocument();
  });

  it("tells staff to ask the owner", async () => {
    signInStaff(["marketplace:manage_listing"]);
    renderWithQuery(<RevenueClient />);
    expect(await screen.findByTestId("plan-gate")).toHaveTextContent("Ask the gym’s owner.");
    expect(screen.queryByRole("link", { name: "See plans" })).toBeNull();
    // Refunds are the owner's too: no link into a page the API refuses.
    expect(screen.queryByRole("link", { name: "Refunds and disputes" })).toBeNull();
  });

  it("shows no gate when the plan has analytics", async () => {
    vi.spyOn(checkinsService, "getOrgRevenueStats").mockResolvedValue({
      success: true,
      data: { currency: "NGN", timeseries: [], new_members_count: 2 } as never,
    });
    renderWithQuery(<RevenueClient />);
    expect(await screen.findByText("New members · 30d")).toBeInTheDocument();
    expect(screen.queryByTestId("plan-gate")).toBeNull();
  });
});

describe("Tax on a plan without analytics", () => {
  it("says the plan leaves the estimate out instead of showing 0", async () => {
    vi.spyOn(teamsService, "getOrganization").mockResolvedValue({ success: true, data: { ...org, tax_rate: 7.5 } as never });
    vi.spyOn(checkinsService, "getOrgRevenueStats").mockResolvedValue(featureRefusal("analytics_enabled"));
    renderWithQuery(<GymTaxClient />);
    expect(await screen.findByTestId("plan-gate")).toHaveTextContent("Your Free plan doesn't include analytics.");
    expect(screen.queryByText(/Gross recorded revenue/)).toBeNull();
  });
});

describe("Invite client on a full plan", () => {
  it("says what the plan includes and links Billing, not raw API text", async () => {
    vi.spyOn(progressService, "addClient").mockResolvedValue({
      success: false,
      status: 403,
      code: "BILLING_LIMIT_REACHED",
      message: "You've reached the free plan's limit of 10 active members. Upgrade your plan to add more.",
      details: { quota: "max_active_members", limit: 10, current_usage: 10, plan_tier: "free" },
    });
    renderWithQuery(<InviteClientModal open onClose={() => {}} onInvited={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Email/), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send invite" }));
    expect(await screen.findByTestId("plan-gate")).toHaveTextContent(
      "Your Free plan includes 10 active members, and you're using all of them.",
    );
    expect(screen.getByRole("link", { name: "See plans" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Programs when the plan refuses a publish", () => {
  const Shell = ({ children }: { children: ReactNode }) => <main>{children}</main>;
  const config = { Shell, navItem: "Programs", basePath: "/dashboard/trainer/programs", accentSoft: "var(--trainer-soft)" };

  it("says what the plan leaves out, instead of a raw toast", async () => {
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "t1", created_by: "owner1", organization_id: "o1", name: "Couch to 5k", status: "draft",
          latest_version_no: 1, latest_published_version_no: 0, created_at: "", updated_at: "",
        } as never,
      ],
    });
    vi.spyOn(programsService, "publishTemplate").mockResolvedValue(featureRefusal("health_auto_tasks_enabled"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithQuery(<ProgramsManager config={config} />);
    await userEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(await screen.findByTestId("plan-gate")).toHaveTextContent(
      "Your Free plan doesn't include tasks that tick themselves from health apps.",
    );
    expect(screen.getByRole("link", { name: "See plans" })).toBeInTheDocument();
  });
});
