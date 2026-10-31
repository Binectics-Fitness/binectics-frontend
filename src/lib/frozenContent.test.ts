import { describe, expect, it } from "vitest";
import {
  FROZEN_CODES,
  FROZEN_MESSAGE,
  FROZEN_RENEW_HREF,
  memberFrozenMessage,
  isFrozenResponse,
} from "./frozenContent";
import { starterErrorMessage } from "./starter/errors";

describe.each([...FROZEN_CODES])("%s", (code) => {
  const res = { success: false, code, status: 409, message: "The API's own sentence" };

  it("is a frozen refusal", () => {
    expect(isFrozenResponse(res)).toBe(true);
  });

  it("reads the same everywhere, whatever sentence the API sent", () => {
    expect(memberFrozenMessage(res, "fallback")).toBe(FROZEN_MESSAGE);
    expect(starterErrorMessage(res, "fallback")).toBe(FROZEN_MESSAGE);
  });
});

describe("not frozen", () => {
  it("passes other refusals through", () => {
    const res = { success: false, code: "STARTER_NOT_ACTIVE", message: "Nope" };
    expect(isFrozenResponse(res)).toBe(false);
    expect(isFrozenResponse(undefined)).toBe(false);
    expect(memberFrozenMessage({ message: "Nope" }, "fallback")).toBe("Nope");
    expect(memberFrozenMessage({}, "fallback")).toBe("fallback");
  });

  it("sends renew to the billing page", () => {
    expect(FROZEN_RENEW_HREF).toBe("/dashboard/member/billing");
  });
});
