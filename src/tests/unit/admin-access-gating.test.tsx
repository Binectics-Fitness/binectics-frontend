import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AdminDashboardShell, SIDEBAR, filterSidebar } from "@/components/ds/AdminDashboardShell";
import { ListingDetailClient } from "@/app/admin/listings/[listingId]/ListingDetailClient";
import { UserDetailClient } from "@/app/admin/users/[userId]/UserDetailClient";
import AdminOverviewClient from "@/app/admin/dashboard/AdminOverviewClient";
import { AdminRefundsClient } from "@/app/admin/refunds/AdminRefundsClient";
import { adminAccessStub } from "@/test/adminAccess";
import { AdminPermission as P, type AdminPermission } from "@/lib/admin/permissions";
import type { AdminAccessState } from "@/hooks/useAdminAccess";
import type { AdminListingDetail, AdminUserDetail } from "@/lib/api/admin";
import { MarketplaceVerificationBadge } from "@/lib/types";

/**
 * Admin custom roles, web-1: the nav, the pages and their actions follow
 * GET /admin/me/access. Hidden, not disabled (ADMIN-ROLES-PLAN §7); the API
 * still refuses everything on its own.
 */

const state = vi.hoisted(() => ({ access: null as AdminAccessState | null }));
const api = vi.hoisted(() => ({
  getListing: vi.fn(),
  getUser: vi.fn(),
  getPlatformMetrics: vi.fn(),
  getFeedbackSummary: vi.fn(),
  adminRefunds: vi.fn(),
}));

vi.mock("@/hooks/useAdminAccess", () => ({
  useAdminAccess: () => state.access,
  adminAccessQueryKey: ["admin", "me", "access"],
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/refunds",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useAdminGuard: () => ({ isAuthorized: true, isLoading: false }),
  isPlatformAdmin: () => true,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "a-1", role: "ADMIN", is_admin: true, first_name: "Ada" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/admin", () => ({
  adminService: {
    getListing: api.getListing,
    getUser: api.getUser,
    getPlatformMetrics: api.getPlatformMetrics,
    getFeedbackSummary: api.getFeedbackSummary,
  },
}));
vi.mock("@/lib/api/marketplace", () => ({ marketplaceService: {} }));
vi.mock("@/lib/api/refunds", () => ({ refundsService: { adminRefunds: api.adminRefunds } }));

function as(held: AdminPermission[] | "all") {
  state.access = adminAccessStub(held);
}

const names = (sections: ReturnType<typeof filterSidebar>) =>
  Object.fromEntries(sections.map((s) => [s.label, s.items.map((i) => i.name)]));

function sidebar() {
  return screen.getByRole("complementary", { name: "Sidebar navigation" });
}

beforeEach(() => {
  vi.clearAllMocks();
  as("all");
});

