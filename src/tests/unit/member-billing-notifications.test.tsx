import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationsDrawer } from "@/components/ds/NotificationsDrawer";
import { RecordRenewalModal } from "@/app/dashboard/gym-owner/members/MembersClient";
import { memberBillingService } from "@/lib/api/memberBilling";
import {
  NotificationCategory,
  NotificationType,
  type NotificationItem,
} from "@/lib/api/notifications";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus,
  UserRole,
  type MembershipSubscription,
} from "@/lib/types";

const push = vi.fn();
const router = { push, back: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/dashboard/member",
  useSearchParams: () => new URLSearchParams(),
}));
const authState = { user: { id: "u1", role: "USER" as UserRole }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));

let items: NotificationItem[] = [];
const markAsRead = vi.fn().mockResolvedValue({});
vi.mock("@/lib/queries/notifications", () => ({
  useNotifications: () => ({ data: { notifications: items }, isLoading: false, refetch: vi.fn() }),
  useUnreadNotificationCount: () => ({ data: { count: 0, by_category: {} }, refetch: vi.fn() }),
  useMarkAsRead: () => ({ mutateAsync: markAsRead, isPending: false }),
  useMarkAllAsRead: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function note(over: Partial<NotificationItem>): NotificationItem {
  return {
    id: "n1",
    type: NotificationType.SUBSCRIPTION_EXPIRED,
    category: NotificationCategory.PAYMENT,
    title: "Your membership is due for renewal",
    message: "Your membership term has ended and the next one has not been paid.",
    isRead: true,
    readAt: null,
    actionUrl: "/dashboard/subscriptions?id=s1",
    metadata: {},
    createdAt: new Date().toISOString(),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user.role = UserRole.USER;
});

describe("notifications drawer: billing", () => {
  it("puts a Renew button on a renewal-due notice, opening that plan's checkout", () => {
    items = [
      note({
        metadata: {
          reason: "renewal_payment_due",
          subscriptionId: "s1",
          listingId: "l1",
          planId: "p1",
          checkoutPath: "/marketplace/listings/l1/plans/p1/checkout",
        },
      }),
    ];
    render(<NotificationsDrawer open onClose={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Renew: Your membership is due for renewal" })).toHaveAttribute(
      "href",
      "/checkout?listing=l1&plan=p1",
    );
  });

  it("puts a Renew button on a failed renewal payment", () => {
    items = [
      note({
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
        title: "We couldn't take your payment",
        metadata: { final: true, checkoutPath: "/marketplace/listings/l9/plans/p9/checkout" },
      }),
    ];
    render(<NotificationsDrawer open onClose={vi.fn()} />);
    expect(screen.getByRole("link", { name: /^Renew: / })).toHaveAttribute("href", "/checkout?listing=l9&plan=p9");
  });

  it("offers no Renew on a failed payment the card will retry (final: false)", () => {
    items = [
      note({
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
        title: "Your renewal payment didn't go through",
        metadata: { final: false, checkoutPath: "/marketplace/listings/l9/plans/p9/checkout" },
      }),
    ];
    render(<NotificationsDrawer open onClose={vi.fn()} />);
    expect(screen.queryByRole("link", { name: /^Renew/ })).toBeNull();
  });

  it("has no Renew button on other notices", () => {
    items = [note({ type: NotificationType.PAYMENT_RECEIVED, title: "Paid", metadata: {} })];
    render(<NotificationsDrawer open onClose={vi.fn()} />);
    expect(screen.queryByRole("link", { name: /^Renew/ })).toBeNull();
  });

  it("opens Billing at the membership for a card notice", async () => {
    items = [
      note({
        type: NotificationType.PAYMENT_METHOD_EXPIRING,
        title: "Your card expires soon",
        actionUrl: "/dashboard/member/billing?subscriptionId=s1",
        metadata: { subscriptionId: "s1" },
      }),
    ];
    const onClose = vi.fn();
    render(<NotificationsDrawer open onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /Your card expires soon/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/member/billing?subscriptionId=s1"));
    expect(onClose).toHaveBeenCalled();
  });

  it("sends a gym owner's final payment failure to Card renewals", async () => {
    authState.user.role = UserRole.GYM_OWNER;
    items = [
      note({
        type: NotificationType.MEMBER_PAYMENT_FAILED_FINAL,
        title: "A member's renewal failed",
        actionUrl: "/dashboard/member/billing",
        metadata: { subscriptionId: "s1" },
      }),
    ];
    render(<NotificationsDrawer open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /A member's renewal failed/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/gym-owner/card-renewals"));
  });
});

describe("Record renewal payment (gym staff)", () => {
  const record = vi.spyOn(memberBillingService, "recordRenewal");
  const sub: MembershipSubscription = {
    _id: "s1",
    organization_id: "o1",
    plan_id: {
      _id: "p1",
      name: "Monthly",
      plan_type: MembershipPlanType.SUBSCRIPTION,
      duration_days: 30,
      price_minor: 2_500_000,
      currency: "NGN",
      features: [],
    },
    member_user_id: { _id: "u1", first_name: "Ngozi", last_name: "Okafor", email: "n@example.com" },
    status: MembershipSubscriptionStatus.EXPIRED,
    start_date: "2026-09-01T00:00:00Z",
    end_date: "2026-10-01T00:00:00Z",
    amount_paid_minor: 2_500_000,
    currency: "NGN",
    auto_renew: false,
    created_at: "",
    updated_at: "",
  };

  it("has no amount field, states the plan's price, and sends method and receipt only", async () => {
    record.mockResolvedValue({ success: true, data: { ...sub, end_date: "2026-11-01T00:00:00Z" } });
    const onRecorded = vi.fn();
    const onClose = vi.fn();
    render(<RecordRenewalModal open sub={sub} orgId="o1" onClose={onClose} onRecorded={onRecorded} />);
    const dialog = await screen.findByRole("dialog", { name: "Record renewal payment" });
    expect(dialog).toHaveTextContent("₦25,000");
    expect(within(dialog).queryByLabelText(/amount/i)).toBeNull();
    await userEvent.type(within(dialog).getByLabelText(/Receipt or transfer reference/), "RCPT-42");
    await userEvent.click(within(dialog).getByRole("button", { name: "Record payment" }));
    await waitFor(() =>
      expect(record).toHaveBeenCalledWith("o1", "s1", { payment_method: "cash", payment_reference: "RCPT-42" }),
    );
    expect(onRecorded).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("sends no reference when none is given", async () => {
    record.mockResolvedValue({ success: true, data: sub });
    render(<RecordRenewalModal open sub={sub} orgId="o1" onClose={vi.fn()} onRecorded={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Record payment" }));
    await waitFor(() => expect(record).toHaveBeenCalledWith("o1", "s1", { payment_method: "cash" }));
  });

  it("explains a missing permission", async () => {
    record.mockResolvedValue({ success: false, status: 403, message: "Forbidden" });
    const onRecorded = vi.fn();
    render(<RecordRenewalModal open sub={sub} orgId="o1" onClose={vi.fn()} onRecorded={onRecorded} />);
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Record payment" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("You don't have permission to record payments");
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("says a card payment is still processing (RENEWAL_CHARGE_IN_PROGRESS)", async () => {
    record.mockResolvedValue({
      success: false,
      status: 409,
      code: "RENEWAL_CHARGE_IN_PROGRESS",
      message: "A renewal payment from the saved card is being processed right now.",
    });
    const onRecorded = vi.fn();
    render(<RecordRenewalModal open sub={sub} orgId="o1" onClose={vi.fn()} onRecorded={onRecorded} />);
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Record payment" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "A card payment for this term is still processing. Try again once it settles.",
    );
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("shows the API's refusal", async () => {
    record.mockResolvedValue({
      success: false,
      status: 400,
      message: "This membership ended too long ago to renew. Enrol the member again.",
    });
    render(<RecordRenewalModal open sub={sub} orgId="o1" onClose={vi.fn()} onRecorded={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Record payment" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("ended too long ago");
  });
});
