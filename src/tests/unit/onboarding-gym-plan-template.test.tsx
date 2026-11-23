import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { planSeedError } from "@/app/onboarding/_config";
import { SEEDED_CURRENCIES } from "../setup/currencyFixtures";

/**
 * The gym track as a Free owner met it on dev (Nov 2026):
 * - the plan template step preselected 3 plans against a cap of 2, the API
 *   refused, and the refusal flashed by in a toast while the page sat there;
 * - staff invites were refused on Free, and the summary said "2 emails";
 * - the country, business types and ID wording were South African;
 * - a reload went back to step 1.
 */

const LIMIT_MESSAGE =
  "This template adds 3 membership plans but your plan allows 2. Choose a smaller template or upgrade your plan.";
const STAFF_REFUSAL = "The Free plan doesn't include staff members. Upgrade your plan to add them.";

const h = vi.hoisted(() => ({
  seed: vi.fn(),
  getStatus: vi.fn(),
  invite: vi.fn(),
  updateOrganization: vi.fn(),
}));

const USER = { id: "u-1", role: "GYM_OWNER", first_name: "Ada", last_name: "Obi", is_onboarding_complete: false, country_code: "NG" };
const ORG = { _id: "org-1", owner_id: "u-1", name: "Ada Gym", currency: "NGN" };

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: USER, updateUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({
    organizations: [ORG],
    currentOrg: ORG,
    setCurrentOrg: vi.fn(),
    refreshOrganizations: vi.fn(),
    isLoading: false,
  }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ data: SEEDED_CURRENCIES, all: SEEDED_CURRENCIES, isError: false }),
  usePaymentGateways: () => ({ data: [], isSuccess: true, isError: false, isPending: false, refetch: vi.fn() }),
}));
vi.mock("@/lib/queries/utility", () => ({
  useCountries: () => ({
    data: [
      { code: "NG", name: "Nigeria", dialCode: "+234", cities: [] },
      { code: "ZA", name: "South Africa", dialCode: "+27", cities: [] },
      { code: "KE", name: "Kenya", dialCode: "+254", cities: [] },
    ],
    isLoading: false,
  }),
}));
vi.mock("@/lib/api/providerBilling", () => ({ providerBillingApi: { getStatus: h.getStatus } }));
vi.mock("@/lib/api/teams", () => ({
  teamsService: {
    updateOrganization: h.updateOrganization,
    createLocation: vi.fn(async () => ({ success: true, data: { _id: "loc-1" } })),
    updateLocation: vi.fn(async () => ({ success: true })),
    seedMembershipPlanTemplate: h.seed,
    getRoles: vi.fn(async () => ({ success: true, data: [{ _id: "role-c", code: "consultant" }] })),
    inviteMember: h.invite,
  },
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: { getMyMembershipSubscriptions: vi.fn(async () => ({ success: true, data: [] })) },
}));
vi.mock("@/lib/api/onboarding", () => ({ onboardingService: { dismiss: vi.fn(async () => ({ success: true })) } }));
vi.mock("@/lib/api/auth", () => ({ authService: { refreshUserFromApi: vi.fn(async () => null), updateProfile: vi.fn() } }));
vi.mock("@/lib/api/consultations", () => ({ consultationsService: {} }));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

import OnboardingPage from "@/app/onboarding/page";

const FREE_LIMITS = { max_active_members: 10, max_membership_plans: 2, max_staff_members: 0, max_listings: 1 };

function limits(l: Record<string, number | null> | null) {
  h.getStatus.mockResolvedValue(l ? { success: true, data: { limits: l } } : { success: false, status: 500 });
}

const cont = () => userEvent.click(screen.getByRole("button", { name: /Continue|Go to dashboard/ }));

async function reachPlansStep() {
  render(<OnboardingPage />);
  // Step 1 (business details) and step 2 (location) need nothing typed.
  await userEvent.click(await screen.findByRole("button", { name: /Continue/ }));
  await screen.findByText("Add your first location.");
  await cont();
  await screen.findByText("Membership plans.");
}

async function reachStaffStep() {
  await reachPlansStep();
  await cont(); // plans
  await screen.findByText("Verification documents.");
  await cont(); // documents
  await screen.findByText("Connect your payments.");
  await cont(); // payout
  await screen.findByText("How check-in works.");
  await cont(); // check-in
  await screen.findByText("Invite your staff.");
}

beforeEach(() => {
  localStorage.clear();
  h.seed.mockReset();
  h.invite.mockReset();
  h.getStatus.mockReset();
  h.updateOrganization.mockReset();
  h.updateOrganization.mockResolvedValue({ success: true, data: {} });
  limits(null);
});