describe("admin nav by permission", () => {
  it("a Super admin sees every item", () => {
    expect(filterSidebar(SIDEBAR, adminAccessStub("all").allows)).toEqual(SIDEBAR);
  });

  it("keeps only the items whose permission the admin holds", () => {
    const { allows } = adminAccessStub([P.CONTENT_READ, P.USERS_READ]);
    expect(names(filterSidebar(SIDEBAR, allows))).toEqual({
      Moderate: ["Overview", "Listings", "Reviews"],
      Platform: ["Users"],
      Operate: ["Forms"],
    });
  });

  it("drops a group left with no items", () => {
    const { allows } = adminAccessStub([P.REFUNDS_READ]);
    const sections = filterSidebar(SIDEBAR, allows);
    expect(sections.map((s) => s.label)).toEqual(["Moderate", "Operate"]);
    expect(names(sections).Moderate).toEqual(["Overview", "Refunds", "Disputes"]);
  });

  it("shows Currencies to a billing admin too (the API accepts either read)", () => {
    expect(names(filterSidebar(SIDEBAR, adminAccessStub([P.BILLING_READ]).allows)).Platform).toEqual([
      "Payments",
      "Currencies",
      "Plans",
    ]);
    expect(names(filterSidebar(SIDEBAR, adminAccessStub([P.PLATFORM_READ]).allows)).Platform).toEqual([
      "Currencies",
    ]);
  });

  it("every gated item names a real permission", () => {
    const known = new Set<string>(Object.values(P));
    for (const item of SIDEBAR.flatMap((s) => s.items)) {
      const gate = item.permission;
      if (gate === undefined) continue;
      for (const p of typeof gate === "string" ? [gate] : gate) expect(known.has(p)).toBe(true);
    }
  });

  it("the rendered sidebar leaves out what the admin can't open", () => {
    as([P.CONTENT_READ]);
    render(
      <AdminDashboardShell activeItem="Listings" crumb="Listings">
        <p>page</p>
      </AdminDashboardShell>,
    );
    const nav = sidebar();
    expect(within(nav).getByRole("link", { name: "Listings" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Refunds" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("navigation", { name: "Platform" })).not.toBeInTheDocument();
  });
});

describe("a page opened without its permission", () => {
  it("says so and names the missing permission, without the page or its actions", () => {
    as([P.CONTENT_READ]);
    render(
      <AdminDashboardShell activeItem="Refunds" crumb="Refunds" actions={<button type="button">Approve</button>}>
        <p>refund queue</p>
      </AdminDashboardShell>,
    );
    expect(screen.getByRole("heading", { name: "You don't have access to this page" })).toBeInTheDocument();
    expect(screen.getByText(/“View refunds and disputes”/)).toBeInTheDocument();
    expect(screen.queryByText("refund queue")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("names every permission of an any-of gate", () => {
    as([]);
    render(
      <AdminDashboardShell activeItem="Currencies" crumb="Currencies">
        <p>currencies</p>
      </AdminDashboardShell>,
    );
    expect(screen.getByText(/one of “View platform settings” or “View billing”/)).toBeInTheDocument();
  });

  it("an explicit page gate wins over the nav item's", () => {
    as([P.CONTENT_READ]);
    render(
      <AdminDashboardShell activeItem="Listings" crumb="Verification" permission={P.VERIFICATION_READ}>
        <p>verification queue</p>
      </AdminDashboardShell>,
    );
    expect(screen.getByText(/“View verification documents”/)).toBeInTheDocument();
    expect(screen.queryByText("verification queue")).not.toBeInTheDocument();
  });

  it("waits for the access answer instead of flashing either state", () => {
    state.access = { ...adminAccessStub([]), ready: false };
    render(
      <AdminDashboardShell activeItem="Refunds" crumb="Refunds">
        <p>refund queue</p>
      </AdminDashboardShell>,
    );
    expect(screen.queryByText("refund queue")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /don't have access/ })).not.toBeInTheDocument();
  });

  it("renders the page normally with the permission, and ungated pages for any admin", () => {
    as([P.REFUNDS_READ]);
    const { unmount } = render(
      <AdminDashboardShell activeItem="Refunds" crumb="Refunds">
        <p>refund queue</p>
      </AdminDashboardShell>,
    );
    expect(screen.getByText("refund queue")).toBeInTheDocument();
    unmount();
    as([]);
    render(
      <AdminDashboardShell activeItem="Overview" crumb="Overview">
        <p>overview</p>
      </AdminDashboardShell>,
    );
    expect(screen.getByText("overview")).toBeInTheDocument();
  });
});

function listing(): AdminListingDetail {
  return {
    _id: "lst1",
    professional_id: { _id: "u1", first_name: "Kemi", last_name: "Coach", email: "kemi@example.com" },
    organization_id: null,
    account_type: "personal_trainer",
    headline: "Strength",
    bio: "",
    specialties: [],
    certifications: [],
    languages: [],
    facilities: [],
    amenities: [],
    photos: [],
    city: "Lagos",
    country_code: "NG",
    currency: "NGN",
    price_from_minor: 1_500_000,
    accepting_clients: true,
    is_published: true,
    verification_badge: MarketplaceVerificationBadge.NONE,
    is_suspended: false,
    active_client_count: 0,
    average_rating: 0,
    review_count: 0,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-05T00:00:00Z",
    documents: [
      {
        _id: "d1",
        file_name: "nasm-cert.pdf",
        file_url: "https://cdn.example/nasm.pdf",
        mime_type: "application/pdf",
        file_size: 2048,
        created_at: "2026-09-02T00:00:00Z",
      },
    ],
  } as AdminListingDetail;
}

describe("gated actions are hidden, not disabled", () => {
  it("listing detail: a content reader sees the listing but no badge or suspend actions, and no documents", async () => {
    as([P.CONTENT_READ]);
    // Without verification:read the API sends documents as null.
    api.getListing.mockResolvedValue({ success: true, data: { ...listing(), documents: null } });
    render(<ListingDetailClient listingId="lst1" />);
    expect(await screen.findByRole("heading", { name: /Kemi Coach/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Award badge" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Documents \(/)).not.toBeInTheDocument();
  });

  it("listing detail: a moderator with verification:read gets the actions and the documents", async () => {
    as([P.CONTENT_READ, P.CONTENT_WRITE, P.VERIFICATION_READ]);
    api.getListing.mockResolvedValue({ success: true, data: listing() });
    render(<ListingDetailClient listingId="lst1" />);
    expect(await screen.findByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Award badge" })).toBeInTheDocument();
    expect(screen.getByText("Documents (1)")).toBeInTheDocument();
  });

  it("user detail: suspend shows only with users:write", async () => {
    const user = {
      id: "u-tia",
      first_name: "Tia",
      last_name: "Trainer",
      email: "tia@example.com",
      profile_picture: null,
      role: { code: "personal_trainer", name: "Trainer" },
      is_admin: false,
      is_suspended: false,
      is_email_verified: true,
      is_placeholder: false,
      last_login: null,
      created_at: "2026-01-04T00:00:00.000Z",
      other_name: null,
      username: null,
      phone_number: null,
      country_code: "NG",
      city: "Lagos",
      email_verified_at: null,
      is_phone_number_verified: false,
      phone_number_verified_at: null,
      is_onboarding_complete: true,
      must_change_password: false,
      account_type_from_team: false,
      admin_permissions: [],
      suspension_reason: null,
      updated_at: null,
      listings: [],
      organizations: [],
      team_memberships: [],
      counts: { bookings_as_client: 0, bookings_as_provider: 0, client_profiles_as_client: 0, client_profiles_as_provider: 0 },
    } as unknown as AdminUserDetail;
    api.getUser.mockResolvedValue({ success: true, data: user });

    as([P.USERS_READ]);
    const { unmount } = render(<UserDetailClient userId="u-tia" />);
    expect(await screen.findAllByText(/Tia Trainer/)).not.toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    unmount();

    as([P.USERS_READ, P.USERS_WRITE]);
    render(<UserDetailClient userId="u-tia" />);
    expect(await screen.findByRole("button", { name: "Suspend" })).toBeInTheDocument();
  });

  it("refund queue: approve and decline need refunds:write", async () => {
    const refund = {
      id: "rf1",
      status: "requested",
      origin: "provider_request",
      amount_minor: 500_000,
      currency: "NGN",
      charge_transaction_id: "tx1",
      reason: "Double charge",
      created_at: "2026-11-01T00:00:00Z",
      payment_rail: "platform",
      member: { first_name: "Ada", last_name: "Obi" },
    };
    api.adminRefunds.mockResolvedValue({ success: true, data: { items: [refund] } });

    as([P.REFUNDS_READ]);
    const { unmount } = render(<AdminRefundsClient />);
    expect(await screen.findByText(/to Ada Obi/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
    unmount();

    as([P.REFUNDS_READ, P.REFUNDS_WRITE]);
    render(<AdminRefundsClient />);
    expect(await screen.findByRole("button", { name: /Approve/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
  });

  it("overview: without analytics:read the KPI and feedback cards are left out and never fetched", async () => {
    as([P.CONTENT_READ]);
    render(<AdminOverviewClient />);
    expect(await screen.findByText(/need the “View analytics” permission/)).toBeInTheDocument();
    expect(api.getPlatformMetrics).not.toHaveBeenCalled();
    expect(api.getFeedbackSummary).not.toHaveBeenCalled();
  });
});
