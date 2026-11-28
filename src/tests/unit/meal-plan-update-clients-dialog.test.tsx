import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MealPlanUpdateClientsDialog } from "@/app/dashboard/dietitian/meal-plans/UpdateClientsDialog";
import { MEAL_UPDATE_COPY as C } from "@/app/dashboard/dietitian/meal-plans/_updateCopy";
import { progressService, type MealPlanUpdatePreview } from "@/lib/api/progress";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }));
vi.mock("@/components/Toast", () => ({ toast }));

type Row = MealPlanUpdatePreview["clients"][number];
function client(over: Partial<Row>): Row {
  return {
    plan_id: "p1", client_profile_id: "c1", client_name: "Asha Bello",
    meals: { added: 1, changed: 1, removed: 0, total: 2 },
    items: [
      { kind: "changed", day_of_week: "monday", meal_type: "lunch", title: "Rice and beans", fields: ["calories"] },
      { kind: "added", day_of_week: "monday", meal_type: "dinner", title: "Grilled fish", fields: [] },
    ],
    total_items: 2, effective_from: "2026-12-01", selectable: true, disabled_reason: null,
    hand_edited: false, paid: false, default_checked: true, ...over,
  };
}
function preview(over: Partial<MealPlanUpdatePreview> = {}): MealPlanUpdatePreview {
  return {
    template: { id: "t1", title: "Cut", version: 3 }, timezone: "Africa/Lagos", effective_from: "2026-12-01", up_to_date_count: 2,
    clients: [
      client({}),
      client({ plan_id: "p2", client_name: "Tobi Adebayo" }),
      client({ plan_id: "p3", client_name: "Kemi Ojo", hand_edited: true, default_checked: false }),
      client({ plan_id: "p4", client_name: "Emeka Nwosu", selectable: false, paid: true, default_checked: false, disabled_reason: "The client bought this plan, so it is never changed for them" }),
    ],
    ...over,
  };
}

const ok = <T,>(data: T) => ({ success: true as const, data });
function renderDialog() {
  const onApplied = vi.fn();
  const onClose = vi.fn();
  render(<MealPlanUpdateClientsDialog planId="t1" planTitle="Cut" onClose={onClose} onApplied={onApplied} />);
  return { onApplied, onClose, user: userEvent.setup() };
}

beforeEach(() => {
  vi.restoreAllMocks();
  toast.mockClear();
});

