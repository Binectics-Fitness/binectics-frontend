import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

describe("MarketingFooter", () => {
  it("renders all column headers", () => {
    render(<MarketingFooter />);
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("renders the brand name", () => {
    render(<MarketingFooter />);
    // The footer contains the Binectics brand name
    expect(screen.getAllByText("Binectics").length).toBeGreaterThanOrEqual(1);
  });

  it("renders navigation links", () => {
    render(<MarketingFooter />);
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Help center")).toBeInTheDocument();
  });
});
