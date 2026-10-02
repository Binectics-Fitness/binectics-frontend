import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingDetailClient } from "@/app/admin/listings/[listingId]/ListingDetailClient";
import AdminListingsPage from "@/app/admin/listings/page";
import type { AdminListingDetail } from "@/lib/api/admin";
import { MarketplaceVerificationBadge } from "@/lib/types";

/**
 * The admin listing detail shows the real listing from GET /admin/listings/:id
 * (any account type), offers only actions that have endpoints (suspend,
 * unsuspend, award, revoke) and lists the documents. No approve/reject:
 * there is no approval workflow.
 */

const api = vi.hoisted(() => ({
  getListing: vi.fn(),
  listListings: vi.fn(),
  suspendGym: vi.fn(),
  unsuspendGym: vi.fn(),
  awardGymBadge: vi.fn(),
  revokeGymBadge: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/components/ds/AdminDashboardShell", () => ({
  AdminDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      <div data-testid="actions">{actions}</div>
      {children}
    </div>
  ),
}));
vi.mock("@/lib/api/admin", () => ({
  adminService: { getListing: api.getListing, listListings: api.listListings },
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    suspendGym: api.suspendGym,
    unsuspendGym: api.unsuspendGym,
    awardGymBadge: api.awardGymBadge,
    revokeGymBadge: api.revokeGymBadge,
  },
}));
vi.mock("@/components/Toast", () => ({
  toast: { success: api.toastSuccess, error: api.toastError },
}));

function listing(over: Partial<AdminListingDetail> = {}): AdminListingDetail {
  return {
    _id: "lst1",
    professional_id: {
      _id: "u1",
      first_name: "Kemi",
      last_name: "Coach",
      email: "kemi@example.com",
      is_suspended: false,
    },
    organization_id: null,
    account_type: "personal_trainer",
    headline: "Strength for busy people",
    bio: "Ten years coaching.",
    specialties: ["Strength"],
    certifications: [],
    languages: ["English", "Yoruba"],
    facilities: [],
    amenities: [],
    photos: [],
    city: "Lagos",
    country_code: "NG",
    currency: "NGN",
    price_from_minor: 1_500_000,
    accepting_clients: true,
    is_published: true,
    published_at: "2026-09-05T00:00:00Z",
    verification_badge: MarketplaceVerificationBadge.NONE,
    is_suspended: false,
    active_client_count: 3,
    average_rating: 4.5,
    review_count: 2,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-05T00:00:00Z",
    documents: [
      {
        _id: "d1",
        file_name: "nasm-cert.pdf",
        file_url: "https://cdn.example/nasm.pdf",
        mime_type: "application/pdf",
        file_size: 204_800,
        created_at: "2026-09-02T00:00:00Z",
      },
    ],
    ...over,
  };
}

describe("admin listing detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getListing.mockResolvedValue({ success: true, data: listing() });
  });

  it("renders the real listing, owner and documents, with no approve or reject", async () => {
    render(<ListingDetailClient listingId="lst1" />);

    expect(await screen.findByRole("heading", { name: "Kemi Coach · Trainer" })).toBeTruthy();
    expect(api.getListing).toHaveBeenCalledWith("lst1");
    expect(screen.getByText("Strength for busy people")).toBeTruthy();
    expect(screen.getByText("kemi@example.com")).toBeTruthy();
    expect(screen.getByText("₦15,000")).toBeTruthy();
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
    expect(screen.getByText(/^Yes · /)).toBeTruthy();
    expect(screen.getByText("nasm-cert.pdf")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View" }).getAttribute("href")).toBe(
      "https://cdn.example/nasm.pdf",
    );
    expect(screen.queryByText(/Aisha/)).toBeNull();
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();
  });

  it("shows an error when the listing can't be loaded", async () => {
    api.getListing.mockResolvedValue({ success: false, message: "Listing not found" });
    render(<ListingDetailClient listingId="missing" />);
    expect(await screen.findByText("Listing not found")).toBeTruthy();
  });

  it("suspends with a reason and reloads", async () => {
    const user = userEvent.setup();
    api.suspendGym.mockResolvedValue({ success: true });
    render(<ListingDetailClient listingId="lst1" />);
    const actions = await screen.findByTestId("actions");
    await user.click(await within(actions).findByRole("button", { name: "Suspend" }));
    await user.type(screen.getByLabelText(/reason/i), "Fake certificate");

    api.getListing.mockResolvedValue({
      success: true,
      data: listing({ is_suspended: true, suspension_reason: "Fake certificate" }),
    });
    await user.click(screen.getByRole("button", { name: "Confirm suspend" }));

    expect(api.suspendGym).toHaveBeenCalledWith("lst1", { reason: "Fake certificate" });
    expect(api.toastSuccess).toHaveBeenCalledWith("Listing suspended");
    expect(await within(actions).findByRole("button", { name: "Unsuspend" })).toBeTruthy();
    expect(screen.getByText("Yes · Fake certificate")).toBeTruthy();
  });

  it("does not report success when the API refuses", async () => {
    const user = userEvent.setup();
    api.unsuspendGym.mockResolvedValue({ success: false, message: "Forbidden" });
    api.getListing.mockResolvedValue({ success: true, data: listing({ is_suspended: true }) });
    render(<ListingDetailClient listingId="lst1" />);
    const actions = await screen.findByTestId("actions");
    await user.click(await within(actions).findByRole("button", { name: "Unsuspend" }));
    await user.click(screen.getByRole("button", { name: "Confirm unsuspend" }));

    expect(api.toastError).toHaveBeenCalledWith("Forbidden");
    expect(api.toastSuccess).not.toHaveBeenCalled();
  });

  it("awards the chosen badge, and revokes one that is set", async () => {
    const user = userEvent.setup();
    api.awardGymBadge.mockResolvedValue({ success: true });
    render(<ListingDetailClient listingId="lst1" />);
    const actions = await screen.findByTestId("actions");
    expect(within(actions).queryByRole("button", { name: "Revoke badge" })).toBeNull();
    await user.click(await within(actions).findByRole("button", { name: "Award badge" }));
    await user.click(screen.getByRole("button", { name: "Featured" }));
    await user.click(screen.getByRole("button", { name: "Award featured" }));
    expect(api.awardGymBadge).toHaveBeenCalledWith("lst1", {
      verification_badge: MarketplaceVerificationBadge.FEATURED,
    });

    api.revokeGymBadge.mockResolvedValue({ success: true });
    api.getListing.mockResolvedValue({
      success: true,
      data: listing({ verification_badge: MarketplaceVerificationBadge.VERIFIED }),
    });
    render(<ListingDetailClient listingId="lst1" />);
    const all = await screen.findAllByRole("button", { name: "Revoke badge" });
    await user.click(all[all.length - 1]);
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    expect(api.revokeGymBadge).toHaveBeenCalledWith("lst1");
  });

  it("the listings table reads every listing type and links rows to the detail page", async () => {
    api.listListings.mockResolvedValue({
      success: true,
      data: [
        listing({ _id: "gym1", account_type: "gym_owner", organization_id: { _id: "o1", name: "Iron Gym" } }),
        listing({ _id: "diet1", account_type: "dietitian" }),
      ],
    });
    render(<AdminListingsPage />);

    const gym = await screen.findByRole("link", { name: "Iron Gym" });
    expect(gym.getAttribute("href")).toBe("/admin/listings/gym1");
    expect(screen.getByRole("link", { name: "Kemi Coach" }).getAttribute("href")).toBe(
      "/admin/listings/diet1",
    );
    expect(screen.getByText("Dietitian")).toBeTruthy();
  });
});
