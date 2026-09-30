import { describe, it, expect, vi, afterEach } from "vitest";
import { apiClient } from "@/lib/api/client";
import { marketplaceService, type CreateListingRequest } from "@/lib/api/marketplace";

/**
 * A listing's currency is derived by the API from the provider's prices, so
 * no listing write sends one, even if a caller spreads it in.
 */
describe("listing payloads", () => {
  afterEach(() => vi.restoreAllMocks());

  const withCurrency = {
    account_type: "personal_trainer",
    headline: "Coach",
    bio: "Bio",
    price_from_minor: 500_000,
    currency: "USD",
  } as unknown as CreateListingRequest;

  it("create sends no currency", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ success: true });
    await marketplaceService.createMyListing(withCurrency);
    await marketplaceService.createOrgListing("org-1", withCurrency);
    for (const [, body] of post.mock.calls) {
      expect(body).not.toHaveProperty("currency");
      expect(body).toMatchObject({ headline: "Coach", price_from_minor: 500_000 });
    }
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("update sends no currency", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ success: true });
    await marketplaceService.updateMyListing({ headline: "New", currency: "USD" } as never);
    await marketplaceService.updateOrgListing("org-1", { headline: "New", currency: "USD" } as never);
    for (const [, body] of patch.mock.calls) {
      expect(body).toEqual({ headline: "New" });
    }
    expect(patch).toHaveBeenCalledTimes(2);
  });
});
