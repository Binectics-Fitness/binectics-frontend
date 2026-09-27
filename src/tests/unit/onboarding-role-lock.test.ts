import { describe, it, expect } from "vitest";
import { ACCOUNT_TYPE_TO_USER_ROLE, canChangeRole, resolveEstablishedRole, resolvePreselectedRole, workspaceDecision } from "@/app/onboarding/_config";

// Regression guards for the onboarding role model:
//
// 1. The backend assigns `fitness_member` (USER) to EVERY generic signup as a
//    default — so a member account role alone must never count as an
//    established choice. Treating it as one locked every generic signup out
//    of the role picker (the "defaulted to member" bug).
// 2. Provider roles (TRAINER / GYM_OWNER / DIETITIAN) are real commitments —
//    a stray or crafted ?role= link must not override them, or it could
//    silently spin up an unrelated org and overwrite the account's role.
// 3. Members whose role really was preassigned (member invite / gym
//    enrollment) are locked via membership evidence in page.tsx, not here.
describe("resolveEstablishedRole", () => {
  it("is null for no role and for unrecognized roles", () => {
    expect(resolveEstablishedRole(undefined)).toBeNull();
    expect(resolveEstablishedRole(null)).toBeNull();
    expect(resolveEstablishedRole("ADMIN")).toBeNull();
  });

  it("is null for the default member role, a backend default, not a choice", () => {
    expect(resolveEstablishedRole("USER")).toBeNull();
  });

  it("resolves provider roles, those reflect an actual commitment", () => {
    expect(resolveEstablishedRole("TRAINER")).toBe("trainer");
    expect(resolveEstablishedRole("GYM_OWNER")).toBe("gym");
    expect(resolveEstablishedRole("DIETITIAN")).toBe("dietitian");
  });
});

describe("resolvePreselectedRole", () => {
  it("is null when neither a query param nor an account role exists (true first-timer)", () => {
    expect(resolvePreselectedRole(null, undefined)).toBeNull();
    expect(resolvePreselectedRole(null, null)).toBeNull();
  });

  it("does NOT preselect from the default member role, the picker must stay open", () => {
    expect(resolvePreselectedRole(null, "USER")).toBeNull();
  });

  it("preselects from an established provider account role", () => {
    expect(resolvePreselectedRole(null, "TRAINER")).toBe("trainer");
    expect(resolvePreselectedRole(null, "GYM_OWNER")).toBe("gym");
    expect(resolvePreselectedRole(null, "DIETITIAN")).toBe("dietitian");
  });

  it("resolves from a valid ?role= link when there's no established role", () => {
    expect(resolvePreselectedRole("trainer", undefined)).toBe("trainer");
    // A default-member account is still an open choice, so the marketing
    // link may preselect (the invited-member case is gated by membership
    // evidence in page.tsx, plus the workspace-creation guard).
    expect(resolvePreselectedRole("gym", "USER")).toBe("gym");
  });

  it("ignores an unrecognized ?role= value", () => {
    expect(resolvePreselectedRole("astronaut", undefined)).toBeNull();
  });

  it("ignores an unrecognized account role", () => {
    expect(resolvePreselectedRole(null, "ADMIN")).toBeNull();
  });

  it("prefers an established provider role over a ?role= link", () => {
    // A stray/crafted ?role= link must not be able to override a real
    // provider account role.
    expect(resolvePreselectedRole("member", "TRAINER")).toBe("trainer");
    expect(resolvePreselectedRole("gym", "DIETITIAN")).toBe("dietitian");
  });
});

// 4. A provider role picked by mistake can be undone while the workspace
//    that created it is still untouched. The rail only OFFERS the change
//    here; whether the workspace is really untouched is the API's call.
describe("canChangeRole", () => {
  const trainer = { id: "u1", role: "TRAINER", is_onboarding_complete: false };
  const ownOrg = { owner_id: "u1" };

  it("offers it to a promoted account mid-onboarding, on a workspace it owns", () => {
    expect(canChangeRole(trainer, ownOrg)).toBe(true);
  });

  it("never once onboarding is finished, the role is real by then", () => {
    expect(canChangeRole({ ...trainer, is_onboarding_complete: true }, ownOrg)).toBe(false);
  });

  it("never for a workspace someone else owns (invited staff)", () => {
    expect(canChangeRole(trainer, { owner_id: "boss" })).toBe(false);
  });

  it("never for a member: there is no workspace to undo", () => {
    expect(canChangeRole({ id: "u1", role: "USER" }, ownOrg)).toBe(false);
  });

  it("needs both a user and a current workspace", () => {
    expect(canChangeRole(null, ownOrg)).toBe(false);
    expect(canChangeRole(trainer, null)).toBe(false);
  });
});

// 5. What Continue does about the workspace, decided before any request.
describe("workspaceDecision", () => {
  const base = {
    currentOrg: null,
    userId: "u1",
    providerTrack: true,
    accountRole: "member" as const,
    memberGate: "free" as const,
    orgLoading: false,
  };

  it("needs no workspace on the member track, whatever else is going on", () => {
    expect(workspaceDecision({ ...base, providerTrack: false, orgLoading: true })).toEqual({ kind: "member" });
  });

  it("creates one for a free signup on a provider track", () => {
    expect(workspaceDecision(base)).toEqual({ kind: "create" });
  });

  it("reuses the workspace the person owns", () => {
    expect(workspaceDecision({ ...base, currentOrg: { _id: "o1", owner_id: "u1" } })).toEqual({ kind: "reuse", orgId: "o1" });
  });

  it("never writes to a workspace someone else owns (invited staff following a ?role= link)", () => {
    expect(workspaceDecision({ ...base, currentOrg: { _id: "o1", owner_id: "boss" } })).toEqual({ kind: "blocked", reason: "foreign" });
  });

  it("waits while the org list is still loading, so a reload cannot create a second workspace", () => {
    expect(workspaceDecision({ ...base, orgLoading: true })).toEqual({ kind: "blocked", reason: "loading" });
  });

  it("waits for membership evidence before a member-role account creates one", () => {
    expect(workspaceDecision({ ...base, memberGate: "pending" })).toEqual({ kind: "blocked", reason: "gate" });
    expect(workspaceDecision({ ...base, memberGate: "invited" })).toEqual({ kind: "blocked", reason: "gate" });
  });
});

describe("ACCOUNT_TYPE_TO_USER_ROLE", () => {
  it("maps every account type the API returns after a change of role", () => {
    expect(ACCOUNT_TYPE_TO_USER_ROLE).toEqual({
      fitness_member: "USER",
      personal_trainer: "TRAINER",
      gym_owner: "GYM_OWNER",
      dietitian: "DIETITIAN",
    });
  });
});
