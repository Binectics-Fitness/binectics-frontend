import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConfirmationModal from "../ConfirmationModal";
import Modal from "../Modal";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";

function Harness({
  isConfirming = false,
  onConfirm = vi.fn(),
  onCancelSpy = vi.fn(),
}: {
  isConfirming?: boolean;
  onConfirm?: () => void;
  onCancelSpy?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Remove member
      </button>
      <ConfirmationModal
        isOpen={open}
        title="Remove this member?"
        description="They lose access straight away."
        confirmLabel="Remove"
        onConfirm={onConfirm}
        onCancel={() => {
          onCancelSpy();
          setOpen(false);
        }}
        isConfirming={isConfirming}
      />
    </>
  );
}

function openFromTrigger() {
  const trigger = screen.getByRole("button", { name: "Remove member" });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe("ConfirmationModal", () => {
  it("is a modal dialog labelled by its title and described by its text", () => {
    render(<Harness />);
    openFromTrigger();

    const dialog = screen.getByRole("dialog", { name: "Remove this member?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "They lose access straight away.",
    );
  });

  it("keeps the danger styling on the confirm button by default", () => {
    render(<Harness />);
    openFromTrigger();
    const confirm = screen.getByRole("button", { name: "Remove" });
    expect(confirm.className).toMatch(/danger/);
  });

  it("closes on Escape", () => {
    const onCancelSpy = vi.fn();
    render(<Harness onCancelSpy={onCancelSpy} />);
    openFromTrigger();

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });

    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus inside on open and back to the trigger on close", () => {
    render(<Harness />);
    const trigger = openFromTrigger();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Cancel" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps Tab inside the dialog", () => {
    render(<Harness />);
    openFromTrigger();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Remove" });

    confirm.focus();
    fireEvent.keyDown(confirm, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);

    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it("does not close on Escape, backdrop or Cancel while a confirm is pending", () => {
    const onCancelSpy = vi.fn();
    render(<Harness isConfirming onCancelSpy={onCancelSpy} />);
    openFromTrigger();

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    fireEvent.click(screen.getByTestId("confirmation-backdrop"));
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toBeDisabled();
    fireEvent.click(cancel);

    expect(onCancelSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on a backdrop click when nothing is pending", () => {
    const onCancelSpy = vi.fn();
    render(<Harness onCancelSpy={onCancelSpy} />);
    openFromTrigger();
    fireEvent.click(screen.getByTestId("confirmation-backdrop"));
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves keys aimed at an alert raised over a pending confirm alone (no keyboard trap)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    function HookHarness() {
      const { requestConfirmation, confirmationModal } = useConfirmationModal();
      return (
        <>
          <button
            type="button"
            onClick={() =>
              requestConfirmation({
                title: "Remove this member?",
                description: "They lose access straight away.",
                confirmLabel: "Remove",
                onConfirm: () => Promise.reject(new Error("boom")),
              })
            }
          >
            Remove member
          </button>
          {confirmationModal}
        </>
      );
    }
    render(<HookHarness />);
    openFromTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    // The failure alert opens on top while the confirm is still pending.
    const ok = await screen.findByRole("button", { name: "OK" });
    expect(document.activeElement).toBe(ok);
    const panel = screen.getByRole("dialog", { name: "Remove this member?" });

    // Tab and Escape from OK are not claimed by the confirm underneath.
    expect(fireEvent.keyDown(ok, { key: "Tab" })).toBe(true);
    expect(document.activeElement).toBe(ok);
    expect(panel).not.toContainElement(document.activeElement as HTMLElement);
    expect(fireEvent.keyDown(ok, { key: "Escape" })).toBe(true);

    fireEvent.click(ok);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled(),
    );
    expect(screen.getByRole("dialog", { name: "Remove this member?" })).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("as a Modal's discard guard, Escape cancels only the guard", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Edit plan">
        <input aria-label="Plan name" />
      </Modal>,
    );
    const input = screen.getByLabelText("Plan name");
    fireEvent.input(input, { target: { value: "Gold" } });

    // First Escape: the dirty Modal asks before discarding.
    fireEvent.keyDown(input, { key: "Escape" });
    expect(
      screen.getByRole("dialog", { name: "Discard changes?" }),
    ).toBeInTheDocument();

    // Second Escape: closes the guard, and the Modal stays open.
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(
      screen.queryByRole("dialog", { name: "Discard changes?" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Edit plan" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
