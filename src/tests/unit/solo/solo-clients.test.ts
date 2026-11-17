import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ apiClient: api, API_BASE_URL: "/api/v1" }));

import { waterService } from "@/lib/api/water";
import { checklistService, ChecklistSystemKey } from "@/lib/api/checklist";

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset().mockResolvedValue({ success: true, data: {} }));
});

describe("water client (api #341)", () => {
  it("reads today with the time zone", async () => {
    await waterService.today("Africa/Lagos");
    expect(api.get).toHaveBeenCalledWith("/water/today?tz=Africa%2FLagos");
  });
  it("adjusts with PUT and carries the op id", async () => {
    await waterService.adjust({ delta: 1, tz: "Africa/Lagos", client_op_id: "op-12345678" });
    expect(api.put).toHaveBeenCalledWith("/water/today/adjust", { delta: 1, tz: "Africa/Lagos", client_op_id: "op-12345678" });
  });
  it("reads and patches settings (null clears the aim)", async () => {
    await waterService.getSettings();
    expect(api.get).toHaveBeenCalledWith("/water/settings");
    await waterService.updateSettings({ target_glasses: null });
    expect(api.patch).toHaveBeenCalledWith("/water/settings", { target_glasses: null });
  });
});

describe("checklist client (api #341)", () => {
  it("reads today and the items", async () => {
    await checklistService.today("Africa/Lagos");
    expect(api.get).toHaveBeenCalledWith("/checklist/today?tz=Africa%2FLagos");
    await checklistService.list();
    expect(api.get).toHaveBeenCalledWith("/checklist/items");
  });
  it("creates, edits and removes a line", async () => {
    await checklistService.create({ label: "Walk", days: [1, 2] });
    expect(api.post).toHaveBeenCalledWith("/checklist/items", { label: "Walk", days: [1, 2] });
    await checklistService.update("abc", { active: false });
    expect(api.patch).toHaveBeenCalledWith("/checklist/items/abc", { active: false });
    await checklistService.remove("abc");
    expect(api.delete).toHaveBeenCalledWith("/checklist/items/abc");
  });
  it("ticks with POST and unticks with DELETE carrying tz in the query", async () => {
    await checklistService.complete("abc", "Africa/Lagos");
    expect(api.post).toHaveBeenCalledWith("/checklist/items/abc/complete", { tz: "Africa/Lagos" });
    await checklistService.uncomplete("abc", "Africa/Lagos");
    expect(api.delete).toHaveBeenCalledWith("/checklist/items/abc/complete?tz=Africa%2FLagos");
  });
  it("shows and hides a tool line", async () => {
    await checklistService.addSystem(ChecklistSystemKey.WEIGHT);
    expect(api.post).toHaveBeenCalledWith("/checklist/system/weight");
    await checklistService.removeSystem(ChecklistSystemKey.WEIGHT);
    expect(api.delete).toHaveBeenCalledWith("/checklist/system/weight");
  });
  it("encodes an id so it cannot change the path", async () => {
    await checklistService.remove("a/b?c");
    expect(api.delete).toHaveBeenCalledWith("/checklist/items/a%2Fb%3Fc");
  });
});
