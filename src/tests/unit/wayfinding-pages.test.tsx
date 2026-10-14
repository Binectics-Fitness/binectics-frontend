import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import TrainerSettingsPage from "@/app/dashboard/trainer/settings/page";
import DietitianSettingsPage from "@/app/dashboard/dietitian/settings/page";
import { ProviderEarnings } from "@/components/ProviderEarnings";
import NotificationsInboxClient from "@/app/dashboard/notifications/NotificationsInboxClient";
import { WorkspaceShell } from "@/components/ds/WorkspaceShell";

let mockGym: { _id: string; name: string } | null = null;
let mockRole = "TRAINER";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useTrainerAccess", () => ({ useCoachingGym: () => mockGym }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: mockRole }, isLoading: false }),
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = { currentOrg: { _id: "o1", name: "Kemi Coaching", owner_id: "u1" }, organizations: [], isLoading: false };
  return { useOrganization: () => value, useOptionalOrganization: () => value };
});
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children }: { children: ReactNode }) => <div data-testid="shell-trainer">{children}</div>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: ReactNode }) => <div data-testid="shell-dietitian">{children}</div>,
}));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div data-testid="shell-gym">{children}</div>,
}));
vi.mock("@/components/ds/AdminDashboardShell", () => ({
  AdminDashboardShell: ({ children }: { children: ReactNode }) => <div data-testid="shell-admin">{children}</div>,
}));
vi.mock("@/components/ds/RoleShell", () => ({ RoleShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/ConsultationAvailabilityManager", () => ({ default: () => null }));
vi.mock("@/components/provider/GatewaysSection", () => ({ GatewaysSection: () => null }));
vi.mock("@/components/activity/ActivityLogPanel", () => ({ ActivityLogSection: () => null, canSeeActivityLog: () => false }));
vi.mock("@/lib/api/earnings", () => {
  const refused = () => Promise.resolve({ success: false });
  return {
    earningsService: {
      getOrgSummary: refused,
      getOrgTimeseries: refused,
      getOrgTransactions: refused,
      getSessionEarnings: refused,
    },
  };
});
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtMoney: String, fmtDateTime: String, fmtNumber: String, fmtDate: String }),
}));
vi.mock("@/lib/queries/notifications", () => ({
  useNotifications: () => ({ data: { notifications: [], pagination: null }, isLoading: false, refetch: vi.fn() }),
  useUnreadNotificationCount: () => ({ data: { count: 0 }, refetch: vi.fn() }),
  useMarkAsRead: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useMarkAllAsRead: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

beforeEach(() => {
  mockGym = null;
  mockRole = "TRAINER";
});

describe("cancellation policy in provider settings", () => {
  it("is one link away for a trainer with their own practice", () => {
    render(<TrainerSettingsPage />);
    expect(screen.getByRole("heading", { name: "Cancellation policy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set your cancellation policy" })).toHaveAttribute("href", "/dashboard/refunds?tab=policy");
  });

  it("is not offered to a gym's staff trainer, whose sessions follow the gym's policy", () => {
    mockGym = { _id: "g1", name: "Iron Temple" };
    render(<TrainerSettingsPage />);
    expect(screen.queryByRole("heading", { name: "Cancellation policy" })).not.toBeInTheDocument();
  });

  it("is one link away for a dietitian", () => {
    mockRole = "DIETITIAN";
    render(<DietitianSettingsPage />);
    expect(screen.getByRole("link", { name: "Set your cancellation policy" })).toHaveAttribute("href", "/dashboard/refunds?tab=policy");
  });
});

describe("Earnings refunds link", () => {
  it("is there for a provider with their own practice", () => {
    render(<ProviderEarnings settingsHref="/dashboard/trainer/settings" sessionNoun="session" />);
    expect(screen.getByRole("link", { name: "Refunds and disputes" })).toHaveAttribute("href", "/dashboard/refunds");
  });

  it("is gone for a gym's staff trainer, whom the refunds page would refuse", () => {
    mockGym = { _id: "g1", name: "Iron Temple" };
    render(<ProviderEarnings settingsHref="/dashboard/trainer/settings" sessionNoun="session" />);
    expect(screen.queryByRole("link", { name: "Refunds and disputes" })).not.toBeInTheDocument();
  });
});

describe("notifications inbox", () => {
  it("links to notification settings from its header, with an accessible name", () => {
    render(<NotificationsInboxClient />);
    expect(screen.getByRole("link", { name: "Notification settings" })).toHaveAttribute("href", "/dashboard/settings/notifications");
  });
});

describe("WorkspaceShell", () => {
  it.each([
    ["TRAINER", "shell-trainer"],
    ["DIETITIAN", "shell-dietitian"],
    ["GYM_OWNER", "shell-gym"],
    ["ADMIN", "shell-admin"],
  ])("puts a %s's shared page (Billing, Refunds) in their own dashboard", (role, testId) => {
    mockRole = role;
    render(<WorkspaceShell activeItem="Billing" crumb="Billing"><p>page</p></WorkspaceShell>);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
