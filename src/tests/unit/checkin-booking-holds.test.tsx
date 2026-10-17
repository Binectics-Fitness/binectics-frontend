import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CheckInScanPage from "@/app/check-in/[gymId]/page";
import { ListingClassesSection } from "@/components/classes/ListingClassesSection";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService } from "@/lib/api/classBookings";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipSubscriptionStatus as S, type MembershipSubscription } from "@/lib/types";
import { formatDate } from "@/utils/format";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ gymId: "o1" }),
  useSearchParams: () => ({ get: () => "fresh" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { first_name: "Yemi" } }) }));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));

function sub(over: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    _id: "s1",
    organization_id: { _id: "o1", name: "Iron Temple" },
    plan_id: "p1",
    listing_id: { _id: "l1", headline: "Iron Temple Ikoyi" },
    member_user_id: "u1",
    status: S.ACTIVE,
    start_date: "2026-10-01T00:00:00Z",
    end_date: "2026-10-31T00:00:00Z",
    amount_paid_minor: 0,
    currency: "NGN",
    auto_renew: false,
    created_at: "",
    updated_at: "",
    ...over,
  };
}

const mine = vi.spyOn(marketplaceService, "getMyMembershipSubscriptions");

afterEach(() => vi.clearAllMocks());

describe("check-in refused while on hold", () => {
  beforeEach(() => {
    vi.spyOn(checkinsService, "getGymInfo").mockResolvedValue({ success: true, data: { name: "Iron Temple", listing_id: "l1" } });
    vi.spyOn(checkinsService, "scan").mockResolvedValue({
      success: false,
      status: 404,
      message: "No active subscription found for this gym",
    });
  });

  it("suspended: why, and who to contact, instead of plans to buy", async () => {
    mine.mockResolvedValue({
      success: true,
      data: [sub({ status: S.SUSPENDED, suspended_at: "2026-10-10T09:00:00Z", suspension_reason: "Unpaid locker fee" })],
    });
    render(<CheckInScanPage />);
    expect(await screen.findByRole("heading", { name: "Your membership is suspended." })).toBeInTheDocument();
    expect(screen.getByTestId("hold-body")).toHaveTextContent(
      `Iron Temple suspended this membership on ${formatDate("2026-10-10T09:00:00Z")}: “Unpaid locker fee”. Contact Iron Temple to restore your access.`,
    );
    expect(screen.queryByText("View membership plans")).toBeNull();
    expect(screen.getByRole("link", { name: "My memberships" })).toHaveAttribute("href", "/dashboard/member/billing");
  });

  it("paused: says so and points at Resume", async () => {
    mine.mockResolvedValue({ success: true, data: [sub({ status: S.PAUSED, paused_at: "2026-10-04T12:00:00Z" })] });
    render(<CheckInScanPage />);
    expect(await screen.findByRole("heading", { name: "Your membership is paused." })).toBeInTheDocument();
    expect(screen.getByTestId("hold-body")).toHaveTextContent(
      `You paused it on ${formatDate("2026-10-04T12:00:00Z")}, so you can't check in at Iron Temple until you resume it.`,
    );
    expect(screen.getByRole("link", { name: "Resume my membership" })).toHaveAttribute("href", "/dashboard/member/billing");
  });

  it("no hold (or the read fails): the existing no-membership screen", async () => {
    mine.mockResolvedValue({ success: false, status: 500 });
    render(<CheckInScanPage />);
    expect(await screen.findByRole("heading", { name: "No active membership." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View membership plans" })).toBeInTheDocument();
  });
});

describe("class booking refused while on hold", () => {
  const renderSection = (organizationId?: string) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <ListingClassesSection listingId="l1" organizationId={organizationId} />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    // Signed in: the section reads the member's own waitlist entries.
    vi.spyOn(classBookingsService, "getMyClassBookings").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(classBookingsService, "getListingClasses").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "c1",
          name: "Spin",
          day_of_week: 1,
          start_time: "07:00",
          duration_minutes: 45,
          capacity: 12,
          waitlist_enabled: false,
        } as never,
      ],
    });
    vi.spyOn(classBookingsService, "bookClass").mockResolvedValue({
      success: false,
      status: 403,
      message: "An active membership with this gym is required to book classes",
    });
  });

  it("names the suspension instead of the generic refusal", async () => {
    mine.mockResolvedValue({ success: true, data: [sub({ status: S.SUSPENDED, suspension_reason: "Dues" })] });
    renderSection();
    await userEvent.click(await screen.findByRole("button", { name: "Book" }));
    expect(
      await screen.findByText(
        "Your membership is suspended. Iron Temple suspended this membership: “Dues”. Contact Iron Temple to restore your access.",
      ),
    ).toBeInTheDocument();
  });

  it("finds the hold on a membership the gym enrolled directly (no listing) by the gym", async () => {
    mine.mockResolvedValue({
      success: true,
      data: [sub({ listing_id: undefined, status: S.SUSPENDED, suspension_reason: "Dues" })],
    });
    renderSection("o1");
    await userEvent.click(await screen.findByRole("button", { name: "Book" }));
    expect(
      await screen.findByText(
        "Your membership is suspended. Iron Temple suspended this membership: “Dues”. Contact Iron Temple to restore your access.",
      ),
    ).toBeInTheDocument();
  });

  it("without a hold, the API's own message", async () => {
    mine.mockResolvedValue({ success: true, data: [] });
    renderSection();
    await userEvent.click(await screen.findByRole("button", { name: "Book" }));
    expect(await screen.findByText("An active membership with this gym is required to book classes")).toBeInTheDocument();
  });
});
