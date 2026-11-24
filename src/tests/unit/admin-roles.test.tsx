import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { adminAccessStub } from "@/test/adminAccess";
import type { AdminAccessState } from "@/hooks/useAdminAccess";
import { AdminPermission as P, type AdminPermission } from "@/lib/admin/permissions";
import type {
  AdminPermissionGroup,
  AdminRole,
  AdminRoleDetail,
  AdminTeamMember,
  AdminUserAccess,
} from "@/lib/api/adminRoles";
import type { AdminUserDetail } from "@/lib/api/admin";
import { SIDEBAR, filterSidebar } from "@/components/ds/AdminDashboardShell";
import { PermissionChecklist, NOT_GRANTABLE_HINT } from "@/app/admin/roles/PermissionChecklist";
import { RoleEditorModal } from "@/app/admin/roles/RoleEditorModal";
import { DeleteRoleDialog } from "@/app/admin/roles/DeleteRoleDialog";
import RolesClient from "@/app/admin/roles/RolesClient";
import { AdminAccessCard } from "@/app/admin/users/[userId]/AdminAccessCard";
import AdminTeamRolesPage from "@/app/admin/team-roles/page";
import { ADMIN_ROLE_ERROR_COPY, adminRoleErrorMessage } from "@/lib/admin/roleErrors";
import { assignmentDiff, canAssignRole, describeRoleChange, filterCatalogue, toggleGroup } from "@/lib/admin/roleHelpers";

/**
 * Admin custom roles, web-2: /admin/roles (team, roles, matrix), the role
 * editor (grouped searchable checklist, read-only system role, delete
 * blocked while in use, history) and the user page's Admin access card.
 */

const state = vi.hoisted(() => ({
  access: null as AdminAccessState | null,
  me: { id: "a-1", role: "ADMIN", is_admin: true, first_name: "Ada" } as Record<string, unknown>,
}));
const api = vi.hoisted(() => ({
  listPermissions: vi.fn(),
  listRoles: vi.fn(),
  getRole: vi.fn(),
  roleHistory: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  listAdmins: vi.fn(),
  setAdminRoles: vi.fn(),
  revokeAdmin: vi.fn(),
}));
const nav = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("@/hooks/useAdminAccess", () => ({
  useAdminAccess: () => state.access,
  adminAccessQueryKey: ["admin", "me", "access"],
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/roles",
  useSearchParams: () => new URLSearchParams(),
  redirect: nav.redirect,
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useAdminGuard: () => ({ isAuthorized: true, isLoading: false }),
  isPlatformAdmin: () => true,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: state.me, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/adminRoles", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/adminRoles")>()),
  adminRolesService: api,
}));

const CATALOGUE: AdminPermissionGroup[] = [
  {
    group: "Users",
    items: [
      { key: P.USERS_READ, label: "View users", description: "Search users and open an account.", pii: true, kind: "read" },
      { key: P.USERS_WRITE, label: "Manage users", description: "Suspend and unsuspend.", pii: false, kind: "write" },
    ],
  },
  {
    group: "Refunds and disputes",
    items: [
      { key: P.REFUNDS_READ, label: "View refunds and disputes", description: "See the refund queue.", pii: true, kind: "read" },
      { key: P.REFUNDS_WRITE, label: "Handle refunds and disputes", description: "Moves money.", pii: false, kind: "write" },
    ],
  },
  {
    group: "Admins",
    items: [
      { key: P.ADMINS_READ, label: "View admins and roles", description: "See admins and roles.", pii: false, kind: "read" },
      { key: P.ADMINS_MANAGE, label: "Manage admins and roles", description: "Create roles; give roles.", pii: false, kind: "write" },
    ],
  },
];

const SUPER: AdminRole = {
  id: "r-super",
  name: "Super admin",
  code: "super_admin",
  description: "Every permission",
  permissions: [],
  is_system: true,
  holder_count: 1,
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
};
const SUPPORT: AdminRole = {
  id: "r-support",
  name: "Support",
  code: "support",
  description: "Front line",
  permissions: [P.USERS_READ, P.USERS_WRITE, P.REFUNDS_READ],
  is_system: false,
  holder_count: 2,
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-20T10:00:00.000Z",
};
const FINANCE: AdminRole = {
  id: "r-finance",
  name: "Finance",
  code: "finance",
  description: null,
  permissions: [P.REFUNDS_READ, P.REFUNDS_WRITE, P.USERS_READ],
  is_system: false,
  holder_count: 0,
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
};

