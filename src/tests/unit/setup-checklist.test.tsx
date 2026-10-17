import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SetupChecklist, ShowSetupChecklist } from "@/components/provider/SetupChecklist";
import { SETUP_HREFS, coachSetupSteps, gymSetupSteps, paymentsState } from "@/lib/provider/setupSteps";
import { marketplaceService, type OrgPaymentConfig } from "@/lib/api/marketplace";
import { consultationsService, type AvailabilityRule, type ConsultationType } from "@/lib/api/consultations";
import { onboardingService } from "@/lib/api/onboarding";
import { AccountType } from "@/lib/types";

const authState: { user: Record<string, unknown> } = { user: {} };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ ...authState, isLoading: false }) }));
const orgState: { currentOrg: Record<string, unknown> | null; organizations: Record<string, unknown>[] } = {
  currentOrg: null,
  organizations: [],
};
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ ...orgState, isLoading: false }),
  useOptionalOrganization: () => ({ ...orgState, isLoading: false }),
}));

const paystack = (over: Partial<OrgPaymentConfig> = {}): OrgPaymentConfig => ({
  gateway: "paystack",
  public_key: "pk_test_x",
  is_active: true,
  currencies: [],
  webhook_url: "https://api.example.com/webhooks/paystack",
  webhook_last_received_at: "2026-10-10T09:00:00Z",
  ...over,
});
const rule = (dayOfWeek: number, isActive = true): AvailabilityRule => ({
  id: `r${dayOfWeek}`,
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  timezone: "Africa/Lagos",
  isActive,
});
const session = (over: Partial<ConsultationType> = {}): ConsultationType =>
  ({
    id: "s1",
    name: "Strength session",
    providerRole: "TRAINER",
    defaultDurationMinutes: 60,
    bufferMinutes: 0,
    minAdvanceNoticeMinutes: 0,
    isActive: true,
    priceMinor: 1_500_000,
    currency: "NGN",
    createdAt: "",
    updatedAt: "",
    ...over,
  }) as ConsultationType;

let dismissed = false;
let listing: { is_published: boolean } | null = null;
let plans: { is_active: boolean }[] = [];
let configs: OrgPaymentConfig[] = [];
let rules: AvailabilityRule[] = [];
let ownTypes: ConsultationType[] = [];

const signIn = (role: string, id = "u1") => {
  authState.user = { id, role, first_name: "Ada", is_onboarding_complete: true };
};
const workspace = (over: Record<string, unknown> = {}) => {
  orgState.currentOrg = { _id: "o1", name: "Ada Coaching", owner_id: "u1", account_type: AccountType.PERSONAL_TRAINER, ...over };
  orgState.organizations = [orgState.currentOrg];
};

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
const settle = () => new Promise((r) => setTimeout(r, 20));

beforeEach(() => {
  vi.restoreAllMocks();
  dismissed = false;
  listing = null;
  plans = [];
  configs = [];
  rules = [];
  ownTypes = [];
  signIn("TRAINER");
  workspace();
  vi.spyOn(onboardingService, "getStatus").mockImplementation(async () => ({
    success: true,
    data: { steps: [], completed_count: 0, total_count: 0, is_complete: true, is_dismissed: dismissed },
  }));
  vi.spyOn(marketplaceService, "getMyListing").mockImplementation(async () =>
    listing ? { success: true, data: listing as never } : { success: false, status: 404 },
  );
  vi.spyOn(marketplaceService, "getOrgListing").mockImplementation(async () =>
    listing ? { success: true, data: listing as never } : { success: false, status: 404 },
  );
  vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockImplementation(async () => ({ success: true, data: plans as never }));
  vi.spyOn(marketplaceService, "getPaymentConfigs").mockImplementation(async () => ({ success: true, data: configs }));
  vi.spyOn(consultationsService, "getMyAvailability").mockImplementation(async () => ({ success: true, data: rules }));
  vi.spyOn(consultationsService, "getOwnTypes").mockImplementation(async () => ({ success: true, data: ownTypes }));
});

