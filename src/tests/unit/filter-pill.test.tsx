import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterPill } from "@/components/ds";

/**
 * The unlayered `button { font-size: inherit }` reset in globals.css beats a
 * layered text-[12.5px] utility on a <button>, so FilterPill's size has to be
 * set inline. jsdom applies no stylesheets; this guards the inline size.
 */
describe("FilterPill", () => {
  it("sets its 12.5px label size inline, where the global button reset can't override it", () => {
    render(<FilterPill label="All" count={3} active onClick={() => {}} />);
    const pill = screen.getByRole("button", { name: /All/ });
    expect(pill.style.fontSize).toBe("12.5px");
    expect(pill.className).not.toMatch(/text-\[/);
    expect(pill).toHaveAttribute("aria-pressed", "true");
  });
});
