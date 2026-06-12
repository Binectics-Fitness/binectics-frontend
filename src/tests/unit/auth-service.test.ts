import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storage before importing authService so the module picks up the mock
vi.mock("@/lib/utils/storage", () => ({
  refreshTokenStorage: { get: vi.fn(), set: vi.fn() },
  userStorage: { get: vi.fn(), set: vi.fn() },
  tokenStorage: { get: vi.fn(), set: vi.fn() },
  clearAuthStorage: vi.fn(),
  expiresAtToMaxAge: vi.fn(),
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

  it("POSTs the refresh token to /auth/logout when one is stored", async () => {
    vi.mocked(storage.refreshTokenStorage.get).mockReturnValue("rt-abc");
    const fetchSpy = mockFetch(200, { statusCode: 200, message: ["Logged out successfully"] });

    await authService.logout();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/logout/);
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      refreshToken: "rt-abc",
    });
  });

  it("clears local auth storage even when the POST succeeds", async () => {
    vi.mocked(storage.refreshTokenStorage.get).mockReturnValue("rt-abc");
    mockFetch(200, { statusCode: 200, message: ["Logged out successfully"] });

    await authService.logout();

    expect(storage.clearAuthStorage).toHaveBeenCalledOnce();
  });

  it("clears local auth storage even when the POST fails (server error)", async () => {
    vi.mocked(storage.refreshTokenStorage.get).mockReturnValue("rt-abc");
    mockFetch(500, { statusCode: 500, message: ["Internal server error"] });

    await authService.logout();

    expect(storage.clearAuthStorage).toHaveBeenCalledOnce();
  });

  it("skips the POST entirely when no refresh token is stored", async () => {
    vi.mocked(storage.refreshTokenStorage.get).mockReturnValue(null);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await authService.logout();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storage.clearAuthStorage).toHaveBeenCalledOnce();
  });
});
