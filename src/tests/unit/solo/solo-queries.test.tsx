import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const water = vi.hoisted(() => ({ today: vi.fn(), adjust: vi.fn(), getSettings: vi.fn(), updateSettings: vi.fn() }));
const list = vi.hoisted(() => ({
  today: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  complete: vi.fn(), uncomplete: vi.fn(), addSystem: vi.fn(), removeSystem: vi.fn(),
}));
vi.mock("@/lib/api/water", async (orig) => ({ ...(await orig<typeof import("@/lib/api/water")>()), waterService: water }));
vi.mock("@/lib/api/checklist", async (orig) => ({ ...(await orig<typeof import("@/lib/api/checklist")>()), checklistService: list }));

import { useTickItem, useWaterCounter } from "@/lib/queries/solo";
import { queryKeys } from "@/lib/queries/keys";
import { ChecklistItemKind, type ChecklistToday } from "@/lib/api/checklist";

const TODAY = { local_day: "2026-11-17", glasses: 3, glass_ml: 250, target_glasses: 8 };
let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);
const ok = <T,>(data: T) => ({ success: true as const, data });
const fail = (message: string, status = 500) => ({ success: false as const, message, status });

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  [...Object.values(water), ...Object.values(list)].forEach((f) => f.mockReset());
  water.today.mockResolvedValue(ok(TODAY));
});

describe("water counter: optimistic + rollback", () => {
  it("shows the glass at once, sends one client_op_id, then takes the server's count", async () => {
    let release!: (v: unknown) => void;
    water.adjust.mockReturnValue(new Promise((r) => (release = r)));
    const { result } = renderHook(() => useWaterCounter(true), { wrapper });
    await waitFor(() => expect(result.current.query.data?.glasses).toBe(3));

    act(() => result.current.tap(1));
    await waitFor(() => expect(result.current.query.data?.glasses).toBe(4)); // before the server answers
    const sent = water.adjust.mock.calls[0][0];
    expect(sent).toMatchObject({ delta: 1 });
    expect(sent.client_op_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(sent.tz).toBeTruthy();

    release(ok({ ...TODAY, glasses: 4, applied: true }));
    await waitFor(() => expect(qc.getQueryData<typeof TODAY>(queryKeys.solo.waterToday())?.glasses).toBe(4));
    expect(result.current.failed).toBeNull();
  });

  it("rolls the count back when the write fails and says so", async () => {
    water.adjust.mockResolvedValue(fail("boom"));
    const { result } = renderHook(() => useWaterCounter(true), { wrapper });
    await waitFor(() => expect(result.current.query.data?.glasses).toBe(3));

    act(() => result.current.tap(1));
    await waitFor(() => expect(result.current.failed).not.toBeNull());
    expect(result.current.query.data?.glasses).toBe(3); // back to what the server has
    expect(result.current.failedMessage).toBe("boom");
  });

  it("retries with the SAME op id, so a glass is never counted twice", async () => {
    water.adjust.mockResolvedValueOnce(fail("Network error")).mockResolvedValueOnce(ok({ ...TODAY, glasses: 4, applied: true }));
    const { result } = renderHook(() => useWaterCounter(true), { wrapper });
    await waitFor(() => expect(result.current.query.data?.glasses).toBe(3));

    act(() => result.current.tap(1));
    await waitFor(() => expect(result.current.failed).not.toBeNull());
    const firstId = water.adjust.mock.calls[0][0].client_op_id;

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.failed).toBeNull());
    expect(water.adjust.mock.calls[1][0].client_op_id).toBe(firstId);
    await waitFor(() => expect(result.current.query.data?.glasses).toBe(4));
  });

  it("undo takes one off, and never goes below zero locally", async () => {
    water.today.mockResolvedValue(ok({ ...TODAY, glasses: 0 }));
    water.adjust.mockResolvedValue(ok({ ...TODAY, glasses: 0, applied: false }));
    const { result } = renderHook(() => useWaterCounter(true), { wrapper });
    await waitFor(() => expect(result.current.query.data?.glasses).toBe(0));
    act(() => result.current.tap(-1));
    await waitFor(() => expect(water.adjust).toHaveBeenCalled());
    expect(result.current.query.data?.glasses).toBe(0);
  });
});

describe("checklist tick: optimistic + rollback", () => {
  const seed: ChecklistToday = {
    local_day: "2026-11-17",
    items: [{ id: "a", label: "Walk", kind: ChecklistItemKind.CUSTOM, system_key: null, done: false }],
  };
  const done = () => qc.getQueryData<ChecklistToday>(queryKeys.solo.checklistToday())?.items[0].done;

  it("ticks at once and keeps it when the write succeeds", async () => {
    qc.setQueryData(queryKeys.solo.checklistToday(), seed);
    list.today.mockResolvedValue(ok({ ...seed, items: [{ ...seed.items[0], done: true }] }));
    list.complete.mockResolvedValue(ok({ id: "a", local_day: seed.local_day, done: true }));
    const { result } = renderHook(() => useTickItem(), { wrapper });
    act(() => result.current.mutate({ id: "a", done: true }));
    await waitFor(() => expect(done()).toBe(true));
    expect(list.complete).toHaveBeenCalledWith("a", expect.any(String));
  });

  it("puts the line back when the tick fails", async () => {
    qc.setQueryData(queryKeys.solo.checklistToday(), seed);
    list.today.mockResolvedValue(ok(seed));
    list.complete.mockResolvedValue(fail("nope"));
    const { result } = renderHook(() => useTickItem(), { wrapper });
    act(() => result.current.mutate({ id: "a", done: true }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(done()).toBe(false);
  });

  it("unticks through DELETE", async () => {
    qc.setQueryData(queryKeys.solo.checklistToday(), { ...seed, items: [{ ...seed.items[0], done: true }] });
    list.today.mockResolvedValue(ok(seed));
    list.uncomplete.mockResolvedValue(ok({ id: "a", local_day: seed.local_day, done: false }));
    const { result } = renderHook(() => useTickItem(), { wrapper });
    act(() => result.current.mutate({ id: "a", done: false }));
    await waitFor(() => expect(list.uncomplete).toHaveBeenCalledWith("a", expect.any(String)));
  });
});
