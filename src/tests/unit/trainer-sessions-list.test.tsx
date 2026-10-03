import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrainerSessionsListPage from "@/app/dashboard/trainer/sessions/page";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/OrganizationContext", () => ({ useOptionalOrganization: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/SearchableSelect", () => ({ default: () => null }));

const session: ConsultationBooking = {
  id: "6650aa00bb11cc22dd33ee44",
  clientUserId: "c1",
  clientFirstName: "Linda",
  clientLastName: "Mokoena",
  providerId: "p1",
  consultationTypeId: "t1",
  consultationTypeName: "1:1 strength",
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 3_600_000).toISOString(),
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.CONFIRMED,
  createdAt: "",
  updatedAt: "",
};

describe("trainer sessions log", () => {
  beforeEach(() => {
    push.mockReset();
    vi.spyOn(consultationsService, "getProviderBookings").mockResolvedValue({ success: true, data: [session] });
    vi.spyOn(consultationsService, "getProviderTypeNames").mockResolvedValue({ success: true, data: {} });
  });

  it("links each session row to its detail page", async () => {
    render(<TrainerSessionsListPage />);
    const link = await screen.findByRole("link", { name: "Linda Mokoena" });
    expect(link).toHaveAttribute("href", `/dashboard/trainer/sessions/${session.id}`);

    await userEvent.click(screen.getByText("1:1 strength"));
    expect(push).toHaveBeenCalledWith(`/dashboard/trainer/sessions/${session.id}`);
  });
});
