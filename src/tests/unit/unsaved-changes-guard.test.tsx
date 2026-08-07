import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

// The guard must close immediately when nothing was typed, but route an
// accidental close through a "Discard changes?" confirm once the form is dirty.

function Harness({ onClose }: { onClose: () => void }) {
  const { requestClose, markDirty, confirmationModal } =
    useUnsavedChangesGuard(onClose);
  return (
    <div>
      <button onClick={markDirty}>type</button>
      <button onClick={requestClose}>close</button>
      {confirmationModal}
    </div>
  );
}

describe("useUnsavedChangesGuard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("closes immediately when nothing has changed", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(screen.getByText("close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/discard changes\?/i)).not.toBeInTheDocument();
  });

  it("asks before discarding once the form is dirty, and keeps you in on cancel", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(screen.getByText("type")); // mark dirty
    fireEvent.click(screen.getByText("close")); // accidental close

    // Does NOT close; shows the confirmation instead.
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/discard changes\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Keep editing"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when the discard is confirmed", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(screen.getByText("type"));
    fireEvent.click(screen.getByText("close"));
    fireEvent.click(screen.getByText("Discard"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not guard when disabled", () => {
    const onClose = vi.fn();
    function Disabled() {
      const { requestClose, markDirty, confirmationModal } =
        useUnsavedChangesGuard(onClose, { enabled: false });
      return (
        <div>
          <button onClick={markDirty}>type</button>
          <button onClick={requestClose}>close</button>
          {confirmationModal}
        </div>
      );
    }
    render(<Disabled />);

    fireEvent.click(screen.getByText("type"));
    fireEvent.click(screen.getByText("close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/discard changes\?/i)).not.toBeInTheDocument();
  });
});
