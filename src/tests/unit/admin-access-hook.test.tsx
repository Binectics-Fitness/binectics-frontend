import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  ADMIN_PERMISSION_MISSING_MESSAGE,
  notifyAdminPermissionMissing,
  onAdminPermissionMissing,
} from "@/lib/admin/accessEvents";
import { apiClient } from "@/lib/api/client";
import { AdminPermission as P } from "@/lib/admin/permissions";

/**
 * useAdminAccess reads GET /admin/me/access and refetches when the API
 * refuses anything with 403 ADMIN_PERMISSION_MISSING (the access changed).
 */

const mocks = vi.hoisted(() => ({
  getMyAccess: vi.fn(),
  auth: { user: { id: "a-1", role: "ADMIN", is_admin: true } as Record<string, unknown> | null, isLoading: false },
}));

vi.mock("@/lib/api/adminAccess", () => ({ adminAccessService: { getMyAccess: mocks.getMyAccess } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const moderator = {
  permissions: [P.CONTENT_READ, P.CONTENT_WRITE],
  roles: [{ id: "r1", name: "Moderator", is_system: false }],
  is_super: false,
  legacy: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.user = { id: "a-1", role: "ADMIN", is_admin: true };
});

describe("useAdminAccess", () => {
  it("answers can, canAny and allows from the admin's permissions", async () => {
    mocks.getMyAccess.mockResolvedValue({ success: true, data: moderator });
    const { result } = renderHook(() => useAdminAccess(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.can(P.CONTENT_WRITE)).toBe(true);
    expect(result.current.can(P.REFUNDS_WRITE)).toBe(false);
    expect(result.current.canAny(P.REFUNDS_READ, P.CONTENT_READ)).toBe(true);
    expect(result.current.canAny(P.REFUNDS_READ, P.USERS_READ)).toBe(false);
    expect(result.current.allows([P.PLATFORM_READ, P.CONTENT_READ])).toBe(true);
    expect(result.current.allows(undefined)).toBe(true);
    expect(result.current.isSuper).toBe(false);
    expect(result.current.roles.map((r) => r.name)).toEqual(["Moderator"]);
  });

  it("a Super admin can do everything", async () => {
    mocks.getMyAccess.mockResolvedValue({
      success: true,
      data: { permissions: Object.values(P), roles: [], is_super: true, legacy: false },
    });
    const { result } = renderHook(() => useAdminAccess(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.isSuper).toBe(true);
    expect(result.current.can(P.ADMINS_MANAGE)).toBe(true);
  });

  it("allows nothing gated until the answer arrives", () => {
    mocks.getMyAccess.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAdminAccess(), { wrapper: wrapper() });
    expect(result.current.ready).toBe(false);
    expect(result.current.can(P.CONTENT_READ)).toBe(false);
  });

  it("refetches when any request is refused with ADMIN_PERMISSION_MISSING", async () => {
    mocks.getMyAccess.mockResolvedValueOnce({ success: true, data: moderator });
    const { result } = renderHook(() => useAdminAccess(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.can(P.CONTENT_WRITE)).toBe(true));
    expect(mocks.getMyAccess).toHaveBeenCalledTimes(1);

    // Their Moderator role lost content:write.
    mocks.getMyAccess.mockResolvedValueOnce({
      success: true,
      data: { ...moderator, permissions: [P.CONTENT_READ] },
    });
    act(() => notifyAdminPermissionMissing({ required: [P.CONTENT_WRITE], match: "all" }));
    await waitFor(() => expect(result.current.can(P.CONTENT_WRITE)).toBe(false));
    expect(mocks.getMyAccess).toHaveBeenCalledTimes(2);
    expect(result.current.can(P.CONTENT_READ)).toBe(true);
  });

  it("fails open when the access can't be loaded: the API still refuses what isn't allowed", async () => {
    mocks.getMyAccess.mockResolvedValue({ success: false, status: 404, message: "Not found" });
    const { result } = renderHook(() => useAdminAccess(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.can(P.REFUNDS_WRITE)).toBe(true);
  });

  it("doesn't ask for someone who isn't an admin", () => {
    mocks.auth.user = { id: "u-1", role: "USER", is_admin: false };
    renderHook(() => useAdminAccess(), { wrapper: wrapper() });
    expect(mocks.getMyAccess).not.toHaveBeenCalled();
  });
});

describe("API client on a 403 ADMIN_PERMISSION_MISSING", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function respond(status: number, body: unknown) {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
    );
  }

  it("says it in words, keeps what the route needed, and tells the access hook", async () => {
    const heard = vi.fn();
    const off = onAdminPermissionMissing(heard);
    respond(403, {
      success: false,
      statusCode: 403,
      code: "ADMIN_PERMISSION_MISSING",
      required: ["refunds:write"],
      match: "all",
      message: ["Missing required admin permission: refunds:write"],
    });
    const res = await apiClient.post("/admin/refunds/rf1/approve", {});
    off();
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.code).toBe("ADMIN_PERMISSION_MISSING");
    expect(res.message).toBe(ADMIN_PERMISSION_MISSING_MESSAGE);
    expect(res.details).toMatchObject({ required: ["refunds:write"], match: "all" });
    expect(heard).toHaveBeenCalledWith({ required: ["refunds:write"], match: "all" });
  });

  it("still tells the hook when the body carries only the code", async () => {
    const heard = vi.fn();
    const off = onAdminPermissionMissing(heard);
    respond(403, { success: false, statusCode: 403, code: "ADMIN_PERMISSION_MISSING", message: "nope" });
    await apiClient.get("/admin/refunds");
    off();
    expect(heard).toHaveBeenCalledWith({ required: undefined, match: undefined });
  });

  it("leaves any other 403 alone", async () => {
    const heard = vi.fn();
    const off = onAdminPermissionMissing(heard);
    respond(403, { success: false, statusCode: 403, code: "AUTH_FORBIDDEN", message: "Admin access required" });
    const res = await apiClient.get("/admin/refunds");
    off();
    expect(heard).not.toHaveBeenCalled();
    expect(res.message).toBe("Admin access required");
  });
});
