import { describe, it, expect } from "vitest";
import { dashboardKindForPath, ownedWorkspace, pickOrgForDashboard, trainerAccess } from "@/lib/workspaces";

// A gym owner who also coaches owns two workspaces on one login. Each
// dashboard must work in its own, and the trainer dashboard must let them in.
const gym = { _id: "gym", owner_id: "u1", account_type: "gym_owner", is_active: true };
const coaching = { _id: "coach", owner_id: "u1", account_type: "personal_trainer", is_active: true };
const otherGym = { _id: "gym2", owner_id: "boss", account_type: "gym_owner", is_active: true };

describe("trainerAccess", () => {
  it("lets a trainer in", () => {
    expect(trainerAccess({ id: "u1", role: "TRAINER" }, [], true)).toEqual({ allowed: true, pending: false });
  });

  it("lets a gym owner in who owns a live trainer workspace", () => {
    expect(trainerAccess({ id: "u1", role: "GYM_OWNER" }, [gym, coaching], false)).toEqual({ allowed: true, pending: false });
  });

  it("keeps out a gym owner without one", () => {
    expect(trainerAccess({ id: "u1", role: "GYM_OWNER" }, [gym], false)).toEqual({ allowed: false, pending: false });
  });

  it("does not count a trainer workspace someone else owns, or a closed one", () => {
    expect(trainerAccess({ id: "u1", role: "GYM_OWNER" }, [{ ...coaching, owner_id: "boss" }], false).allowed).toBe(false);
    expect(trainerAccess({ id: "u1", role: "GYM_OWNER" }, [{ ...coaching, is_active: false }], false).allowed).toBe(false);
  });

  it("waits for the workspaces before deciding a non-trainer", () => {
    expect(trainerAccess({ id: "u1", role: "GYM_OWNER" }, [], true)).toEqual({ allowed: false, pending: true });
  });

  it("is a plain no without a user", () => {
    expect(trainerAccess(null, [coaching], true)).toEqual({ allowed: false, pending: false });
  });
});

describe("pickOrgForDashboard", () => {
  it("puts the trainer dashboard in the trainer workspace, whatever came first", () => {
    expect(pickOrgForDashboard([gym, coaching], "trainer", { userId: "u1", currentId: "gym" })?._id).toBe("coach");
  });

  it("never puts the gym dashboard in the trainer workspace", () => {
    expect(pickOrgForDashboard([coaching, gym], "gym", { userId: "u1", currentId: "coach" })?._id).toBe("gym");
    expect(pickOrgForDashboard([coaching, gym], "gym", { userId: "u1", currentId: null })?._id).toBe("gym");
  });

  it("keeps the current workspace when it is already the right kind", () => {
    expect(pickOrgForDashboard([gym, otherGym], "gym", { userId: "u1", currentId: "gym2" })?._id).toBe("gym2");
  });

  it("prefers the one the person owns over one they are staff in", () => {
    expect(pickOrgForDashboard([otherGym, gym], "gym", { userId: "u1", currentId: null })?._id).toBe("gym");
  });

  it("has no opinion on the trainer dashboard without a trainer workspace (staff trainer)", () => {
    expect(pickOrgForDashboard([otherGym], "trainer", { userId: "u1", currentId: "gym2" })).toBeNull();
  });

  it("falls back to an untyped workspace for the gym dashboard, never a trainer one", () => {
    const legacy = { _id: "old", owner_id: "u1" };
    expect(pickOrgForDashboard([coaching, legacy], "gym", { userId: "u1" })?._id).toBe("old");
    expect(pickOrgForDashboard([coaching], "gym", { userId: "u1" })).toBeNull();
  });
});

describe("ownedWorkspace", () => {
  it("finds the owner's live workspace of a kind", () => {
    expect(ownedWorkspace([gym, coaching], "trainer", "u1")?._id).toBe("coach");
    expect(ownedWorkspace([gym, coaching], "trainer", undefined)).toBeNull();
  });
});

describe("dashboardKindForPath", () => {
  it("maps each dashboard and nothing else", () => {
    expect(dashboardKindForPath("/dashboard/trainer")).toBe("trainer");
    expect(dashboardKindForPath("/dashboard/trainer/clients/1")).toBe("trainer");
    expect(dashboardKindForPath("/dashboard/gym-owner/settings")).toBe("gym");
    expect(dashboardKindForPath("/dashboard/dietitian")).toBe("dietitian");
    expect(dashboardKindForPath("/dashboard/trainers")).toBeNull();
    expect(dashboardKindForPath("/dashboard/billing")).toBeNull();
    expect(dashboardKindForPath(null)).toBeNull();
  });
});