describe("Update clients dialog for meal plans", () => {
  it("previews per client, ticks only unedited unbought copies, and says changes start tomorrow", async () => {
    vi.spyOn(progressService, "previewMealPlanUpdate").mockResolvedValue(ok(preview()) as never);
    renderDialog();
    const pressed = async (n: string) => (await screen.findByRole("button", { name: new RegExp(n) })).getAttribute("aria-pressed");
    expect(await pressed("Asha")).toBe("true");
    expect(await pressed("Tobi")).toBe("true");
    expect(await pressed("Kemi")).toBe("false");
    expect(screen.getByRole("button", { name: /Emeka/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(C.handEditedBody)).toBeInTheDocument();
    expect(screen.getByText(C.futureOnly("Tue 1 Dec"))).toBeInTheDocument();
    expect(screen.getByText(C.untouched)).toBeInTheDocument();
    expect(screen.getByText(C.upToDate(2))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: C.apply(2) })).toBeInTheDocument();
  });

  it("shows exactly which meals change for a client when asked", async () => {
    vi.spyOn(progressService, "previewMealPlanUpdate").mockResolvedValue(ok(preview()) as never);
    const { user } = renderDialog();
    await screen.findByRole("button", { name: /Asha/ });
    expect(screen.queryByText("Grilled fish")).toBeNull();
    await user.click(screen.getAllByRole("button", { name: C.showChanges })[0]);
    expect(screen.getByText("Grilled fish")).toBeInTheDocument();
    expect(screen.getByText("Monday · Dinner")).toBeInTheDocument();
    expect(screen.getByText("calories changed")).toBeInTheDocument();
  });

  it("applies with one key, sends the confirmed hand-edited copy as an overwrite, toasts with Undo, and Try again re-sends only the failed one with the SAME key", async () => {
    vi.spyOn(progressService, "previewMealPlanUpdate").mockResolvedValue(ok(preview()) as never);
    const update = vi
      .spyOn(progressService, "updateMealPlanClients")
      .mockResolvedValueOnce(ok({ results: [
        { plan_id: "p1", client_name: "Asha Bello", status: "updated", update_id: "u1", things_changed: 2 },
        { plan_id: "p2", client_name: "Tobi Adebayo", status: "failed", error_code: "MEAL_PLAN_UPDATE_FAILED" },
        { plan_id: "p3", client_name: "Kemi Ojo", status: "updated", update_id: "u3", things_changed: 2 },
      ] }) as never)
      .mockResolvedValueOnce(ok({ results: [
        { plan_id: "p2", client_name: "Tobi Adebayo", status: "updated", update_id: "u2", things_changed: 2 },
      ] }) as never);
    const revert = vi.spyOn(progressService, "revertMealPlanUpdates").mockResolvedValue(ok([{ plan_id: "p1", client_name: null, status: "updated" }]) as never);
    const { user, onApplied } = renderDialog();
    // Ticking the hand-edited client is the confirmation to replace their edits.
    await user.click(await screen.findByRole("button", { name: /Kemi/ }));
    await user.click(screen.getByRole("button", { name: C.apply(3) }));

    expect(await screen.findByText(C.resultTitle(2, 3))).toBeInTheDocument();
    expect(screen.getByText(C.resultFailed("Tobi"))).toBeInTheDocument();
    expect(update.mock.calls[0][1].plan_ids).toEqual(["p1", "p2", "p3"]);
    expect(update.mock.calls[0][1].overwrite_edited_plan_ids).toEqual(["p3"]);
    expect(onApplied).toHaveBeenCalled();

    const toastCall = toast.mock.calls[0];
    expect(toastCall[0]).toBe(C.toastUpdated(2));
    expect(toastCall[2].label).toBe(C.undo);
    toastCall[2].onClick();
    await waitFor(() => expect(revert).toHaveBeenCalledWith([{ plan_id: "p1", update_id: "u1" }, { plan_id: "p3", update_id: "u3" }]));

    await user.click(screen.getByRole("button", { name: C.tryAgain }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][1].plan_ids).toEqual(["p2"]);
    expect(update.mock.calls[1][1].idempotency_key).toBe(update.mock.calls[0][1].idempotency_key);
    expect(await screen.findByText(C.resultTitle(3, 3))).toBeInTheDocument();
  });

  it("reports skipped copies plainly in the result", async () => {
    vi.spyOn(progressService, "previewMealPlanUpdate").mockResolvedValue(ok(preview()) as never);
    vi.spyOn(progressService, "updateMealPlanClients").mockResolvedValue(ok({ results: [
      { plan_id: "p1", client_name: "Asha Bello", status: "skipped_edited" },
      { plan_id: "p2", client_name: "Tobi Adebayo", status: "skipped_bought" },
    ] }) as never);
    const { user } = renderDialog();
    await user.click(await screen.findByRole("button", { name: C.apply(2) }));
    expect(await screen.findByText(C.resultEdited)).toBeInTheDocument();
    expect(screen.getByText(C.resultBought)).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
  });

  it("says so when nobody holds an older copy", async () => {
    vi.spyOn(progressService, "previewMealPlanUpdate").mockResolvedValue(ok(preview({ clients: [] })) as never);
    renderDialog();
    expect(await screen.findByText(C.nobody)).toBeInTheDocument();
  });

  it("shows a load error", async () => {
    vi.spyOn(progressService, "previewMealPlanUpdate").mockResolvedValue({ success: false, message: "boom" } as never);
    renderDialog();
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });
});
