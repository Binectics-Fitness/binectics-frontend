import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  MessagingErrorCode,
  ThreadKind,
  ThreadRole,
  messagingService,
  type ThreadSummary,
  type ThreadsPage,
} from "@/lib/api/messaging";
import type { ApiResponse } from "@/lib/types";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/gym-owner/messages",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", role: "USER" } }),
}));

vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => ({ organizations: [] }) }));

const GYM = "dddddddddddddddddddddddd";

let n = 0;
function thread(title: string): ThreadSummary {
  n += 1;
  return {
    _id: n.toString(16).padStart(24, "e"),
    kind: ThreadKind.GYM,
    title,
    organization_id: GYM,
    avatar_url: null,
    my_role: ThreadRole.GYM_STAFF,
    as_gym: { organization_id: GYM, name: "Iron House" },
    last_message: null,
    unread_count: 0,
    muted: false,
  } as unknown as ThreadSummary;
}

const ok = (data: ThreadsPage): ApiResponse<ThreadsPage> => ({ success: true, data });

function mount(props: Partial<React.ComponentProps<typeof MessagingCenter>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MessagingCenter emptyHint="Messages members send Iron House appear here." {...props} />
    </QueryClientProvider>,
  );
}

const rows = () => within(screen.getByRole("list", { name: "Conversations" })).queryAllByRole("button", { name: /inbox/ });

beforeEach(() => {
  n = 0;
  vi.spyOn(messagingService, "unreadCount").mockResolvedValue({ success: true, data: { unread: 0, threads: 0 } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MessagingCenter: gym inbox for staff (?as_gym=)", () => {
  it("asks the API for this gym's inbox only, 30 at a time, instead of filtering page 1 on the client", async () => {
    const list = vi
      .spyOn(messagingService, "listThreads")
      .mockResolvedValue(ok({ threads: [thread("Ada Member")], next_cursor: null }));

    mount({ gymInboxOf: GYM });

    expect(await screen.findByRole("button", { name: /Ada Member/ })).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({ asGym: GYM, limit: 30, cursor: undefined });
    // A single page: nothing more to load.
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("builds the ?as_gym= query string", async () => {
    const { apiClient } = await import("@/lib/api/client");
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ success: true, data: { threads: [], next_cursor: null } });
    await messagingService.listThreads({ asGym: GYM, limit: 30, cursor: "c1" });
    expect(get).toHaveBeenCalledWith(`/messaging/threads?as_gym=${GYM}&limit=30&cursor=c1`);
    await messagingService.listThreads({ limit: 30 });
    expect(get).toHaveBeenLastCalledWith("/messaging/threads?limit=30");
  });

  it("pages with next_cursor through Load more, keeping earlier rows", async () => {
    const first = Array.from({ length: 30 }, (_, i) => thread(`Member ${i + 1}`));
    const list = vi.spyOn(messagingService, "listThreads").mockImplementation(async (params = {}) =>
      params.cursor === "page-2"
        ? ok({ threads: [thread("Late Member")], next_cursor: null })
        : ok({ threads: first, next_cursor: "page-2" }),
    );

    mount({ gymInboxOf: GYM });

    await screen.findByRole("button", { name: /Member 30,/ });
    expect(rows()).toHaveLength(30);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByRole("button", { name: /Late Member/ })).toBeInTheDocument();
    expect(rows()).toHaveLength(31);
    expect(list).toHaveBeenLastCalledWith({ asGym: GYM, limit: 30, cursor: "page-2" });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument());
  });

  it("says plainly when the API refuses the gym inbox (403 MESSAGING_NOT_GYM_INBOX)", async () => {
    vi.spyOn(messagingService, "listThreads").mockResolvedValue({
      success: false,
      status: 403,
      code: MessagingErrorCode.NOT_GYM_INBOX,
      message: "Forbidden",
    });

    mount({ gymInboxOf: GYM });

    expect(await screen.findByRole("alert")).toHaveTextContent("You can't answer this gym's inbox.");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("leaves the normal inbox alone: page 1 with no as_gym and no Load more", async () => {
    const list = vi
      .spyOn(messagingService, "listThreads")
      .mockResolvedValue(ok({ threads: [thread("Ada Member")], next_cursor: "more" }));

    mount();

    await screen.findByRole("button", { name: /Ada Member/ });
    expect(list).toHaveBeenCalledWith({ limit: 30 });
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
});
