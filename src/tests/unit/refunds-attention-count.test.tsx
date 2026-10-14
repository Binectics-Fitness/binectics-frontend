import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRefundsAttentionCount } from "@/lib/queries/refunds";

const orgRefunds = vi.fn();
const orgDisputes = vi.fn();
let mockOrg: { _id: string; owner_id: string; is_owner?: boolean } | null = null;

vi.mock("@/lib/api/refunds", () => ({
  refundsService: {
    orgRefunds: (...a: unknown[]) => orgRefunds(...a),
    orgDisputes: (...a: unknown[]) => orgDisputes(...a),
  },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({ currentOrg: mockOrg }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  orgRefunds.mockReset();
  orgDisputes.mockReset();
  mockOrg = { _id: "o1", owner_id: "u1" };
});

describe("useRefundsAttentionCount", () => {
  it("adds open refund suggestions and open disputes for the owner", async () => {
    orgRefunds.mockResolvedValue({ success: true, data: { items: [], total: 2 } });
    orgDisputes.mockResolvedValue({ success: true, data: { items: [], total: 1 } });
    const { result } = renderHook(() => useRefundsAttentionCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));
    expect(orgRefunds).toHaveBeenCalledWith("o1", { provider_prompt: "open" });
    expect(orgDisputes).toHaveBeenCalledWith("o1", { state: "open" });
  });

  it("is zero when nothing is waiting", async () => {
    orgRefunds.mockResolvedValue({ success: true, data: { items: [], total: 0 } });
    orgDisputes.mockResolvedValue({ success: true, data: { items: [], total: 0 } });
    const { result } = renderHook(() => useRefundsAttentionCount(), { wrapper });
    await waitFor(() => expect(orgDisputes).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });

  it("counts a refused or failed call as zero rather than erroring", async () => {
    orgRefunds.mockResolvedValue({ success: false, code: "FORBIDDEN" });
    orgDisputes.mockResolvedValue({ success: true, data: { items: [], total: 4 } });
    const { result } = renderHook(() => useRefundsAttentionCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(4));
  });

  it("never asks when the person doesn't own the workspace (a gym's staff)", async () => {
    mockOrg = { _id: "gym", owner_id: "boss", is_owner: false };
    const { result } = renderHook(() => useRefundsAttentionCount(), { wrapper });
    expect(result.current).toBe(0);
    expect(orgRefunds).not.toHaveBeenCalled();
    expect(orgDisputes).not.toHaveBeenCalled();
  });

  it("never asks when switched off", () => {
    const { result } = renderHook(() => useRefundsAttentionCount(false), { wrapper });
    expect(result.current).toBe(0);
    expect(orgRefunds).not.toHaveBeenCalled();
  });
});
