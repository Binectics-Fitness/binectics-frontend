import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeOptions,
  normalizePreview,
  normalizeProgram,
  normalizeTask,
  starterService,
} from "./starter";
import { StarterEquipment, StarterExportFormat, StarterGoal, StarterTaskStatus } from "@/lib/starter/types";

describe("starter normalisers", () => {
  it("reads options and drops rows without an id or name", () => {
    const out = normalizeOptions({
      match: "closest",
      options: [
        { template_id: "t1", name: "Home Start", goal_tags: ["get_active", "bogus"], equipment: "none", days_per_week: 3, session_minutes: 25, duration_days: 28 },
        { name: "no id" },
        null,
      ],
    });
    expect(out.exact).toBe(false);
    expect(out.options).toHaveLength(1);
    expect(out.options[0]).toMatchObject({
      templateId: "t1",
      goalTags: [StarterGoal.GetActive],
      equipment: StarterEquipment.None,
      durationWeeks: 4,
    });
  });
  it("treats an unreadable body as no options", () => {
    expect(normalizeOptions(undefined)).toEqual({ exact: false, options: [] });
  });
  it("reads a preview with week one and later weeks", () => {
    const p = normalizePreview({
      template_id: "t1",
      name: "Home Start",
      cautions: null,
      week_one: [{ title: "Day 1", exercises: [{ name: "Squat", sets: 2, reps: 10, rest_seconds: 45, cues: ["Chest tall", 5], media_id: "squat" }] }, { exercises: [] }],
      later_weeks: [{ week: 2, name: "Week 2" }, { week: "x" }],
    });
    expect(p?.cautions).toBeUndefined();
    expect(p?.weekOne).toHaveLength(1);
    expect(p?.weekOne[0].exercises[0]).toMatchObject({ restSeconds: 45, cues: ["Chest tall"], mediaId: "squat" });
    expect(p?.laterWeeks).toEqual([{ week: 2, name: "Week 2" }]);
    expect(normalizePreview({ name: "x" })).toBeNull();
  });
  it("reads a program with progress and sharing", () => {
    const p = normalizeProgram({
      _id: "i1",
      name: "Home Start",
      status: "active",
      reminders_enabled: true,
      shared_with_provider_ids: ["a", "b"],
      progress: { day: 3, total_days: 28, last_7_days: { scheduled: 1, done: 1 } },
    });
    expect(p).toMatchObject({ id: "i1", remindersEnabled: true, sharedWithProviderIds: ["a", "b"] });
    expect(p?.progress).toEqual({ day: 3, totalDays: 28, last7: { scheduled: 1, done: 1 } });
  });
  it("reads a task and defaults an unknown status to pending", () => {
    const t = normalizeTask({ _id: "o1", scheduled_for: "2026-11-02T00:00:00.000Z", status: "weird", exercises: [{ name: "Squat" }], session_minutes: 25 });
    expect(t).toMatchObject({ id: "o1", status: StarterTaskStatus.Pending, sessionMinutes: 25, title: "Starter session" });
    expect(t?.exercises).toHaveLength(1);
    expect(normalizeTask({ _id: "o1" })).toBeNull();
  });
});

describe("starterService.downloadExport", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("returns the file and its server-chosen name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("a,b\r\n", { status: 200, headers: { "content-disposition": 'attachment; filename="binectics-history-2026-11-02.csv"' } }),
      ),
    );
    const res = await starterService.downloadExport(StarterExportFormat.Csv);
    expect(res.success).toBe(true);
    expect(res.data?.filename).toBe("binectics-history-2026-11-02.csv");
    expect(res.data?.blob.size).toBe(5);
  });
  it("reports the API's error code and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "EXPORT_TOO_LARGE", message: ["narrow it"] }), { status: 413, headers: { "content-type": "application/json" } }),
      ),
    );
    const res = await starterService.downloadExport(StarterExportFormat.Json);
    expect(res).toMatchObject({ success: false, status: 413, code: "EXPORT_TOO_LARGE", message: "narrow it" });
  });
  it("survives a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const res = await starterService.downloadExport(StarterExportFormat.Json);
    expect(res.success).toBe(false);
  });
});
