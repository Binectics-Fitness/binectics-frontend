import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock only the storage symbols that auth.ts actually imports after the revamp.
// refreshTokenStorage and expiresAtToMaxAge were removed; including them here
// would mask import-binding mismatches between the mock and the module.
vi.mock("@/lib/utils/storage", () => ({
  userStorage: { get: vi.fn(), set: vi.fn() },
  tokenStorage: { get: vi.fn(), set: vi.fn(), setExpiry: vi.fn() },
  clearAuthStorage: vi.fn(),
}));

import { authService } from "@/lib/api/auth";
import * as storage from "@/lib/utils/storage";

const mockFetch = (status: number, body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => (h === "content-type" ? "application/json" : null) },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response);

describe("authService.logout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs to /auth/logout with an empty body (refresh token is an httpOnly cookie)", async () => {
    const fetchSpy = mockFetch(200, { statusCode: 200, message: ["Logged out successfully"] });

    await authService.logout();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/logout/);
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({});
  });

  it("does not attach a Bearer token to the logout request", async () => {
    const fetchSpy = mockFetch(200, { statusCode: 200, message: ["Logged out successfully"] });

    await authService.logout();

    const [, init] = fetchSpy.mock.calls[0];
    expect((init as RequestInit).headers as Record<string, string>).not.toHaveProperty(
      "Authorization",
    );
  });

  it("clears local auth storage when the server returns 200", async () => {
    mockFetch(200, { statusCode: 200, message: ["Logged out successfully"] });

    await authService.logout();

    expect(storage.clearAuthStorage).toHaveBeenCalledOnce();
  });

  it("clears local auth storage even when the server returns an error response", async () => {
    mockFetch(500, { statusCode: 500, message: ["Internal server error"] });

    await authService.logout();

    expect(storage.clearAuthStorage).toHaveBeenCalledOnce();
  });

  it("always fires the POST — does not skip when no stored token state exists", async () => {
    const fetchSpy = mockFetch(200, { statusCode: 200, message: ["Logged out successfully"] });

    await authService.logout();

    // The server owns revocation via the httpOnly cookie; the client never
    // checks local token state before sending the logout request.
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(storage.clearAuthStorage).toHaveBeenCalledOnce();
  });
});
