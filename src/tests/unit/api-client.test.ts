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

function withHeaders(res: Response, headers: Record<string, string>): Response {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    ...res,
    headers: {
      get: (name: string) =>
        lower[name.toLowerCase()] ??
        (name.toLowerCase() === "content-type" ? "application/json" : null),
    },
  } as unknown as Response;
}

describe("apiClient sign-in refusal details", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("surfaces a suspension's reason and date in details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(403, {
        code: "AUTH_ACCOUNT_SUSPENDED",
        message: ["Your account has been suspended"],
        suspension_reason: "Fraudulent bookings",
        suspended_at: "2026-09-14T10:30:00.000Z",
      }),
    );

    const res = await apiClient.post("/auth/login", {}, false);

    expect(res.code).toBe("AUTH_ACCOUNT_SUSPENDED");
    expect(res.status).toBe(403);
    expect(res.details).toEqual({
      suspension_reason: "Fraudulent bookings",
      suspended_at: "2026-09-14T10:30:00.000Z",
    });
  });

  it("reads a 429's Retry-After header into details.retry_after_seconds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      withHeaders(jsonResponse(429, { message: "Too Many Requests" }), {
        "Retry-After": "42",
      }),
    );

    const res = await apiClient.post("/auth/login", {}, false);

    expect(res.status).toBe(429);
    expect(res.details).toEqual({ retry_after_seconds: 42 });
  });

  it("ignores a Retry-After that isn't a number of seconds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      withHeaders(jsonResponse(429, { message: "Too Many Requests" }), {
        "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT",
      }),
    );

    const res = await apiClient.post("/auth/login", {}, false);

    expect(res.details).toBeUndefined();
  });
});

describe("apiClient session expiry redirect", () => {
  let replace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    replace = vi.fn();
    vi.stubGlobal("location", {
      pathname: "/dashboard/member",
      search: "?tab=plans",
      replace,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("sends a signed-in user whose refresh fails to /session-expired, remembering the page", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "u1" }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(401, { message: "Unauthorized" }));

    void apiClient.get("/auth/profile");
    await vi.waitFor(() => expect(replace).toHaveBeenCalled());

    expect(replace).toHaveBeenCalledWith(
      "/session-expired?redirect=%2Fdashboard%2Fmember%3Ftab%3Dplans",
    );
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("recovers when another tab won the refresh race (fresh cookie already set)", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "u1" }));
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(401, { message: "Unauthorized" })) // original
      .mockResolvedValueOnce(jsonResponse(401, { message: "Refresh token is invalid or expired" })) // lost the race
      .mockResolvedValueOnce(jsonResponse(200, { data: { id: "u1" } })); // retried with the winner's cookie

    const res = await apiClient.get<{ id: string }>("/auth/profile");

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: "u1" });
    expect(replace).not.toHaveBeenCalled();
    expect(localStorage.getItem("user")).not.toBeNull();
  });

  it.each(["/auth/login", "/auth/verify-otp", "/auth/change-password"])(
    "never refreshes or retries a 401 from %s (a wrong credential must count once)",
    async (endpoint) => {
      localStorage.setItem("user", JSON.stringify({ id: "u1" }));
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          jsonResponse(401, { message: ["Authentication failed"], code: "AUTH_INVALID_CREDENTIALS" }),
        );

      const res = await apiClient.post(endpoint, { email: "a@b.example", password: "wrong" }, false);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(false);
      expect(res.status).toBe(401);
      expect(replace).not.toHaveBeenCalled();
      expect(localStorage.getItem("user")).not.toBeNull();
    },
  );

  it("does not race-retry a business 401 that carries a code", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "u1" }));
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(401, { message: "No", code: "SOMETHING" })) // original
      .mockResolvedValueOnce(jsonResponse(401, { message: "Unauthorized" })) // refresh fails
      .mockResolvedValue(jsonResponse(200, { data: { id: "u1" } }));

    void apiClient.get("/some/resource");
    await vi.waitFor(() => expect(replace).toHaveBeenCalled());

    expect(fetchSpy).toHaveBeenCalledTimes(2); // original + refresh, no race retry
  });

  it("sends someone who was never signed in to /login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(401, { message: "Unauthorized" }));

    void apiClient.get("/auth/profile");
    await vi.waitFor(() => expect(replace).toHaveBeenCalled());

    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("stays put on an account-state page", async () => {
    vi.stubGlobal("location", { pathname: "/session-expired", search: "", replace });
    localStorage.setItem("user", JSON.stringify({ id: "u1" }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(401, { message: "Unauthorized" }));

    const res = await apiClient.get("/auth/profile");

    expect(res.status).toBe(401);
    expect(replace).not.toHaveBeenCalled();
  });
});
