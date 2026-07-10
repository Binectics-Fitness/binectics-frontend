import { describe, it, expect } from "vitest";
import { resolvePreselectedRole } from "@/app/onboarding/_config";

// Regression guard: an invited gym member's role IS their membership, never
// an open choice. The onboarding page freezes a "roleLocked" flag from this
// function's result at mount and uses it to disable the persistent role
// rail — so this function is the entire safety boundary. Getting it wrong
// either re-opens the "invited member can overwrite their own role" bug, or
// wrongly locks out a genuine first-time signup with no role yet.
describe("resolvePreselectedRole", () => {
  it("is null when neither a query param nor an account role exists (true first-timer)", () => {
    expect(resolvePreselectedRole(null, undefined)).toBeNull();
    expect(resolvePreselectedRole(null, null)).toBeNull();
  });

  it("resolves from the account's existing role (e.g. an invited, claimed member)", () => {
    expect(resolvePreselectedRole(null, "USER")).toBe("member");
    expect(resolvePreselectedRole(null, "TRAINER")).toBe("trainer");
    expect(resolvePreselectedRole(null, "GYM_OWNER")).toBe("gym");
    expect(resolvePreselectedRole(null, "DIETITIAN")).toBe("dietitian");
  });

  it("resolves from a valid ?role= link when there's no account role yet", () => {
    expect(resolvePreselectedRole("trainer", undefined)).toBe("trainer");
  });

  it("ignores an unrecognized ?role= value", () => {
    expect(resolvePreselectedRole("astronaut", undefined)).toBeNull();
  });

  it("ignores an unrecognized account role", () => {
    expect(resolvePreselectedRole(null, "ADMIN")).toBeNull();
  });

  it("prefers the account role over a ?role= link when both exist", () => {
    // The bug this guards: a stray/crafted ?role= link must not be able to
    // override an already-claimed member's real account role — that's the
    // exact override this whole function exists to block.
    expect(resolvePreselectedRole("gym", "USER")).toBe("member");
    expect(resolvePreselectedRole("member", "TRAINER")).toBe("trainer");
  });
});
