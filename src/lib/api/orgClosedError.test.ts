import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { ORG_CLOSED_MESSAGE } from "@/lib/orgClosure/closure";

afterEach(() => vi.unstubAllGlobals());

describe("ORG_CLOSED from any flow", () => {
  it("is turned into one friendly message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ statusCode: 409, message: ["raw"], code: "ORG_CLOSED" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await apiClient.post("/marketplace/anything", {});
    expect(res.success).toBe(false);
    expect(res.code).toBe("ORG_CLOSED");
    expect(res.message).toBe(ORG_CLOSED_MESSAGE);
  });
});
