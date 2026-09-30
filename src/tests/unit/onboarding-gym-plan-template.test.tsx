import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { planSeedError } from "@/app/onboarding/_config";
import { SEEDED_CURRENCIES } from "../setup/currencyFixtures";

/**
 * The gym "Membership plans" step seeds plans from a template. A template
 * larger than the owner's plan allows is refused (400), and the step used to
 * move on as if it had worked. The refusal is now shown and the owner stays
 * on the step to pick a smaller template or Start blank.
 */

const LIMIT_MESSAGE =
  "This template adds 3 membership plans but your plan allows 2. Choose a smaller template or upgrade your plan.";

const h = vi.hoisted(() => ({
  seed: vi.fn(),
  toastError: vi.fn(),
}));

const USER = { id: "u-1", role: "GYM_OWNER", first_name: "Ada", last_name: "Obi", is_onboarding_complete: false };
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
vi.mock("@/lib/api/teams", () => ({
  teamsService: {
    updateOrganization: vi.fn(async () => ({ success: true, data: {} })),
    createLocation: vi.fn(async () => ({ success: true, data: { _id: "loc-1" } })),
    updateLocation: vi.fn(async () => ({ success: true })),
    seedMembershipPlanTemplate: h.seed,
  },
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: { getMyMembershipSubscriptions: vi.fn(async () => ({ success: true, data: [] })) },
}));
vi.mock("@/lib/api/onboarding", () => ({ onboardingService: { dismiss: vi.fn(async () => ({ success: true })) } }));
vi.mock("@/lib/api/auth", () => ({ authService: { refreshUserFromApi: vi.fn(async () => null), updateProfile: vi.fn() } }));
vi.mock("@/lib/api/consultations", () => ({ consultationsService: {} }));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { error: h.toastError, success: vi.fn() }),
}));

import OnboardingPage from "@/app/onboarding/page";

async function reachPlansStep() {
  render(<OnboardingPage />);
  // Step 1 (business details) and step 2 (location) need nothing typed.
  await userEvent.click(await screen.findByRole("button", { name: /Continue/ }));
  await screen.findByText("Add your first location.");
  await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
  await screen.findByText("Membership plans.");
}

describe("gym onboarding: membership plan template", () => {
  beforeEach(() => {
    h.seed.mockReset();
    h.toastError.mockReset();
  });

  it("shows the API's message and stays on the step when the template is over the plan limit", async () => {
    h.seed.mockResolvedValue({ success: false, status: 400, code: "VALIDATION_FAILED", message: LIMIT_MESSAGE });
    await reachPlansStep();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(h.seed).toHaveBeenCalledWith("org-1", "standard");
    expect(h.toastError).toHaveBeenCalledWith(LIMIT_MESSAGE);
    expect(screen.getByText("Membership plans.")).toBeInTheDocument();
  });

  it("moves on once the plans are added", async () => {
    h.seed.mockResolvedValue({ success: true, data: [] });
    await reachPlansStep();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(h.toastError).not.toHaveBeenCalled();
    expect(screen.queryByText("Membership plans.")).toBeNull();
  });

  it("lets the owner Start blank after a refusal, without seeding", async () => {
    h.seed.mockResolvedValue({ success: false, status: 400, message: LIMIT_MESSAGE });
    await reachPlansStep();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(h.seed).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText("Start blank"));
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(h.seed).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Membership plans.")).toBeNull();
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
