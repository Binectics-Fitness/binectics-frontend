import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GymDashboardShell, SIDEBAR } from "@/components/ds/GymDashboardShell";
import {
  GYM_NAV_ACCESS,
  GYM_PAGE_ACCESS,
  TeamPermission as P,
  gymLandingHref,
  gymPageRule,
  gymSidebarFor,
  gymViewer,
} from "@/lib/gymStaffNav";
import { resetShellNav, useShellNav } from "@/hooks/useShellNav";
import { isAppRoute } from "./appRoutes";

/**
 * F1: a gym's managers, assistants and admins work in the gym dashboard,
 * seeing exactly what their role's permissions let them use. The role
 * permission lists mirror the API's seeded defaults (TeamsService
 * seedDefaultRoles).
 */
const ALL = Object.values(P);
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ALL,
  manager: [
    P.VIEW_MEMBERS, P.VIEW_INVITATIONS, P.INVITE_MEMBER, P.REMOVE_MEMBER, P.UPDATE_MEMBER_ROLE,
    P.DEACTIVATE_MEMBER, P.CANCEL_INVITATION, P.PROGRESS_VIEW, P.PROGRESS_CREATE, P.PROGRESS_EDIT,
    P.PROGRESS_MANAGE_CLIENTS, P.PROGRESS_INVITE_CLIENT, P.MARKETPLACE_MANAGE_LISTING,
    P.MARKETPLACE_VIEW_REQUESTS, P.MARKETPLACE_RESPOND_REQUESTS, P.BOOKINGS_MANAGE, P.MESSAGING_ANSWER_MEMBERS,
  ],
  assistant: [P.VIEW_MEMBERS, P.PROGRESS_VIEW, P.MARKETPLACE_VIEW_REQUESTS],
  front_desk: [P.VIEW_MEMBERS, P.MESSAGING_ANSWER_MEMBERS],
};

/** Exactly what each role sees, in nav order. */
const EXPECTED: Record<string, string[]> = {
  owner: SIDEBAR.flatMap((s) => s.items.map((i) => i.name)),
  admin: [
    "Overview", "Members", "Schedule", "Requests", "Check‑ins", "Check-in kiosk", "Revenue", "Plans & pricing",
    "My listing", "Loyalty", "Team & roles", "Assignment rules", "Locations", "Staff", "Messages", "Settings",
  ],
  manager: [
    "Overview", "Members", "Schedule", "Requests", "Check‑ins", "Check-in kiosk", "Revenue", "Plans & pricing",
    "My listing", "Team & roles", "Assignment rules", "Locations", "Staff", "Messages",
  ],
  assistant: ["Schedule", "Requests", "Team & roles", "Locations", "Staff"],
  front_desk: ["Schedule", "Team & roles", "Locations", "Staff", "Messages"],
};
const OWNER_ONLY = ["Payouts", "Refunds", "Billing", "Forms"];

const staffOrg = (role: string) => ({
  _id: "gym",
  name: "Iron Temple",
  owner_id: "boss",
  account_type: "gym_owner",
  is_active: true,
  is_owner: false,
  my_role_code: role,
  my_permissions: ROLE_PERMISSIONS[role],
});
const ownerOrg = { ...staffOrg("owner"), owner_id: "u1", is_owner: true, my_permissions: ALL };
const names = (sections: { items: { name: string }[] }[]) => sections.flatMap((s) => s.items.map((i) => i.name));

