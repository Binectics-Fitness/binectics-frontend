import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSettledThisMonth } from "../useSettledThisMonth";

const getOrgSummary = vi.fn();
let org: Record<string, unknown> | null = null;

vi.mock("@/lib/api/earnings", () => ({ earningsService: { getOrgSummary: (id: string) => getOrgSummary(id) } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u-1" } }) }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: org, isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: org, organizations: [], isLoading: false }),
}));

describe("useSettledThisMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrgSummary.mockResolvedValue({
      success: true,
      data: { windows: { today: {}, week: {}, month: { NGN: 5_000_000 } }, all_time: { by_currency: {} } },
    });
  });

  it("reads the settled month for the workspace owner", async () => {
    org = { _id: "org-1", owner_id: "u-1", currency: "NGN" };
    const { result } = renderHook(() => useSettledThisMonth());
    await waitFor(() => expect(result.current).toMatch(/50,000/));
    expect(getOrgSummary).toHaveBeenCalledWith("org-1");
  });

  it("fails closed when the org has no owner_id", async () => {
    org = { _id: "org-1", currency: "NGN" };
    const { result } = renderHook(() => useSettledThisMonth());
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toBeNull();
    expect(getOrgSummary).not.toHaveBeenCalled();
  });

  it("stays out of another owner's ledger", async () => {
    org = { _id: "gym-1", owner_id: "someone-else", currency: "NGN" };
    const { result } = renderHook(() => useSettledThisMonth());
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toBeNull();
    expect(getOrgSummary).not.toHaveBeenCalled();
  });
});
