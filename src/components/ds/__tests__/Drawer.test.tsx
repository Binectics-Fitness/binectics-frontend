import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Drawer } from "../Drawer";

function Harness({ title = "Details" }: { title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open row</button>
      <button type="button">Elsewhere</button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title || undefined}>
        <a href="#a">First link</a>
        <button type="button">Last action</button>
      </Drawer>
    </>
  );
}

describe("Drawer focus", () => {
  it("moves focus to the close button when it opens", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open row" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
  });

  it("focuses the panel itself when there is no title", async () => {
    render(<Harness title="" />);
    await userEvent.click(screen.getByRole("button", { name: "Open row" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
  });

  it("keeps Tab and Shift+Tab inside the panel", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open row" }));
    const close = screen.getByRole("button", { name: "Close" });
    await waitFor(() => expect(close).toHaveFocus());
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "First link" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
  });

  it("pulls Shift+Tab from the panel itself back inside", async () => {
    render(<Harness title="" />);
    await userEvent.click(screen.getByRole("button", { name: "Open row" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
  });

  it("returns focus to the opener on Escape and on the close button", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open row" });
    await userEvent.click(opener);
    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(opener).toHaveFocus();
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(opener);
    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(opener).toHaveFocus();
    vi.useRealTimers();
  });
});