const holders = [
  { id: "u-sam", first_name: "Sam", last_name: "Support", email: "sam@example.com", is_suspended: false },
  { id: "u-ola", first_name: "Ola", last_name: "Helper", email: null, is_suspended: true },
];

function as(held: AdminPermission[] | "all") {
  state.access = adminAccessStub(held);
}

let client: QueryClient;
function wrap(ui: ReactNode) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  as("all");
  state.me = { id: "a-1", role: "ADMIN", is_admin: true, first_name: "Ada" };
  api.listPermissions.mockResolvedValue({ success: true, data: CATALOGUE });
  api.listRoles.mockResolvedValue({ success: true, data: [SUPER, SUPPORT, FINANCE] });
  api.roleHistory.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 25 } });
});

/* ─── Pure helpers ─────────────────────────────────────────── */

describe("roles helpers", () => {
  it("filters the catalogue on label and description, dropping empty groups", () => {
    expect(filterCatalogue(CATALOGUE, "money").map((g) => g.group)).toEqual(["Refunds and disputes"]);
    expect(filterCatalogue(CATALOGUE, "MANAGE").flatMap((g) => g.items.map((i) => i.key))).toEqual([
      P.USERS_WRITE,
      P.ADMINS_MANAGE,
    ]);
    expect(filterCatalogue(CATALOGUE, "  ")).toBe(CATALOGUE);
  });

  it("selects all grantable items in a group, and clears them when all are on", () => {
    const on = toggleGroup(new Set([P.AUDIT_READ]), [P.USERS_READ, P.USERS_WRITE]);
    expect([...on].sort()).toEqual([P.AUDIT_READ, P.USERS_READ, P.USERS_WRITE].sort());
    expect([...toggleGroup(on, [P.USERS_READ, P.USERS_WRITE])]).toEqual([P.AUDIT_READ]);
  });

  it("only lets an actor assign roles inside their own permissions; the system role needs a Super admin", () => {
    const support = adminAccessStub([P.USERS_READ, P.USERS_WRITE, P.REFUNDS_READ, P.ADMINS_MANAGE]);
    expect(canAssignRole(SUPPORT, support.can, false)).toBe(true);
    expect(canAssignRole(FINANCE, support.can, false)).toBe(false);
    expect(canAssignRole(SUPER, support.can, false)).toBe(false);
    expect(canAssignRole(SUPER, support.can, true)).toBe(true);
  });

  it("works out the assignment diff, including losing admin access", () => {
    const d = assignmentDiff([SUPER, SUPPORT, FINANCE], ["r-support"], ["r-finance"]);
    expect(d.rolesAdded.map((r) => r.name)).toEqual(["Finance"]);
    expect(d.rolesRemoved.map((r) => r.name)).toEqual(["Support"]);
    expect(d.permissionsAdded).toEqual([P.REFUNDS_WRITE]);
    expect(d.permissionsRemoved).toEqual([P.USERS_WRITE]);
    expect(d.losesAccess).toBe(false);
    expect(assignmentDiff([SUPPORT], ["r-support"], []).losesAccess).toBe(true);
    expect(assignmentDiff([SUPPORT], ["r-support"], [], [P.AUDIT_READ]).losesAccess).toBe(false);
    expect(assignmentDiff([SUPPORT], ["r-support"], ["r-support"]).empty).toBe(true);
  });

  it("describes history rows in words", () => {
    expect(describeRoleChange({ event: "ADMIN_ROLE_UPDATED", diff: { added: [P.AUDIT_READ], removed: [], renamed: { from: "A", to: "B" } } })).toEqual({
      title: "Edited the role",
      lines: ["Renamed from “A” to “B”", "Added: View the audit log"],
    });
    expect(describeRoleChange({ event: "ADMIN_ROLE_CREATED", diff: { added: [P.USERS_READ], removed: [] } }).lines).toEqual([
      "With 1 permission: View users",
    ]);
  });
});

