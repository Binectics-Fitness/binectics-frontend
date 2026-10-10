import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemberLoyalty } from "@/components/loyalty/MemberLoyalty";
import { ProviderLoyaltyPanel } from "@/components/loyalty/ProviderLoyaltyPanel";
import { loyaltyService } from "@/lib/api/loyalty";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("next/image", () => ({ default: () => null }));

const org = { _id: "org1", name: "Iron Lab", is_owner: true, can_manage_organization: true };
let currentOrg: Record<string, unknown> | null = org;
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg, isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg, isLoading: false }),
}));
vi.mock("@/components/Toast", () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast };
});

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });

function renderWith(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("member loyalty: only where the provider runs a program", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(loyaltyService, "listRewards").mockReturnValue(ok([]) as never);
    vi.spyOn(loyaltyService, "getHistory").mockReturnValue(ok([]) as never);
    vi.spyOn(loyaltyService, "listMyRedemptions").mockReturnValue(ok([]) as never);
  });

  it("explains there is no program when none of the member's providers runs one", async () => {
    vi.spyOn(loyaltyService, "getPrograms").mockReturnValue(ok([]) as never);
    renderWith(<MemberLoyalty />);
    expect(await screen.findByText(/None of your providers runs a loyalty program/)).toBeInTheDocument();
    expect(loyaltyService.listRewards).not.toHaveBeenCalled();
  });

  it("shows one provider's balance and asks for that provider's rewards only", async () => {
    vi.spyOn(loyaltyService, "getPrograms").mockReturnValue(
      ok([
        { organization_id: "g1", organization_name: "Iron Lab", account_type: "gym", balance: 300, is_member: true },
        { organization_id: "t1", organization_name: "Coach Ada", account_type: "personal_trainer", balance: 20, is_member: true },
      ]) as never,
    );
    renderWith(<MemberLoyalty />);
    expect(await screen.findByText("Points with Iron Lab")).toBeInTheDocument();
    await waitFor(() => expect(loyaltyService.listRewards).toHaveBeenCalledWith("g1"));
    fireEvent.click(screen.getByRole("tab", { name: /Coach Ada/ }));
    expect(await screen.findByText("Points with Coach Ada")).toBeInTheDocument();
    await waitFor(() => expect(loyaltyService.listRewards).toHaveBeenCalledWith("t1"));
    expect(screen.queryByText(/Binectics/)).toBeNull();
  });
});

describe("provider loyalty settings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    currentOrg = org;
    vi.spyOn(loyaltyService, "listOrgRewards").mockReturnValue(ok([]) as never);
  });

  it("is off by default, explains it's the provider's own program, and hides rewards until on", async () => {
    let enabled = false;
    vi.spyOn(loyaltyService, "getOrgSettings").mockImplementation(
      () => ok({ organization_id: "org1", enabled, updated_at: null }) as never,
    );
    const update = vi.spyOn(loyaltyService, "updateOrgSettings").mockImplementation((_id, next) => {
      enabled = next;
      return ok({ organization_id: "org1", enabled: next, updated_at: "2026-10-09" }) as never;
    });
    renderWith(<ProviderLoyaltyPanel />);
    const toggle = await screen.findByRole("switch", { name: "Loyalty program" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/your own program, not a Binectics one/)).toBeInTheDocument();
    expect(screen.queryByText("Your rewards")).toBeNull();
    expect(loyaltyService.listOrgRewards).not.toHaveBeenCalled();

    fireEvent.click(toggle);
    await waitFor(() => expect(update).toHaveBeenCalledWith("org1", true));
    expect(await screen.findByText("Your rewards")).toBeInTheDocument();
  });

  it("asks before turning it off", async () => {
    vi.spyOn(loyaltyService, "getOrgSettings").mockReturnValue(
      ok({ organization_id: "org1", enabled: true, updated_at: null }) as never,
    );
    const update = vi.spyOn(loyaltyService, "updateOrgSettings");
    renderWith(<ProviderLoyaltyPanel />);
    fireEvent.click(await screen.findByRole("switch", { name: "Loyalty program" }));
    expect(await screen.findByText("Turn off your loyalty program?")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("a teammate without manage-organization sees the switch but can't change it", async () => {
    currentOrg = { ...org, is_owner: false, can_manage_organization: false };
    vi.spyOn(loyaltyService, "getOrgSettings").mockReturnValue(
      ok({ organization_id: "org1", enabled: false, updated_at: null }) as never,
    );
    renderWith(<ProviderLoyaltyPanel />);
    expect(await screen.findByRole("switch", { name: "Loyalty program" })).toBeDisabled();
    expect(screen.getByText(/Only the owner/)).toBeInTheDocument();
  });
});
