import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUnlockableOffers } from "@/hooks/useUnlockableOffers";
import { marketplaceService } from "@/lib/api/marketplace";
import { paidContentService } from "@/lib/api/paidContent";

const ok = <T,>(data: T) => ({ success: true as const, data });
const listing = {
  content_offers: [{ item_kind: "program", item_id: "p1", title: "Strength", prices: [{ currency: "NGN", amount_minor: 100000 }], plans: [] }],
};
const ent = (id: string) => ({ itemKind: "program", itemId: id }) as never;

describe("useUnlockableOffers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(marketplaceService, "getMyProviders").mockResolvedValue(
      ok({ professionals: [{ listing: { _id: "L1" } }], gyms: [] }) as never,
    );
    vi.spyOn(marketplaceService, "getListingById").mockResolvedValue(ok(listing) as never);
  });

  it("offers what the member does not hold", async () => {
    vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue(ok({ items: [ent("other")], nextCursor: null }));
    const { result } = renderHook(() => useUnlockableOffers(true));
    await waitFor(() => expect(result.current).toHaveLength(1));
  });

  it("offers nothing when the held-items read fails (fail closed)", async () => {
    const read = vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue({ success: false, status: 500 });
    const { result } = renderHook(() => useUnlockableOffers(true));
    await waitFor(() => expect(read).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toEqual([]);
  });

  it("pages past 100 held items, so an item on page two is not offered again", async () => {
    const read = vi
      .spyOn(paidContentService, "myEntitlements")
      .mockResolvedValueOnce(ok({ items: [ent("a")], nextCursor: "c2" }))
      .mockResolvedValueOnce(ok({ items: [ent("p1")], nextCursor: null }));
    const { result } = renderHook(() => useUnlockableOffers(true));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    expect(read).toHaveBeenLastCalledWith(100, "c2");
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toEqual([]);
  });
});
