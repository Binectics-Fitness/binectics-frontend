import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import GymLocationsPage from "@/app/dashboard/gym-owner/facility/page";

/**
 * The cards on this page are marketplace listings. "Manage location" sent the
 * listing's _id to /locations/[locationId], which looks the id up among the
 * organization's locations and showed "Location not found." A listing holds
 * no location id (only organization_id), so the link goes to the locations
 * list, where each location opens with its own id.
 */
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/hooks/useGymViewer", () => ({ useGymViewer: () => ({ isOwner: true, permissions: new Set() }) }));
vi.mock("@/app/dashboard/gym-owner/facility/_actions", () => ({
  AddLocationButton: () => <button type="button">+ Add location</button>,
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    getMyListings: async () => ({
      success: true,
      data: [
        {
          _id: "listing-123",
          headline: "Iron Temple Lekki",
          account_type: "GYM_OWNER",
          amenities: [],
          city: "Lagos",
          country_code: "NG",
        },
      ],
    }),
    getMyListingFacilityItems: async () => ({ success: true, data: [] }),
  },
}));

describe("gym Locations card link", () => {
  it("opens the locations list, never /locations/<listing id>", async () => {
    render(<GymLocationsPage />);
    expect(await screen.findByText("Iron Temple Lekki")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Manage locations" });
    expect(link).toHaveAttribute("href", "/dashboard/gym-owner/locations");
    for (const a of screen.queryAllByRole("link")) {
      expect(a.getAttribute("href") ?? "").not.toContain("listing-123");
    }
  });
});
