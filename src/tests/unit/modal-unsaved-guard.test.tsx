import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Modal from "@/components/Modal";

// Integration: the shared Modal auto-detects typing and guards its close paths
// (X / overlay / ESC) through the "Discard changes?" confirmation — no per-modal
// wiring. Complements useUnsavedChangesGuard's unit test.

describe("Modal unsaved-changes guard", () => {
  it("closes immediately when nothing was typed", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Edit">
        <input aria-label="field" />
      </Modal>,
    );

    fireEvent.click(await screen.findByLabelText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/discard changes\?/i)).not.toBeInTheDocument();
  });

  it("guards the close after typing, and only closes on Discard", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Edit">
        <input aria-label="field" />
      </Modal>,
    );

    // Type → dirty.
    fireEvent.change(await screen.findByLabelText("field"), {
      target: { value: "hello" },
    });

    // Click the X → confirmation shown, NOT closed.
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/discard changes\?/i)).toBeInTheDocument();

    // Keep editing → stays open.
    fireEvent.click(screen.getByText("Keep editing"));
    expect(onClose).not.toHaveBeenCalled();

    // Try again and confirm → closes.
    fireEvent.click(screen.getByLabelText("Close"));
    fireEvent.click(screen.getByText("Discard"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not guard when disableCloseGuard is set", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Edit" disableCloseGuard>
        <input aria-label="field" />
      </Modal>,
    );

    fireEvent.change(await screen.findByLabelText("field"), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByLabelText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/discard changes\?/i)).not.toBeInTheDocument();
  });
});