describe("the gym nav for each role", () => {
  it.each(Object.keys(EXPECTED))("%s sees exactly the permitted items", (role) => {
    const org = role === "owner" ? ownerOrg : staffOrg(role);
    expect(names(gymSidebarFor(SIDEBAR, gymViewer(org, "u1")))).toEqual(EXPECTED[role]);
  });

  it("never shows a non-owner the owner's money and personal pages, even with every permission", () => {
    const admin = names(gymSidebarFor(SIDEBAR, gymViewer(staffOrg("admin"), "u1")));
    for (const item of OWNER_ONLY) expect(admin).not.toContain(item);
  });

  it("shows nothing to someone whose role holds nothing", () => {
    expect(gymSidebarFor(SIDEBAR, gymViewer({ ...staffOrg("odd"), my_permissions: [] }, "u1"))).toEqual([]);
  });

  it("has a rule for every sidebar item and no rule for an item that isn't there", () => {
    const items = names(SIDEBAR).sort();
    expect(Object.keys(GYM_NAV_ACCESS).sort()).toEqual(items);
  });

  it("asks for everything a page loads: Settings reads the gym (view_members) and its currencies (manage_listing)", () => {
    expect(gymPageRule("/dashboard/gym-owner/settings")).toEqual({
      all: [P.MANAGE_ORGANIZATION, P.VIEW_MEMBERS, P.MARKETPLACE_MANAGE_LISTING],
    });
    expect(gymPageRule("/dashboard/gym-owner/tax")).toEqual({ all: [P.MARKETPLACE_MANAGE_LISTING, P.VIEW_MEMBERS] });
  });

  it("maps only real pages", () => {
    for (const [path] of GYM_PAGE_ACCESS) expect(isAppRoute(path)).toBe(true);
  });

  it("goes by the deepest page: the activity log needs the audit permission, the root only matches itself", () => {
    expect(gymPageRule("/dashboard/gym-owner/settings/activity")).toEqual({ all: [P.VIEW_AUDIT_LOG] });
    expect(gymPageRule("/dashboard/gym-owner/card-renewals")).toEqual({ owner: true });
    expect(gymPageRule("/dashboard/gym-owner/something-new")).toBeUndefined();
    expect(gymPageRule("/dashboard/gym-owner/")).toEqual(GYM_NAV_ACCESS.Overview);
  });

  it("opens the gym's listing to manage_listing and its loyalty program to manage_organization (owner rulings, Oct 20)", () => {
    expect(GYM_NAV_ACCESS["My listing"]).toEqual({ all: [P.MARKETPLACE_MANAGE_LISTING] });
    expect(gymPageRule("/dashboard/profile-edit")).toEqual({ all: [P.MARKETPLACE_MANAGE_LISTING] });
    expect(gymPageRule("/dashboard/gym-owner/loyalty")).toEqual({ all: [P.MANAGE_ORGANIZATION, P.VIEW_MEMBERS] });
    expect(gymPageRule("/dashboard/loyalty")).toEqual({ all: [P.MANAGE_ORGANIZATION, P.VIEW_MEMBERS] });
    const listingOnly = gymViewer({ ...staffOrg("custom"), my_permissions: [P.MARKETPLACE_MANAGE_LISTING] }, "u1");
    expect(names(gymSidebarFor(SIDEBAR, listingOnly))).toContain("My listing");
    expect(names(gymSidebarFor(SIDEBAR, listingOnly))).not.toContain("Loyalty");
    const orgManager = gymViewer({ ...staffOrg("custom"), my_permissions: [P.MANAGE_ORGANIZATION, P.VIEW_MEMBERS] }, "u1");
    expect(names(gymSidebarFor(SIDEBAR, orgManager))).toContain("Loyalty");
    expect(names(gymSidebarFor(SIDEBAR, orgManager))).not.toContain("My listing");
    // Forms still lists the signed-in person's own forms: owner only.
    expect(GYM_NAV_ACCESS.Forms).toEqual({ owner: true });
  });

  it("links the gym's Loyalty to the gym's own page", () => {
    const item = SIDEBAR.flatMap((s) => s.items).find((i) => i.name === "Loyalty");
    expect(item?.href).toBe("/dashboard/gym-owner/loyalty");
  });

  it("starts an assistant on the first page their role covers", () => {
    expect(gymLandingHref(SIDEBAR, gymViewer(staffOrg("assistant"), "u1"))).toBe("/dashboard/gym-owner/schedule");
    expect(gymLandingHref(SIDEBAR, gymViewer(staffOrg("manager"), "u1"))).toBe("/dashboard/gym-owner");
  });
});

