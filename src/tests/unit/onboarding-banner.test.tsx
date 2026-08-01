import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnboardingBanner from "@/components/OnboardingBanner";
import { UserRole, type User } from "@/lib/types";

// The banner is auth-driven and self-gating: it reads the signed-in user
// from useAuth() (no props) and renders only while onboarding is
// incomplete; dismissal persists per user id in localStorage. These tests
// exercise that contract — the old prop-driven API (userRole/userName)
// no longer exists.

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

function makeUser(overrides: Partial<User> = {}): Partial<User> {
  return {
    id: "user-1",
    first_name: "Adesegun",
    role: UserRole.USER,
    is_onboarding_complete: false,
    ...overrides,
  };
}

function renderWithUser(user: Partial<User> | null) {
  mockUseAuth.mockReturnValue({ user });
  return render(<OnboardingBanner />);
}

describe("OnboardingBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders member content with a personalized welcome", () => {
    renderWithUser(makeUser());

    expect(screen.getByText(/Welcome, Adesegun/)).toBeInTheDocument();
    expect(screen.getByText("Fitness goals")).toBeInTheDocument();
    expect(screen.getByText("Preferences & interests")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Subscription plan")).toBeInTheDocument();
    expect(screen.getByText("Complete setup →")).toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
  });

  it("falls back to the role title when the user has no first name", () => {
    renderWithUser(makeUser({ first_name: undefined }));
    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
  });

  it.each([
    [UserRole.TRAINER, /Complete your trainer profile/i, "Certifications & credentials"],
    [UserRole.DIETITIAN, /Complete your dietitian profile/i, "License information"],
    [UserRole.GYM_OWNER, /Complete your gym setup/i, "Facilities & amenities"],
  ])("renders role-specific content for %s", (role, title, step) => {
    renderWithUser(makeUser({ role, first_name: undefined }));
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(step)).toBeInTheDocument();
  });

  it("renders nothing when signed out", () => {
    const { container } = renderWithUser(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once onboarding is complete", () => {
    const { container } = renderWithUser(
      makeUser({ is_onboarding_complete: true }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for roles without a setup track (e.g. ADMIN)", () => {
    const { container } = renderWithUser(
      makeUser({ role: UserRole.ADMIN }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("dismisses via the X button and persists per user id", () => {
    renderWithUser(makeUser());

    fireEvent.click(screen.getByLabelText("Dismiss setup banner"));

    expect(screen.queryByText(/Welcome, Adesegun/)).not.toBeInTheDocument();
    expect(localStorage.getItem("setup-banner-dismissed:user-1")).toBe("1");
  });

  it("dismisses via the Later button", () => {
    renderWithUser(makeUser());

    fireEvent.click(screen.getByText("Later"));

    expect(screen.queryByText(/Welcome, Adesegun/)).not.toBeInTheDocument();
    expect(localStorage.getItem("setup-banner-dismissed:user-1")).toBe("1");
  });

  it("stays hidden on later renders once dismissed (stored flag)", () => {
    localStorage.setItem("setup-banner-dismissed:user-1", "1");
    const { container } = renderWithUser(makeUser());
    expect(container).toBeEmptyDOMElement();
  });

  it("a dismissal by one user does not hide the banner for another", () => {
    localStorage.setItem("setup-banner-dismissed:someone-else", "1");
    renderWithUser(makeUser());
    expect(screen.getByText(/Welcome, Adesegun/)).toBeInTheDocument();
  });

  it("links Complete setup to the role's onboarding route", () => {
    renderWithUser(makeUser({ role: UserRole.DIETITIAN, first_name: undefined }));
    const link = screen.getByText("Complete setup →").closest("a");
    expect(link).toHaveAttribute("href", "/onboarding/dietitian");
  });
});
