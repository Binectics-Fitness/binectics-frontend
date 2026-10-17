import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GymOwnerMessagesPage from "@/app/dashboard/gym-owner/messages/page";

/**
 * F1: a gym's staff with messaging:answer_members answer the gym's inbox
 * from the gym dashboard, with the same messaging UI, listing only the
 * gym's member conversations. The owner keeps the whole inbox and the
 * Announce button.
 */
const threads = [
  { _id: "t-gym", title: "Ngozi (gym inbox)", kind: "gym", as_gym: { organization_id: "gym", name: "Iron Temple" } },
  { _id: "t-other-gym", title: "Other gym thread", kind: "gym", as_gym: { organization_id: "gym2", name: "Elsewhere" } },
  { _id: "t-mine", title: "My own trainer", kind: "direct", as_gym: null },
];

let mockUser = { id: "u1", role: "USER" };
let mockOrg: Record<string, unknown> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/messages",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => ({ currentOrg: mockOrg }) }));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/messaging/queries", () => ({
  useInbox: () => ({ data: { threads }, isLoading: false, isError: false, refetch: vi.fn() }),
  useThreadSummary: () => ({ data: undefined, error: null }),
}));
vi.mock("@/components/messaging/ThreadList", () => ({
  ThreadList: ({ threads: list, emptyHint }: { threads: { _id: string; title: string }[]; emptyHint: string }) => (
    <ul aria-label="Conversations list" data-hint={emptyHint}>
      {list.map((t) => (
        <li key={t._id}>{t.title}</li>
      ))}
    </ul>
  ),
}));
vi.mock("@/components/messaging/ThreadPane", () => ({
  ThreadPane: () => null,
  PaneMessage: () => null,
  THREAD_ID_PATTERN: /^[a-f0-9]{24}$/,
}));
vi.mock("@/components/messaging/SearchPanel", () => ({ SearchBox: () => null, SearchPanel: () => null }));
vi.mock("@/components/messaging/AnnouncePanel", () => ({ AnnouncePanel: () => null }));

const listed = () => screen.getAllByRole("listitem").map((li) => li.textContent);

beforeEach(() => {
  mockUser = { id: "u1", role: "USER" };
  mockOrg = { _id: "gym", name: "Iron Temple", owner_id: "boss", account_type: "gym_owner", is_owner: false };
});

describe("the gym inbox in the gym dashboard", () => {
  it("lists only this gym's member conversations for its staff, without Announce", () => {
    render(<GymOwnerMessagesPage />);
    expect(listed()).toEqual(["Ngozi (gym inbox)"]);
    expect(screen.queryByRole("button", { name: "Announce" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Conversations list" })).toHaveAttribute(
      "data-hint",
      "Messages members send Iron Temple appear here, and you reply as the gym.",
    );
  });

  it("keeps the owner's whole inbox and the Announce button", () => {
    mockUser = { id: "boss", role: "GYM_OWNER" };
    mockOrg = { ...mockOrg, is_owner: true };
    render(<GymOwnerMessagesPage />);
    expect(listed()).toEqual(["Ngozi (gym inbox)", "Other gym thread", "My own trainer"]);
    expect(screen.getByRole("button", { name: "Announce" })).toBeInTheDocument();
  });
});
