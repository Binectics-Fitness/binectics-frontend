import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { apiClient } from "@/lib/api/client";

type FakeResponseOptions = { throwOnParse?: boolean };

function jsonResponse(
  status: number,
  body: unknown,
  { throwOnParse = false }: FakeResponseOptions = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: throwOnParse
      ? () => Promise.reject(new Error("Unexpected end of JSON input"))
      : () => Promise.resolve(body),
    text: () =>
      Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("apiClient.handleResponse (via get)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves the HTTP status on a non-2xx JSON error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(500, { message: "boom" }),
    );

    const res = await apiClient.get("/x", false);

    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    expect(res.message).toBe("boom");
  });

  it("does not mask a server error as a Network error when the body cannot be parsed", async () => {
    // 502 gateway page that advertises JSON but sends an unparseable body.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(502, null, { throwOnParse: true }),
    );

    const res = await apiClient.get("/x", false);

    expect(res.success).toBe(false);
    expect(res.status).toBe(502);
    expect(res.message).not.toBe("Network error");
  });

  it("unwraps a legitimately-falsy `data` payload instead of returning the envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(200, { data: 0 }),
    );

    const res = await apiClient.get<number>("/count", false);

    expect(res.success).toBe(true);
    expect(res.data).toBe(0);
  });

  it("returns the payload as-is when there is no `data` envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(200, { id: 7, name: "fit" }),
    );

    const res = await apiClient.get<{ id: number; name: string }>("/x", false);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: 7, name: "fit" });
  });
});
