import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AsyncSpinner } from "@/components/ds";

/** The loader is the Binectics mark (mobile #243), not a generic border ring. */
describe("AsyncSpinner", () => {
  it.each([
    ["inline", 20],
    ["page", 40],
  ] as const)("%s: draws the brand mark, labelled for screen readers", (size, px) => {
    const { container } = render(<AsyncSpinner size={size} label="Loading members" />);
    expect(screen.getByRole("status", { name: "Loading members" })).toBeInTheDocument();
    const mark = screen.getByTestId("brand-loader");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveAttribute("width", String(px));
    expect(mark.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });
});
