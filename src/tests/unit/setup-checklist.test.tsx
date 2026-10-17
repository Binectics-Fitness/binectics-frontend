import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SetupChecklist } from "@/components/provider/SetupChecklist";
import { SETUP_HREFS, paymentsState, setupSteps } from "@/lib/provider/setupSteps";
import { marketplaceService, type OrgPaymentConfig } from "@/lib/api/marketplace";
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

let dismissed = false;
let listing: { is_published: boolean } | null = null;
let plans: { is_active: boolean }[] = [];
let configs: OrgPaymentConfig[] = [];

const signIn = (role: string, id = "u1") => {
  authState.user = { id, role, first_name: "Ada", is_onboarding_complete: true };
};
const workspace = (over: Record<string, unknown> = {}) => {
  orgState.currentOrg = { _id: "o1", name: "Ada Coaching", owner_id: "u1", account_type: AccountType.TRAINER, ...over };
  orgState.organizations = [orgState.currentOrg];
};

function renderChecklist(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.restoreAllMocks();
  dismissed = false;
  listing = null;
  plans = [];
  configs = [];
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
});

describe("setupSteps", () => {
  it("lists what a brand-new trainer still has to do", () => {
    const steps = setupSteps("trainer", { listing: null, activePlans: 0, payments: [], people: 0 });
    expect(steps.map((s) => [s.key, s.done])).toEqual([
      ["listing", false],
      ["plans", false],
      ["payments", false],
      ["people", false],
    ]);
    expect(steps[0].title).toBe("Publish your profile");
    expect(steps[3].detail).toBe("Invite someone you already work with.");
  });

  it("says what's already there once it is", () => {
    const steps = setupSteps("gym", { listing: { is_published: true }, activePlans: 2, payments: [paystack()], people: 1 });
    expect(steps.every((s) => s.done)).toBe(true);
    expect(steps.map((s) => s.detail)).toEqual(["Live. Members can find your gym.", "2 active plans.", "Connected.", "1 member."]);
  });

  it("leaves payment keys out for someone who doesn't own the workspace", () => {
    expect(setupSteps("gym", { listing: null, activePlans: 0, payments: null, people: 0 }).map((s) => s.key)).not.toContain("payments");
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

  it("sends each step to its own page per role", () => {
    expect(SETUP_HREFS.dietitian.people).toBe("/dashboard/dietitian/clients");
    expect(SETUP_HREFS.gym.payments).toBe("/dashboard/gym-owner/settings#gateways");
  });
});

describe("SetupChecklist", () => {
  it("shows a new trainer each step, linked, with how far they are", async () => {
    listing = { is_published: false };
    renderChecklist(<SetupChecklist kind="trainer" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getByText("0 of 4 done")).toBeInTheDocument();
    expect(within(card).getByText("Saved but not published, so nobody can see it yet.")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Publish your profile/ })).toHaveAttribute("href", "/dashboard/trainer/profile");
    expect(within(card).getByRole("link", { name: /Add your payment keys/ })).toHaveAttribute("href", "/dashboard/trainer/settings#gateways");
    const client = within(card).getByRole("link", { name: /Add your first client/ });
    expect(client).toHaveAttribute("href", "/dashboard/trainer/clients");
    // Screen readers hear whether each step is done, not just a ring.
    expect(client).toHaveTextContent("Add your first client, to do");
  });

  it("counts what's done and keeps the rest", async () => {
    listing = { is_published: true };
    plans = [{ is_active: true }, { is_active: false }];
    configs = [paystack({ webhook_last_received_at: null })];
    renderChecklist(<SetupChecklist kind="dietitian" people={3} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getByText("3 of 4 done")).toBeInTheDocument();
    expect(within(card).getByText("1 active plan.")).toBeInTheDocument();
    expect(within(card).getByText("Keys saved. Add the webhook URL in Paystack so payments confirm.")).toBeInTheDocument();
  });

  it("is gone once everything is done", async () => {
    listing = { is_published: true };
    plans = [{ is_active: true }];
    configs = [paystack()];
    const { container } = renderChecklist(<SetupChecklist kind="trainer" people={1} />);
    await waitFor(() => expect(marketplaceService.getPaymentConfigs).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });

  it("waits for the page's client count rather than flash a wrong step", async () => {
    const { container } = renderChecklist(<SetupChecklist kind="trainer" people={null} />);
    await waitFor(() => expect(onboardingService.getStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden for a provider who hid the setup guide", async () => {
    dismissed = true;
    const { container } = renderChecklist(<SetupChecklist kind="trainer" people={0} />);
    await waitFor(() => expect(onboardingService.getStatus).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });

  it("hides for good with Hide, through the per-user walkthrough flag", async () => {
    const hide = vi.spyOn(onboardingService, "walkthroughDismiss").mockResolvedValue({ success: true, data: { is_dismissed: true } });
    renderChecklist(<SetupChecklist kind="trainer" people={0} />);
    await userEvent.click(await screen.findByRole("button", { name: "Hide the setup checklist" }));
    expect(hide).toHaveBeenCalled();
    expect(screen.queryByTestId("setup-checklist")).toBeNull();
  });

  it("waits until the setup wizard is done (the onboarding banner covers that)", () => {
    authState.user.is_onboarding_complete = false;
    const { container } = renderChecklist(<SetupChecklist kind="trainer" people={0} />);
    expect(container).toBeEmptyDOMElement();
    expect(onboardingService.getStatus).not.toHaveBeenCalled();
  });

  it("is not shown to a gym's trainer: the gym sets up", () => {
    signIn("TRAINER", "coach1");
    workspace({ owner_id: "gymowner", account_type: AccountType.GYM_OWNER, my_role_code: "consultant" });
    const { container } = renderChecklist(<SetupChecklist kind="trainer" people={0} />);
    expect(container).toBeEmptyDOMElement();
    expect(marketplaceService.getPaymentConfigs).not.toHaveBeenCalled();
  });

  it("shows a gym owner the gym's steps", async () => {
    signIn("GYM_OWNER");
    workspace({ account_type: AccountType.GYM_OWNER });
    renderChecklist(<SetupChecklist kind="gym" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    expect(within(card).getByRole("link", { name: /Publish your listing/ })).toHaveAttribute("href", "/dashboard/profile-edit");
    expect(within(card).getByRole("link", { name: /Create a membership plan/ })).toHaveAttribute("href", "/dashboard/gym-owner/plans");
    expect(within(card).getByRole("link", { name: /Get your first member/ })).toHaveAttribute("href", "/dashboard/gym-owner/members");
    expect(marketplaceService.getOrgListing).toHaveBeenCalledWith("o1");
  });

  it("shows a gym's staff only what their role opens, never the owner's payment keys", async () => {
    signIn("USER", "staff1");
    workspace({ owner_id: "gymowner", account_type: AccountType.GYM_OWNER, my_permissions: ["marketplace:manage_listing", "team:view_members"] });
    renderChecklist(<SetupChecklist kind="gym" people={0} />);
    const card = await screen.findByTestId("setup-checklist");
    const links = within(card).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/dashboard/gym-owner/plans", "/dashboard/gym-owner/members"]);
    expect(marketplaceService.getPaymentConfigs).not.toHaveBeenCalled();
    expect(marketplaceService.getOrgListing).not.toHaveBeenCalled();
  });
});
