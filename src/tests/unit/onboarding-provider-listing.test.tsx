import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SEEDED_CURRENCIES } from "../setup/currencyFixtures";
import { saveOnboardingDraft } from "@/app/onboarding/_draft";

/**
 * Trainer and dietitian onboarding as a new provider met it on dev (Nov
 * 2026): the headline, city and country never reached the listing (My
 * profile said "Listing not found"), the preview said "Your Name", the
 * monthly online price was asked for and dropped, and the dietitian's
 * "Clinical · 6 protocols" seed created nothing.
 *
 * Each test resumes the track from a saved draft, which is also what a
 * reload does.
 */

const h = vi.hoisted(() => ({
  user: { id: "u-9", role: "TRAINER", first_name: "Chinedu", last_name: "Eze", is_onboarding_complete: false, country_code: "NG" } as Record<string, unknown>,
  getMyListing: vi.fn(),
  createMyListing: vi.fn(),
  updateMyListing: vi.fn(),
  getPlans: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  dismiss: vi.fn(),
}));
const ORG = { _id: "org-9", owner_id: "u-9", name: "Chinedu Eze Training", currency: "NGN" };

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: h.user, updateUser: vi.fn(), logout: vi.fn() }),
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
  teamsService: { updateOrganization: vi.fn(async () => ({ success: true, data: {} })) },
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    getMyMembershipSubscriptions: vi.fn(async () => ({ success: true, data: [] })),
    getMyListing: h.getMyListing,
    createMyListing: h.createMyListing,
    updateMyListing: h.updateMyListing,
    getOrgMembershipPlans: h.getPlans,
    createOrgMembershipPlan: h.createPlan,
    updateOrgMembershipPlan: h.updatePlan,
  },
}));
vi.mock("@/lib/api/onboarding", () => ({ onboardingService: { dismiss: h.dismiss } }));
vi.mock("@/lib/api/auth", () => ({ authService: { refreshUserFromApi: vi.fn(async () => null), updateProfile: vi.fn() } }));
vi.mock("@/lib/api/consultations", () => ({
  consultationsService: {
    getOwnTypes: vi.fn(async () => ({ success: true, data: [] })),
    createOwnType: vi.fn(async () => ({ success: true })),
    updateOwnType: vi.fn(async () => ({ success: true })),
  },
}));
vi.mock("@/lib/api/credentials", () => ({ credentialsService: {} }));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

import OnboardingPage from "@/app/onboarding/page";

beforeEach(() => {
  localStorage.clear();
  for (const fn of [h.getMyListing, h.createMyListing, h.updateMyListing, h.getPlans, h.createPlan, h.updatePlan, h.dismiss]) fn.mockReset();
  h.dismiss.mockResolvedValue({ success: true });
  h.getMyListing.mockResolvedValue({ success: false, status: 404, message: "Listing not found" });
  h.createMyListing.mockResolvedValue({ success: true, data: { _id: "l-1" } });
  h.getPlans.mockResolvedValue({ success: true, data: [] });
  h.createPlan.mockResolvedValue({ success: true, data: { _id: "p-1" } });
  h.user = { ...h.user, role: "TRAINER" };
  // Leaving the page is not part of these tests.
  Object.defineProperty(window, "location", { configurable: true, value: { href: "", replace: vi.fn() } });
});

