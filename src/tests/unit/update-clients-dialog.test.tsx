import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdateClientsDialog } from "@/components/programs/builder/UpdateClientsDialog";
import { UPDATE_COPY as C } from "@/components/programs/builder/copy";
import { programsService, type UpdatePreview } from "@/lib/api/programs";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }));
vi.mock("@/components/Toast", () => ({ toast }));

function client(over: Partial<UpdatePreview["clients"][number]>): UpdatePreview["clients"][number] {
  return {
    instance_id: "i1", client_profile_id: "p1", client_name: "Asha Bello", status: "active", from_version_no: 2, versions_behind: 1,
    future_tasks: { added: 0, changed: 34, removed: 0, total: 34 }, effective_from: "2026-11-30", selectable: true,
    disabled_reason: null, default_checked: true, paid: false, ...over,
  };
}
function preview(over: Partial<UpdatePreview> = {}): UpdatePreview {
  return {
    template: { id: "t1", name: "Strength Foundations" }, target_version_no: 3, will_publish: false,
    sold: { is_sold: false, paid_clients: [] },
    changes: [{ from_version_no: 2, client_count: 3, total_items: 2, items: [
      { kind: "changed", title: "Full-body strength A", where: "Week 2", detail: "Goblet squat 3 × 8 → 4 × 8" },
      { kind: "added", title: "Plank", where: "Weeks 3-4" },
    ] }],
    clients: [
      client({}),
      client({ instance_id: "i2", client_name: "Tobi Adebayo", future_tasks: { added: 0, changed: 18, removed: 0, total: 18 } }),
      client({ instance_id: "i3", client_name: "Kemi Ojo", from_version_no: 1, versions_behind: 2, default_checked: false, future_tasks: { added: 0, changed: 40, removed: 0, total: 40 } }),
      client({ instance_id: "i4", client_name: "Emeka Nwosu", selectable: false, default_checked: false, disabled_reason: "Nothing left to change", future_tasks: { added: 0, changed: 0, removed: 0, total: 0 } }),
    ],
    ...over,
  };
}

const ok = <T,>(data: T) => ({ success: true as const, data });
function renderDialog(props: Partial<React.ComponentProps<typeof UpdateClientsDialog>> = {}) {
  const onApplied = vi.fn();
  const onClose = vi.fn();
  render(<UpdateClientsDialog templateId="t1" programName="Strength Foundations" onClose={onClose} onApplied={onApplied} {...props} />);
  return { onApplied, onClose, user: userEvent.setup() };
}

beforeEach(() => {
  vi.restoreAllMocks();
  toast.mockClear();
});

describe("Update clients dialog", () => {
  it("shows the diff, pre-checks only the latest-but-one clients and disables a client with nothing left", async () => {
    vi.spyOn(programsService, "previewUpdate").mockResolvedValue(ok(preview()) as never);
    renderDialog();
    expect(await screen.findByText("Goblet squat 3 × 8 → 4 × 8")).toBeInTheDocument();
    expect(screen.getByText(C.moves(2, 3))).toBeInTheDocument();
    const pressed = (n: string) => screen.getByRole("button", { name: new RegExp(n) }).getAttribute("aria-pressed");
    expect(pressed("Asha")).toBe("true");
    expect(pressed("Tobi")).toBe("true");
    expect(pressed("Kemi")).toBe("false");
    expect(screen.getByText(C.clientLine(1, 2, 40))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Emeka/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(C.futureOnly("Mon 30 Nov"))).toBeInTheDocument();
    expect(screen.getByText(C.untouched)).toBeInTheDocument();
    expect(screen.getByText(C.notified)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: C.apply(2) })).toBeInTheDocument();
  });

  it("a sold program warns and pre-checks nobody", async () => {
    const p = preview({ sold: { is_sold: true, paid_clients: [{ client_name: "Asha Bello", from_version_no: 2 }, { client_name: "Tobi Adebayo", from_version_no: 2 }] } });
    p.clients = p.clients.map((c) => ({ ...c, default_checked: false }));
    vi.spyOn(programsService, "previewUpdate").mockResolvedValue(ok(p) as never);
    renderDialog();
    expect(await screen.findByText(C.soldTitle)).toBeInTheDocument();
    expect(screen.getByText(C.soldBody("Asha and Tobi", 2))).toBeInTheDocument();
    const apply = screen.getByRole("button", { name: C.pickOne });
    expect(apply).toHaveAttribute("aria-disabled", "true");
  });

  it("applies the picked clients with one key, toasts with Undo, and Try again re-sends only the failed one with the SAME key", async () => {
    vi.spyOn(programsService, "previewUpdate").mockResolvedValue(ok(preview()) as never);
    const update = vi
      .spyOn(programsService, "updateClients")
      .mockResolvedValueOnce(ok({ target_version_no: 3, published: false, results: [
        { instance_id: "i1", client_name: "Asha Bello", status: "updated", update_id: "u1", to_version_no: 3, tasks_changed: 34 },
        { instance_id: "i2", client_name: "Tobi Adebayo", status: "failed", error_code: "PROGRAM_UPDATE_FAILED", message: "x" },
      ] }) as never)
      .mockResolvedValueOnce(ok({ target_version_no: 3, published: false, results: [
        { instance_id: "i2", client_name: "Tobi Adebayo", status: "updated", update_id: "u2", to_version_no: 3, tasks_changed: 18 },
      ] }) as never);
    const revert = vi.spyOn(programsService, "revertUpdates").mockResolvedValue(ok([{ instance_id: "i1", client_name: null, status: "updated" }]) as never);
    const { user, onApplied } = renderDialog();
    await user.click(await screen.findByRole("button", { name: C.apply(2) }));

    expect(await screen.findByText(C.resultTitle(1, 2))).toBeInTheDocument();
    expect(screen.getByText(C.resultFailed("Tobi"))).toBeInTheDocument();
    expect(onApplied).toHaveBeenCalled();
    // The Undo toast carries only what actually changed.
    const toastCall = toast.mock.calls[0];
    expect(toastCall[0]).toBe(C.toastUpdated(1, 3));
    expect(toastCall[2].label).toBe(C.undo);
    toastCall[2].onClick();
    await waitFor(() => expect(revert).toHaveBeenCalledWith([{ instance_id: "i1", update_id: "u1" }]));

    await user.click(screen.getByRole("button", { name: C.tryAgain }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][1].instance_ids).toEqual(["i2"]);
    expect(update.mock.calls[1][1].idempotency_key).toBe(update.mock.calls[0][1].idempotency_key);
    expect(await screen.findByText(C.resultTitle(2, 2))).toBeInTheDocument();
  });

  it("from one client's page it lists only that client, ticked", async () => {
    vi.spyOn(programsService, "previewUpdate").mockResolvedValue(ok(preview()) as never);
    renderDialog({ onlyInstanceId: "i3" });
    expect(await screen.findByRole("button", { name: C.applyOne("Kemi") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Asha/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^Kemi/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("says so when everyone is on the latest version", async () => {
    vi.spyOn(programsService, "previewUpdate").mockResolvedValue(ok(preview({ clients: [], changes: [] })) as never);
    renderDialog();
    expect(await screen.findByText(C.nobody)).toBeInTheDocument();
  });
});
