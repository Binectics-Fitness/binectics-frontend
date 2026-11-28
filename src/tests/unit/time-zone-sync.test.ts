import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/auth", () => ({
  authService: { updateProfile: vi.fn() },
}));

import { authService } from "@/lib/api/auth";
import {
  syncBrowserTimeZone,
  resetTimeZoneSyncGuard,
} from "@/lib/utils/timeZoneSync";

const update = authService.updateProfile as unknown as ReturnType<typeof vi.fn>;

describe("syncBrowserTimeZone", () => {
  beforeEach(() => {
    resetTimeZoneSyncGuard();
    update.mockReset().mockResolvedValue({ success: true });
  });

  it("sends the zone when the profile has none or another", async () => {
    expect(await syncBrowserTimeZone({ time_zone: null }, "Africa/Lagos")).toBe(true);
    expect(update).toHaveBeenCalledWith({ time_zone: "Africa/Lagos" });
    expect(await syncBrowserTimeZone({ time_zone: "Africa/Lagos" }, "Europe/London")).toBe(true);
    expect(update).toHaveBeenLastCalledWith({ time_zone: "Europe/London" });
  });

  it("sends nothing when it matches, for UTC, or signed out", async () => {
    expect(await syncBrowserTimeZone({ time_zone: "Africa/Lagos" }, "Africa/Lagos")).toBe(false);
    expect(await syncBrowserTimeZone({}, "UTC")).toBe(false);
    expect(await syncBrowserTimeZone(null, "Africa/Lagos")).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("tries once per zone per session", async () => {
    await syncBrowserTimeZone({}, "Africa/Lagos");
    expect(await syncBrowserTimeZone({}, "Africa/Lagos")).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("swallows failures", async () => {
    update.mockRejectedValue(new Error("offline"));
    expect(await syncBrowserTimeZone({}, "Africa/Lagos")).toBe(false);
    update.mockReset().mockResolvedValue({ success: false });
    resetTimeZoneSyncGuard();
    expect(await syncBrowserTimeZone({}, "Africa/Lagos")).toBe(false);
  });
});
