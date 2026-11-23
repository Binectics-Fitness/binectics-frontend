import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Web Explore (parity batch C): the URL drives the request, the controls
 * write the URL, "Near me" falls back to the profile place and says so,
 * and none of the old unbacked claims are left.
 */
const replace = vi.fn();
let query = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/marketplace",
}));
let authUser: Record<string, unknown> | null = null;
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: authUser, isLoading: false }) }));
vi.mock("@/contexts/RegionContext", () => ({
  useRegion: () => ({ formatAmount: (n: number) => String(n), currency: "NGN", currencies: [] }),
}));
vi.mock("@/components/MarketplaceAuthCluster", () => ({ MarketplaceAuthCluster: () => null }));
vi.mock("@/components/marketplace/SaveListingButton", () => ({ SaveListingButton: () => null }));

const searchListings = vi.fn();
vi.mock("@/lib/api/marketplace", () => ({ marketplaceService: { searchListings: (p: unknown) => searchListings(p) } }));
// No /utility/cities match: the profile city is sent as text.
vi.mock("@/lib/api/client", () => ({ apiClient: { get: vi.fn(async () => ({ success: true, data: [] })) } }));

const LISTING = {
  _id: "l1",
  account_type: "personal_trainer",
  headline: "x",
  professional: { _id: "p1", first_name: "Eze", last_name: "Okafor" },
  average_rating: 0,
  review_count: 0,
  city: "Lagos",
};

function page(listings: unknown[] = [LISTING], total = listings.length) {
  return { success: true, data: { listings, pagination: { page: 1, limit: 20, total, total_pages: 1 } } };
}

async function renderPage() {
  const { default: MarketplacePage } = await import("@/app/marketplace/page");
  return render(<MarketplacePage />);
}

beforeEach(async () => {
  replace.mockReset();
  searchListings.mockReset();
  searchListings.mockResolvedValue(page());
  query = "";
  authUser = null;
  const { clearProfileCityCache } = await import("@/lib/marketplace/explorePlace");
  clearProfileCityCache();
  Object.defineProperty(navigator, "geolocation", { value: undefined, configurable: true });
});

describe("web Explore", () => {
  it("sends the URL's filters as the API's query parameters", async () => {
    query = "type=personal_trainer&q=yoga&sort=rating&accepting=1&verified=1&rating=4&page=2";
    await renderPage();
    await screen.findByText("Eze Okafor");
    expect(searchListings).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
      account_type: "personal_trainer",
      q: "yoga",
      sort: "rating",
      accepting_clients: true,
      verified_only: true,
      min_rating: 4,
    });
    expect((screen.getByRole("searchbox", { name: "Search providers" }) as HTMLInputElement).value).toBe("yoga");
  });

  it("measures from a picked city in the URL", async () => {
    query = "city=Abuja&country=NG&lat=9.07&lng=7.4&radius=10";
    await renderPage();
    await screen.findByText("Eze Okafor");
    expect(searchListings).toHaveBeenLastCalledWith({ page: 1, limit: 20, lat: 9.07, lng: 7.4, radius_km: 10 });
    expect(screen.getByTestId("explore-place").textContent).toBe("Abuja, NG · Picked city");
  });

  it("writes search, type and toggles to the URL", async () => {
    await renderPage();
    await screen.findByText("Eze Okafor");
    vi.useFakeTimers();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search providers" }), { target: { value: "pcos" } });
    act(() => vi.advanceTimersByTime(450));
    vi.useRealTimers();
    expect(replace).toHaveBeenLastCalledWith("/marketplace?q=pcos", { scroll: false });

    fireEvent.click(screen.getByRole("button", { name: "Gyms" }));
    expect(replace).toHaveBeenLastCalledWith("/marketplace?type=gym_owner", { scroll: false });

    fireEvent.click(screen.getAllByRole("switch", { name: "Accepting new clients" })[0]);
    expect(replace).toHaveBeenLastCalledWith("/marketplace?accepting=1", { scroll: false });
  });

  it("falls back to the profile city when location is refused, and says so", async () => {
    authUser = { id: "u1", role: "USER", city: "Lagos", country_code: "NG" };
    const getCurrentPosition = vi.fn((_s: PositionCallback, e?: PositionErrorCallback | null) => e?.({ code: 1 } as GeolocationPositionError));
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true });
    await renderPage();
    await screen.findByText("Eze Okafor");
    // Unresolved profile city: sent as text, and named as the profile city.
    expect(searchListings).toHaveBeenLastCalledWith({ page: 1, limit: 20, city: "Lagos", country_code: "NG" });
    expect(screen.getByTestId("explore-place").textContent).toBe("Lagos, NG · Your profile city");
    // The purpose is on screen before the browser asks.
    expect(screen.getAllByText("Used only to sort by distance. Not saved.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Use my location" })[0]);
    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalled());
    expect((await screen.findAllByText("Location is off. Showing Lagos, NG, your profile city.")).length).toBeGreaterThan(0);
  });

  it("asks for location when Nearest is chosen without a place", async () => {
    query = "sort=rating";
    const getCurrentPosition = vi.fn((s: PositionCallback) => s({ coords: { latitude: 6.5, longitude: 3.4 } } as GeolocationPosition));
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true });
    await renderPage();
    await screen.findByText("Eze Okafor");
    fireEvent.click(screen.getAllByRole("radio", { name: "Nearest" })[0]);
    expect(replace).toHaveBeenLastCalledWith("/marketplace", { scroll: false });
    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledTimes(1));
  });

  it("shows a retry on failure and the mobile empty copy", async () => {
    searchListings.mockResolvedValueOnce({ success: false, message: "boom" });
    await renderPage();
    expect(await screen.findByText("Couldn't load providers")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Eze Okafor")).toBeTruthy();

    searchListings.mockResolvedValue(page([], 0));
    query = "type=gym_owner&accepting=1";
    const { default: MarketplacePage } = await import("@/app/marketplace/page");
    render(<MarketplacePage />);
    expect(await screen.findByText("No gyms match")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: 'Remove "Accepting clients"' }));
    expect(replace).toHaveBeenLastCalledWith("/marketplace?type=gym_owner", { scroll: false });
  });

  it("makes no unbacked claims", async () => {
    await renderPage();
    await screen.findByText("Eze Okafor");
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/verified by our team/i);
    expect(text).not.toMatch(/Featured/);
    expect(text).not.toMatch(/Lagos, NG/);
    expect(document.querySelector("em, .italic, .font-serif")).toBeNull();
  });
});
