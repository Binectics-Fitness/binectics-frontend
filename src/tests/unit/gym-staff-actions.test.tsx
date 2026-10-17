import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { GymReviewsClient } from "@/app/dashboard/gym-owner/reviews/GymReviewsClient";
import GymLocationsPage from "@/app/dashboard/gym-owner/facility/page";

/**
 * F1: a gym's staff see the page their role covers, but not an action on it
 * the API would refuse them. Replying to a review is manage_reviews (a
 * Manager doesn't hold it); adding a location is manage_organization.
 */
let mockOrg: Record<string, unknown> = {};
const mockUser = { id: "u1" };

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      <div data-testid="actions">{actions}</div>
      {children}
    </div>
  ),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: mockOrg, isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: mockOrg, isLoading: false }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/queries/marketplace", () => ({ useOrgListing: () => ({ data: { _id: "listing" } }) }));
vi.mock("@/lib/queries/reviews", () => ({
  useTargetAggregate: () => ({ data: { averageRating: 4, totalReviews: 1, ratingBreakdown: { "5": 0 } } }),
  useTargetReviews: () => ({
    data: {
      reviews: [
        { _id: "r1", rating: 4, comment: "Good gym", createdAt: "2026-10-01T00:00:00Z", reviewer: { first_name: "Ade" } },
      ],
      pagination: { page: 1, totalPages: 1 },
    },
    isLoading: false,
  }),
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    getMyListings: async () => ({ success: true, data: [] }),
    getMyListingFacilityItems: async () => ({ success: true, data: [] }),
  },
}));
vi.mock("@/app/dashboard/gym-owner/facility/_actions", () => ({
  AddLocationButton: () => <button type="button">+ Add location</button>,
}));

const staff = (permissions: string[]) => ({
  _id: "gym",
  name: "Iron Temple",
  owner_id: "boss",
  is_owner: false,
  my_role_code: "manager",
  my_permissions: permissions,
});

beforeEach(() => {
  mockOrg = { _id: "gym", name: "Iron Temple", owner_id: "u1", is_owner: true };
});

describe("replying to a review", () => {
  it("is offered to the owner", () => {
    render(<GymReviewsClient />);
    expect(screen.getByRole("button", { name: "Respond" })).toBeInTheDocument();
  });

  it("is not offered to a Manager, who may read the reviews but not answer them", () => {
    mockOrg = staff(["marketplace:manage_listing", "team:view_members"]);
    render(<GymReviewsClient />);
    expect(screen.getByText("Good gym")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Respond" })).toBeNull();
  });

  it("is offered to a role that holds manage_reviews", () => {
    mockOrg = staff(["marketplace:manage_listing", "marketplace:manage_reviews"]);
    render(<GymReviewsClient />);
    expect(screen.getByRole("button", { name: "Respond" })).toBeInTheDocument();
  });
});

describe("adding a location", () => {
  it("is offered to the owner and to a role that manages the organization", () => {
    for (const org of [mockOrg, staff(["marketplace:manage_listing", "team:manage_organization"])]) {
      mockOrg = org;
      const { unmount } = render(<GymLocationsPage />);
      expect(screen.getByRole("button", { name: "+ Add location" })).toBeInTheDocument();
      unmount();
    }
  });

  it("is not offered to a Manager", () => {
    mockOrg = staff(["marketplace:manage_listing", "team:view_members"]);
    render(<GymLocationsPage />);
    expect(screen.queryByRole("button", { name: "+ Add location" })).toBeNull();
  });
});
