import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { utilityService } from "@/lib/api/utility";

describe("utilityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      success: true,
      data: {
        country: "US",
        currency: "USD",
        locale: "en-US",
        region_name: "United States",
        source: "default",
      },
    });
  });

  it("calls canonical geo resolve endpoint", async () => {
    await utilityService.resolveGeo();
    expect(mockGet).toHaveBeenCalledWith("/geo/resolve", false);
  });
});
