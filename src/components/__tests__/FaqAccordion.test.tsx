import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import FaqAccordion from "@/components/FaqAccordion";

const items = [
  { q: "What is Binectics?", a: "A global fitness marketplace." },
  { q: "How do I sign up?", a: "Click the register button." },
  { q: "Is it free?", a: "Explorer tier starts at $19/mo." },
];

describe("FaqAccordion", () => {
  it("renders all question items", () => {
    render(<FaqAccordion items={items} />);
    for (const item of items) {
      expect(screen.getByText(item.q)).toBeInTheDocument();
    }
  });

  it("first item is expanded by default", () => {
    render(<FaqAccordion items={items} />);
    const firstButton = screen.getByText(items[0].q);
    expect(firstButton.closest("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles an item on click", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} />);

    const secondButton = screen.getByText(items[1].q);
    expect(secondButton.closest("button")).toHaveAttribute("aria-expanded", "false");

    await user.click(secondButton);
    expect(secondButton.closest("button")).toHaveAttribute("aria-expanded", "true");

    // First item should now be collapsed
    const firstButton = screen.getByText(items[0].q);
    expect(firstButton.closest("button")).toHaveAttribute("aria-expanded", "false");
  });
});
