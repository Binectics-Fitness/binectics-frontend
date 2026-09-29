import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const replace = vi.fn();
let authState: { user: { id: string; role: string } | null; isLoading: boolean };
let orgState: { organizations: unknown[]; isLoading: boolean } | null;

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOptionalOrganization: () => orgState }));

import { useTrainerAccess } from "@/hooks/useTrainerAccess";

const coaching = { _id: "coach", owner_id: "u1", account_type: "personal_trainer", is_active: true };
const gym = { _id: "gym", owner_id: "u1", account_type: "gym_owner", is_active: true };

describe("useTrainerAccess", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("admits a trainer", () => {
    authState = { user: { id: "u1", role: "TRAINER" }, isLoading: false };
    orgState = { organizations: [], isLoading: false };
    const { result } = renderHook(() => useTrainerAccess());
    expect(result.current.isAuthorized).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it("admits a gym owner who owns a trainer workspace", () => {
    authState = { user: { id: "u1", role: "GYM_OWNER" }, isLoading: false };
    orgState = { organizations: [gym, coaching], isLoading: false };
    const { result } = renderHook(() => useTrainerAccess());
    expect(result.current.isAuthorized).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a gym owner without one back to the gym dashboard", () => {
    authState = { user: { id: "u1", role: "GYM_OWNER" }, isLoading: false };
    orgState = { organizations: [gym], isLoading: false };
    const { result } = renderHook(() => useTrainerAccess());
    expect(result.current.isAuthorized).toBe(false);
    expect(replace).toHaveBeenCalledWith("/dashboard/gym-owner");
  });

  it("does not redirect while the workspaces are still loading", () => {
    authState = { user: { id: "u1", role: "GYM_OWNER" }, isLoading: false };
    orgState = { organizations: [], isLoading: true };
    const { result } = renderHook(() => useTrainerAccess());
    expect(result.current.isAuthorized).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
