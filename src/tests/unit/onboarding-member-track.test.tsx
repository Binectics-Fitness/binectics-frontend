import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MEMBER_STEPS,
  availableTools,
  clampMemberStep,
  memberCanContinue,
  memberContinueLabel,
  memberFinishesAt,
  memberLanding,
  persistMemberStep,
} from "@/app/onboarding/_member";
import { ROLES } from "@/app/onboarding/_config";
import { loadSoloTools, loadStartPath } from "@/lib/solo/startChoice";

/**
 * The web member track matches mobile's (#272): "How would you like to
 * start?", then, only for "on my own", "What would you like to use?". No
 * goal step, no city, no "We've found providers" claim, nothing sent to the
 * profile.
 */

const h = vi.hoisted(() => ({
  params: new URLSearchParams("role=member"),
  subs: [] as unknown[],
  dismiss: vi.fn(),
  updateProfile: vi.fn(),
}));

const USER = { id: "m-1", role: "USER", first_name: "Ada Grace", last_name: "Obi", is_onboarding_complete: false };

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.params,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: USER, updateUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({
    organizations: [],
    currentOrg: null,
    setCurrentOrg: vi.fn(),
    refreshOrganizations: vi.fn(),
    isLoading: false,
  }),
}));
vi.mock("@/lib/api/teams", () => ({ teamsService: { createOrganization: vi.fn() } }));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: { getMyMembershipSubscriptions: vi.fn(async () => ({ success: true, data: h.subs })) },
}));
vi.mock("@/lib/api/onboarding", () => ({ onboardingService: { dismiss: h.dismiss } }));
vi.mock("@/lib/api/auth", () => ({
  authService: { refreshUserFromApi: vi.fn(async () => null), updateProfile: h.updateProfile },
}));
vi.mock("@/lib/api/consultations", () => ({ consultationsService: {} }));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

import OnboardingPage from "@/app/onboarding/page";

const realLocation = window.location;
let landed: string;

beforeEach(() => {
  h.params = new URLSearchParams("role=member");
  h.subs = [];
  h.dismiss.mockReset().mockResolvedValue({ success: true });
  h.updateProfile.mockReset();
  window.localStorage.clear();
  landed = "";
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...realLocation,
      replace: vi.fn(),
      set href(v: string) {
        landed = v;
      },
      get href() {
        return landed;
      },
    },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: realLocation });
});

async function onStartStep() {
  render(<OnboardingPage />);
  await screen.findByRole("heading", { name: "Welcome, Ada. How would you like to start?" });
}

describe("member track: the steps", () => {
  it("is two steps, the second only for 'on my own'", () => {
    expect(MEMBER_STEPS).toHaveLength(2);
    expect(ROLES.find((r) => r.id === "member")?.steps.map((s) => s.title)).toEqual(["How to start", "What to use"]);
    expect(memberFinishesAt(1, { startPath: "own" })).toBe(false);
    expect(memberFinishesAt(1, { startPath: "provider" })).toBe(true);
    expect(memberFinishesAt(1, { startPath: "invite" })).toBe(true);
    expect(memberFinishesAt(2, { startPath: "own" })).toBe(true);
  });

  it("asks for a path before going on, and the button says so", () => {
    expect(memberCanContinue(1, {})).toBe(false);
    expect(memberContinueLabel(1, {})).toBe("Choose one to continue");
    expect(memberContinueLabel(1, { startPath: "own" })).toBe("Continue");
    expect(memberContinueLabel(2, { startPath: "own" })).toBe("Continue without picking");
    expect(memberContinueLabel(2, { startPath: "own", soloTools: ["water", "fasting"] })).toBe("Continue with 2");
  });

  it("lands each path where mobile does: Today, Explore, invitations", () => {
    expect(memberLanding("own")).toBe("/dashboard/member");
    expect(memberLanding("provider")).toBe("/marketplace");
    expect(memberLanding("invite")).toBe("/dashboard/member/requests");
  });

  it("offers only tools web has: no journal, and always workouts (no Starter flag)", () => {
    expect(availableTools().map((t) => t.id)).toEqual(["workouts", "fasting", "water", "checklist", "weight", "logs"]);
  });
});

