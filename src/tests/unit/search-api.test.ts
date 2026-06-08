import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { searchService } from "@/lib/api/search";

describe("searchService.unifiedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ success: true, data: null });
  });

  it("does not include q when query is shorter than 2 chars", async () => {
    await searchService.unifiedSearch({ q: "a", limit: 5 });
    expect(mockGet).toHaveBeenCalledWith("/search/unified?limit=5");
  });

  it("trims query before sending", async () => {
    await searchService.unifiedSearch({ q: "  fitzone  " });
    expect(mockGet).toHaveBeenCalledWith("/search/unified?q=fitzone");
  });

  it("clamps limit to 1..20 and floors decimals", async () => {
    await searchService.unifiedSearch({ q: "fit", limit: 25.9 });
    expect(mockGet).toHaveBeenCalledWith("/search/unified?q=fit&limit=20");

    await searchService.unifiedSearch({ q: "fit", limit: 0.7 });
    expect(mockGet).toHaveBeenLastCalledWith("/search/unified?q=fit&limit=1");
  });

  it("omits non-numeric limit", async () => {
    await searchService.unifiedSearch({ q: "fit", limit: Number.NaN });
    expect(mockGet).toHaveBeenCalledWith("/search/unified?q=fit");
  });

  it("calls bare endpoint when no valid params exist", async () => {
    await searchService.unifiedSearch({ q: " " });
    expect(mockGet).toHaveBeenCalledWith("/search/unified");
  });
});
