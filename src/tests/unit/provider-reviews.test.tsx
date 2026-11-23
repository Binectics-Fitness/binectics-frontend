import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { reviewsService, ReviewStatus, ReviewTargetType, type Review } from "@/lib/api/reviews";
import { marketplaceService } from "@/lib/api/marketplace";
import { legacyLinkTarget } from "@/lib/routing/legacyLinks";
import { resolveNotificationTarget } from "@/utils/resolveNotificationLink";
import { NotificationType } from "@/lib/api/notifications";
import { UserRole } from "@/lib/types";
import { TrainerReviewsClient } from "@/app/dashboard/trainer/reviews/TrainerReviewsClient";
import { initialProfileTab } from "@/app/dashboard/dietitian/profile/ReviewsTab";
import { ProviderReviewCard } from "@/components/reviews/ProviderReviews";
import { ReportReviewButton, REPORT_REASON_MAX } from "@/components/reviews/ReportReviewButton";
import { SIDEBAR, sidebarFor } from "@/components/ds/TrainerDashboardShell";

/**
 * Web provider parity batch D: the trainer Reviews page (read, respond,
 * edit a response), Report on every provider review list, and review /
 * meal notifications landing on the right page for each coach.
 */

let mockGym: { _id: string; name: string } | null = null;
vi.mock("@/hooks/useTrainerAccess", () => ({ useCoachingGym: () => mockGym }));
const toastSuccess = vi.fn();
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { success: (m: string) => toastSuccess(m), error: vi.fn() }),
}));

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const withQuery = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const review = (over: Partial<Review> = {}): Review => ({
  id: "r1",
  targetType: ReviewTargetType.TRAINER,
  targetId: "l1",
  reviewerUserId: "m1",
  reviewerName: "Tunde A.",
  rating: 4,
  comment: "Pushes me just enough.",
  status: ReviewStatus.VISIBLE,
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  ...over,
});

const page = (reviews: Review[], totalPages = 1) =>
  ok({ reviews, pagination: { page: 1, limit: 10, total: reviews.length, totalPages } });

const listing = (id: string | null) =>
  vi
    .spyOn(marketplaceService, "getMyListing")
    .mockReturnValue((id ? ok({ _id: id }) : Promise.resolve({ success: false, status: 404 })) as never);

