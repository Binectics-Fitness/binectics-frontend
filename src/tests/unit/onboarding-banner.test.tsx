import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnboardingBanner from "@/components/OnboardingBanner";
import { UserRole, type User } from "@/lib/types";

// The banner is auth-driven and self-gating: it reads the signed-in user from
// useAuth() (no props) and renders only while onboarding is incomplete.
// Dismissal is now server-side (per-user, cross-device) via the onboarding
// walkthrough endpoints, read through useOnboardingStatus() — no localStorage.
// These tests exercise that contract.

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseOnboardingStatus = vi.fn();
vi.mock("@/lib/queries/onboarding", () => ({
  useOnboardingStatus: () => mockUseOnboardingStatus(),
}));

const walkthroughDismiss = vi.fn().mockResolvedValue({ success: true });
const walkthroughReopen = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/api/onboarding", () => ({
  onboardingService: {
    walkthroughDismiss: () => walkthroughDismiss(),
    walkthroughReopen: () => walkthroughReopen(),
  },
}));

const invalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

function makeUser(overrides: Partial<User> = {}): Partial<User> {
  return {
    id: "user-1",
    first_name: "Adesegun",
    role: UserRole.USER,
    is_onboarding_complete: false,
    ...overrides,
  };
}

/** Default: signed in, status loaded, not dismissed. */
function arrange(
  user: Partial<User> | null,
  status: { is_dismissed?: boolean } | null = { is_dismissed: false },
  isLoading = false,
) {
  mockUseAuth.mockReturnValue({ user });
  mockUseOnboardingStatus.mockReturnValue({ data: status, isLoading });
  return render(<OnboardingBanner />);
}

describe("OnboardingBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders member content with a personalized welcome", () => {
    arrange(makeUser());

    expect(screen.getByText(/Welcome, Adesegun/)).toBeInTheDocument();
    expect(screen.getByText("Fitness goals")).toBeInTheDocument();
    expect(screen.getByText("Subscription plan")).toBeInTheDocument();
    expect(screen.getByText("Complete setup →")).toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
  });

  it("falls back to the role title when the user has no first name", () => {
    arrange(makeUser({ first_name: undefined }));
    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
  });

  it.each([
    [UserRole.TRAINER, /Complete your trainer profile/i, "Certifications & credentials"],
    [UserRole.DIETITIAN, /Complete your dietitian profile/i, "License information"],
    [UserRole.GYM_OWNER, /Complete your gym setup/i, "Facilities & amenities"],
  ])("renders role-specific content for %s", (role, title, step) => {
    arrange(makeUser({ role, first_name: undefined }));
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(step)).toBeInTheDocument();
  });

  it("renders nothing when signed out", () => {
    const { container } = arrange(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once onboarding is complete", () => {
    const { container } = arrange(makeUser({ is_onboarding_complete: true }));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for roles without a setup track (e.g. ADMIN)", () => {
    const { container } = arrange(makeUser({ role: UserRole.ADMIN }));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing until the server status has loaded", () => {
    // Avoids flashing the banner to a user who dismissed it on another device.
    const { container } = arrange(makeUser(), null, true);
    expect(container).toBeEmptyDOMElement();
  });

  it("dismisses via the X button, calling the server and collapsing to a resume row", () => {
    arrange(makeUser());

    fireEvent.click(screen.getByLabelText("Dismiss setup banner"));

    expect(walkthroughDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Welcome, Adesegun/)).not.toBeInTheDocument();
    expect(screen.getByText("Setup guide hidden")).toBeInTheDocument();
    expect(screen.getByText("Resume setup")).toBeInTheDocument();
  });

  it("dismisses via the Later button", () => {
    arrange(makeUser());

    fireEvent.click(screen.getByText("Later"));

    expect(walkthroughDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Welcome, Adesegun/)).not.toBeInTheDocument();
  });

  it("shows only the resume row when the server reports it dismissed", () => {
    arrange(makeUser(), { is_dismissed: true });

    expect(screen.queryByText(/Welcome, Adesegun/)).not.toBeInTheDocument();
    expect(screen.getByText("Setup guide hidden")).toBeInTheDocument();
    expect(screen.getByText("Resume setup")).toBeInTheDocument();
  });

  it("reopens from the resume row, calling the server and restoring the banner", () => {
    arrange(makeUser(), { is_dismissed: true });

    fireEvent.click(screen.getByText("Resume setup"));

    expect(walkthroughReopen).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Welcome, Adesegun/)).toBeInTheDocument();
    expect(screen.getByText("Complete setup →")).toBeInTheDocument();
  });

  it("links Complete setup to the role's onboarding route", () => {
    arrange(makeUser({ role: UserRole.DIETITIAN, first_name: undefined }));
    const link = screen.getByText("Complete setup →").closest("a");
    expect(link).toHaveAttribute("href", "/onboarding/dietitian");
  });

  it.each([UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.DIETITIAN])(
    "points a provider (%s) at the plan catalogue",
    (role) => {
      arrange(makeUser({ role, first_name: undefined }));
      const link = screen.getByText("Choose your plan").closest("a");
      expect(link).toHaveAttribute("href", "/dashboard/billing");
    },
  );

  it("does not show a plan CTA to a fitness member", () => {
    // A member subscribes to a gym, not to Binectics — nothing to point at.
    arrange(makeUser({ role: UserRole.USER }));
    expect(screen.queryByText("Choose your plan")).not.toBeInTheDocument();
  });
});