describe("coachSetupSteps: the coach app's four steps", () => {
  it("lists what a brand-new trainer still has to do, with no payment-keys step", () => {
    const steps = coachSetupSteps("trainer", { listing: null, rules: [], ownTypes: [], people: 0 });
    expect(steps.map((s) => [s.key, s.done])).toEqual([
      ["listing", false],
      ["hours", false],
      ["session", false],
      ["people", false],
    ]);
    expect(steps.map((s) => s.title)).toEqual(["Publish your profile", "Set your hours", "Set your session", "Add your first client"]);
  });

  it("says what's already there, as the coach app does", () => {
    const steps = coachSetupSteps("dietitian", {
      listing: { is_published: true },
      rules: [rule(1), rule(1), rule(3), rule(5, false)],
      ownTypes: [session({ isActive: false, name: "Old" }), session()],
      people: 2,
    });
    expect(steps.every((s) => s.done)).toBe(true);
    expect(steps.map((s) => s.detail)).toEqual([
      "Live. Members can find you.",
      "2 days a week.",
      "Strength session, 60 min, ₦15,000.",
      "2 clients.",
    ]);
    expect(steps.map((s) => s.href)).toEqual([
      "/dashboard/dietitian/profile",
      "/dashboard/dietitian/settings#hours",
      "/dashboard/dietitian/settings#session",
      "/dashboard/dietitian/clients",
    ]);
  });

  it("calls a session without a price free", () => {
    const [, , s] = coachSetupSteps("trainer", { listing: null, rules: [], ownTypes: [session({ priceMinor: 0 })], people: 0 });
    expect(s.detail).toBe("Strength session, 60 min, free.");
  });

  it("leaves the listing out for a gym's trainer", () => {
    const steps = coachSetupSteps("trainer", { listing: null, rules: [], ownTypes: [], people: 0, staffTrainer: true });
    expect(steps.map((s) => s.key)).toEqual(["hours", "session", "people"]);
  });
});

describe("gymSetupSteps", () => {
  it("says what's already there once it is", () => {
    const steps = gymSetupSteps({ listing: { is_published: true }, activePlans: 2, payments: [paystack()], people: 1 });
    expect(steps.every((s) => s.done)).toBe(true);
    expect(steps.map((s) => s.detail)).toEqual(["Live. Members can find your gym.", "2 active plans.", "Connected.", "1 member."]);
  });

  it("leaves payment keys out for anyone but the owner", () => {
    expect(gymSetupSteps({ listing: null, activePlans: 0, payments: null, people: 0 }).map((s) => s.key)).not.toContain("payments");
  });

  it("names the webhook step for what's missing, softly: it clears after the first payment", () => {
    const step = gymSetupSteps({ listing: null, activePlans: 0, payments: [paystack({ webhook_last_received_at: null })], people: 0 }).find(
      (s) => s.key === "payments",
    )!;
    expect(step.title).toBe("Connect Paystack's webhook");
    expect(step.detail).toBe("No webhook from Paystack yet. If you've added the URL, this clears after the first payment.");
    expect(step.done).toBe(false);
  });

  it("isn't done with payments until Paystack's webhook has arrived", () => {
    expect(paymentsState([])).toBe("none");
    expect(paymentsState([paystack({ is_active: false })])).toBe("none");
    expect(paymentsState([paystack({ webhook_last_received_at: null })])).toBe("no_webhook");
    expect(paymentsState([paystack()])).toBe("connected");
    // An older API without the field isn't held against anyone.
    const older: Partial<OrgPaymentConfig> = paystack();
    delete older.webhook_last_received_at;
    expect(paymentsState([older as OrgPaymentConfig])).toBe("connected");
  });

  it("sends each step to its own page", () => {
    expect(SETUP_HREFS.gym.payments).toBe("/dashboard/gym-owner/settings#gateways");
  });
});

