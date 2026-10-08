import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnrollmentOffersCard } from "@/app/dashboard/member/_components/EnrollmentOffersCard";
import { marketplaceService, type EnrollmentOffer } from "@/lib/api/marketplace";
import type { MembershipSubscription } from "@/lib/types";

vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const offer = (over: Partial<EnrollmentOffer> = {}): EnrollmentOffer => ({
  _id: "o1",
  organization_id: { _id: "g1", name: "Iron Lagos" },
  plan_id: { _id: "p1", name: "Monthly", price_minor: 1_500_000, currency: "NGN", duration_days: 30 },
  email: "yemi@example.com",
  requested_status: "active",
  payment_mode: "manual",
  expires_at: "2026-10-21T00:00:00.000Z",
  created_at: "2026-10-07T00:00:00.000Z",
  status: "pending",
  ...over,
});

let client: QueryClient;
function renderCard(onAccepted = vi.fn()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<EnrollmentOffersCard onAccepted={onAccepted} />, { wrapper });
}

describe("EnrollmentOffersCard", () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.restoreAllMocks();
  });

  it("renders nothing when there are no pending offers", async () => {
    const get = vi
      .spyOn(marketplaceService, "getMyEnrollmentOffers")
      .mockResolvedValue({ success: true, data: [] });
    const { container } = renderCard();
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("lists a pending offer with the plan price from minor units", async () => {
    vi.spyOn(marketplaceService, "getMyEnrollmentOffers").mockResolvedValue({
      success: true,
      data: [offer()],
    });
    renderCard();
    expect(await screen.findByText("Iron Lagos")).toBeInTheDocument();
    // 1,500,000 kobo is ₦15,000, never ₦1,500,000.
    expect(screen.getByText(/Monthly/).textContent).toMatch(/15,000/);
    expect(screen.getByText(/Monthly/).textContent).not.toMatch(/1,500,000/);
  });

  it("accepting a transfer offer shows the account to pay into", async () => {
    vi.spyOn(marketplaceService, "getMyEnrollmentOffers")
      .mockResolvedValueOnce({ success: true, data: [offer({ payment_mode: "paystack_transfer" })] })
      .mockResolvedValue({ success: true, data: [] });
    const accept = vi.spyOn(marketplaceService, "acceptEnrollmentOffer").mockResolvedValue({
      success: true,
      data: {
        subscription: { _id: "s1" } as MembershipSubscription,
        transfer_account: {
          account_number: "9912345678",
          bank_name: "Wema Bank",
          amount_minor: 1_500_000,
          currency: "NGN",
          reference: "ref_1",
        },
      },
    });
    const onAccepted = vi.fn();
    renderCard(onAccepted);

    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));

    expect(await screen.findByText("9912345678")).toBeInTheDocument();
    expect(accept).toHaveBeenCalledWith("o1");
    expect(onAccepted).toHaveBeenCalled();
    expect(screen.getByText("Wema Bank")).toBeInTheDocument();
  });

  it("declining calls the decline endpoint and does not count as joining", async () => {
    vi.spyOn(marketplaceService, "getMyEnrollmentOffers")
      .mockResolvedValueOnce({ success: true, data: [offer()] })
      .mockResolvedValue({ success: true, data: [] });
    const decline = vi
      .spyOn(marketplaceService, "declineEnrollmentOffer")
      .mockResolvedValue({ success: true, data: { declined: true } });
    const onAccepted = vi.fn();
    renderCard(onAccepted);

    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));

    await waitFor(() => expect(decline).toHaveBeenCalledWith("o1"));
    expect(onAccepted).not.toHaveBeenCalled();
  });
});