describe("error-code copy", () => {
  it.each(Object.keys(ADMIN_ROLE_ERROR_COPY))("%s has plain copy", (code) => {
    const msg = adminRoleErrorMessage({ code, status: 409, message: "raw" }, "fallback");
    expect(msg).toBe(ADMIN_ROLE_ERROR_COPY[code]);
    expect(msg).not.toMatch(/ADMIN_|:/);
  });

  it("names how many people hold a role in use", () => {
    expect(adminRoleErrorMessage({ code: "ADMIN_ROLE_IN_USE", status: 409, details: { holder_count: 3 } }, "x")).toBe(
      "3 people hold this role. Take it away from them before deleting it.",
    );
    expect(adminRoleErrorMessage({ code: "ADMIN_ROLE_IN_USE", status: 409, details: { holder_count: 1 } }, "x")).toMatch(
      /^1 person holds/,
    );
  });

  it("explains a 400 on assignment as an unknown role, and falls back otherwise", () => {
    expect(adminRoleErrorMessage({ code: "VALIDATION_FAILED", status: 400 }, "x", { assigning: true })).toMatch(
      /no longer exists/,
    );
    expect(adminRoleErrorMessage({ status: 500 }, "Try again.")).toBe("Try again.");
  });
});

/* ─── Nav and redirect ─────────────────────────────────────── */

describe("Team & roles nav and redirect", () => {
  it("adds Team & roles to Operate behind admins:read", () => {
    const operate = SIDEBAR.find((s) => s.label === "Operate");
    const item = operate?.items.find((i) => i.name === "Team & roles");
    expect(item?.href).toBe("/admin/roles");
    expect(item?.permission).toBe(P.ADMINS_READ);
    const moderator = filterSidebar(SIDEBAR, adminAccessStub([P.CONTENT_READ, P.USERS_READ]).allows);
    expect(moderator.flatMap((s) => s.items.map((i) => i.name))).not.toContain("Team & roles");
  });

  it("sends /admin/team-roles to /admin/roles", () => {
    AdminTeamRolesPage();
    expect(nav.redirect).toHaveBeenCalledWith("/admin/roles");
  });
});

/* ─── Checklist ────────────────────────────────────────────── */

function Checklist({ initial, held, readOnly }: { initial: AdminPermission[]; held: AdminPermission[] | "all"; readOnly?: boolean }) {
  const [selected, setSelected] = useState(new Set(initial));
  const access = adminAccessStub(held);
  return (
    <PermissionChecklist catalogue={CATALOGUE} selected={selected} onChange={setSelected} canGrant={access.can} readOnly={readOnly} />
  );
}