describe("member track: the page", () => {
  it("starts with nothing picked, no goal step, no city and no provider claim", async () => {
    await onStartStep();
    const radios = screen.getAllByRole("radio").filter((r) => ["On my own", "With a gym or coach", "I have an invite"].some((t) => r.textContent?.includes(t)));
    expect(radios).toHaveLength(3);
    radios.forEach((r) => expect(r).toHaveAttribute("aria-checked", "false"));
    expect(screen.getByRole("button", { name: "Choose one to continue" })).toBeDisabled();
    expect(screen.queryByText(/What brings you here/)).toBeNull();
    expect(screen.queryByText(/Where do you train/)).toBeNull();
    expect(screen.queryByText(/found providers/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Sea Point/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Save & finish later/ })).toBeNull();
  });

  it("on my own: tools step, Back returns, Skip finishes to Today with nothing sent to the profile", async () => {
    await onStartStep();
    await userEvent.click(screen.getByRole("radio", { name: /On my own/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "What would you like to use?" });
    expect(h.dismiss).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Back/ }));
    await screen.findByRole("heading", { name: /How would you like to start/ });
    // The answer given is kept.
    expect(screen.getByRole("radio", { name: /On my own/ })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await userEvent.click(await screen.findByRole("checkbox", { name: /Water/ }));
    expect(screen.getByRole("button", { name: "Continue with 1" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));

    await waitFor(() => expect(landed).toBe("/dashboard/member"));
    expect(h.dismiss).toHaveBeenCalledTimes(1);
    expect(h.updateProfile).not.toHaveBeenCalled();
    expect(loadStartPath("m-1")).toBe("own");
    expect(loadSoloTools("m-1")).toEqual([]);
  });

  it("on my own: Continue with picks saves them in this browser", async () => {
    await onStartStep();
    await userEvent.click(screen.getByRole("radio", { name: /On my own/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Fasting/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Weight/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue with 2" }));
    await waitFor(() => expect(landed).toBe("/dashboard/member"));
    expect(loadSoloTools("m-1")).toEqual(["fasting", "weight"]);
    expect(h.updateProfile).not.toHaveBeenCalled();
  });

  it("with a gym or coach: finishes on step 1 and opens Explore", async () => {
    await onStartStep();
    await userEvent.click(screen.getByRole("radio", { name: /With a gym or coach/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(landed).toBe("/marketplace"));
    expect(h.dismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "What would you like to use?" })).toBeNull();
    expect(h.updateProfile).not.toHaveBeenCalled();
  });

  it("an invite: finishes on step 1 and opens the invitations", async () => {
    await onStartStep();
    await userEvent.click(screen.getByRole("radio", { name: /I have an invite/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(landed).toBe("/dashboard/member/requests"));
  });

  it("Back from step 1 reopens the role choice", async () => {
    await onStartStep();
    await userEvent.click(screen.getByRole("button", { name: /Back/ }));
    await screen.findByRole("heading", { name: "How will you use Binectics?" });
  });

  it("a gym's member has nothing to choose: one button to the dashboard", async () => {
    h.params = new URLSearchParams();
    h.subs = [{ status: "active", organization_id: { _id: "g1", name: "Iron House", account_type: "gym_owner" } }];
    render(<OnboardingPage />);
    await screen.findByText(/You're a member of Iron House/);
    expect(screen.queryByRole("heading", { name: /How would you like to start/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Go to dashboard" }));
    await waitFor(() => expect(landed).toBe("/dashboard/member"));
  });
});

describe("member track: resuming from the old flow", () => {
  it("shows the last step for a step past the end of the new track", () => {
    expect(clampMemberStep(3)).toBe(2);
    expect(clampMemberStep(4)).toBe(2);
    expect(clampMemberStep(1)).toBe(1);
    expect(clampMemberStep(0)).toBe(0);
  });

  it("ignores the old track's answers: no goal, city or schedule is sent or kept", () => {
    const old = { goal: "strong", city: "Lagos", neighbourhood: "Yaba", providerTypes: ["Gyms"], times: ["Lunch · 11am-2pm"], days: ["Mon"] };
    for (const step of [1, 2, 3, 4]) persistMemberStep(step, old, "m-1");
    expect(h.updateProfile).not.toHaveBeenCalled();
    expect(loadStartPath("m-1")).toBeNull();
    expect(loadSoloTools("m-1")).toEqual([]);
  });

  it("a member who left the old track part-way starts the new one at its first step", async () => {
    // Nothing of the old track is stored: the page always opened at the
    // role choice (or step 1 with ?role=member), so there is no old step to
    // restore. The account's old answers stay on its profile untouched.
    await onStartStep();
    expect(screen.getByText("Step 1 of 2", { selector: ".ob-progress" })).toBeInTheDocument();
  });
});
