import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { UserRole } from "@/lib/types";

let user: { id: string; role: UserRole } | null = { id: "u1", role: UserRole.USER };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user }) }));
const readIsSolo = vi.hoisted(() => vi.fn());
vi.mock("@/lib/solo/state", () => ({ readIsSolo }));

import { useIsSoloMember } from "@/hooks/useIsSoloMember";

let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  readIsSolo.mockReset();
  user = { id: "u1", role: UserRole.USER };
  window.sessionStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", "true");
});
afterEach(() => vi.unstubAllEnvs());

describe("useIsSoloMember", () => {
  it("makes no read and answers null with the switch off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", "");
    const { result } = renderHook(() => useIsSoloMember(), { wrapper });
    expect(result.current).toEqual({ solo: null, isLoading: false });
    expect(readIsSolo).not.toHaveBeenCalled();
  });

  it.each([UserRole.TRAINER, UserRole.GYM_OWNER, UserRole.DIETITIAN])("makes no read for a %s", (role) => {
    user = { id: "u2", role };
    const { result } = renderHook(() => useIsSoloMember(), { wrapper });
    expect(result.current.solo).toBeNull();
    expect(readIsSolo).not.toHaveBeenCalled();
  });

  it("is unknown while loading, then the answer", async () => {
    readIsSolo.mockResolvedValue(true);
    const { result } = renderHook(() => useIsSoloMember(), { wrapper });
    expect(result.current).toEqual({ solo: null, isLoading: true });
    await waitFor(() => expect(result.current.solo).toBe(true));
    expect(readIsSolo).toHaveBeenCalledWith(UserRole.USER);
  });

  it("opens in the layout the member left (this tab), then re-reads", async () => {
    window.sessionStorage.setItem("bx.solo.state.u1", "1");
    readIsSolo.mockResolvedValue(false);
    const { result } = renderHook(() => useIsSoloMember(), { wrapper });
    expect(result.current.solo).toBe(true); // no flicker on first paint
    await waitFor(() => expect(result.current.solo).toBe(false));
    expect(window.sessionStorage.getItem("bx.solo.state.u1")).toBe("0");
  });

  it("keeps the previous answer when a later read fails", async () => {
    readIsSolo.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useIsSoloMember(), { wrapper });
    await waitFor(() => expect(result.current.solo).toBe(true));
    readIsSolo.mockRejectedValue(new Error("one source failed"));
    await qc.refetchQueries({ queryKey: ["solo", "state", "u1"] });
    expect(result.current.solo).toBe(true);
  });

  it("stores one boolean per account, nothing else", async () => {
    readIsSolo.mockResolvedValue(true);
    renderHook(() => useIsSoloMember(), { wrapper });
    await waitFor(() => expect(window.sessionStorage.getItem("bx.solo.state.u1")).toBe("1"));
    expect(window.sessionStorage.length).toBe(1);
    expect(window.localStorage.length).toBe(0);
  });
});