describe("permission checklist", () => {
  it("searches on label and description", async () => {
    const user = userEvent.setup();
    render(<Checklist initial={[]} held="all" />);
    await user.type(screen.getByRole("searchbox", { name: "Search permissions" }), "money");
    expect(screen.getByRole("checkbox", { name: "Handle refunds and disputes" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "View users" })).not.toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText(/No permission matches/)).toBeInTheDocument();
  });

  it("selects and clears a whole group", async () => {
    const user = userEvent.setup();
    render(<Checklist initial={[]} held="all" />);
    await user.click(screen.getByRole("checkbox", { name: "Select all in Users" }));
    expect(screen.getByRole("checkbox", { name: "View users" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Manage users" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "View refunds and disputes" })).not.toBeChecked();
    expect(screen.getByText("2 of 6 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Select all in Users" }));
    expect(screen.getByRole("checkbox", { name: "View users" })).not.toBeChecked();
  });

  it("greys out permissions the actor doesn't hold, and select-all skips them", async () => {
    const user = userEvent.setup();
    render(<Checklist initial={[]} held={[P.USERS_READ, P.REFUNDS_READ, P.ADMINS_MANAGE]} />);
    const write = screen.getByRole("checkbox", { name: "Handle refunds and disputes" });
    expect(write).toBeDisabled();
    expect(screen.getAllByText(NOT_GRANTABLE_HINT).length).toBe(3);
    await user.click(screen.getByRole("checkbox", { name: "Select all in Refunds and disputes" }));
    expect(screen.getByRole("checkbox", { name: "View refunds and disputes" })).toBeChecked();
    expect(write).not.toBeChecked();
  });
});

/* ─── Role editor ──────────────────────────────────────────── */

describe("role editor", () => {
  it("shows the system role read-only", async () => {
    api.getRole.mockResolvedValue({ success: true, data: { ...SUPER, holders: [holders[0]] } satisfies AdminRoleDetail });
    wrap(<RoleEditorModal roleId="r-super" catalogue={CATALOGUE} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Super admin" });
    expect(await within(dialog).findByText(/always has every permission/)).toBeInTheDocument();
    expect(within(dialog).getByRole("checkbox", { name: "Manage admins and roles" })).toBeChecked();
    for (const box of within(dialog).getAllByRole("checkbox")) expect(box).toBeDisabled();
    expect(within(dialog).queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete role" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("is read-only without admins:manage", async () => {
    as([P.ADMINS_READ, P.USERS_READ]);
    api.getRole.mockResolvedValue({ success: true, data: { ...SUPPORT, holders } });
    wrap(<RoleEditorModal roleId="r-support" catalogue={CATALOGUE} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Support" });
    expect(await within(dialog).findByText(/You can view this role/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("creates a role and refreshes the admin's own access", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    api.createRole.mockResolvedValue({ success: true, data: { ...FINANCE, id: "r-new", name: "Auditors" } });
    wrap(<RoleEditorModal roleId={null} catalogue={CATALOGUE} onClose={onClose} />);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const dialog = await screen.findByRole("dialog", { name: "New role" });
    await user.click(within(dialog).getByRole("button", { name: "Create role" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("at least 2 characters");
    await user.type(within(dialog).getByPlaceholderText("e.g. Support lead"), "  Auditors ");
    await user.click(within(dialog).getByRole("button", { name: "Create role" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Choose at least one permission");
    await user.click(within(dialog).getByRole("checkbox", { name: "View refunds and disputes" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "View users" }));
    await user.click(within(dialog).getByRole("button", { name: "Create role" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    // Catalogue order, trimmed name, no empty description.
    expect(api.createRole).toHaveBeenCalledWith({ name: "Auditors", permissions: [P.USERS_READ, P.REFUNDS_READ] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "me", "access"] });
  });

  it("sends updated_at back, and offers a reload when someone else changed the role", async () => {
    const user = userEvent.setup();
    api.getRole
      .mockResolvedValueOnce({ success: true, data: { ...SUPPORT, holders } })
      .mockResolvedValueOnce({ success: true, data: { ...SUPPORT, name: "Support desk", updated_at: "2026-11-21T00:00:00.000Z", holders } });
    api.updateRole.mockResolvedValue({ success: false, status: 409, code: "ADMIN_ROLE_STALE", message: "stale" });
    wrap(<RoleEditorModal roleId="r-support" catalogue={CATALOGUE} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Support" });
    await user.click(await within(dialog).findByRole("checkbox", { name: "Manage users" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(api.updateRole).toHaveBeenCalledWith("r-support", {
      name: "Support",
      description: "Front line",
      permissions: [P.USERS_READ, P.REFUNDS_READ],
      expected_updated_at: SUPPORT.updated_at,
    });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(ADMIN_ROLE_ERROR_COPY.ADMIN_ROLE_STALE);
    await user.click(within(dialog).getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(within(dialog).getByDisplayValue("Support desk")).toBeInTheDocument());
    expect(within(dialog).getByRole("checkbox", { name: "Manage users" })).toBeChecked();
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blocks delete while the role is held and lists the holders", async () => {
    const user = userEvent.setup();
    api.getRole.mockResolvedValue({ success: true, data: { ...SUPPORT, holders } });
    wrap(<RoleEditorModal roleId="r-support" catalogue={CATALOGUE} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Support" });
    await user.click(await within(dialog).findByRole("button", { name: "Delete role" }));
    const blocked = await screen.findByRole("dialog", { name: "Support is still in use" });
    expect(within(blocked).getByText(/2 people hold this role/)).toBeInTheDocument();
    expect(within(blocked).getByRole("link", { name: "Sam Support" })).toHaveAttribute("href", "/admin/users/u-sam");
    expect(within(blocked).getByRole("link", { name: "Ola Helper" })).toHaveAttribute("href", "/admin/users/u-ola");
    expect(within(blocked).queryByRole("button", { name: "Delete role" })).not.toBeInTheDocument();
    expect(api.deleteRole).not.toHaveBeenCalled();
  });

  it("deletes a role nobody holds", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    api.getRole.mockResolvedValue({ success: true, data: { ...FINANCE, holders: [] } });
    api.deleteRole.mockResolvedValue({ success: true, data: { id: "r-finance", deleted: true } });
    wrap(<RoleEditorModal roleId="r-finance" catalogue={CATALOGUE} onClose={onClose} />);
    const dialog = await screen.findByRole("dialog", { name: "Finance" });
    await user.click(await within(dialog).findByRole("button", { name: "Delete role" }));
    const confirm = await screen.findByRole("dialog", { name: "Delete Finance?" });
    await user.click(within(confirm).getByRole("button", { name: "Delete role" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.deleteRole).toHaveBeenCalledWith("r-finance");
  });

  it("shows holders and history in tabs", async () => {
    const user = userEvent.setup();
    api.getRole.mockResolvedValue({ success: true, data: { ...SUPPORT, holders } });
    api.roleHistory.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "h1",
            event: "ADMIN_ROLE_UPDATED",
            actor_user_id: "a-1",
            actor: { id: "a-1", first_name: "Ada", last_name: "Admin" },
            subject_type: "role",
            subject_id: "r-support",
            before: null,
            after: null,
            diff: { added: [P.REFUNDS_READ], removed: [P.AUDIT_READ] },
            reason: "Audit moved to Finance",
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 25,
      },
    });
    wrap(<RoleEditorModal roleId="r-support" catalogue={CATALOGUE} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Support" });
    await user.click(await within(dialog).findByRole("tab", { name: "Holders · 2" }));
    expect(within(dialog).getByRole("link", { name: "Sam Support" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("tab", { name: "History" }));
    expect(await within(dialog).findByText("Added: View refunds and disputes")).toBeInTheDocument();
    expect(within(dialog).getByText("Removed: audit:read")).toBeInTheDocument();
    expect(within(dialog).getByText("Reason: Audit moved to Finance")).toBeInTheDocument();
    expect(api.roleHistory).toHaveBeenCalledWith("r-support", 1, 25);
  });
});

describe("delete dialog", () => {
  it("lists holders and offers no delete while the role is in use", () => {
    render(<DeleteRoleDialog roleName="Support" holders={holders} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Support is still in use" });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(2);
    expect(within(dialog).getByText("sam@example.com")).toBeInTheDocument();
    expect(within(dialog).getByText("Suspended")).toBeInTheDocument();
  });
});

/* ─── Page ─────────────────────────────────────────────────── */

const team: AdminTeamMember[] = [
  {
    id: "a-1",
    first_name: "Ada",
    last_name: "Admin",
    email: "ada@example.com",
    profile_picture: null,
    is_suspended: false,
    last_login: new Date().toISOString(),
    roles: [{ id: "r-super", name: "Super admin", is_system: true }],
    direct_permissions: [],
    effective_permissions: [],
    is_super: true,
    legacy: false,
  },
  {
    id: "u-ola",
    first_name: "Ola",
    last_name: "Helper",
    email: null,
    profile_picture: null,
    is_suspended: true,
    last_login: null,
    roles: [],
    direct_permissions: [P.USERS_READ],
    effective_permissions: [P.USERS_READ],
    is_super: false,
    legacy: true,
  },
];

describe("/admin/roles", () => {
  beforeEach(() => {
    api.listAdmins.mockResolvedValue({ success: true, data: team });
  });

  it("lists admins, roles and the matrix, with New role for a manager", async () => {
    wrap(<RolesClient />);
    expect(await screen.findByRole("heading", { name: "Team & roles", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("2 admins · 3 roles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ada Admin" })).toHaveAttribute("href", "/admin/users/a-1");
    expect(screen.getByText("Direct permissions only")).toBeInTheDocument();
    expect(screen.getByText("Legacy")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();
    const roles = screen.getByRole("list", { name: "Roles" });
    expect(within(roles).getByText("All permissions · 1 holder")).toBeInTheDocument();
    expect(within(roles).getByText("3 permissions · 2 holders")).toBeInTheDocument();
    expect(within(roles).getByText("System")).toBeInTheDocument();
    expect(await screen.findByText("Permissions matrix")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New role" })).toBeInTheDocument();
  });

  it("hides New role without admins:manage and opens roles read-only", async () => {
    const user = userEvent.setup();
    as([P.ADMINS_READ, P.CONTENT_READ]);
    api.getRole.mockResolvedValue({ success: true, data: { ...SUPPORT, holders } });
    wrap(<RolesClient />);
    await screen.findByText("2 admins · 3 roles");
    expect(screen.queryByRole("button", { name: "New role" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Audit log" })).not.toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Roles" })).getAllByRole("button")[1]).toBeEnabled());
    await user.click(within(screen.getByRole("list", { name: "Roles" })).getAllByRole("button")[1]);
    const dialog = await screen.findByRole("dialog", { name: "Support" });
    expect(await within(dialog).findByText(/You can view this role/)).toBeInTheDocument();
  });
});

/* ─── User page card ───────────────────────────────────────── */

const person: AdminUserDetail = {
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
  created_at: null,
  other_name: null,
  username: null,
  phone_number: null,
  country_code: null,
  city: null,
  email_verified_at: null,
  is_phone_number_verified: false,
  phone_number_verified_at: null,
  is_onboarding_complete: true,
  must_change_password: false,
  account_type_from_team: false,
  suspension_reason: null,
  updated_at: null,
  listings: [],
  organizations: [],
  team_memberships: [],
  counts: { bookings_as_client: 0, bookings_as_provider: 0, client_profiles_as_client: 0, client_profiles_as_provider: 0 },
};

const supportAccess: AdminUserAccess = {
  roles: [{ id: "r-support", name: "Support", is_system: false }],
  direct_permissions: [],
  effective_permissions: [P.USERS_READ, P.USERS_WRITE, P.REFUNDS_READ],
  is_super: false,
  legacy: false,
};

describe("Admin access card", () => {
  it("shows roles and grouped effective permissions; no actions without admins:manage", async () => {
    const user = userEvent.setup();
    as([P.ADMINS_READ, P.USERS_READ]);
    wrap(<AdminAccessCard user={{ ...person, is_admin: true }} access={supportAccess} onChanged={vi.fn()} />);
    expect(screen.getByText("Support")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /3 permissions/ }));
    expect(await screen.findByText("View users, Manage users")).toBeInTheDocument();
    expect(screen.getByText("View refunds and disputes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit roles" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove admin access" })).not.toBeInTheDocument();
  });

  it("never offers changes on your own access", () => {
    state.me = { id: "u-tia", is_admin: true };
    wrap(<AdminAccessCard user={{ ...person, is_admin: true }} access={supportAccess} onChanged={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Edit roles" })).not.toBeInTheDocument();
    expect(screen.getByText("You can't change your own admin access.")).toBeInTheDocument();
  });

  it("edits roles: shows the diff before saving, then saves and refreshes access", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    api.setAdminRoles.mockResolvedValue({
      success: true,
      data: { user_id: "u-tia", is_admin: true, roles: [], effective_permissions: [], event: "ADMIN_ROLES_ASSIGNED", diff: { roles_added: [], roles_removed: [], permissions_added: [], permissions_removed: [] } },
    });
    wrap(<AdminAccessCard user={{ ...person, is_admin: true }} access={supportAccess} onChanged={onChanged} />);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await user.click(screen.getByRole("button", { name: "Edit roles" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit roles · Tia Trainer" });
    const review = within(dialog).getByRole("button", { name: "Review changes" });
    await waitFor(() => expect(within(dialog).getByRole("checkbox", { name: "Support" })).toBeChecked());
    expect(review).toBeDisabled();
    await user.click(within(dialog).getByRole("checkbox", { name: "Support" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Finance" }));
    await user.click(review);
    expect(within(dialog).getByRole("list", { name: "Roles added" })).toHaveTextContent("Finance");
    expect(within(dialog).getByRole("list", { name: "Roles removed" })).toHaveTextContent("Support");
    expect(within(dialog).getByRole("list", { name: "Permissions gained" })).toHaveTextContent("Handle refunds and disputes");
    expect(within(dialog).getByRole("list", { name: "Permissions lost" })).toHaveTextContent("Manage users");
    expect(api.setAdminRoles).not.toHaveBeenCalled();
    await user.type(within(dialog).getByRole("textbox"), "Moved to finance");
    await user.click(within(dialog).getByRole("button", { name: "Save roles" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.setAdminRoles).toHaveBeenCalledWith("u-tia", ["r-finance"], "Moved to finance");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "me", "access"] });
  });

  it("disables roles beyond the actor's permissions and the system role for non-Super admins", async () => {
    const user = userEvent.setup();
    as([P.ADMINS_READ, P.ADMINS_MANAGE, P.USERS_READ, P.USERS_WRITE, P.REFUNDS_READ]);
    wrap(<AdminAccessCard user={{ ...person, is_admin: true }} access={supportAccess} onChanged={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Edit roles" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("checkbox", { name: "Finance" })).toBeDisabled();
    expect(within(dialog).getByRole("checkbox", { name: "Super admin" })).toBeDisabled();
    expect(within(dialog).getByRole("checkbox", { name: "Support" })).toBeEnabled();
    expect(within(dialog).getByText("Only a Super admin can give or take this role")).toBeInTheDocument();
  });

  it("makes someone an admin only after their email is typed", async () => {
    const user = userEvent.setup();
    api.setAdminRoles.mockResolvedValue({
      success: true,
      data: { user_id: "u-tia", is_admin: true, roles: [], effective_permissions: [], event: "ADMIN_GRANTED", diff: { roles_added: [], roles_removed: [], permissions_added: [], permissions_removed: [] } },
    });
    wrap(<AdminAccessCard user={person} access={null} onChanged={vi.fn()} />);
    expect(screen.getByText("Not an admin.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Make admin" }));
    const dialog = await screen.findByRole("dialog", { name: "Make Tia Trainer an admin" });
    await user.click(await within(dialog).findByRole("checkbox", { name: "Support" }));
    await user.click(within(dialog).getByRole("button", { name: "Review changes" }));
    const confirm = within(dialog).getByRole("button", { name: "Make admin" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole("textbox", { name: "Type tia@example.com to confirm" }), "tia@example");
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole("textbox", { name: "Type tia@example.com to confirm" }), ".com");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(api.setAdminRoles).toHaveBeenCalledWith("u-tia", ["r-support"], ""));
  });

  it("maps refusals to plain copy", async () => {
    const user = userEvent.setup();
    api.setAdminRoles.mockResolvedValue({ success: false, status: 409, code: "ADMIN_TARGET_INELIGIBLE", message: "raw" });
    wrap(<AdminAccessCard user={person} access={null} onChanged={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Make admin" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("checkbox", { name: "Support" }));
    await user.click(within(dialog).getByRole("button", { name: "Review changes" }));
    await user.type(within(dialog).getByRole("textbox", { name: /to confirm/ }), "tia@example.com");
    await user.click(within(dialog).getByRole("button", { name: "Make admin" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(ADMIN_ROLE_ERROR_COPY.ADMIN_TARGET_INELIGIBLE);
  });

  it("removes admin access", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    api.revokeAdmin.mockResolvedValue({
      success: true,
      data: { user_id: "u-tia", is_admin: false, roles: [], effective_permissions: [], event: "ADMIN_REVOKED", diff: { roles_added: [], roles_removed: [], permissions_added: [], permissions_removed: [] } },
    });
    wrap(<AdminAccessCard user={{ ...person, is_admin: true }} access={supportAccess} onChanged={onChanged} />);
    await user.click(screen.getByRole("button", { name: "Remove admin access" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove admin access from Tia Trainer?" });
    await user.click(within(dialog).getByRole("button", { name: "Remove admin access" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.revokeAdmin).toHaveBeenCalledWith("u-tia", "");
  });
});
