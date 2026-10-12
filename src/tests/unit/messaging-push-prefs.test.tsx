import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PushRegistrar } from "@/components/PushRegistrar";
import NotificationPreferencesPanel from "@/app/dashboard/settings/NotificationPreferencesPanel";
import { AnnouncePanel } from "@/components/messaging/AnnouncePanel";
import { registerOpenThread, threadIdFromLink } from "@/components/messaging/openThread";
import { messagingService, MessageSide } from "@/lib/api/messaging";
import { clearMessagingStorage } from "@/components/messaging/messagingStorage";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer",
}));

const auth = vi.hoisted(() => ({ user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", role: "TRAINER" } as { id: string; role: string } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@/components/Toast", () => ({ toast: Object.assign(vi.fn(), toasts) }));

const pushLib = vi.hoisted(() => ({
  handler: null as null | ((title: string, body: string, link?: string) => void),
}));
vi.mock("@/lib/push/push", () => ({
  isPushConfigured: () => true,
  enablePush: async (fn: (title: string, body: string, link?: string) => void) => {
    pushLib.handler = fn;
    return true;
  },
}));

const prefs = vi.hoisted(() => ({ mutateAsync: vi.fn(), data: {} as Record<string, boolean> }));
vi.mock("@/lib/queries/notifications", () => ({
  useNotificationPreferences: () => ({ data: prefs.data, isLoading: false, refetch: vi.fn() }),
  useUpdateNotificationPreferences: () => ({ mutateAsync: prefs.mutateAsync, isPending: false, isError: false }),
}));

const THREAD = "6abb11112222333344445555";

function withClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  return { ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>), invalidate };
}

beforeEach(() => {
  push.mockClear();
  toasts.info.mockClear();
  toasts.success.mockClear();
  toasts.error.mockClear();
  pushLib.handler = null;
  Object.defineProperty(globalThis, "Notification", { configurable: true, value: { permission: "granted" } });
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  clearMessagingStorage();
});

afterEach(() => vi.restoreAllMocks());

describe("foreground message push (CONTRACT §5, web P4/P5)", () => {
  it("reads the thread id from a message link and nothing else", () => {
    expect(threadIdFromLink(`/dashboard/messages?thread=${THREAD}`)).toBe(THREAD);
    expect(threadIdFromLink("/dashboard/gym-owner/checkins")).toBeNull();
    expect(threadIdFromLink("/dashboard/messages?thread=nope")).toBeNull();
    expect(threadIdFromLink(undefined)).toBeNull();
  });

  it("refreshes the inbox and badge, and View opens the thread in this role's inbox", async () => {
    const { invalidate } = withClient(<PushRegistrar />);
    await waitFor(() => expect(pushLib.handler).not.toBeNull());
    act(() => pushLib.handler!("Binectics", "New message from Halima", `/dashboard/messages?thread=${THREAD}`));
    expect(invalidate).toHaveBeenCalled();
    expect(toasts.info).toHaveBeenCalledTimes(1);
    const action = toasts.info.mock.calls[0][1] as { onClick: () => void };
    action.onClick();
    expect(push).toHaveBeenCalledWith(`/dashboard/trainer/messages?thread=${THREAD}`);
  });

  it("stays quiet and syncs when that thread is already open and visible", async () => {
    const syncNow = vi.fn();
    const unregister = registerOpenThread(THREAD, syncNow);
    withClient(<PushRegistrar />);
    await waitFor(() => expect(pushLib.handler).not.toBeNull());
    act(() => pushLib.handler!("Binectics", "New message from Halima", `/dashboard/messages?thread=${THREAD}`));
    expect(syncNow).toHaveBeenCalledTimes(1);
    expect(toasts.info).not.toHaveBeenCalled();
    unregister();
  });

  it("leaves other notifications as they were", async () => {
    withClient(<PushRegistrar />);
    await waitFor(() => expect(pushLib.handler).not.toBeNull());
    act(() => pushLib.handler!("Check-in", "Welcome back", "/dashboard/member/streaks"));
    (toasts.info.mock.calls[0][1] as { onClick: () => void }).onClick();
    expect(push).toHaveBeenCalledWith("/dashboard/member/streaks");
  });
});

describe("message preview setting (CONTRACT §4.15, web W24)", () => {
  it("is off by default and toggles pushMessagePreviews", async () => {
    prefs.data = { inAppMessages: true };
    prefs.mutateAsync.mockResolvedValue({});
    render(<NotificationPreferencesPanel />);
    const toggle = screen.getByRole("button", { name: "Show message text in notifications" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    await waitFor(() => expect(prefs.mutateAsync).toHaveBeenCalledWith({ pushMessagePreviews: true }));
  });
});

describe("gym announcements (web W16)", () => {
  it("names the real audience, opens the thread on success, and retries with the same id", async () => {
    const onSent = vi.fn();
    const broadcast = vi
      .spyOn(messagingService, "broadcast")
      .mockResolvedValueOnce({ success: false, message: "Network error" })
      .mockResolvedValueOnce({
        success: true,
        data: {
          _id: "m1",
          thread_id: THREAD,
          seq: 1,
          rev: 1,
          client_message_id: "x",
          side: MessageSide.MINE,
          sender_id: null,
          author: { kind: "gym", user_id: null, name: "Dapo", avatar_url: null },
          staff_sender: null,
          body: "Closed Monday",
          created_at: new Date().toISOString(),
          edited_at: null,
          deleted_at: null,
          reply_to: null,
          reactions: [],
          editable_until: null,
          can_delete: true,
        },
      });
    render(<AnnouncePanel userId="u1" organizationId="org1" gymName="Dapo Fitness Hub" onSent={onSent} onBack={vi.fn()} />);
    expect(screen.getByText(/every active member and staff member of Dapo Fitness Hub/)).toBeInTheDocument();

    const box = screen.getByRole("textbox", { name: "Announcement to all members and staff" });
    fireEvent.change(box, { target: { value: "Closed Monday" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to all" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not sent");
    expect(box).toHaveValue("Closed Monday");

    fireEvent.click(screen.getByRole("button", { name: "Send to all" }));
    await waitFor(() => expect(onSent).toHaveBeenCalledWith(THREAD));
    expect(toasts.success).toHaveBeenCalledWith("Announcement sent.");
    expect(box).toHaveValue("");
    const ids = broadcast.mock.calls.map((c) => c[0].client_message_id);
    expect(ids[0]).toBe(ids[1]);
  });
});
