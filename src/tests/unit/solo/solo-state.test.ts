import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  providers: vi.fn(), requests: vi.fn(), invitations: vi.fn(), offers: vi.fn(), subs: vi.fn(), stats: vi.fn(), team: vi.fn(),
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    getMyProviders: m.providers, getMyEnrollmentOffers: m.offers, getMyMembershipSubscriptions: m.subs,
  },
}));
vi.mock("@/lib/api/progress", () => ({
  progressService: { getMyPendingClientRequests: m.requests, getMyReceivedInvitations: m.invitations },
}));
vi.mock("@/lib/api/checkins", () => ({ checkinsService: { getMyDashboardStats: m.stats } }));
vi.mock("@/lib/api/client", () => ({ apiClient: { get: m.team } }));

import { readIsSolo } from "@/lib/solo/state";
import { MembershipSubscriptionStatus as S, UserRole } from "@/lib/types";

const ok = <T,>(data: T) => ({ success: true as const, data });
beforeEach(() => {
  m.providers.mockResolvedValue(ok({ professionals: [], gyms: [] }));
  m.requests.mockResolvedValue(ok([]));
  m.invitations.mockResolvedValue(ok([]));
  m.offers.mockResolvedValue(ok([]));
  m.subs.mockResolvedValue(ok([]));
  m.stats.mockResolvedValue(ok({ total_check_ins: 0 }));
  m.team.mockResolvedValue(ok([]));
});

describe("readIsSolo reads the same seven sources as mobile", () => {
  it("is solo with nothing anywhere", async () => {
    expect(await readIsSolo(UserRole.USER)).toBe(true);
    expect(m.team).toHaveBeenCalledWith("/teams/invitations/mine");
  });
  it("is not solo with a provider (trainer or gym)", async () => {
    m.providers.mockResolvedValue(ok({ professionals: [{ professional_id: "p" }], gyms: [] }));
    expect(await readIsSolo(UserRole.USER)).toBe(false);
    m.providers.mockResolvedValue(ok({ professionals: [], gyms: [{ organization_id: "o" }] }));
    expect(await readIsSolo(UserRole.USER)).toBe(false);
  });
  it.each([["coach request", "requests"], ["client invitation", "invitations"], ["team invitation", "team"]] as const)(
    "is not solo with a pending %s", async (_n, key) => {
      m[key].mockResolvedValue(ok([{}]));
      expect(await readIsSolo(UserRole.USER)).toBe(false);
    });
  it("is not solo with a pending membership offer, but ignores an answered one", async () => {
    m.offers.mockResolvedValue(ok([{ status: "pending" }]));
    expect(await readIsSolo(UserRole.USER)).toBe(false);
    m.offers.mockResolvedValue(ok([{ status: "accepted" }]));
    expect(await readIsSolo(UserRole.USER)).toBe(true);
  });
  it("is not solo with a live membership, but is with an ended one", async () => {
    m.subs.mockResolvedValue(ok([{ status: S.PAUSED }]));
    expect(await readIsSolo(UserRole.USER)).toBe(false);
    m.subs.mockResolvedValue(ok([{ status: S.CANCELLED }, { status: S.EXPIRED }]));
    expect(await readIsSolo(UserRole.USER)).toBe(true);
  });
  it("is not solo after a check-in", async () => {
    m.stats.mockResolvedValue(ok({ total_check_ins: 2 }));
    expect(await readIsSolo(UserRole.USER)).toBe(false);
  });
  it("treats a missing team-invitations route (404) as none", async () => {
    m.team.mockResolvedValue({ success: false, status: 404, message: "Not Found" });
    expect(await readIsSolo(UserRole.USER)).toBe(true);
  });
  it("throws when ANY source fails, never guessing", async () => {
    m.subs.mockResolvedValue({ success: false, status: 500, message: "down" });
    await expect(readIsSolo(UserRole.USER)).rejects.toThrow();
    m.subs.mockResolvedValue(ok([]));
    m.team.mockResolvedValue({ success: false, status: 500, message: "down" });
    await expect(readIsSolo(UserRole.USER)).rejects.toThrow();
  });
  it("is never solo for another role", async () => {
    expect(await readIsSolo(UserRole.TRAINER)).toBe(false);
  });
});
