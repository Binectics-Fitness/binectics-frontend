import { describe, it, expect } from "vitest";
import { resolveEstablishedRole, resolvePreselectedRole } from "@/app/onboarding/_config";

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

  it("is null for the default member role — a backend default, not a choice", () => {
    expect(resolveEstablishedRole("USER")).toBeNull();
  });

  it("resolves provider roles — those reflect an actual commitment", () => {
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

  it("does NOT preselect from the default member role — the picker must stay open", () => {
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
