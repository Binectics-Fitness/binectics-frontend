import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ListingReviews, reviewTargetFor } from "@/components/marketplace/ListingReviews";
import {
  ConnectRequestButton,
  connectionStateFromRefusal,
  resolveConnectionState,
} from "@/components/marketplace/ConnectRequestButton";
import { reviewsService, ReviewStatus, ReviewTargetType, type Review } from "@/lib/api/reviews";
import { marketplaceService } from "@/lib/api/marketplace";
import { MarketplaceRequestStatus, MarketplaceRequestType } from "@/lib/types";

/**
 * Discoverability W3 on a listing: members write reviews on web (F10),
 * gated on the API's eligibility, and ask a trainer or dietitian to connect
 * (F17), as on mobile.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/marketplace/l1",
}));
let mockUser: { id: string; role: string } | null = { id: "m1", role: "USER" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isLoading: false }),
}));
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  }),
}));

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const withQuery = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const review = (over: Partial<Review> = {}): Review => ({
  id: "r1",
  targetType: ReviewTargetType.DIETITIAN,
  targetId: "l1",
  reviewerUserId: "other",
  reviewerName: "Tunde A.",
  rating: 4,
  comment: "Clear plans, quick replies.",
  status: ReviewStatus.VISIBLE,
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  ...over,
});

beforeEach(() => {
  mockUser = { id: "m1", role: "USER" };
  push.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("listing reviews (F10)", () => {
  const reviewsPage = (reviews: Review[]) =>
    ok({ reviews, pagination: { page: 1, limit: 10, total: reviews.length, totalPages: 1 } });

  beforeEach(() => {
    vi.spyOn(reviewsService, "getTargetAggregate").mockReturnValue(
      ok({ targetType: ReviewTargetType.DIETITIAN, targetId: "l1", averageRating: 4, totalReviews: 1 }),
    );
    vi.spyOn(reviewsService, "getTargetReviews").mockReturnValue(reviewsPage([review()]));
  });

  const renderSection = () =>
    render(withQuery(<ListingReviews listingId="l1" accountType="dietitian" providerName="Nouriva" />));

  it("maps each listing type to its review target", () => {
    expect(reviewTargetFor("gym_owner")).toBe(ReviewTargetType.GYM);
    expect(reviewTargetFor("personal_trainer")).toBe(ReviewTargetType.TRAINER);
    expect(reviewTargetFor("dietitian")).toBe(ReviewTargetType.DIETITIAN);
  });

  it("lets an eligible member write a review, sending the API's own source", async () => {
    const eligibility = vi
      .spyOn(reviewsService, "getEligibility")
      .mockReturnValue(ok({ canReview: true, sourceBookingId: "b7" }));
    const create = vi.spyOn(reviewsService, "createReview").mockReturnValue(ok(review({ id: "r2", reviewerUserId: "m1" })));
    renderSection();
    expect(await screen.findByText("Clear plans, quick replies.")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Write a review" }));
    expect(eligibility).toHaveBeenCalledWith(ReviewTargetType.DIETITIAN, "l1");

    const form = screen.getByRole("form", { name: "Review Nouriva" });
    const post = within(form).getByRole("button", { name: "Post review" });
    expect(post).toBeDisabled(); // a rating first
    await userEvent.click(within(form).getByRole("radio", { name: "5 stars" }));
    await userEvent.type(within(form).getByLabelText("What was it like? (optional)"), "Great coach");
    await userEvent.click(post);

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        targetType: ReviewTargetType.DIETITIAN,
        targetId: "l1",
        rating: 5,
        comment: "Great coach",
        sourceBookingId: "b7",
        sourceSubscriptionId: undefined,
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Thanks, your review is posted.");
    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
  });

  it("shows no form, and no reason, to a member the API says can't review", async () => {
    const eligibility = vi
      .spyOn(reviewsService, "getEligibility")
      .mockReturnValue(ok({ canReview: false, reason: "Complete an eligible dietitian engagement before reviewing." }));
    renderSection();
    await waitFor(() => expect(eligibility).toHaveBeenCalled());
    expect(await screen.findByText("Clear plans, quick replies.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Write a review" })).toBeNull();
    expect(screen.queryByText(/eligible/)).toBeNull();
  });

  it("doesn't ask a provider or a signed-out visitor at all", async () => {
    const eligibility = vi.spyOn(reviewsService, "getEligibility");
    mockUser = { id: "t1", role: "TRAINER" };
    const { unmount } = renderSection();
    expect(await screen.findByText("Clear plans, quick replies.")).toBeInTheDocument();
    unmount();
    mockUser = null;
    renderSection();
    expect(await screen.findByText("Clear plans, quick replies.")).toBeInTheDocument();
    expect(eligibility).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Write a review" })).toBeNull();
  });

  it("doesn't offer a second review to a member who has one", async () => {
    vi.spyOn(reviewsService, "getEligibility").mockReturnValue(ok({ canReview: true }));
    vi.spyOn(reviewsService, "getTargetReviews").mockReturnValue(reviewsPage([review({ reviewerUserId: "m1" })]));
    renderSection();
    expect(await screen.findByTestId("already-reviewed")).toHaveTextContent("You’ve reviewed Nouriva.");
    expect(screen.queryByRole("button", { name: "Write a review" })).toBeNull();
  });

  it("folds the API's 'already reviewed' into the page, not an error", async () => {
    vi.spyOn(reviewsService, "getEligibility").mockReturnValue(ok({ canReview: true }));
    vi.spyOn(reviewsService, "createReview").mockResolvedValue({
      success: false,
      status: 409,
      message: "You have already reviewed this provider",
    });
    renderSection();
    await userEvent.click(await screen.findByRole("button", { name: "Write a review" }));
    await userEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    await userEvent.click(screen.getByRole("button", { name: "Post review" }));
    expect(await screen.findByTestId("already-reviewed")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("says when there are none yet, and shows the provider's reply", async () => {
    vi.spyOn(reviewsService, "getEligibility").mockReturnValue(ok({ canReview: false }));
    vi.spyOn(reviewsService, "getTargetReviews").mockReturnValue(reviewsPage([]));
    vi.spyOn(reviewsService, "getTargetAggregate").mockReturnValue(
      ok({ targetType: ReviewTargetType.DIETITIAN, targetId: "l1", averageRating: 0, totalReviews: 0 }),
    );
    const { unmount } = renderSection();
    expect(await screen.findByText("No reviews yet.")).toBeInTheDocument();
    expect(screen.getByText("0 reviews")).toBeInTheDocument();
    unmount();

    vi.spyOn(reviewsService, "getTargetReviews").mockReturnValue(
      reviewsPage([review({ providerResponse: { message: "Thank you!", createdAt: "2026-10-02T00:00:00.000Z" } })]),
    );
    renderSection();
    expect(await screen.findByText("Response from Nouriva")).toBeInTheDocument();
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
  });
});

describe("request to connect (F17)", () => {
  const renderButton = (over: Partial<React.ComponentProps<typeof ConnectRequestButton>> = {}) =>
    render(
      withQuery(
        <ConnectRequestButton listingId="l1" professionalId="pro1" providerName="Ada" acceptingClients {...over} />,
      ),
    );

  beforeEach(() => {
    vi.spyOn(marketplaceService, "getMyProviders").mockReturnValue(ok({ professionals: [], gyms: [] }));
    vi.spyOn(marketplaceService, "getMyRequests").mockReturnValue(ok([]));
  });

  it("reads where the member stands from their providers and requests", () => {
    const base = { professionalId: "pro1", listingId: "l1" };
    expect(resolveConnectionState({ ...base, providerIds: ["pro1"], requests: [] })).toBe("connected");
    expect(
      resolveConnectionState({ ...base, providerIds: [], requests: [{ listing_id: "l1", status: MarketplaceRequestStatus.PENDING }] }),
    ).toBe("pending");
    expect(
      resolveConnectionState({ ...base, providerIds: [], requests: [{ listing_id: "l1", status: MarketplaceRequestStatus.DECLINED }] }),
    ).toBe("none");
    expect(resolveConnectionState({ ...base, providerIds: null, requests: null })).toBe("unknown");
    expect(connectionStateFromRefusal({ status: 409, message: "You already have a pending request for this listing" })).toBe("pending");
    expect(connectionStateFromRefusal({ status: 409, message: "You are already a client of this professional" })).toBe("connected");
    expect(connectionStateFromRefusal({ status: 400, message: "nope" })).toBeNull();
  });

  it("sends a connection request and then shows it pending", async () => {
    const send = vi.spyOn(marketplaceService, "sendRequest").mockReturnValue(ok({} as never));
    renderButton();
    const button = await screen.findByRole("button", { name: "Request to connect" });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(send).toHaveBeenCalledWith("l1", { type: MarketplaceRequestType.CONNECTION });
    expect(await screen.findByRole("button", { name: "Request pending" })).toBeDisabled();
    expect(toastSuccess).toHaveBeenCalledWith("Request sent. You'll be notified when Ada answers.");
  });

  it("shows a request already out as pending, and hides it once they're connected", async () => {
    vi.spyOn(marketplaceService, "getMyRequests").mockReturnValue(
      ok([{ listing_id: "l1", status: MarketplaceRequestStatus.PENDING }] as never),
    );
    const { unmount } = renderButton();
    expect(await screen.findByRole("button", { name: "Request pending" })).toBeDisabled();
    unmount();

    vi.spyOn(marketplaceService, "getMyProviders").mockReturnValue(
      ok({ professionals: [{ professional_id: "pro1" }], gyms: [] } as never),
    );
    const { container } = renderButton();
    await waitFor(() => expect(container.querySelector("button")).toBeNull());
  });

  it("folds the API's 409 into the button instead of an error", async () => {
    vi.spyOn(marketplaceService, "sendRequest").mockResolvedValue({
      success: false,
      status: 409,
      message: "You are already a client of this professional",
    });
    const { container } = renderButton();
    const button = await screen.findByRole("button", { name: "Request to connect" });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    await waitFor(() => expect(container.querySelector("button")).toBeNull());
    expect(toastError).not.toHaveBeenCalled();
  });

  it("is disabled for a professional not taking clients", async () => {
    renderButton({ acceptingClients: false });
    expect(await screen.findByRole("button", { name: "Not accepting clients" })).toBeDisabled();
  });

  it("isn't offered to a provider, and sends a signed-out visitor to log in first", async () => {
    mockUser = { id: "t1", role: "TRAINER" };
    const { container, unmount } = renderButton();
    expect(container.querySelector("button")).toBeNull();
    unmount();

    mockUser = null;
    const send = vi.spyOn(marketplaceService, "sendRequest");
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Request to connect" }));
    expect(push).toHaveBeenCalledWith("/login?redirect=%2Fmarketplace%2Fl1");
    expect(send).not.toHaveBeenCalled();
  });
});
