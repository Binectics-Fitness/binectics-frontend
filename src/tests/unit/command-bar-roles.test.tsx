import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandBar } from "@/components/ds/CommandBar";
import { resetShellNav, useRegisterShellNav } from "@/hooks/useShellNav";

const mockPush = vi.fn();
let mockUser: { id: string; role: string } | null = null;
let mockGym: { _id: string; name: string } | null = null;

vi.mock("@/hooks/useCommandBar", () => ({
  useCommandBar: () => ({ open: true, close: vi.fn() }),
  closeCommandBar: vi.fn(),
}));
vi.mock("@/lib/queries/search", () => ({
  useUnifiedSearch: () => ({ data: null, isLoading: false }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/hooks/useTrainerAccess", () => ({ useCoachingGym: () => mockGym }));

function group(label: string) {
  const heading = screen.queryByText(label);
  return heading ? within(heading.parentElement as HTMLElement) : null;
}

function labelsIn(label: string): string[] {
  const g = group(label);
  return g ? g.getAllByRole("button").map((b) => b.textContent ?? "") : [];
}

function Shell({ sections }: { sections: { label: string; items: { name: string; href: string; badge?: string }[] }[] }) {
  useRegisterShellNav(sections);
  return null;
}

beforeEach(() => {
  mockPush.mockReset();
  mockUser = null;
  mockGym = null;
  act(() => resetShellNav());
});
afterEach(() => act(() => resetShellNav()));

describe("CommandBar for each role", () => {
  it("only offers the marketplace and help when signed out", () => {
    render(<CommandBar />);
    expect(labelsIn("Navigate")).toEqual(["Marketplace"]);
    expect(group("Actions")).toBeNull();
    expect(labelsIn("Help")).toEqual(["Help center", "Contact support"]);
  });

  it("gives a member their own pages and no provider actions", () => {
    mockUser = { id: "m1", role: "USER" };
    render(<CommandBar />);
    const nav = labelsIn("Navigate");
    expect(nav).toEqual(expect.arrayContaining(["Dashboard", "Marketplace", "My bookings", "Messages", "Account settings"]));
    expect(group("Actions")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Messages/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/messages");
  });

  it("sends a trainer's Messages to the trainer inbox, not the member one", () => {
    mockUser = { id: "t1", role: "TRAINER" };
    render(<CommandBar />);
    fireEvent.click(screen.getByRole("button", { name: /Messages/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/trainer/messages");
  });

  it("gives a trainer working actions that each go somewhere", () => {
    mockUser = { id: "t1", role: "TRAINER" };
    render(<CommandBar />);
    expect(labelsIn("Actions")).toEqual(["Invite a client", "New program", "New plan", "Block off time"]);
    fireEvent.click(screen.getByRole("button", { name: /New program/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/trainer/programs?new=1");
  });

  it("does not offer a gym's staff trainer client invites or plans", () => {
    mockUser = { id: "t1", role: "TRAINER" };
    mockGym = { _id: "g1", name: "Iron Temple" };
    render(<CommandBar />);
    expect(labelsIn("Actions")).toEqual(["New program", "Block off time"]);
  });

  it("gives a dietitian and a gym owner their own actions", () => {
    mockUser = { id: "d1", role: "DIETITIAN" };
    const { unmount } = render(<CommandBar />);
    expect(labelsIn("Actions")).toEqual(["New meal plan", "New program", "Block off time"]);
    unmount();
    mockUser = { id: "g1", role: "GYM_OWNER" };
    render(<CommandBar />);
    expect(labelsIn("Actions")).toEqual(["New class", "New membership plan", "Add staff"]);
  });

  it("no longer shows keyboard hints nothing listens for", () => {
    mockUser = { id: "m1", role: "USER" };
    render(<CommandBar />);
    expect(screen.queryByText(/G B|G I|⌘ N|⌘ B/)).not.toBeInTheDocument();
  });

  it("offers the sidebar of the dashboard on screen, with its counts, plus account settings", () => {
    mockUser = { id: "t1", role: "TRAINER" };
    render(
      <>
        <Shell
          sections={[
            { label: "Work", items: [{ name: "Today", href: "/dashboard/trainer" }, { name: "Inbox", href: "/dashboard/trainer/messages", badge: "3" }] },
            { label: "Practice", items: [{ name: "Refunds", href: "/dashboard/refunds", badge: "2" }] },
          ]}
        />
        <CommandBar />
      </>,
    );
    const nav = labelsIn("Navigate");
    expect(nav).toEqual(["Today", "Inbox3", "Refunds2", "Notifications", "Account settings"]);
    fireEvent.click(screen.getByRole("button", { name: /Refunds/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/refunds");
  });

  it("falls back to role-wide places once the shell is gone", () => {
    mockUser = { id: "t1", role: "TRAINER" };
    const { rerender } = render(
      <>
        <Shell sections={[{ label: "Work", items: [{ name: "Today", href: "/dashboard/trainer" }] }]} />
        <CommandBar />
      </>,
    );
    expect(labelsIn("Navigate")[0]).toBe("Today");
    rerender(<CommandBar />);
    expect(labelsIn("Navigate")[0]).toBe("Dashboard");
  });
});
