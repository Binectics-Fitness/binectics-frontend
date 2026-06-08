import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommandBar } from "@/components/ds/CommandBar";
import { cleanup } from "@testing-library/react";
import { UnifiedSearchSection } from "@/lib/api/search";

const mockUseCommandBar = vi.fn();
const mockUseUnifiedSearch = vi.fn();
const mockPush = vi.fn();

vi.mock("@/hooks/useCommandBar", () => ({
  useCommandBar: () => mockUseCommandBar(),
  closeCommandBar: vi.fn(),
}));

vi.mock("@/lib/queries/search", () => ({
  useUnifiedSearch: (...args: unknown[]) => mockUseUnifiedSearch(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("CommandBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCommandBar.mockReturnValue({
      open: true,
      close: vi.fn(),
    });
    mockUseUnifiedSearch.mockReturnValue({
      data: {
        query: "",
        sections: {
          [UnifiedSearchSection.MARKETPLACE]: [],
          [UnifiedSearchSection.BOOKINGS]: [],
          [UnifiedSearchSection.TEAMS]: [],
          [UnifiedSearchSection.PLANS]: [],
        },
        meta: { limitPerSection: 5 },
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders static command groups", () => {
    render(<CommandBar />);

    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
  });

  it("renders marketplace group when API returns listing matches", async () => {
    mockUseUnifiedSearch.mockReturnValue({
      data: {
        query: "elite",
        sections: {
          [UnifiedSearchSection.MARKETPLACE]: [
            {
              id: "abc123",
              title: "Elite Strength Gym",
              subtitle: "Cape Town",
              kind: "listing",
              action_url: "/marketplace/abc123",
            },
          ],
          [UnifiedSearchSection.BOOKINGS]: [],
          [UnifiedSearchSection.TEAMS]: [],
          [UnifiedSearchSection.PLANS]: [],
        },
        meta: { limitPerSection: 5 },
      },
      isLoading: false,
    });

    render(<CommandBar />);

    const input = screen.getByPlaceholderText("Search · jump · run an action...");
    fireEvent.change(input, { target: { value: "elite" } });

    await waitFor(() => {
      expect(screen.getByText("Marketplace")).toBeInTheDocument();
      expect(screen.getByText("Elite Strength Gym")).toBeInTheDocument();
    });
  });

  it("renders bookings, teams, and plans groups from unified results", async () => {
    mockUseUnifiedSearch.mockReturnValue({
      data: {
        query: "fit",
        sections: {
          [UnifiedSearchSection.MARKETPLACE]: [],
          [UnifiedSearchSection.BOOKINGS]: [
            {
              id: "b1",
              title: "Mina Adebayo",
              subtitle: "confirmed",
              kind: "booking",
              action_url: "/dashboard/bookings",
            },
          ],
          [UnifiedSearchSection.TEAMS]: [
            {
              id: "t1",
              title: "Fitzone Org",
              subtitle: "gym_owner",
              kind: "organization",
              action_url: "/dashboard/team/t1",
            },
          ],
          [UnifiedSearchSection.PLANS]: [
            {
              id: "p1",
              title: "Fitzone Gold",
              subtitle: "USD 49",
              kind: "plan",
              action_url: "/dashboard/settings",
            },
          ],
        },
        meta: { limitPerSection: 5 },
      },
      isLoading: false,
    });

    render(<CommandBar />);
    const input = screen.getByPlaceholderText("Search · jump · run an action...");
    fireEvent.change(input, { target: { value: "fit" } });

    await waitFor(() => {
      expect(screen.getByText("Bookings")).toBeInTheDocument();
      expect(screen.getByText("Mina Adebayo")).toBeInTheDocument();
      expect(screen.getByText("Teams")).toBeInTheDocument();
      expect(screen.getByText("Fitzone Org")).toBeInTheDocument();
      expect(screen.getByText("Plans")).toBeInTheDocument();
      expect(screen.getByText("Fitzone Gold")).toBeInTheDocument();
    });
  });

  it("does not render unified API groups for one-character queries", async () => {
    mockUseUnifiedSearch.mockReturnValue({
      data: {
        query: "f",
        sections: {
          [UnifiedSearchSection.MARKETPLACE]: [
            {
              id: "abc123",
              title: "Elite Strength Gym",
              subtitle: "Cape Town",
              kind: "listing",
              action_url: "/marketplace/abc123",
            },
          ],
          [UnifiedSearchSection.BOOKINGS]: [
            {
              id: "b1",
              title: "Mina Adebayo",
              subtitle: "confirmed",
              kind: "booking",
              action_url: "/dashboard/bookings",
            },
          ],
          [UnifiedSearchSection.TEAMS]: [],
          [UnifiedSearchSection.PLANS]: [],
        },
        meta: { limitPerSection: 5 },
      },
      isLoading: false,
    });

    render(<CommandBar />);
    const input = screen.getByPlaceholderText("Search · jump · run an action...");
    fireEvent.change(input, { target: { value: "f" } });

    await waitFor(() => {
      expect(screen.queryByText("Marketplace")).not.toBeInTheDocument();
      expect(screen.queryByText("Bookings")).not.toBeInTheDocument();
      expect(screen.queryByText("Elite Strength Gym")).not.toBeInTheDocument();
      expect(screen.queryByText("Mina Adebayo")).not.toBeInTheDocument();
    });
  });

  it("keeps command bar usable when unified search returns null data", async () => {
    mockUseUnifiedSearch.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<CommandBar />);
    const input = screen.getByPlaceholderText("Search · jump · run an action...");
    fireEvent.change(input, { target: { value: "fit" } });

    await waitFor(() => {
      expect(screen.getByText("No results for “fit”")).toBeInTheDocument();
      expect(screen.queryByText("Marketplace")).not.toBeInTheDocument();
      expect(screen.queryByText("Bookings")).not.toBeInTheDocument();
    });
  });

  it("keeps command bar usable when unified search sections are missing", async () => {
    mockUseUnifiedSearch.mockReturnValue({
      data: {
        query: "fit",
        sections: {} as any,
        meta: { limitPerSection: 5 },
      },
      isLoading: false,
    });

    render(<CommandBar />);
    const input = screen.getByPlaceholderText("Search · jump · run an action...");
    fireEvent.change(input, { target: { value: "fit" } });

    await waitFor(() => {
      expect(screen.getByText("No results for “fit”")).toBeInTheDocument();
      expect(screen.queryByText("Marketplace")).not.toBeInTheDocument();
      expect(screen.queryByText("Bookings")).not.toBeInTheDocument();
      expect(screen.queryByText("Teams")).not.toBeInTheDocument();
      expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    });
  });

  it("ignores malformed unified items and renders only valid ones", async () => {
    mockUseUnifiedSearch.mockReturnValue({
      data: {
        query: "fit",
        sections: {
          [UnifiedSearchSection.MARKETPLACE]: [
            {
              id: "broken-no-title",
              subtitle: "Cape Town",
              kind: "listing",
              action_url: "/marketplace/broken-no-title",
            },
            {
              id: "broken-no-url",
              title: "Broken Missing URL",
              subtitle: "Cape Town",
              kind: "listing",
            },
            {
              id: "ok-1",
              title: "Valid Fit Gym",
              subtitle: "Cape Town",
              kind: "listing",
              action_url: "/marketplace/ok-1",
            },
          ],
          [UnifiedSearchSection.BOOKINGS]: [],
          [UnifiedSearchSection.TEAMS]: [],
          [UnifiedSearchSection.PLANS]: [],
        },
        meta: { limitPerSection: 5 },
      },
      isLoading: false,
    });

    render(<CommandBar />);
    const input = screen.getByPlaceholderText("Search · jump · run an action...");
    fireEvent.change(input, { target: { value: "fit" } });

    await waitFor(() => {
      expect(screen.getByText("Marketplace")).toBeInTheDocument();
      expect(screen.getByText("Valid Fit Gym")).toBeInTheDocument();
      expect(screen.queryByText("Broken Missing URL")).not.toBeInTheDocument();
      expect(screen.queryByText("broken-no-title")).not.toBeInTheDocument();
    });
  });
});
