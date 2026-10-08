import { useEffect, useRef, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Modal from "@/components/Modal";
import SearchableSelect from "@/components/SearchableSelect";
import { ActionModal } from "@/components/ds/ActionModal";
import FacilityItemFormModal from "@/components/FacilityItemFormModal";
import { InviteClientModal } from "@/components/clients/InviteClientModal";

// The shared Modal closes on Escape unless a child already handled that
// Escape (preventDefault), e.g. a picker closing its own list. In Next the
// React root is the document, so a child's stopPropagation can't stop the
// Modal's document listener; defaultPrevented is the signal it honours.

/** A child that handles Escape natively WITHOUT stopping propagation. */
function HandlesEscape() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && e.preventDefault();
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);
  return <input ref={ref} aria-label="handles escape" />;
}

describe("Modal Escape", () => {
  it("a plain Escape closes the dialog", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Plain">
        <input aria-label="field" />
      </Modal>,
    );
    fireEvent.keyDown(await screen.findByLabelText("field"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("an Escape a child already handled leaves the dialog open", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Handled">
        <HandlesEscape />
      </Modal>,
    );
    const input = await screen.findByLabelText("handles escape");
    expect(fireEvent.keyDown(input, { key: "Escape" })).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    // The same Escape from elsewhere in the dialog still closes it.
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape in an open SearchableSelect closes the list, then the next Escape closes the dialog", async () => {
    function Harness({ onClose }: { onClose: () => void }) {
      const [v, setV] = useState("");
      return (
        <Modal open onClose={onClose} title="Pick" disableCloseGuard>
          <SearchableSelect value={v} onChange={setV} options={[{ label: "Ada", value: "a" }]} placeholder="Choose" />
        </Modal>
      );
    }
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(await screen.findByRole("button", { name: /Choose/ }));
    fireEvent.keyDown(await screen.findByPlaceholderText("Search…"), { key: "Escape" });
    expect(screen.queryByText("Ada")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("existing Modal users still close on Escape", () => {
  it("ActionModal", async () => {
    const onClose = vi.fn();
    render(
      <ActionModal open onClose={onClose} title="Action">
        <p>Body</p>
      </ActionModal>,
    );
    await screen.findByRole("dialog", { name: "Action" });
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("FacilityItemFormModal", async () => {
    const onClose = vi.fn();
    render(<FacilityItemFormModal open onClose={onClose} onSubmit={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("InviteClientModal", async () => {
    const onClose = vi.fn();
    render(<InviteClientModal open onClose={onClose} onInvited={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
