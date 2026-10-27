import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ apiClient: { get: (...a: unknown[]) => get(...a) }, API_BASE_URL: "" }));

import { exerciseLibraryService } from "@/lib/api/exerciseLibrary";

describe("exerciseLibraryService.getLibrary", () => {
  beforeEach(() => get.mockReset());

  it("reads the listed exercises", async () => {
    get.mockResolvedValue({
      success: true,
      data: { available: true, schema: "x", manifest_generated: "2026-10-27", exercises: [{ id: "squat", name: "Squat", category: "Squat", equipment: "none", variants: [] }] },
    });
    const res = await exerciseLibraryService.getLibrary();
    expect(get).toHaveBeenCalledWith("/exercise-library");
    expect(res.success).toBe(true);
    expect(res.data?.available).toBe(true);
    expect(res.data?.exercises[0].id).toBe("squat");
  });

  it("passes available:false through as unavailable (index down)", async () => {
    get.mockResolvedValue({ success: true, data: { available: false, schema: null, manifest_generated: null, exercises: [] } });
    const res = await exerciseLibraryService.getLibrary();
    expect(res.data).toEqual({ available: false, exercises: [] });
  });

  it("returns a failure unchanged", async () => {
    get.mockResolvedValue({ success: false, status: 500, message: "boom" });
    const res = await exerciseLibraryService.getLibrary();
    expect(res.success).toBe(false);
    expect(res.message).toBe("boom");
  });
});
