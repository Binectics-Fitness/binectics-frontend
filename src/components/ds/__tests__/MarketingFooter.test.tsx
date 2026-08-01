import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

// The footer embeds RegionSelector, which reads RegionContext; the
// footer's own content is what's under test, so a minimal region stub
// is enough.
vi.mock("@/contexts/RegionContext", () => ({
  useRegion: () => ({
    country: "NG",
    currency: "NGN",
    setRegion: vi.fn(),
  }),
}));

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
