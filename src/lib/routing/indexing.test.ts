import { describe, expect, it } from "vitest";
import { isPrivatePath } from "./indexing";

describe("isPrivatePath", () => {
  it.each([
    "/login",
    "/register/invite",
    "/reset-password/abc123",
    "/verify-email/abc123",
    "/checkout",
    "/checkout/cancelled",
    "/booking/b1/receipt",
    "/check-in/gym1",
    "/forms/f1",
    "/onboarding/gym-owner",
    "/teams/invite/accept",
    "/dashboard/trainer",
  ])("keeps %s out of search", (path) => {
    expect(isPrivatePath(path)).toBe(true);
  });

  it.each(["/", "/about", "/pricing", "/marketplace", "/marketplace/abc", "/for-gyms", "/loginhelp", "/formsguide"])(
    "leaves %s indexable",
    (path) => {
      expect(isPrivatePath(path)).toBe(false);
    },
  );
});