describe("gym onboarding: membership plan template", () => {
  it("shows the API's refusal on the step, and stays there", async () => {
    h.seed.mockResolvedValue({ success: false, status: 400, code: "VALIDATION_FAILED", message: LIMIT_MESSAGE });
    await reachPlansStep();
    await cont();
    expect(h.seed).toHaveBeenCalledWith("org-1", "standard");
    expect(screen.getByRole("alert")).toHaveTextContent(LIMIT_MESSAGE);
    expect(screen.getByText("Membership plans.")).toBeInTheDocument();
  });

  it("moves on once the plans are added", async () => {
    h.seed.mockResolvedValue({ success: true, data: [] });
    await reachPlansStep();
    await cont();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Membership plans.")).toBeNull();
  });

  it("lets the owner Start blank after a refusal, without seeding", async () => {
    h.seed.mockResolvedValue({ success: false, status: 400, message: LIMIT_MESSAGE });
    await reachPlansStep();
    await cont();
    expect(h.seed).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText("Start blank"));
    await cont();
    expect(h.seed).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Membership plans.")).toBeNull();
  });

  it("offers only templates that fit the plan's cap, and starts on Start blank", async () => {
    limits(FREE_LIMITS);
    await reachPlansStep();
    const standard = await screen.findByRole("radio", { name: /Standard set/ });
    await vi.waitFor(() => expect(standard).toBeDisabled());
    expect(screen.getByRole("radio", { name: /Boutique/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Start blank/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getAllByText(/Your plan allows 2 membership plans/)).toHaveLength(2);
    await cont();
    expect(h.seed).not.toHaveBeenCalled();
    expect(screen.queryByText("Membership plans.")).toBeNull();
  });

  it("seeds a template that fits", async () => {
    limits(FREE_LIMITS);
    h.seed.mockResolvedValue({ success: true, data: [] });
    await reachPlansStep();
    const crossfit = await screen.findByRole("radio", { name: /CrossFit/ });
    expect(crossfit).not.toBeDisabled();
    await userEvent.click(crossfit);
    await cont();
    expect(h.seed).toHaveBeenCalledWith("org-1", "crossfit");
  });

  it("makes no claim about other gyms", async () => {
    await reachPlansStep();
    expect(screen.queryByText(/Used by/)).toBeNull();
  });
});

describe("gym onboarding: staff invites", () => {
  it("does not offer invites when the plan has no staff seats, and the summary says none", async () => {
    limits(FREE_LIMITS);
    await reachStaffStep();
    expect(await screen.findByText(/Your plan doesn't include staff accounts/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Coach emails/)).toBeNull();
    await cont();
    expect(h.invite).not.toHaveBeenCalled();
    await screen.findByText("Submit for review.");
    const row = screen.getByText("Staff invites").parentElement!;
    expect(within(row).getByText("None")).toBeInTheDocument();
  });

  it("shows a refusal on the step, and counts only invites that were sent", async () => {
    await reachStaffStep();
    await userEvent.type(screen.getByLabelText(/Coach emails/), "a@gym.test{enter}b@gym.test");
    h.invite.mockImplementation(async (_org: string, body: { email: string }) =>
      body.email === "a@gym.test" ? { success: true } : { success: false, status: 403, message: STAFF_REFUSAL },
    );
    await cont();
    expect(screen.getByRole("alert")).toHaveTextContent(`We couldn't send b@gym.test. ${STAFF_REFUSAL}`);
    expect(screen.getByText("Invite your staff.")).toBeInTheDocument();
    // Removing the refused address moves on, without inviting a@ twice.
    const box = screen.getByLabelText(/Coach emails/);
    await userEvent.clear(box);
    await userEvent.type(box, "a@gym.test");
    await cont();
    expect(h.invite).toHaveBeenCalledTimes(2);
    await screen.findByText("Submit for review.");
    const row = screen.getByText("Staff invites").parentElement!;
    expect(within(row).getByText("1 sent")).toBeInTheDocument();
  });
});

describe("gym onboarding: country", () => {
  it("starts on the account's country, with its business types and ID wording", async () => {
    render(<OnboardingPage />);
    await screen.findByText("Business details.");
    expect(screen.getByLabelText("Country")).toHaveTextContent("Nigeria");
    expect(screen.queryByText("Pty Ltd")).toBeNull();
    await userEvent.click(screen.getByLabelText("Legal entity"));
    expect(await screen.findByText("Private limited company (Ltd)")).toBeInTheDocument();
    expect(screen.queryByText(/Pty/)).toBeNull();
    await userEvent.keyboard("{Escape}");
    await cont();
    // The country is saved on the workspace as its ISO code.
    expect(h.updateOrganization).toHaveBeenCalledWith("org-1", expect.objectContaining({ country: "NG" }));
    await screen.findByText("Add your first location.");
    await cont();
    await screen.findByText("Membership plans.");
    await cont();
    await screen.findByText("Verification documents.");
    expect(screen.getByText(/NIN slip, international passport or driver's licence/)).toBeInTheDocument();
    expect(screen.queryByText(/South African ID/)).toBeNull();
  });
});

describe("gym onboarding: reload", () => {
  it("resumes on the step it was left on, with what was typed", async () => {
    const first = render(<OnboardingPage />);
    await screen.findByText("Business details.");
    await userEvent.type(screen.getByPlaceholderText("Iron Lab"), "Imole Gym");
    await cont();
    await screen.findByText("Add your first location.");
    first.unmount();

    render(<OnboardingPage />);
    expect(await screen.findByText("Add your first location.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByPlaceholderText("Iron Lab")).toHaveValue("Imole Gym");
  });
});

describe("planSeedError", () => {
  it("is null when the plans were added", () => {
    expect(planSeedError({ success: true })).toBeNull();
  });

  it("passes on the API's reason for a refusal", () => {
    expect(planSeedError({ success: false, status: 400, message: LIMIT_MESSAGE })).toBe(LIMIT_MESSAGE);
  });

  it("uses plain copy for a server or network failure", () => {
    const fallback = "We couldn't add those membership plans. Try again, or choose Start blank and add plans later.";
    expect(planSeedError({ success: false, status: 500, message: "Internal server error" })).toBe(fallback);
    expect(planSeedError({ success: false, message: "Failed to fetch" })).toBe(fallback);
  });
});
