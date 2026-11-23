import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AcceptInvitationPage from "@/app/teams/invite/accept/page";

/**
 * Signed out on the team invitation page: both ways in come back to it.
 * The links used to say ?returnUrl=, which the sign-in page never reads, and
 * "Create Account" pointed at /register, which has no page (Q-V, Nov 2026).
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/teams/invite/accept",
  useSearchParams: () => new URLSearchParams("token=abc"),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isLoading: false, refreshUser: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({ useOptionalOrganization: () => null }));

describe("team invitation page, signed out", () => {
  it("sends Create Account to the sign-up form with the way back", async () => {
    render(<AcceptInvitationPage />);
    const back = encodeURIComponent("/teams/invite/accept?token=abc");
    expect(await screen.findByRole("link", { name: "Create Account" })).toHaveAttribute(
      "href",
      `/login?mode=signup&redirect=${back}`,
    );
  });
});
