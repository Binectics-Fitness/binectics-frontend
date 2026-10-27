import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchableSelect from "@/components/SearchableSelect";

// Escape inside the open picker closes only the list: it is marked handled
// (defaultPrevented) and stops bubbling, so a surrounding dialog that honours
// defaultPrevented stays open, and focus returns to the trigger.
describe("SearchableSelect Escape", () => {
  it("closes only the list and refocuses the trigger", async () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <SearchableSelect value="" onChange={() => {}} options={[{ label: "Ada", value: "a" }]} placeholder="Pick" />
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /Pick/ });
    vi.useFakeTimers();
    fireEvent.click(trigger);
    act(() => vi.runAllTimers());
    vi.useRealTimers();
    const search = screen.getByPlaceholderText("Search…");
    expect(screen.getByText("Ada")).toBeInTheDocument();
    const notCancelled = fireEvent.keyDown(search, { key: "Escape" });
    expect(notCancelled).toBe(false); // preventDefault was called
    expect(outer).not.toHaveBeenCalled();
    expect(screen.queryByText("Ada")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

// A saved value must not read as "nothing chosen" while the options are still
// loading (the listing editor's Country showed its placeholder for NG).
describe("SearchableSelect saved value", () => {
  it("shows the raw value until its option arrives, then the label", () => {
    const { rerender } = render(<SearchableSelect value="NG" onChange={() => {}} options={[]} placeholder="Pick" />);
    expect(screen.getByRole("button", { name: /NG/ })).toBeInTheDocument();
    rerender(<SearchableSelect value="NG" onChange={() => {}} options={[{ label: "Nigeria · NG", value: "NG" }]} placeholder="Pick" />);
    expect(screen.getByRole("button", { name: /Nigeria · NG/ })).toBeInTheDocument();
  });
});
