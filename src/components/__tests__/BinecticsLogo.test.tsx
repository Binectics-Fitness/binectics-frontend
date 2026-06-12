import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BinecticsMark, BinecticsLockup } from "@/components/BinecticsLogo";

describe("BinecticsMark", () => {
  it("renders an SVG element", () => {
    const { container } = render(<BinecticsMark />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 48 48");
  });

  it("applies custom size", () => {
    const { container } = render(<BinecticsMark size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });
});

describe("BinecticsLockup", () => {
  it("renders the mark and brand name", () => {
    const { container } = render(<BinecticsLockup />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(screen.getByText("Binectics")).toBeInTheDocument();
  });
});
