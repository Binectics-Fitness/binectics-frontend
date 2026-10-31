import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentLockCard } from "@/components/content/ContentLockCard";
import { ContentOffersStrip } from "@/components/content/ContentOffersStrip";
import { deliveredAccess, offersFromListing } from "@/lib/paidContent/offers";
import type { ContentOffer } from "@/lib/api/paidContent";

const offer: ContentOffer = {
  itemKind: "program",
  itemId: "p1",
  title: "Strength Base",
  prices: [
    { currency: "NGN", amountMinor: 1500000 },
    { currency: "USD", amountMinor: 1000 },
  ],
  plans: [{ id: "pl1", name: "Monthly Coaching", priceMinor: 2000000, currency: "NGN", durationDays: 30, planType: "x", listingId: "l1" }],
};

describe("ContentLockCard", () => {
  it("shows each currency's price once, the plan, and a Buy link to the offer page", () => {
    render(<ContentLockCard offer={offer} />);
    expect(screen.getByText(/₦15,000 once/)).toBeTruthy();
    expect(screen.getByText(/\$10 once/)).toBeTruthy();
    expect(screen.getByText(/Included in Monthly Coaching/)).toBeTruthy();
    const link = screen.getByRole("link", { name: "Buy" });
    expect(link.getAttribute("href")).toBe("/dashboard/member/content/programs/p1");
  });

  it("offers Join plan when only a plan includes it", () => {
    render(<ContentLockCard offer={{ ...offer, prices: [] }} />);
    expect(screen.getByRole("link", { name: "Join plan" })).toBeTruthy();
  });

  it("frozen: says access ended and links to see how to renew", () => {
    render(<ContentLockCard offer={{ ...offer, itemKind: "meal_plan", itemId: "m1" }} frozen />);
    expect(screen.getByText("Access ended")).toBeTruthy();
    expect(screen.queryByText(/once/)).toBeNull();
    expect(screen.getByRole("link", { name: "See how to renew" }).getAttribute("href")).toBe(
      "/dashboard/member/content/meal-plans/m1",
    );
  });
});

describe("ContentOffersStrip", () => {
  it("renders nothing when there are no offers", () => {
    const { container } = render(<ContentOffersStrip offers={[]} />);
    expect(container.innerHTML).toBe("");
  });
  it("lists the offers under 'Programs & meal plans'", () => {
    render(<ContentOffersStrip offers={[offer]} />);
    expect(screen.getByRole("heading", { name: "Programs & meal plans" })).toBeTruthy();
    expect(screen.getByText("Strength Base")).toBeTruthy();
  });
});

describe("offers helpers", () => {
  it("reads content_offers off a listing and drops junk or unsellable rows", () => {
    const listing = {
      content_offers: [
        { item_kind: "program", item_id: "a", title: "A", prices: [{ currency: "ngn", amount_minor: 500000 }], plans: [] },
        { item_kind: "meal_plan", item_id: "b", title: "B", prices: [], plans: [] },
        null,
      ],
    };
    const out = offersFromListing(listing);
    expect(out.map((o) => o.itemId)).toEqual(["a"]);
    expect(offersFromListing({})).toEqual([]);
    expect(offersFromListing(null)).toEqual([]);
  });
  it("a delivered copy is frozen only when it says so and names its item", () => {
    expect(deliveredAccess({ access: { state: "frozen" }, paid_access: { item_id: "m1" } })).toEqual({ frozen: true, itemId: "m1" });
    expect(deliveredAccess({ access: { state: "open" }, paid_access: { item_id: "m1" } }).frozen).toBe(false);
    expect(deliveredAccess({ access: { state: "frozen" } }).frozen).toBe(false);
    expect(deliveredAccess({}).frozen).toBe(false);
  });
});