beforeEach(() => {
  mockGym = null;
  toastSuccess.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("trainer Reviews page", () => {
  it("lists the trainer's reviews with the rating summary", async () => {
    listing("l1");
    vi.spyOn(reviewsService, "getTargetAggregate").mockReturnValue(
      ok({ targetType: ReviewTargetType.TRAINER, targetId: "l1", averageRating: 4.5, totalReviews: 2 }),
    );
    const list = vi
      .spyOn(reviewsService, "getTargetReviews")
      .mockReturnValue(page([review(), review({ id: "r2", reviewerName: "Ada O.", rating: 5, comment: "Great" })]));
    render(withQuery(<TrainerReviewsClient />));

    expect(await screen.findByText("Pushes me just enough.")).toBeInTheDocument();
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("2 reviews")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith(ReviewTargetType.TRAINER, "l1", { page: 1, limit: 10, sort: "newest" });
    expect(screen.getByRole("button", { name: "Respond to Tunde A." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Report the review by Tunde A." })).toBeInTheDocument();
  });

  it("says when there are no reviews yet", async () => {
    listing("l1");
    vi.spyOn(reviewsService, "getTargetAggregate").mockReturnValue(ok(null));
    vi.spyOn(reviewsService, "getTargetReviews").mockReturnValue(page([]));
    render(withQuery(<TrainerReviewsClient />));
    expect(await screen.findByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByText("Clients can review you after a completed session.")).toBeInTheDocument();
  });

  it("sends a trainer with no profile to set one up", async () => {
    listing(null);
    const list = vi.spyOn(reviewsService, "getTargetReviews");
    render(withQuery(<TrainerReviewsClient />));
    expect(await screen.findByText("No profile yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up your profile" })).toHaveAttribute("href", "/dashboard/trainer/profile");
    expect(list).not.toHaveBeenCalled();
  });

  it("offers a retry when the reviews can't load", async () => {
    listing("l1");
    vi.spyOn(reviewsService, "getTargetAggregate").mockReturnValue(ok(null));
    const list = vi
      .spyOn(reviewsService, "getTargetReviews")
      .mockReturnValueOnce(Promise.resolve({ success: false, status: 500 }) as never)
      .mockReturnValue(page([review()]));
    render(withQuery(<TrainerReviewsClient />));
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Pushes me just enough.")).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("tells a gym's staff trainer the gym answers its reviews", () => {
    mockGym = { _id: "g1", name: "Iron Lab" };
    const mine = vi.spyOn(marketplaceService, "getMyListing");
    render(withQuery(<TrainerReviewsClient />));
    expect(screen.getByText("Iron Lab answers reviews of its listing.")).toBeInTheDocument();
    expect(mine).not.toHaveBeenCalled();
  });

  it("is in the trainer nav, but not for a gym's staff trainer", () => {
    const names = (sections: typeof SIDEBAR) => sections.flatMap((s) => s.items.map((i) => i.name));
    expect(SIDEBAR.flatMap((s) => s.items).find((i) => i.name === "Reviews")?.href).toBe("/dashboard/trainer/reviews");
    expect(names(sidebarFor(SIDEBAR, true))).not.toContain("Reviews");
  });
});

describe("responding to a review", () => {
  it("posts a new public response", async () => {
    const respond = vi
      .spyOn(reviewsService, "createProviderResponse")
      .mockReturnValue(ok(review({ providerResponse: { message: "Thanks!", createdAt: "2026-10-02T09:00:00.000Z" } })));
    render(withQuery(<ProviderReviewCard review={review()} canRespond canReport={false} />));

    await userEvent.click(screen.getByRole("button", { name: "Respond to Tunde A." }));
    const post = screen.getByRole("button", { name: "Post response" });
    expect(post).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Your response"), "  Thanks!  ");
    await userEvent.click(post);

    await waitFor(() => expect(respond).toHaveBeenCalledWith("r1", { message: "Thanks!" }));
    expect(toastSuccess).toHaveBeenCalledWith("Response posted");
    await waitFor(() => expect(screen.queryByLabelText("Your response")).toBeNull());
  });

  it("edits an existing response, starting from what it says", async () => {
    const respond = vi.spyOn(reviewsService, "createProviderResponse").mockReturnValue(ok(review()));
    const answered = review({ providerResponse: { message: "Thanks!", createdAt: "2026-10-02T09:00:00.000Z" } });
    render(withQuery(<ProviderReviewCard review={answered} canRespond canReport={false} />));

    expect(screen.getByText("Thanks!")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit your response to Tunde A." }));
    const box = screen.getByLabelText("Your response");
    expect(box).toHaveValue("Thanks!");
    const save = screen.getByRole("button", { name: "Save response" });
    expect(save).toBeDisabled(); // unchanged
    await userEvent.clear(box);
    await userEvent.type(box, "Thanks, see you Tuesday.");
    await userEvent.click(save);

    await waitFor(() => expect(respond).toHaveBeenCalledWith("r1", { message: "Thanks, see you Tuesday." }));
    expect(toastSuccess).toHaveBeenCalledWith("Response updated");
  });

  it("closes the form on Escape without sending", async () => {
    const respond = vi.spyOn(reviewsService, "createProviderResponse");
    render(withQuery(<ProviderReviewCard review={review()} canRespond canReport={false} />));
    await userEvent.click(screen.getByRole("button", { name: "Respond to Tunde A." }));
    await userEvent.type(screen.getByLabelText("Your response"), "Draft{Escape}");
    expect(screen.queryByLabelText("Your response")).toBeNull();
    expect(respond).not.toHaveBeenCalled();
  });

  it("shows no actions to a gym manager who can't manage reviews", () => {
    render(withQuery(<ProviderReviewCard review={review()} canRespond={false} canReport={false} />));
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("reporting a review", () => {
  it("asks for a reason, then sends it once", async () => {
    const report = vi.spyOn(reviewsService, "reportReview").mockReturnValue(ok({ id: "rep1" }));
    render(<ReportReviewButton reviewId="r1" reviewerName="Tunde A." />);

    await userEvent.click(screen.getByRole("button", { name: "Report the review by Tunde A." }));
    const box = screen.getByLabelText("Why are you reporting this review?");
    expect(box).toHaveAttribute("maxLength", String(REPORT_REASON_MAX));
    expect(screen.getByText("Binectics looks at reports. The review stays up until it decides.")).toBeInTheDocument();
    const send = screen.getByRole("button", { name: "Send report" });
    expect(send).toBeDisabled();
    await userEvent.type(box, "Not a client of mine");
    await userEvent.click(send);

    await waitFor(() => expect(report).toHaveBeenCalledWith("r1", { reason: "Not a client of mine" }));
    expect(await screen.findByText("Reported. Our team will look at it.")).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith("Review reported");
    expect(screen.queryByRole("button", { name: /Report/ })).toBeNull();
  });

  it("says so when the review was already reported", async () => {
    vi.spyOn(reviewsService, "reportReview").mockReturnValue(
      Promise.resolve({ success: false, status: 409, message: "You have already reported this review" }) as never,
    );
    render(<ReportReviewButton reviewId="r1" reviewerName="Tunde A." />);
    await userEvent.click(screen.getByRole("button", { name: "Report the review by Tunde A." }));
    await userEvent.type(screen.getByLabelText("Why are you reporting this review?"), "Spam");
    await userEvent.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByText("You already reported this review.")).toBeInTheDocument();
  });

  it("keeps the form and shows the error when sending fails", async () => {
    vi.spyOn(reviewsService, "reportReview").mockReturnValue(
      Promise.resolve({ success: false, status: 500 }) as never,
    );
    render(<ReportReviewButton reviewId="r1" reviewerName="Tunde A." />);
    await userEvent.click(screen.getByRole("button", { name: "Report the review by Tunde A." }));
    await userEvent.type(screen.getByLabelText("Why are you reporting this review?"), "Spam");
    await userEvent.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t send the report. Try again.");
    expect(screen.getByLabelText("Why are you reporting this review?")).toHaveValue("Spam");
  });

  it("cancels without sending", async () => {
    const report = vi.spyOn(reviewsService, "reportReview");
    render(<ReportReviewButton reviewId="r1" reviewerName="Tunde A." />);
    await userEvent.click(screen.getByRole("button", { name: "Report the review by Tunde A." }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Report the review by Tunde A." })).toBeInTheDocument();
    expect(report).not.toHaveBeenCalled();
  });

  it("sits under each review on a provider's list", () => {
    render(withQuery(<ProviderReviewCard review={review()} canRespond canReport />));
    const card = screen.getByRole("article", { name: "Review by Tunde A." });
    expect(within(card).getByRole("button", { name: "Report the review by Tunde A." })).toBeInTheDocument();
  });
});

describe("review and meal notification targets", () => {
  const id = "6abe5a17882f018fcdb21c61";

  it.each([
    ["TRAINER", "/dashboard/trainer/reviews"],
    ["DIETITIAN", "/dashboard/dietitian/profile?tab=Reviews"],
    ["GYM_OWNER", "/dashboard/gym-owner/reviews"],
    ["USER", "/dashboard/notifications"],
  ])("a new review for %s opens %s", (role, target) => {
    expect(legacyLinkTarget("/dashboard/reviews", `?reviewId=${id}`, role)).toBe(target);
    expect(
      resolveNotificationTarget(
        { type: NotificationType.REVIEW_RECEIVED, actionUrl: `/dashboard/reviews?reviewId=${id}` },
        role as UserRole,
      ),
    ).toBe(target);
  });

  it("opens the dietitian's Reviews tab from ?tab=Reviews", () => {
    expect(initialProfileTab("Reviews")).toBe("Reviews");
    expect(initialProfileTab("reviews")).toBe("Reviews");
    expect(initialProfileTab(null)).toBe("Listing");
    expect(initialProfileTab("nope")).toBe("Listing");
  });

  it("keeps a response to the user's own review on the notification", () => {
    for (const role of [UserRole.TRAINER, UserRole.GYM_OWNER, UserRole.USER]) {
      expect(
        resolveNotificationTarget({ type: NotificationType.REVIEW_RESPONSE, actionUrl: `/dashboard/reviews?reviewId=${id}` }, role),
      ).toBe("/dashboard/notifications");
    }
  });

  it("opens the client a logged meal names, for a trainer or a dietitian", () => {
    const link = `/dashboard/dietitian/clients?profileId=${id}`;
    expect(legacyLinkTarget("/dashboard/dietitian/clients", `?profileId=${id}`, "DIETITIAN")).toBe(`/dashboard/dietitian/clients/${id}`);
    expect(legacyLinkTarget("/dashboard/dietitian/clients", `?profileId=${id}`, "TRAINER")).toBe(`/dashboard/trainer/clients/${id}`);
    expect(resolveNotificationTarget({ type: NotificationType.MEAL_LOGGED, actionUrl: link }, UserRole.TRAINER)).toBe(
      `/dashboard/trainer/clients/${id}`,
    );
    expect(resolveNotificationTarget({ type: NotificationType.MEAL_LOGGED, actionUrl: link }, UserRole.DIETITIAN)).toBe(
      `/dashboard/dietitian/clients/${id}`,
    );
  });

  it("leaves the dietitian's own clients list alone, and sends a trainer to theirs", () => {
    expect(legacyLinkTarget("/dashboard/dietitian/clients", "", "DIETITIAN")).toBeNull();
    expect(legacyLinkTarget("/dashboard/dietitian/clients", "?profileId=../x", "DIETITIAN")).toBeNull();
    expect(legacyLinkTarget("/dashboard/dietitian/clients", "", "TRAINER")).toBe("/dashboard/trainer/clients");
    expect(legacyLinkTarget("/dashboard/dietitian/clients", "?profileId=../x", "TRAINER")).toBe("/dashboard/trainer/clients");
  });
});
