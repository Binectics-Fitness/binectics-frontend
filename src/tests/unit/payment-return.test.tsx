import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PaymentReturnPage from "@/app/payments/return/page";
import { consultationsService, ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { marketplaceService } from "@/lib/api/marketplace";
import { paidContentService, type ContentPurchase } from "@/lib/api/paidContent";
import { savePendingCheckout } from "@/lib/payments/pendingCheckout";

const replace = vi.fn();
const nav = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
const auth = vi.hoisted(() => ({ user: { id: "u1" } as { id: string } | null, isLoading: false }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const hold = {
  id: "b1",
  status: ConsultationBookingStatus.PENDING,
  payment: { reference: "bkg_abc", amountMinor: 2500000, currency: "NGN", expiresAt: "" },
} as unknown as ConsultationBooking;

describe("/payments/return", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    auth.user = { id: "u1" };
    window.sessionStorage.clear();
  });

  it("asks the API to verify a booking's charge, then goes to My bookings", async () => {
    nav.search = "trxref=bkg_abc&reference=bkg_abc";
    vi.spyOn(consultationsService, "getMyBookings").mockResolvedValue({ success: true, data: [hold] });
    const verify = vi.spyOn(consultationsService, "verifyBookingPayment").mockResolvedValue({ success: true, data: hold });
    render(<PaymentReturnPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/bookings"));
    expect(verify).toHaveBeenCalledWith("b1");
  });

  it("still goes to My bookings when the hold isn't found, marking nothing paid", async () => {
    nav.search = "reference=bkg_zzz";
    vi.spyOn(consultationsService, "getMyBookings").mockResolvedValue({ success: true, data: [hold] });
    const verify = vi.spyOn(consultationsService, "verifyBookingPayment");
    render(<PaymentReturnPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/bookings"));
    expect(verify).not.toHaveBeenCalled();
  });

  const purchase = { id: "pu1", reference: "itm_abc", status: "pending" } as unknown as ContentPurchase;

  it("asks the API to verify a paid program's purchase, then goes to My purchases", async () => {
    nav.search = "trxref=itm_abc&reference=itm_abc";
    vi.spyOn(paidContentService, "myPurchases").mockResolvedValue({ success: true, data: [purchase] });
    const verify = vi.spyOn(paidContentService, "verify").mockResolvedValue({ success: true } as never);
    render(<PaymentReturnPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/member/purchases"));
    expect(verify).toHaveBeenCalledWith("pu1");
  });

  it("still goes to My purchases when the reference isn't theirs, verifying nothing", async () => {
    nav.search = "reference=itm_zzz";
    vi.spyOn(paidContentService, "myPurchases").mockResolvedValue({ success: true, data: [purchase] });
    const verify = vi.spyOn(paidContentService, "verify");
    render(<PaymentReturnPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/member/purchases"));
    expect(verify).not.toHaveBeenCalled();
  });

  it("still goes to My purchases when the lookup throws", async () => {
    nav.search = "reference=itm_abc";
    vi.spyOn(paidContentService, "myPurchases").mockRejectedValue(new Error("offline"));
    render(<PaymentReturnPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/member/purchases"));
  });

  it("finishes a membership with the server's reference, and the API decides", async () => {
    nav.search = "reference=mbr_123";
    savePendingCheckout({ reference: "mbr_123", payment_reference: "paystack_mbr_123", listing_id: "l1", plan_id: "p1", amount_minor: 1_500_000 });
    const subscribe = vi
      .spyOn(marketplaceService, "subscribeToListingPlan")
      .mockResolvedValue({ success: true, data: {} as never });
    render(<PaymentReturnPage />);
    expect(screen.getByText("Payment received. Finishing your membership...")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/checkout/success?listing=l1&plan=p1"));
    expect(subscribe).toHaveBeenCalledWith("l1", "p1", "paystack_mbr_123", 1_500_000);
  });

  it("says what to do when a membership can't be finished from here", async () => {
    nav.search = "reference=mbr_other";
    const subscribe = vi.spyOn(marketplaceService, "subscribeToListingPlan");
    render(<PaymentReturnPage />);
    expect(await screen.findByText(/contact support with reference mbr_other/)).toBeInTheDocument();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("shows a plain return message for any other reference", () => {
    nav.search = "reference=SUB_1";
    render(<PaymentReturnPage />);
    expect(screen.getByText("You're back from Paystack.")).toBeInTheDocument();
    expect(screen.getByText("You can close this page.")).toBeInTheDocument();
  });

  it("asks a signed-out visitor to sign in instead of guessing", async () => {
    nav.search = "reference=bkg_abc";
    auth.user = null;
    const mine = vi.spyOn(consultationsService, "getMyBookings");
    render(<PaymentReturnPage />);
    expect(await screen.findByText("Sign in to see your payment.")).toBeInTheDocument();
    expect(mine).not.toHaveBeenCalled();
  });
});
