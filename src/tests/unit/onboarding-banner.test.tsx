import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import OnboardingBanner from "@/components/OnboardingBanner";
import { UserRole } from "@/lib/types";

// Mock next/link
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

describe("OnboardingBanner", () => {
  it("renders USER role banner with correct content", () => {
    render(<OnboardingBanner userRole={UserRole.USER} userName="Adesegun" />);

    expect(screen.getByText(/Welcome, Adesegun!/)).toBeInTheDocument();
    expect(screen.getByText(/Complete your profile/)).toBeInTheDocument();
    expect(screen.getByText("Fitness goals")).toBeInTheDocument();
    expect(screen.getByText("Preferences & interests")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Subscription plan")).toBeInTheDocument();
    expect(screen.getByText("Complete Setup")).toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
  });

  it("renders role-specific content for TRAINER", () => {
    render(<OnboardingBanner userRole={UserRole.TRAINER} userName="Jake" />);

    expect(
      screen.getByText(/Complete your trainer profile/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Certifications & credentials"),
    ).toBeInTheDocument();
  });

  it("renders role-specific content for DIETITIAN", () => {
    render(<OnboardingBanner userRole={UserRole.DIETITIAN} userName="Priya" />);

    expect(
      screen.getByText(/Complete your dietitian profile/),
    ).toBeInTheDocument();
    expect(screen.getByText("Professional credentials")).toBeInTheDocument();
  });

  it("renders role-specific content for GYM_OWNER", () => {
    render(<OnboardingBanner userRole={UserRole.GYM_OWNER} userName="David" />);

    expect(screen.getByText(/Complete your gym setup/)).toBeInTheDocument();
    expect(screen.getByText("Gym details & location")).toBeInTheDocument();
  });

  it("dismisses when X button is clicked", () => {
    const { container } = render(
      <OnboardingBanner userRole={UserRole.USER} userName="Test" />,
    );

    const dismissBtn = screen.getByLabelText("Dismiss");
    fireEvent.click(dismissBtn);

    // Banner should be gone
    expect(container.firstChild).toBeNull();
  });

  it("dismisses when Later button is clicked", () => {
    const { container } = render(
      <OnboardingBanner userRole={UserRole.USER} userName="Test" />,
    );

    const laterBtn = screen.getByText("Later");
    fireEvent.click(laterBtn);

    expect(container.firstChild).toBeNull();
  });

  it("does not render for ADMIN role", () => {
    const { container } = render(
      <OnboardingBanner userRole={"ADMIN" as UserRole} userName="Admin" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("has mobile-responsive layout classes", () => {
    const { container } = render(
      <OnboardingBanner userRole={UserRole.USER} userName="Test" />,
    );

    // Outer wrapper should have responsive padding
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain("p-4");
    expect(banner.className).toContain("sm:p-6");

    // Layout flex should stack on mobile
    const flexContainer = banner.querySelector(".flex.flex-col");
    expect(flexContainer).not.toBeNull();
  });

  it("buttons have whitespace-nowrap to prevent wrapping", () => {
    render(<OnboardingBanner userRole={UserRole.USER} userName="Test" />);

    const setupLink = screen.getByText("Complete Setup");
    expect(setupLink.className).toContain("whitespace-nowrap");

    const laterBtn = screen.getByText("Later");
    expect(laterBtn.className).toContain("whitespace-nowrap");
  });

  it("Complete Setup links to profile settings", () => {
    render(<OnboardingBanner userRole={UserRole.USER} userName="Test" />);

    const link = screen.getByText("Complete Setup").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/settings/profile");
  });
});
