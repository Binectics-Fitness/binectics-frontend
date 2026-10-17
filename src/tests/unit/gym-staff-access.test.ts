import { describe, expect, it } from "vitest";
import { gymStaffAccess, inviteDestination, pickOrgForDashboard, staffGym } from "@/lib/workspaces";
import { isAppRoute } from "./appRoutes";

// Iron Temple, owned by "boss". u1 works there; the role decides the rest.
const gym = (role: string, permissions: string[], extra: Record<string, unknown> = {}) => ({
  _id: "gym",
  name: "Iron Temple",
  owner_id: "boss",
  account_type: "gym_owner",
  is_active: true,
  is_owner: false,
  my_role_code: role,
  my_permissions: permissions,
  ...extra,
});
const manager = gym("manager", ["team:view_members", "bookings:manage", "messaging:answer_members"]);
const assistant = gym("assistant", ["team:view_members", "progress:view", "marketplace:view_requests"]);
const trainer = gym("consultant", ["team:view_members", "progress:view"]);
const member = { id: "u1", role: "USER" };

describe("staffGym", () => {
  it("finds the gym a manager, assistant or admin works at", () => {
    expect(staffGym([manager], "u1")?._id).toBe("gym");
    expect(staffGym([assistant], "u1")?._id).toBe("gym");
    expect(staffGym([gym("admin", ["team:manage_organization"])], "u1")?._id).toBe("gym");
    expect(staffGym([gym("front_desk", ["bookings:manage"])], "u1")?._id).toBe("gym");
  });

  it("leaves out the gym's trainers: they get the trainer dashboard", () => {
    expect(staffGym([trainer], "u1")).toBeNull();
  });

  it("leaves out a role that holds nothing, a closed gym, a gym you own, and other kinds of workspace", () => {
    expect(staffGym([gym("odd", [])], "u1")).toBeNull();
    expect(staffGym([{ ...manager, is_active: false }], "u1")).toBeNull();
    expect(staffGym([{ ...manager, owner_id: "u1" }], "u1")).toBeNull();
    expect(staffGym([{ ...manager, is_owner: true }], "u1")).toBeNull();
    expect(staffGym([{ ...manager, account_type: "dietitian" }], "u1")).toBeNull();
  });

  it("prefers the gym asked for when someone works at two", () => {
    const second = { ...assistant, _id: "gym2", name: "Second" };
    expect(staffGym([manager, second], "u1", "gym2")?._id).toBe("gym2");
    expect(staffGym([manager, second], "u1")?._id).toBe("gym");
  });
});

describe("gymStaffAccess", () => {
  it("lets a gym's non-trainer staff into the gym dashboard", () => {
    expect(gymStaffAccess(member, [manager], false)).toEqual({ allowed: true, pending: false });
  });

  it("keeps out a plain member and a gym's trainer", () => {
    expect(gymStaffAccess(member, [], false)).toEqual({ allowed: false, pending: false });
    expect(gymStaffAccess(member, [trainer], false)).toEqual({ allowed: false, pending: false });
  });

  it("waits while workspaces load", () => {
    expect(gymStaffAccess(member, [], true)).toEqual({ allowed: false, pending: true });
  });
});

describe("pickOrgForDashboard for staff", () => {
  it("puts staff in the gym they work at", () => {
    expect(pickOrgForDashboard([manager], "gym", { userId: "u1" })?._id).toBe("gym");
  });

  it("on two teams, starts in the gym where the role holds something", () => {
    const empty = gym("front_desk", [], { _id: "bare", name: "Bare Gym" });
    expect(pickOrgForDashboard([empty, manager], "gym", { userId: "u1" })?._id).toBe("gym");
    // A gym they chose stays chosen.
    expect(pickOrgForDashboard([empty, manager], "gym", { userId: "u1", currentId: "bare" })?._id).toBe("bare");
  });

  it("never puts the gym dashboard in a gym where the person is only a trainer", () => {
    const own = { _id: "mine", owner_id: "u1", account_type: "gym_owner", is_active: true };
    expect(pickOrgForDashboard([trainer, own], "gym", { userId: "u1", currentId: "gym" })?._id).toBe("mine");
  });
});

describe("inviteDestination (the accept page's button)", () => {
  it("sends a manager into the gym's dashboard, on that gym", () => {
    const d = inviteDestination(member, [manager], "gym", "/dashboard/member");
    expect(d).toMatchObject({ href: "/dashboard/gym-owner", label: "Open Iron Temple's dashboard", organizationId: "gym" });
    expect(isAppRoute(d.href)).toBe(true);
  });

  it("sends an assistant there too", () => {
    expect(inviteDestination(member, [assistant], "gym", "/dashboard/member").href).toBe("/dashboard/gym-owner");
  });

  it("sends a gym's trainer to the trainer dashboard", () => {
    const d = inviteDestination({ id: "u1", role: "TRAINER" }, [trainer], "gym", "/dashboard/trainer");
    expect(d.href).toBe("/dashboard/trainer");
    expect(isAppRoute(d.href)).toBe(true);
  });

  it("never sends anyone to /dashboard/team, which bounced non-owners", () => {
    for (const orgs of [[manager], [assistant], [gym("odd", [])], []]) {
      expect(inviteDestination(member, orgs, "gym", "/dashboard/member").href).not.toBe("/dashboard/team");
    }
  });

  it("sends someone whose role holds nothing, or who joined a non-gym team, home", () => {
    expect(inviteDestination(member, [gym("odd", [])], "gym", "/dashboard/member")).toMatchObject({
      href: "/dashboard/member",
      label: "Go to your dashboard",
    });
    const dietTeam = { ...manager, _id: "diet", account_type: "dietitian" };
    expect(inviteDestination(member, [dietTeam], "diet", "/dashboard/member").href).toBe("/dashboard/member");
  });

  it("goes by the workspace just joined, not another gym the person works at", () => {
    const other = { ...manager, _id: "gym2", name: "Other" };
    const joined = gym("odd", [], { _id: "gym3", name: "New" });
    expect(inviteDestination(member, [other, joined], "gym3", "/dashboard/member").href).toBe("/dashboard/member");
  });
});
