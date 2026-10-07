import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUsersPage from "@/app/admin/users/page";
import { UserDetailClient } from "@/app/admin/users/[userId]/UserDetailClient";
import { adminService, type AdminUserDetail, type AdminUserListItem } from "@/lib/api/admin";
import { toast } from "@/components/Toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/users",
}));
const auth = vi.hoisted(() => ({
  user: { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" } as Record<string, unknown> | null,
  isLoading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const tia: AdminUserListItem = {
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
  last_login: "2026-09-30T10:00:00.000Z",
  created_at: "2026-01-04T00:00:00.000Z",
};

const detail: AdminUserDetail = {
  ...tia,
  other_name: null,
  username: null,
  phone_number: "+2348000000000",
  country_code: "NG",
  city: "Lagos",
  email_verified_at: "2026-01-05T00:00:00.000Z",
  is_phone_number_verified: false,
  phone_number_verified_at: null,
  is_onboarding_complete: true,
  must_change_password: false,
  account_type_from_team: true,
  admin_permissions: [],
  suspension_reason: null,
  updated_at: null,
  listings: [
    {
      id: "lst1",
      headline: "Strength with Tia",
      slug: "tia",
      account_type: "personal_trainer",
      is_published: true,
      is_suspended: false,
      organization_id: null,
    },
  ],
  organizations: [{ id: "org1", name: "Tia Coaching", account_type: "personal_trainer", is_active: true }],
  team_memberships: [
    { organization_id: "gym1", organization_name: "Iron Gym", team_role: "Consultant / Trainer", status: "active", joined_at: null },
  ],
  counts: { bookings_as_client: 1, bookings_as_provider: 12, client_profiles_as_client: 0, client_profiles_as_provider: 7 },
};

describe("admin users search", () => {
  const list = vi.spyOn(adminService, "listUsers");
  const metrics = vi.spyOn(adminService, "getPlatformMetrics");

  beforeEach(() => {
    vi.clearAllMocks();
    metrics.mockResolvedValue({ success: false, message: "nope" });
    list.mockResolvedValue({ success: true, data: { items: [tia], total: 1, page: 1, limit: 25 } });
  });

  it("lists users with rows linking to the account view", async () => {
    render(<AdminUsersPage />);
    const name = (await screen.findByText("Tia Trainer"));
    expect(name.closest("a")).toHaveAttribute("href", "/admin/users/u-tia");
    expect(screen.getAllByText("Trainer").length).toBeGreaterThan(0);
    expect(list).toHaveBeenCalledWith({ q: undefined, role: undefined, page: 1, limit: 25 });
  });

  it("searches after typing stops, and filters by role", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);
    await screen.findAllByText("Tia Trainer");
    await user.type(screen.getByLabelText("Search users"), "tia@");
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ q: "tia@", role: undefined, page: 1, limit: 25 }));
    await user.click(screen.getByRole("button", { name: "Dietitians" }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ q: "tia@", role: "dietitian", page: 1, limit: 25 }));
  });

  it("says when nothing matches", async () => {
    list.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 25 } });
    render(<AdminUsersPage />);
    expect((await screen.findAllByText("No users match")).length).toBeGreaterThan(0);
  });
});

describe("admin user detail", () => {
  const get = vi.spyOn(adminService, "getUser");
  const suspend = vi.spyOn(adminService, "suspendUser");
  const unsuspend = vi.spyOn(adminService, "unsuspendUser");

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ success: true, data: detail });
  });

  it("shows the real account fields, related rows and counts", async () => {
    render(<UserDetailClient userId="u-tia" />);
    expect((await screen.findAllByRole("heading", { name: "Tia Trainer" })).length).toBeGreaterThan(0);
    expect(get).toHaveBeenCalledWith("u-tia");
    expect(screen.getAllByText("tia@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("from a gym team role").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Strength with Tia" })).toHaveAttribute("href", "/marketplace/lst1");
    expect(screen.getAllByText("Tia Coaching").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Iron Gym").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    // No role or admin editor on this page.
    expect(screen.queryByRole("button", { name: /admin|role/i })).toBeNull();
  });

  it("requires a reason to suspend, then suspends and reloads", async () => {
    const user = userEvent.setup();
    suspend.mockResolvedValue({
      success: true,
      data: {
        user: { _id: "u-tia", first_name: "Tia", last_name: "Trainer", email: "tia@example.com", is_suspended: true, suspension_reason: "Chargebacks" },
        cascaded: { listingsSuspended: 1, subscriptionsCancelled: 0, bookingsCancelled: 2 },
      },
    });
    render(<UserDetailClient userId="u-tia" />);
    await screen.findAllByRole("heading", { name: "Tia Trainer" });
    await user.click(screen.getByRole("button", { name: "Suspend" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Suspend account" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Reason"), "Chargebacks");
    get.mockResolvedValue({ success: true, data: { ...detail, is_suspended: true, suspension_reason: "Chargebacks" } });
    await user.click(confirm);
    await waitFor(() => expect(suspend).toHaveBeenCalledWith("u-tia", "Chargebacks"));
    expect(toast.success).toHaveBeenCalledWith("Account suspended");
    expect((await screen.findAllByText(/Reason: Chargebacks/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 bookings cancelled/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Unsuspend" }).length).toBeGreaterThan(0);
  });

  it("reinstates a suspended account", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({ success: true, data: { ...detail, is_suspended: true, suspension_reason: "Chargebacks" } });
    unsuspend.mockResolvedValue({
      success: true,
      data: { _id: "u-tia", first_name: "Tia", last_name: "Trainer", email: "tia@example.com", is_suspended: false, suspension_reason: null },
    });
    render(<UserDetailClient userId="u-tia" />);
    await user.click((await screen.findByRole("button", { name: "Unsuspend" })));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Reinstate" }));
    await waitFor(() => expect(unsuspend).toHaveBeenCalledWith("u-tia"));
  });

  it("says plainly when the user does not exist", async () => {
    get.mockResolvedValue({ success: false, status: 404, message: "User not found" });
    render(<UserDetailClient userId="nope" />);
    expect((await screen.findAllByText("No user has this id.")).length).toBeGreaterThan(0);
  });
});