describe("SetupChecklist", () => {
  it("shows a new trainer each step, linked, with how far they are", async () => {
    listing = { is_published: false };
    renderWithQuery(<SetupChecklist kind="trainer" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getByText("0 of 4 done")).toBeInTheDocument();
    expect(within(card).getByText("Saved but not published, so nobody can see it yet.")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Publish your profile/ })).toHaveAttribute("href", "/dashboard/trainer/profile");
    expect(within(card).getByRole("link", { name: /Set your hours/ })).toHaveAttribute("href", "/dashboard/trainer/settings#hours");
    expect(within(card).getByRole("link", { name: /Set your session/ })).toHaveAttribute("href", "/dashboard/trainer/settings#session");
    const client = within(card).getByRole("link", { name: /Add your first client/ });
    expect(client).toHaveAttribute("href", "/dashboard/trainer/clients");
    // Screen readers hear whether each step is done, not just a ring.
    expect(client).toHaveTextContent("Add your first client, to do");
    // A coach's own payment keys are optional: never a step, never fetched.
    expect(within(card).queryByText(/payment keys/)).toBeNull();
    expect(marketplaceService.getPaymentConfigs).not.toHaveBeenCalled();
  });

  it("counts what's done and keeps the rest", async () => {
    listing = { is_published: true };
    rules = [rule(2)];
    signIn("DIETITIAN");
    renderWithQuery(<SetupChecklist kind="dietitian" people={3} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getByText("3 of 4 done")).toBeInTheDocument();
    expect(within(card).getByText("1 day a week.")).toBeInTheDocument();
    expect(within(card).getByText("Length and price of a session.")).toBeInTheDocument();
  });

  it("is gone once everything is done", async () => {
    listing = { is_published: true };
    rules = [rule(1)];
    ownTypes = [session()];
    const { container } = renderWithQuery(<SetupChecklist kind="trainer" people={1} />);
    await waitFor(() => expect(consultationsService.getOwnTypes).toHaveBeenCalled());
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it("waits while the client count is unknown (loading, or the list failed)", async () => {
    const { container } = renderWithQuery(<SetupChecklist kind="trainer" people={null} />);
    await waitFor(() => expect(onboardingService.getStatus).toHaveBeenCalled());
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden for a provider who hid it", async () => {
    dismissed = true;
    const { container } = renderWithQuery(<SetupChecklist kind="trainer" people={0} />);
    await waitFor(() => expect(onboardingService.getStatus).toHaveBeenCalled());
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it("hides with Hide, through the per-user walkthrough flag", async () => {
    const hide = vi.spyOn(onboardingService, "walkthroughDismiss").mockResolvedValue({ success: true, data: { is_dismissed: true } });
    renderWithQuery(<SetupChecklist kind="trainer" people={0} />);
    await userEvent.click(await screen.findByRole("button", { name: "Hide the setup checklist" }));
    expect(hide).toHaveBeenCalled();
    expect(screen.queryByTestId("setup-checklist")).toBeNull();
  });

  it("waits until the setup wizard is done (the onboarding banner covers that)", () => {
    authState.user.is_onboarding_complete = false;
    const { container } = renderWithQuery(<SetupChecklist kind="trainer" people={0} />);
    expect(container).toBeEmptyDOMElement();
    expect(onboardingService.getStatus).not.toHaveBeenCalled();
  });

  it("gives a gym's trainer the coach app's steps without the listing", async () => {
    signIn("TRAINER", "coach1");
    workspace({ owner_id: "gymowner", account_type: AccountType.GYM_OWNER, my_role_code: "consultant" });
    renderWithQuery(<SetupChecklist kind="trainer" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/dashboard/trainer/settings#hours",
      "/dashboard/trainer/settings#session",
      "/dashboard/trainer/clients",
    ]);
    expect(marketplaceService.getMyListing).not.toHaveBeenCalled();
  });

  it("shows a gym owner the gym's steps, payments and webhook included", async () => {
    signIn("GYM_OWNER");
    workspace({ account_type: AccountType.GYM_OWNER });
    configs = [paystack({ webhook_last_received_at: null })];
    renderWithQuery(<SetupChecklist kind="gym" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getByRole("link", { name: /Publish your listing/ })).toHaveAttribute("href", "/dashboard/profile-edit");
    expect(within(card).getByRole("link", { name: /Create a membership plan/ })).toHaveAttribute("href", "/dashboard/gym-owner/plans");
    expect(within(card).getByRole("link", { name: /Connect Paystack's webhook/ })).toHaveAttribute("href", "/dashboard/gym-owner/settings#gateways");
    expect(within(card).getByRole("link", { name: /Get your first member/ })).toHaveAttribute("href", "/dashboard/gym-owner/members");
    expect(marketplaceService.getOrgListing).toHaveBeenCalledWith("o1");
  });

  it("shows a gym's staff only what their role opens, never the owner's payment keys", async () => {
    signIn("USER", "staff1");
    workspace({ owner_id: "gymowner", account_type: AccountType.GYM_OWNER, my_permissions: ["marketplace:manage_listing", "team:view_members"] });
    renderWithQuery(<SetupChecklist kind="gym" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    const links = within(card).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/dashboard/gym-owner/plans", "/dashboard/gym-owner/members"]);
    expect(marketplaceService.getPaymentConfigs).not.toHaveBeenCalled();
    expect(marketplaceService.getOrgListing).not.toHaveBeenCalled();
  });
});

describe("ShowSetupChecklist: the way back after Hide", () => {
  it("isn't there while the checklist isn't hidden", async () => {
    const { container } = renderWithQuery(<ShowSetupChecklist where="Today" />);
    await waitFor(() => expect(onboardingService.getStatus).toHaveBeenCalled());
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it("brings it back by clearing the walkthrough flag", async () => {
    dismissed = true;
    const reopen = vi.spyOn(onboardingService, "walkthroughReopen").mockImplementation(async () => {
      dismissed = false;
      return { success: true, data: { is_dismissed: false } };
    });
    renderWithQuery(<ShowSetupChecklist where="Overview" />);
    const row = await screen.findByTestId("show-setup-checklist");
    expect(row).toHaveTextContent("Hidden from your Overview.");
    await userEvent.click(within(row).getByRole("button", { name: "Show setup checklist" }));
    expect(reopen).toHaveBeenCalled();
    expect(await screen.findByText("Back on your Overview.")).toBeInTheDocument();
  });

  it("says so when it couldn't", async () => {
    dismissed = true;
    vi.spyOn(onboardingService, "walkthroughReopen").mockResolvedValue({ success: false, message: "nope" });
    renderWithQuery(<ShowSetupChecklist where="Today" />);
    await userEvent.click(await screen.findByRole("button", { name: "Show setup checklist" }));
    expect(await screen.findByText("We couldn't bring it back. Try again.")).toBeInTheDocument();
  });
});
