import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api/client", async (o) => ({ ...(await o<typeof import("@/lib/api/client")>()), apiClient: client }));

import { memberNotesService, noteErrorMessage } from "@/lib/api/memberNotes";
import { goalErrorMessage, memberGoalsService } from "@/lib/api/memberGoals";
import { historyQueryString, memberHistoryService } from "@/lib/api/memberHistory";
import { starterService } from "@/lib/api/starter";
import { StarterExportFormat } from "@/lib/starter/types";
import { exportWindow } from "@/lib/records/exportData";
import { charsLeftLine, dayHeading, dayLimitLine, draftKey, readDraft, writeDraft } from "@/lib/records/journal";
import { groupByDay, historyHref, rowText } from "@/lib/records/history";
import { joinProgress, progressText, weekRuleText } from "@/lib/records/goals";
import { clearSoloStorage } from "@/lib/solo/storage";
import type { HistoryItem } from "@/lib/api/memberHistory";

const ok = <T,>(data: T) => ({ success: true as const, data });

beforeEach(() => Object.values(client).forEach((f) => f.mockReset()));

describe("memberNotesService (same routes as mobile)", () => {
  it("lists newest first with limit and cursor", async () => {
    client.get.mockResolvedValue(ok({ items: [], next_cursor: null }));
    await memberNotesService.list({ cursor: "c2" });
    expect(client.get).toHaveBeenCalledWith("/member-notes?limit=20&cursor=c2");
  });
  it("creates, changes and deletes", async () => {
    client.post.mockResolvedValue(ok({ id: "n1" }));
    client.patch.mockResolvedValue(ok({ id: "n1" }));
    client.delete.mockResolvedValue(ok({}));
    await memberNotesService.create({ body: "hi", tz: "Africa/Lagos", mood: "good", client_op_id: "op-12345678" });
    expect(client.post).toHaveBeenCalledWith("/member-notes", { body: "hi", tz: "Africa/Lagos", mood: "good", client_op_id: "op-12345678" });
    await memberNotesService.update("n/1", { mood: null });
    expect(client.patch).toHaveBeenCalledWith("/member-notes/n%2F1", { mood: null });
    await memberNotesService.remove("n1");
    expect(client.delete).toHaveBeenCalledWith("/member-notes/n1");
  });
  it("says the limits in our words", () => {
    expect(noteErrorMessage({ code: "JOURNAL_LIMIT_REACHED", status: 409, message: "5 a day" })).toMatch(/5 notes today/);
    expect(noteErrorMessage({ code: "JOURNAL_LIMIT_REACHED", status: 409, message: "1000 in all" })).toMatch(/1000 notes/);
    expect(noteErrorMessage({ message: "Network error" })).toMatch(/Could not reach/);
  });
});

describe("memberGoalsService", () => {
  it("reads every goal (archived too) from { items }", async () => {
    client.get.mockResolvedValue(ok({ items: [{ id: "g1" }] }));
    const res = await memberGoalsService.list(true);
    expect(client.get).toHaveBeenCalledWith("/member-goals?include_archived=true");
    expect(res.data).toEqual([{ id: "g1" }]);
  });
  it("creates, updates, archives, deletes and reads progress and week start", async () => {
    client.post.mockResolvedValue(ok({}));
    client.patch.mockResolvedValue(ok({}));
    client.delete.mockResolvedValue(ok({}));
    client.get.mockResolvedValue(ok({}));
    await memberGoalsService.create({ text: "Fast", kind: "weekly_target", metric: "fasts", target: 3 });
    expect(client.post).toHaveBeenCalledWith("/member-goals", { text: "Fast", kind: "weekly_target", metric: "fasts", target: 3 });
    await memberGoalsService.update("g1", { active: false });
    expect(client.patch).toHaveBeenCalledWith("/member-goals/g1", { active: false });
    await memberGoalsService.remove("g1");
    expect(client.delete).toHaveBeenCalledWith("/member-goals/g1");
    await memberGoalsService.progress("Africa/Lagos");
    expect(client.get).toHaveBeenCalledWith("/member-goals/progress?tz=Africa%2FLagos");
    await memberGoalsService.updateSettings({ week_start: "sunday" });
    expect(client.patch).toHaveBeenCalledWith("/member-goals/settings", { week_start: "sunday" });
  });
  it("says the limits in our words", () => {
    expect(goalErrorMessage({ code: "GOAL_LIMIT_REACHED", status: 409, message: "10 active" })).toMatch(/10 active goals/);
    expect(goalErrorMessage({ code: "GOAL_LIMIT_REACHED", status: 409, message: "50 in all" })).toMatch(/50 goals/);
  });
});

