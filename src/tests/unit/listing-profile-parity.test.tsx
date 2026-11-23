import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingProfile } from "@/app/marketplace/[listingId]/ListingProfile";
import {
  FacilityStatus,
  MembershipPlanType,
  MembershipSubscriptionStatus as S,
  type MarketplaceMembershipPlan,
} from "@/lib/types";
import type { PlatformCurrency } from "@/lib/api/currencies";

/**
 * The public profile matching mobile #304: the business or the person as
 * the title, a real photo as the hero with the logo as an avatar, a working
 * gallery, facilities, addresses, and a member who sees their membership
 * instead of a checkout.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn(), replace: vi.fn() }) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

let authState: { user: { id: string } | null; isLoading: boolean } = { user: null, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/components/MarketplaceAuthCluster", () => ({ MarketplaceAuthCluster: () => null }));
vi.mock("@/components/marketplace/SaveListingButton", () => ({ SaveListingButton: () => null }));
vi.mock("@/components/marketplace/ListingReviews", () => ({
  ListingReviews: () => null,
  useListingRating: (_id: string, _type: string, fallback: unknown) => fallback,
}));
vi.mock("@/components/marketplace/ConnectRequestButton", () => ({ ConnectRequestButton: () => null }));
vi.mock("@/components/marketplace/ListingMessageButton", () => ({ ListingMessageButton: () => null }));
vi.mock("@/components/marketplace/ShareListingButton", () => ({ ShareListingButton: () => null }));
vi.mock("@/components/classes/ListingClassesSection", () => ({ ListingClassesSection: () => null }));

let mySubs: unknown[] = [];
const subsEnabled = vi.fn();
vi.mock("@/lib/queries/marketplace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/queries/marketplace")>()),
  useMySubscriptions: (enabled: boolean) => {
    subsEnabled(enabled);
    return { data: enabled ? mySubs : undefined };
  },
}));

const NGN: PlatformCurrency = {
  code: "NGN",
  name: "Nigerian naira",
  symbol: "₦",
  minor_unit: 2,
  selectable: { price: true, charge_card: true, charge_transfer: true } as PlatformCurrency["selectable"],
  suggested_for_countries: ["NG"],
  gateways: [{ gateway: "paystack", label: "Paystack", methods: ["card"] }],
};
vi.mock("@/lib/queries/currencies", () => ({ useCurrencies: () => ({ all: [NGN], data: [NGN] }) }));
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({ isEnabled: () => false, data: undefined, isLoading: false }),
}));

const LOGO = "https://res.cloudinary.com/x/org-profile.png";

const gym = {
  _id: "l-gym",
  account_type: "gym_owner",
  headline: "Strength, cardio and classes across Lekki, Yaba and Ikeja",
  average_rating: 0,
  review_count: 0,
  profile_image: LOGO,
  photos: [LOGO, "https://res.cloudinary.com/x/racks.jpg", "https://res.cloudinary.com/x/cardio.jpg"],
  amenities: ["WIFI", "TOWEL_SERVICE"],
  facility_items: [
    { _id: "f1", name: "Cardio deck", category: "CARDIO", status: FacilityStatus.AVAILABLE, image_url: "https://res.cloudinary.com/x/deck.jpg" },
    { _id: "f2", name: "Sauna", category: "WELLNESS", status: FacilityStatus.MAINTENANCE },
  ],
  organization_id: { _id: "org-gym", name: "Imole Forge Fitness" },
  professional_id: { _id: "u-owner", first_name: "Folake", last_name: "Adewale" },
};

const trainer = {
  _id: "l-coach",
  account_type: "personal_trainer",
  headline: "Strength & conditioning coach · Surulere",
  average_rating: 0,
  review_count: 0,
  photos: ["https://res.cloudinary.com/x/coach.jpg"],
  organization_id: { _id: "org-ws", name: "Chinedu Eze Training" },
  professional_id: { _id: "u-coach", first_name: "Chinedu", last_name: "Eze" },
};

const plan = (over: Partial<MarketplaceMembershipPlan>): MarketplaceMembershipPlan => ({
  _id: "p1",
  organization_id: "org-gym",
  created_by: "u-owner",
  name: "Plan",
  plan_type: MembershipPlanType.SUBSCRIPTION,
  duration_days: 30,
  price_minor: 0,
  currency: "NGN",
  features: [],
  is_active: true,
  is_public: true,
  created_at: "",
  updated_at: "",
  ...over,
});
const dayPass = plan({ _id: "p-day", name: "Day Pass", plan_type: MembershipPlanType.ONE_TIME, price_minor: 500_000 });
const monthly = plan({ _id: "p-monthly", name: "All-Access Monthly", price_minor: 3_500_000 });

const membership = (over: Record<string, unknown> = {}) => ({
  _id: "sub-1",
  organization_id: { _id: "org-gym", name: "Imole Forge Fitness" },
  plan_id: { _id: "p-monthly", name: "All-Access Monthly", plan_type: "subscription" },
  listing_id: { _id: "l-gym", headline: "Gym" },
  member_user_id: "m1",
  status: S.ACTIVE,
  start_date: "2026-11-01",
  end_date: "2026-12-23T12:00:00.000Z",
  amount_paid_minor: 3_500_000,
  currency: "NGN",
  auto_renew: true,
  ...over,
});

function renderProfile(listing: object, plans: MarketplaceMembershipPlan[] = []) {
  render(<ListingProfile listing={listing as never} initialPlans={plans} />);
  return within(document.getElementById("booking-card") as HTMLElement);
}

beforeEach(() => {
  vi.clearAllMocks();
  authState = { user: null, isLoading: false };
  mySubs = [];
});

describe("title and pictures", () => {
  it("titles a gym by its business, with the headline under it and the owner as a byline", () => {
    renderProfile(gym);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Imole Forge Fitness");
    expect(screen.getByText(gym.headline)).toBeInTheDocument();
    expect(screen.getByText("Owned by Folake Adewale")).toBeInTheDocument();
  });

  it("titles a trainer by their own name, not their workspace's", () => {
    renderProfile(trainer);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Chinedu Eze");
    expect(screen.getByText(trainer.headline)).toBeInTheDocument();
    expect(screen.queryByText(/Chinedu Eze Training/)).toBeNull();
  });

  it("never uses the logo as the hero: the gallery is the real photos, the logo an avatar", () => {
    renderProfile(gym);
    const gallery = screen.getByRole("region", { name: "Photos" });
    const srcs = within(gallery).getAllByRole("img").map((i) => i.getAttribute("src"));
    expect(srcs[0]).toBe("https://res.cloudinary.com/x/racks.jpg");
    expect(srcs).not.toContain(LOGO);
    // Decorative (alt=""): the name is the heading beside it.
    expect(screen.getByTestId("listing-avatar").querySelector("img")).toHaveAttribute("src", LOGO);
  });

  it("opens the full-screen viewer from Show all, moves with the arrows and closes on Escape", async () => {
    renderProfile(gym);
    await userEvent.click(screen.getByRole("button", { name: "Show all 2" }));
    const viewer = screen.getByRole("dialog", { name: "Imole Forge Fitness photos" });
    expect(within(viewer).getByText("1 / 2")).toBeInTheDocument();
    await userEvent.click(within(viewer).getByRole("button", { name: "Next photo" }));
    expect(within(viewer).getByText("2 / 2")).toBeInTheDocument();
    expect(within(viewer).getByRole("img")).toHaveAttribute("src", "https://res.cloudinary.com/x/cardio.jpg");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a plain panel with the logo when there is no photo at all", () => {
    renderProfile({ ...gym, photos: [LOGO], facility_items: [] });
    expect(screen.queryByRole("region", { name: "Photos" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
  });
});

describe("facilities, amenities and addresses", () => {
  it("lists facility items with their photos and marks one under maintenance", () => {
    renderProfile(gym);
    const section = document.getElementById("facilities") as HTMLElement;
    expect(within(section).getByText("Cardio deck")).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "Open photo of Cardio deck" })).toBeInTheDocument();
    const sauna = within(section).getByText("Sauna").closest("li") as HTMLElement;
    expect(within(sauna).getByText("Under maintenance")).toBeInTheDocument();
    expect(within(section).getAllByText("Under maintenance")).toHaveLength(1);
  });

  it("labels amenities in words, not codes", () => {
    renderProfile(gym);
    const section = document.getElementById("amenities") as HTMLElement;
    expect(within(section).getByText("WiFi")).toBeInTheDocument();
    expect(within(section).getByText("Towel Service")).toBeInTheDocument();
    expect(within(section).queryByText("TOWEL_SERVICE")).toBeNull();
  });

  it("shows the gym's addresses with Open in Maps when the API sends them", () => {
    renderProfile({
      ...gym,
      locations: [
        { id: "a", name: "Yaba", street: "9 Fola Osibo Road", city: "Lagos", is_primary: false },
        { id: "b", name: "Lekki Phase 1", street: "1 Admiralty Way", city: "Lagos", is_primary: true },
      ],
    });
    const section = document.getElementById("location") as HTMLElement;
    expect(within(section).getByRole("heading", { name: "Locations" })).toBeInTheDocument();
    const rows = within(section).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Lekki Phase 1");
    expect(rows[0]).toHaveTextContent("1 Admiralty Way, Lagos");
    const link = within(rows[1]).getByRole("link", { name: "Open in Maps" });
    expect(link.getAttribute("href")).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Locations · 2" })).toBeInTheDocument();
  });

  it("hides the address section when the API sends none", () => {
    renderProfile(gym);
    expect(document.getElementById("location")).toBeNull();
    expect(screen.queryByRole("link", { name: /^Location/ })).toBeNull();
  });
});

describe("the buy area", () => {
  it("a newcomer with several plans has nothing picked and checkout waits", () => {
    authState = { user: { id: "m1" }, isLoading: false };
    const card = renderProfile(gym, [dayPass, monthly]);
    expect(card.getAllByRole("radio").every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    expect(card.getByRole("button", { name: /Continue to checkout/ })).toBeDisabled();
  });

  it("does not ask for memberships when signed out", () => {
    renderProfile(gym, [dayPass, monthly]);
    expect(subsEnabled).toHaveBeenLastCalledWith(false);
  });

  it("a member sees their membership and Manage membership, never checkout", () => {
    authState = { user: { id: "m1" }, isLoading: false };
    mySubs = [membership()];
    const card = renderProfile(gym, [dayPass, monthly]);
    expect(card.getByText("Your membership")).toBeInTheDocument();
    expect(card.getByTestId("membership-line")).toHaveTextContent(/All-Access Monthly · Active · renews 23 Dec 2026/);
    expect(card.getByRole("link", { name: "Manage membership" })).toHaveAttribute(
      "href",
      "/dashboard/member/billing?subscriptionId=sub-1",
    );
    // Also near the top for a phone, where the booking card is far below.
    expect(within(screen.getByTestId("member-strip")).getByRole("link", { name: "Manage membership" })).toHaveAttribute(
      "href",
      "/dashboard/member/billing?subscriptionId=sub-1",
    );
    expect(card.queryByRole("button", { name: /Continue to checkout/ })).toBeNull();
    expect(screen.queryByText(/Continue to checkout/)).toBeNull();
    // Their plan is theirs; nothing else is picked for them.
    expect(card.getByRole("radio", { name: /All-Access Monthly/ })).toBeDisabled();
    expect(card.getAllByText("Your current plan").length).toBeGreaterThan(0);
    expect(card.getByRole("radio", { name: /Day Pass/ })).not.toBeChecked();
    expect(card.queryByRole("button", { name: /^Add/ })).toBeNull();
  });

  it("a member adds a second plan on purpose, with an explicit Add", async () => {
    authState = { user: { id: "m1" }, isLoading: false };
    mySubs = [membership()];
    const card = renderProfile(gym, [dayPass, monthly]);
    await userEvent.click(card.getByRole("radio", { name: /Day Pass/ }));
    const add = card.getByRole("button", { name: /^Add · Day Pass · ₦5,000/ });
    // Manage membership stays the primary action.
    expect(card.getByRole("link", { name: "Manage membership" })).toBeInTheDocument();
    await userEvent.click(add);
    expect(push).toHaveBeenCalledWith("/checkout?listing=l-gym&plan=p-day");
  });

  it("recognises a gym member enrolled at the desk, by the renewal listing or the gym", () => {
    authState = { user: { id: "m1" }, isLoading: false };
    mySubs = [membership({ listing_id: undefined, renewal_listing_id: null, organization_id: "org-gym", status: S.PAUSED })];
    const card = renderProfile(gym, [dayPass, monthly]);
    expect(card.getByTestId("membership-line")).toHaveTextContent("All-Access Monthly · Paused");
  });

  it("an ended membership is not a member", () => {
    authState = { user: { id: "m1" }, isLoading: false };
    mySubs = [membership({ status: S.EXPIRED })];
    const card = renderProfile(gym, [dayPass, monthly]);
    expect(card.queryByText("Your membership")).toBeNull();
    expect(card.getByRole("button", { name: /Continue to checkout/ })).toBeInTheDocument();
  });
});
