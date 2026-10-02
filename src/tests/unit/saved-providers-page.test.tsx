import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SavedProvidersClient } from "@/app/dashboard/saved-providers/SavedProvidersClient";
import { marketplaceService, type SavedListingCard } from "@/lib/api/marketplace";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencyList: () => ({ data: [] }),
}));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const card = (over: Partial<SavedListingCard>): SavedListingCard =>
  ({
    _id: "l1",
    account_type: "gym_owner",
    headline: "Strength and conditioning",
    city: "Lagos",
    country_code: "NG",
    average_rating: 4.5,
    review_count: 2,
    verification_badge: "none",
    organization_id: "o1",
    organization: { _id: "o1", name: "Iron Lab" },
    professional: null,
    saved_at: "2026-10-01T10:00:00.000Z",
    ...over,
  }) as SavedListingCard;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SavedProvidersClient />
    </QueryClientProvider>,
  );
}

describe("Saved providers page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the empty state with a way to the marketplace", async () => {
    vi.spyOn(marketplaceService, "getSavedListings").mockResolvedValue({ success: true, data: [] });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Nothing saved yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse marketplace" })).toHaveAttribute("href", "/marketplace");
  });

  it("lists saved providers in the order the API returns, linking to each profile", async () => {
    vi.spyOn(marketplaceService, "getSavedListings").mockResolvedValue({
      success: true,
      data: [
        card({}),
        card({
          _id: "l2",
          account_type: "personal_trainer",
          organization_id: undefined,
          organization: null,
          professional: { _id: "u2", first_name: "Tola", last_name: "Coach" },
          headline: "Strength coach",
          price_from_minor: 500000,
          currency: "NGN",
        }),
      ],
    });
    renderPage();

    const list = await screen.findByRole("list", { name: "Saved providers" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Iron Lab")).toBeInTheDocument();
    expect(within(items[1]).getByText("Tola Coach")).toBeInTheDocument();
    expect(within(items[1]).getByRole("link", { name: "View profile" })).toHaveAttribute("href", "/marketplace/l2");
    expect(screen.getByText("2 saved providers")).toBeInTheDocument();
  });

  it("removes a provider from the list", async () => {
    const list = vi
      .spyOn(marketplaceService, "getSavedListings")
      .mockResolvedValueOnce({ success: true, data: [card({})] })
      .mockResolvedValue({ success: true, data: [] });
    const unsave = vi
      .spyOn(marketplaceService, "unsaveListing")
      .mockResolvedValue({ success: true, data: { listing_id: "l1", saved: false } });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Remove Iron Lab from saved" }));

    expect(unsave).toHaveBeenCalledWith("l1");
    expect(await screen.findByRole("heading", { name: "Nothing saved yet" })).toBeInTheDocument();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it("says so when the list can't load", async () => {
    vi.spyOn(marketplaceService, "getSavedListings").mockResolvedValue({ success: false, message: "boom" });
    renderPage();

    expect(await screen.findByText("Couldn't load your saved providers.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