describe("memberHistoryService", () => {
  it("sends tz, the kinds as a comma list, the page size and the cursor", async () => {
    client.get.mockResolvedValue(ok({ tz: "UTC", items: [], next_cursor: null }));
    await memberHistoryService.read({ tz: "UTC", types: ["fast", "water"], cursor: "abc" });
    expect(client.get).toHaveBeenCalledWith("/member-history?tz=UTC&limit=30&types=fast%2Cwater&cursor=abc");
    expect(historyQueryString({ tz: "UTC", types: null })).toBe("tz=UTC&limit=30");
  });
});

describe("starterService.downloadExport window", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("sends format alone for all of it, and from for a shorter range", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("a", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await starterService.downloadExport(StarterExportFormat.Csv);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/my-programs\/export\?format=csv$/);
    await starterService.downloadExport(StarterExportFormat.Json, exportWindow("quarter", "2026-11-23"));
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/format=json&from=2026-08-24T00%3A00%3A00.000Z$/);
  });
  it("exportWindow: all sends nothing, a year goes back 365 days", () => {
    expect(exportWindow("all", "2026-11-23")).toEqual({});
    expect(exportWindow("year", "2026-11-23")).toEqual({ from: "2025-11-23T00:00:00.000Z" });
  });
});

describe("journal rules", () => {
  const now = new Date(2026, 10, 20, 12);
  it("day headings", () => {
    expect(dayHeading("2026-11-20", now)).toBe("Today");
    expect(dayHeading("2026-11-19", now)).toBe("Yesterday");
    expect(dayHeading("2026-11-16", now)).toBe("Monday 16 Nov");
  });
  it("states the limit only when it matters", () => {
    expect(dayLimitLine(3)).toBeNull();
    expect(dayLimitLine(4)).toBe("You can write 1 more note today.");
    expect(dayLimitLine(5)).toMatch(/the most for one day/);
    expect(charsLeftLine(10, 2000)).toBeNull();
    expect(charsLeftLine(1999, 2000)).toBe("1 character left");
  });
  it("the draft is per account and wiped at sign-out", () => {
    writeDraft("u1", { body: "half a thought", mood: "tired" });
    expect(readDraft("u1")).toEqual({ body: "half a thought", mood: "tired" });
    expect(readDraft("u2")).toBeNull();
    expect(draftKey("u1").startsWith("solo:")).toBe(true);
    clearSoloStorage();
    expect(readDraft("u1")).toBeNull();
  });
});

describe("goal rules", () => {
  it("N of M, never a percentage; the week rule follows the week start", () => {
    expect(progressText(3, 5)).toBe("3 of 5");
    expect(weekRuleText("sunday")).toMatch(/Sunday to Saturday/);
    const g = { id: "g", text: "t", kind: "free_text" as const, metric: null, target: null, active: true, archived_at: null, created_at: null, updated_at: null };
    expect(joinProgress([g], [{ id: "g", text: "t", metric: null, target: null, count: 2 }])[0].progress).toBeNull();
  });
});

describe("history rows", () => {
  const items: HistoryItem[] = [
    { kind: "weight", id: "w1", at: "2026-11-20T07:05:00Z", local_day: "2026-11-20", title: "", weight_kg: 73.1, source: "manual" },
    { kind: "water", id: "h2", at: "2026-11-19T20:00:00Z", local_day: "2026-11-19", title: "", glasses: 1 },
    { kind: "fast", id: "f1", at: "2026-11-19T20:30:00Z", local_day: "2026-11-19", title: "", status: "completed", preset: "16_8", target_hours: 16, ended_at: "2026-11-20T12:34:00Z", end_reason: null, duration_minutes: 964 },
  ];
  it("each fact once, grouped by local day", () => {
    expect(rowText(items[0]).title).toBe("73.1 kg");
    expect(rowText(items[1])).toEqual({ title: "1 glass", meta: "Water · whole day" });
    expect(rowText(items[2]).title).toBe("Fast, 16 h 04 min");
    const groups = groupByDay(items, new Date(2026, 10, 20, 12));
    expect(groups.map((g) => [g.heading, g.items.length])).toEqual([["Today", 1], ["Yesterday", 2]]);
  });
  it("water opens only for today; everything else opens its page", () => {
    expect(historyHref(items[1], "2026-11-20")).toBeNull();
    expect(historyHref(items[1], "2026-11-19")).toBe("/dashboard/member/water");
    expect(historyHref(items[0], "2026-11-20")).toBe("/dashboard/member/weight-log");
    expect(historyHref(items[2], "2026-11-20")).toBe("/dashboard/member/fasting/history");
  });
});
