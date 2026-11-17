import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ apiClient: api, API_BASE_URL: "/api/v1" }));

import { fastingService, fastingMessage } from "@/lib/api/fasting";
import { memberSeriesService } from "@/lib/api/memberSeries";
import { memberTargetsService } from "@/lib/api/memberTargets";
import { FASTING_ERROR_MESSAGES } from "@/lib/solo/fastingCopy";

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset().mockResolvedValue({ success: true, data: {} }));
});

describe("fasting client (api #340, #344)", () => {
  it("sends the safety check once, with the acknowledgement, and reads settings", async () => {
    await fastingService.screen({ under_18: false, eating_disorder_history: false, pregnant_or_breastfeeding: true, diabetes_or_medication: false });
    expect(api.post).toHaveBeenCalledWith("/fasting/screening", {
      under_18: false,
      eating_disorder_history: false,
      pregnant_or_breastfeeding: true,
      diabetes_or_medication: false,
      acknowledged: true,
    });
    await fastingService.settings();
    expect(api.get).toHaveBeenCalledWith("/fasting/settings");
  });

  it("starts, reads the running fast, ends, undoes and deletes with encoded ids", async () => {
    await fastingService.start({ started_at: "2026-11-17T20:30:00.000Z", target_hours: 16, preset: "16_8" });
    expect(api.post).toHaveBeenCalledWith("/fasting/sessions", { started_at: "2026-11-17T20:30:00.000Z", target_hours: 16, preset: "16_8" });
    await fastingService.current();
    expect(api.get).toHaveBeenCalledWith("/fasting/sessions/current");
    await fastingService.end("abc");
    expect(api.post).toHaveBeenCalledWith("/fasting/sessions/abc/end", {});
    await fastingService.end("abc", "2026-11-18T12:30:00.000Z");
    expect(api.post).toHaveBeenCalledWith("/fasting/sessions/abc/end", { ended_at: "2026-11-18T12:30:00.000Z" });
    await fastingService.undoEnd("abc");
    expect(api.post).toHaveBeenCalledWith("/fasting/sessions/abc/undo-end", {});
    await fastingService.remove("a/b");
    expect(api.delete).toHaveBeenCalledWith("/fasting/sessions/a%2Fb");
  });

  it("edits with only the fields given and adds a feeling", async () => {
    await fastingService.edit("abc", { note: "" });
    expect(api.patch).toHaveBeenCalledWith("/fasting/sessions/abc", { note: "" });
    await fastingService.addFeeling("abc", "hungry");
    expect(api.post).toHaveBeenCalledWith("/fasting/sessions/abc/feelings", { value: "hungry" });
  });

  it("pages history by cursor and reads the summary for a local range", async () => {
    await fastingService.history(10);
    expect(api.get).toHaveBeenCalledWith("/fasting/sessions?limit=10");
    await fastingService.history(10, "cur+sor");
    expect(api.get).toHaveBeenCalledWith("/fasting/sessions?limit=10&cursor=cur%2Bsor");
    await fastingService.summary("2026-11-16", "2026-11-22", "Africa/Lagos");
    expect(api.get).toHaveBeenCalledWith("/fasting/sessions/summary?from=2026-11-16&to=2026-11-22&tz=Africa%2FLagos");
  });
});

describe("error codes become plain sentences written here, not the server's", () => {
  it.each(Object.keys(FASTING_ERROR_MESSAGES))("%s has its own sentence", (code) => {
    const msg = fastingMessage({ code, status: 409, message: "SERVER WORDING" }, "fallback");
    expect(msg).toBe(FASTING_ERROR_MESSAGES[code]);
    expect(msg).not.toMatch(/SERVER WORDING/);
    expect(msg.length).toBeGreaterThan(10);
    expect(msg).not.toMatch(/FASTING_/);
  });

  it("covers every code the API defines for fasting (binectics-api error-codes.ts)", () => {
    for (const code of [
      "FASTING_SESSION_NOT_FOUND",
      "FASTING_SCREENING_REQUIRED",
      "FASTING_ALREADY_RUNNING",
      "FASTING_BAD_TIME",
      "FASTING_OVERLAP",
      "FASTING_EXPIRED_UNCLOSED",
      "FASTING_BAD_STATE",
      "FASTING_UNDO_UNAVAILABLE",
      "FASTING_FEELINGS_FULL",
      "FASTING_DAILY_LIMIT_REACHED",
      "FASTING_SUMMARY_TOO_MANY",
    ]) {
      expect(FASTING_ERROR_MESSAGES[code], code).toBeTruthy();
    }
  });

  it("falls back for unknown codes, says a network failure and a throttle plainly", () => {
    expect(fastingMessage({ code: "SOMETHING_NEW", status: 400 }, "We could not start your fast. Try again.")).toBe("We could not start your fast. Try again.");
    expect(fastingMessage({ status: undefined }, "x")).toBe("Could not reach Binectics. Check your connection and try again.");
    expect(fastingMessage({ status: 429 }, "x")).toBe("Too many requests. Please wait a moment and try again.");
  });

  it("the daily-limit and summary-cap messages (api #344) are written out", () => {
    expect(fastingMessage({ code: "FASTING_DAILY_LIMIT_REACHED", status: 409 }, "x")).toMatch(/most fasts allowed in a day/);
    expect(fastingMessage({ code: "FASTING_SUMMARY_TOO_MANY", status: 422 }, "x")).toMatch(/too many fasts/);
  });
});

describe("series and targets clients (api #343)", () => {
  it("reads a series with the zone and bucket, and the weight comparison", async () => {
    await memberSeriesService.read({ metric: "fasting_hours", from: "2026-10-19", to: "2026-11-17", tz: "Africa/Lagos", bucket: "day" });
    expect(api.get).toHaveBeenCalledWith("/member-series?metric=fasting_hours&from=2026-10-19&to=2026-11-17&tz=Africa%2FLagos&bucket=day");
    await memberSeriesService.compareWeight("4w", "Africa/Lagos");
    expect(api.get).toHaveBeenCalledWith("/member-series/weight/compare?tz=Africa%2FLagos&period=4w");
  });

  it("reads and patches targets; a null clears one and the clear-everything DELETE is never exposed", async () => {
    await memberTargetsService.get();
    expect(api.get).toHaveBeenCalledWith("/member-targets");
    await memberTargetsService.update({ weight_range: null });
    expect(api.patch).toHaveBeenCalledWith("/member-targets", { weight_range: null });
    await memberTargetsService.update({ fasting_window: { min_hours: 16, max_hours: 20, days_per_week: 5 } });
    expect(api.patch).toHaveBeenLastCalledWith("/member-targets", { fasting_window: { min_hours: 16, max_hours: 20, days_per_week: 5 } });
    expect(Object.keys(memberTargetsService)).toEqual(["get", "update"]);
    expect(api.delete).not.toHaveBeenCalled();
  });
});