// ── The shell itself ───────────────────────────────────────────────────────
let mockPath = "/dashboard/gym-owner/staff";
let mockOrg: Record<string, unknown> = ownerOrg;
let mockUser = { id: "u1", role: "GYM_OWNER", first_name: "Dapo", last_name: "A" };
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => mockPath,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useTrainerAccess", () => ({
  useProviderAccess: () => ({ user: mockUser, isAuthorized: true, isLoading: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({ currentOrg: mockOrg, organizations: [mockOrg], isLoading: false, setCurrentOrg: vi.fn() });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
const refundCountCalls: boolean[] = [];
vi.mock("@/lib/queries/refunds", () => ({
  useRefundsAttentionCount: (enabled = true) => {
    refundCountCalls.push(enabled);
    return 0;
  },
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
const requestCountCalls: { orgId: string | undefined; enabled: boolean }[] = [];
let mockPendingRequests = 0;
vi.mock("@/lib/queries/orgRequests", () => ({
  useOrgPendingRequestCount: (orgId: string | undefined, enabled = true) => {
    requestCountCalls.push({ orgId, enabled });
    return enabled ? mockPendingRequests : 0;
  },
}));

function sidebar() {
  return within(screen.getByRole("complementary", { name: "Sidebar navigation" }));
}
function sidebarNames(): string[] {
  return sidebar()
    .getAllByRole("link")
    .map((a) => a.textContent ?? "")
    .filter((t) => names(SIDEBAR).includes(t));
}
/** What the command bar would offer: the shell's registered nav. */
function CommandBarProbe() {
  const nav = useShellNav();
  return <ol aria-label="Command bar nav">{nav?.map((e) => <li key={e.name}>{e.name}</li>)}</ol>;
}
const commandBarNames = () =>
  within(screen.getByRole("list", { name: "Command bar nav" }))
    .queryAllByRole("listitem")
    .map((li) => li.textContent);
function renderShell(activeItem = "Staff") {
  return render(
    <>
      <GymDashboardShell activeItem={activeItem} crumb={activeItem}>
        <p>page body</p>
      </GymDashboardShell>
      <CommandBarProbe />
    </>,
  );
}

beforeEach(() => {
  mockPath = "/dashboard/gym-owner/staff";
  mockOrg = ownerOrg;
  mockUser = { id: "u1", role: "GYM_OWNER", first_name: "Dapo", last_name: "A" };
  replace.mockReset();
  refundCountCalls.length = 0;
  requestCountCalls.length = 0;
  mockPendingRequests = 0;
});
afterEach(() => act(() => resetShellNav()));

describe("GymDashboardShell for a gym's staff", () => {
  it.each(["manager", "assistant", "admin"])("a %s's sidebar and ⌘K show exactly their items", (role) => {
    mockOrg = staffOrg(role);
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    renderShell();
    expect(sidebarNames()).toEqual(EXPECTED[role]);
    expect(commandBarNames()).toEqual(EXPECTED[role]);
    for (const item of OWNER_ONLY) expect(sidebar().queryByRole("link", { name: item })).not.toBeInTheDocument();
  });

  it("gives the owner every item, in the sidebar and ⌘K", () => {
    renderShell();
    expect(sidebarNames()).toEqual(EXPECTED.owner);
    expect(commandBarNames()).toEqual(EXPECTED.owner);
    expect(sidebar().queryByText(/owner manages billing/)).not.toBeInTheDocument();
  });

  it("says in one line under the chip what the owner keeps, and names the role", () => {
    mockOrg = staffOrg("manager");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    renderShell();
    expect(sidebar().getByText("Manager")).toBeInTheDocument();
    expect(sidebar().getByText("Iron Temple's owner manages billing, payouts and refunds. Your role decides the rest.")).toBeInTheDocument();
  });

  it("doesn't ask staff for the owner's refund count", () => {
    mockOrg = staffOrg("admin");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    renderShell();
    expect(refundCountCalls.every((enabled) => enabled === false)).toBe(true);
  });

  it("badges Requests with the gym's pending count for the owner", () => {
    mockPendingRequests = 3;
    renderShell();
    const link = sidebar().getByRole("link", { name: /Requests/ });
    expect(link).toHaveAttribute("href", "/dashboard/gym-owner/requests");
    expect(link).toHaveTextContent("3");
    expect(requestCountCalls.at(-1)).toEqual({ orgId: "gym", enabled: true });
  });

  it("asks for the pending count only when the role may see requests", () => {
    mockOrg = staffOrg("front_desk");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockPendingRequests = 3;
    renderShell();
    expect(sidebar().queryByRole("link", { name: /Requests/ })).not.toBeInTheDocument();
    expect(requestCountCalls.every((c) => c.enabled === false)).toBe(true);
  });

  it("covers the Requests page for view_requests only, and shows one line to a role without it", () => {
    expect(gymPageRule("/dashboard/gym-owner/requests")).toEqual({ all: [P.MARKETPLACE_VIEW_REQUESTS] });
    mockOrg = staffOrg("front_desk");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockPath = "/dashboard/gym-owner/requests";
    renderShell("Requests");
    expect(screen.queryByText("page body")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows one line, not the page, on a deep link the role doesn't cover", () => {
    mockOrg = staffOrg("assistant");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockPath = "/dashboard/gym-owner/payouts";
    renderShell("Payouts");
    expect(screen.queryByText("page body")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your role at Iron Temple doesn't include this page. Ask the gym's owner or an admin to change your role if you need it.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("covers shared pages by their nav item (Billing for a manager)", () => {
    mockOrg = staffOrg("manager");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockPath = "/dashboard/billing";
    renderShell("Billing");
    expect(screen.queryByText("page body")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows the page when the role covers it", () => {
    mockOrg = staffOrg("manager");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockPath = "/dashboard/gym-owner/members/abc";
    renderShell("Members");
    expect(screen.getByText("page body")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("opens the gym's listing to a manager, and its loyalty program only to a role that manages the organization", () => {
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockOrg = staffOrg("manager");
    mockPath = "/dashboard/profile-edit";
    const { unmount } = renderShell("My listing");
    expect(screen.getByText("page body")).toBeInTheDocument();
    unmount();
    act(() => resetShellNav());

    mockPath = "/dashboard/gym-owner/loyalty";
    const second = renderShell("Loyalty");
    expect(screen.queryByText("page body")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    second.unmount();
    act(() => resetShellNav());

    mockOrg = staffOrg("admin");
    renderShell("Loyalty");
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("sends an assistant from the dashboard root to the first page their role covers", () => {
    mockOrg = staffOrg("assistant");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    mockPath = "/dashboard/gym-owner";
    renderShell("Overview");
    expect(replace).toHaveBeenCalledWith("/dashboard/gym-owner/schedule");
    expect(screen.queryByText("page body")).not.toBeInTheDocument();
  });

  it("offers staff the way back to their own home from the account menu", () => {
    mockOrg = staffOrg("manager");
    mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
    renderShell();
    act(() => sidebar().getByRole("button", { name: "Account menu" }).click());
    expect(sidebar().getByRole("menuitem", { name: "Your member home" })).toHaveAttribute("href", "/dashboard/member");
  });
});