describe("trainer onboarding", () => {
  // The track used to ask for a certificate, insurance and an ID, and saved
  // none of them: nothing on the API holds them and nobody reviews them.
  it("asks for no documents: specializations lead straight to pricing", async () => {
    saveOnboardingDraft("u-9", { role: "trainer", step: 2, data: { country: "Nigeria", currency: "NGN" } });
    render(<OnboardingPage />);
    expect(await screen.findByText("Your specializations.")).toBeInTheDocument();
    expect(screen.getByText(/Step 02 of 05/)).toBeInTheDocument();
    expect(screen.queryByText(/Upload (your )?certifications/i)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(await screen.findByText("Set your pricing.")).toBeInTheDocument();
    expect(screen.queryByText(/liability insurance|ID document|verified badge/i)).toBeNull();
  });

  it("says certificates are not checked, rather than promising a badge", async () => {
    saveOnboardingDraft("u-9", { role: "trainer", step: 5, data: { country: "Nigeria", currency: "NGN" } });
    render(<OnboardingPage />);
    await screen.findByText("Your marketplace profile.");
    expect(screen.getByText(/doesn't check certificates yet/)).toBeInTheDocument();
  });

  it("creates the listing from what onboarding asked, and shows the account's name", async () => {
    saveOnboardingDraft("u-9", {
      role: "trainer",
      step: 5,
      data: { country: "Nigeria", currency: "NGN", city: "Lagos", headline: "Strength coach · Surulere", specializations: ["Strength"] },
    });
    render(<OnboardingPage />);
    expect(await screen.findByText("Your marketplace profile.")).toBeInTheDocument();
    expect(screen.getByText("Chinedu Eze")).toBeInTheDocument();
    expect(screen.queryByText(/Your Name/i)).toBeNull();
    expect(screen.getByLabelText("Headline")).toHaveValue("Strength coach · Surulere");
    await userEvent.type(screen.getByLabelText("Short bio"), "I coach strength.");
    await userEvent.click(screen.getByRole("button", { name: /Go to dashboard/ }));
    await vi.waitFor(() => expect(h.dismiss).toHaveBeenCalled());
    expect(h.createMyListing).toHaveBeenCalledWith({
      account_type: "personal_trainer",
      headline: "Strength coach · Surulere",
      bio: "I coach strength.",
      specialties: ["Strength"],
      city: "Lagos",
      country_code: "NG",
    });
  });

  it("stays on the step and says why when the listing is refused", async () => {
    h.createMyListing.mockResolvedValue({ success: false, status: 403, message: "You coach at Imole Forge." });
    saveOnboardingDraft("u-9", { role: "trainer", step: 5, data: { country: "Nigeria", currency: "NGN", headline: "Coach", bio: "Hi." } });
    render(<OnboardingPage />);
    await screen.findByText("Your marketplace profile.");
    await userEvent.click(screen.getByRole("button", { name: /Go to dashboard/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You coach at Imole Forge.");
    expect(h.dismiss).not.toHaveBeenCalled();
  });

  it("finishes without a listing when the headline or bio is left out", async () => {
    saveOnboardingDraft("u-9", { role: "trainer", step: 5, data: { country: "Nigeria", currency: "NGN" } });
    render(<OnboardingPage />);
    await screen.findByText("Your marketplace profile.");
    await userEvent.click(screen.getByRole("button", { name: /Go to dashboard/ }));
    await vi.waitFor(() => expect(h.dismiss).toHaveBeenCalled());
    expect(h.createMyListing).not.toHaveBeenCalled();
  });

  it("saves the monthly online price as a package, and asks for no session packs", async () => {
    saveOnboardingDraft("u-9", {
      role: "trainer",
      step: 3,
      data: { country: "Nigeria", currency: "NGN", price1on1Free: true, priceMonthly: "40,000", priceMonthlyMinor: 4_000_000 },
    });
    render(<OnboardingPage />);
    await screen.findByText("Set your pricing.");
    expect(screen.queryByText(/session pack$/)).toBeNull();
    expect(screen.queryByLabelText(/4-session/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await screen.findByText("Connect your payout.");
    expect(h.createPlan).toHaveBeenCalledWith("org-9", {
      name: "Online coaching (monthly)",
      plan_type: "subscription",
      duration_days: 30,
      price_minor: 4_000_000,
      currency: "NGN",
    });
  });

  it("updates the package on Back and Continue instead of adding another", async () => {
    h.getPlans.mockResolvedValue({ success: true, data: [{ _id: "p-1", name: "Online coaching (monthly)" }] });
    h.updatePlan.mockResolvedValue({ success: true });
    saveOnboardingDraft("u-9", {
      role: "trainer",
      step: 3,
      data: { country: "Nigeria", currency: "NGN", price1on1Free: true, priceMonthlyMinor: 5_000_000, priceMonthly: "50,000" },
    });
    render(<OnboardingPage />);
    await screen.findByText("Set your pricing.");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await screen.findByText("Connect your payout.");
    expect(h.createPlan).not.toHaveBeenCalled();
    expect(h.updatePlan).toHaveBeenCalledWith("org-9", "p-1", { duration_days: 30, price_minor: 5_000_000, currency: "NGN" });
  });
});

describe("dietitian onboarding", () => {
  it("has no library seed step, and creates the listing at the end", async () => {
    h.user = { ...h.user, role: "DIETITIAN" };
    saveOnboardingDraft("u-9", {
      role: "dietitian",
      step: 6,
      data: { country: "Nigeria", currency: "NGN", fullName: "Halima Bello, RD", city: "Abuja", headline: "Registered dietitian", bio: "PCOS care." },
    });
    render(<OnboardingPage />);
    await screen.findByText("Your marketplace profile.");
    expect(screen.queryByText(/Seed your library/)).toBeNull();
    expect(screen.queryByText(/protocols/)).toBeNull();
    expect(screen.getAllByText("Halima Bello, RD").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: /Go to dashboard/ }));
    await vi.waitFor(() => expect(h.dismiss).toHaveBeenCalled());
    expect(h.createMyListing).toHaveBeenCalledWith(
      expect.objectContaining({ account_type: "dietitian", headline: "Registered dietitian", bio: "PCOS care.", city: "Abuja", country_code: "NG" }),
    );
  });
});
