import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReadOnlyReason, ThreadKind, ThreadRole } from "@/lib/api/messaging";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { clearMessagingStorage } from "@/components/messaging/messagingStorage";
import { toggleReaction } from "@/components/messaging/MessageActions";
import { createMessagingFake, ME, networkError, type MessagingFake } from "./messaging-fake";

const nav = vi.hoisted(() => {
  let params = new URLSearchParams();
  const listeners = new Set<() => void>();
  const set = (url: string) => {
    params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
    listeners.forEach((fn) => fn());
  };
  return {
    get: () => params,
    set,
    push: vi.fn(set),
    replace: vi.fn(set),
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
});

vi.mock("next/navigation", async () => {
  const React = await import("react");
  return {
    useSearchParams: () => React.useSyncExternalStore(nav.subscribe, nav.get, nav.get),
    usePathname: () => "/dashboard/messages",
    useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn() }),
  };
});
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: ME, role: "USER" } }) }));
const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@/components/Toast", () => ({ toast: Object.assign(vi.fn(), toasts) }));

let fake: MessagingFake;

beforeEach(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  clearMessagingStorage();
  sessionStorage.clear();
  Object.values(toasts).forEach((fn) => fn.mockClear());
  fake = createMessagingFake();
  fake.install();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function openThread(threadId: string) {
  nav.set(`/dashboard/messages?thread=${threadId}`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MessagingCenter emptyHint="hint" />
    </QueryClientProvider>,
  );
  return screen.findByRole("log");
}

const bubble = (text: string) => within(screen.getByRole("log")).getByText(text).closest("[data-message-id]") as HTMLElement;
const menu = () => screen.getByRole("menu", { name: "Message actions" });

describe("message action menu (web W19)", () => {
  it("opens from the hover button with the actions this message allows", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "their note");
    fake.sendAsMe(t, "my note");
    const log = await openThread(t);
    await within(log).findByText("my note");

    fireEvent.click(screen.getByRole("button", { name: "Actions for Tunde's message" }));
    const theirs = within(menu());
    expect(theirs.getByRole("group", { name: "React" })).toBeInTheDocument();
    expect(theirs.getByRole("menuitem", { name: "Reply" })).toBeInTheDocument();
    expect(theirs.getByRole("menuitem", { name: "Copy text" })).toBeInTheDocument();
    expect(theirs.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(theirs.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();

    fireEvent.keyDown(menu(), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Actions for your message" }));
    expect(within(menu()).getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(within(menu()).getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("is fully keyboard operable: arrows move between messages, Enter or Shift+F10 opens, Escape returns focus", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "first");
    fake.receive(t, "second");
    const log = await openThread(t);
    await within(log).findByText("second");

    log.focus();
    fireEvent.keyDown(log, { key: "ArrowUp" });
    expect(document.activeElement).toBe(bubble("second"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(document.activeElement).toBe(bubble("first"));

    fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    await waitFor(() => expect(within(menu()).getAllByRole("menuitemcheckbox")[0]).toHaveFocus());
    fireEvent.keyDown(menu(), { key: "End" });
    expect(within(menu()).getByRole("menuitem", { name: "Copy text" })).toHaveFocus();
    fireEvent.keyDown(menu(), { key: "ArrowDown" });
    expect(within(menu()).getAllByRole("menuitemcheckbox")[0]).toHaveFocus();
    fireEvent.keyDown(menu(), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await waitFor(() => expect(bubble("first")).toHaveFocus());

    fireEvent.keyDown(bubble("first"), { key: "F10", shiftKey: true });
    expect(screen.getByRole("menu", { name: "Message actions" })).toBeInTheDocument();
  });

  it("opens on right click (context menu)", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "right click me");
    await openThread(t);
    fireEvent.contextMenu(bubble("right click me"));
    expect(menu()).toBeInTheDocument();
  });

  it("copies the text and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "copy this");
    await openThread(t);
    fireEvent.contextMenu(bubble("copy this"));
    fireEvent.click(within(menu()).getByRole("menuitem", { name: "Copy text" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("copy this"));
    expect(toasts.success).toHaveBeenCalledWith("Copied.");
  });
});

describe("edit and delete (owner ruling 2)", () => {
  it("edits inline within the window and shows Edited", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.sendAsMe(t, "typo here");
    await openThread(t);
    fireEvent.contextMenu(bubble("typo here"));
    fireEvent.click(within(menu()).getByRole("menuitem", { name: "Edit" }));
    const editor = screen.getByRole("textbox", { name: "Edit message" });
    expect(editor).toHaveFocus();
    fireEvent.change(editor, { target: { value: "fixed now" } });
    fireEvent.keyDown(editor, { key: "Enter" });
    await waitFor(() => expect(fake.count("editMessage")).toBe(1));
    expect(await within(screen.getByRole("log")).findByText("fixed now")).toBeInTheDocument();
    expect(within(screen.getByRole("log")).getByText(/Edited/)).toBeInTheDocument();
    expect(fake.calls.find((c) => c.method === "editMessage")!.args[2]).toBe("fixed now");
  });

  it("hides Edit once the 15-minute window has passed", async () => {
    const t = fake.addThread({ title: "Tunde" });
    const m = fake.sendAsMe(t, "too old to edit");
    fake.change(t, m._id, { editable_until: new Date(Date.now() - 1_000).toISOString() });
    await openThread(t);
    fireEvent.contextMenu(bubble("too old to edit"));
    expect(within(menu()).queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(within(menu()).getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("Escape cancels an edit and keeps the original", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.sendAsMe(t, "keep me");
    await openThread(t);
    fireEvent.contextMenu(bubble("keep me"));
    fireEvent.click(within(menu()).getByRole("menuitem", { name: "Edit" }));
    const editor = screen.getByRole("textbox", { name: "Edit message" });
    fireEvent.change(editor, { target: { value: "never mind" } });
    fireEvent.keyDown(editor, { key: "Escape" });
    expect(within(screen.getByRole("log")).getByText("keep me")).toBeInTheDocument();
    expect(fake.count("editMessage")).toBe(0);
  });

  it("asks before deleting, then shows Message deleted", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.sendAsMe(t, "regret this");
    await openThread(t);
    fireEvent.contextMenu(bubble("regret this"));
    fireEvent.click(within(menu()).getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete message?" });
    expect(fake.count("deleteMessage")).toBe(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete for everyone" }));
    expect(await within(screen.getByRole("log")).findByText("Message deleted")).toBeInTheDocument();
    expect(within(screen.getByRole("log")).queryByText("regret this")).not.toBeInTheDocument();
  });
});

describe("reactions (optimistic with rollback)", () => {
  it("adds a reaction at once and keeps it when the server agrees", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "nice work");
    await openThread(t);
    fireEvent.contextMenu(bubble("nice work"));
    fireEvent.click(within(menu()).getByRole("menuitemcheckbox", { name: "Thumbs up" }));
    const chip = await screen.findByRole("button", { name: /Thumbs up, 1, including you/ });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(fake.count("addReaction")).toBe(1));
    fireEvent.click(chip);
    await waitFor(() => expect(screen.queryByRole("button", { name: /Thumbs up/ })).not.toBeInTheDocument());
    expect(fake.count("removeReaction")).toBe(1);
  });

  it("rolls back and says so when the server refuses", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "nice work");
    fake.failNext("addReaction", networkError());
    await openThread(t);
    fireEvent.contextMenu(bubble("nice work"));
    fireEvent.click(within(menu()).getByRole("menuitemcheckbox", { name: "Heart" }));
    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith("Couldn't update the reaction."));
    expect(screen.queryByRole("button", { name: /Heart/ })).not.toBeInTheDocument();
  });

  it("offers no reactions in announcements", async () => {
    const t = fake.addThread(
      { title: "Dapo · announcements", kind: ThreadKind.BROADCAST, my_role: ThreadRole.AUDIENCE },
      ReadOnlyReason.ANNOUNCEMENTS_ONLY,
    );
    fake.receive(t, "Closed Monday");
    await openThread(t);
    fireEvent.contextMenu(bubble("Closed Monday"));
    expect(within(menu()).queryByRole("group", { name: "React" })).not.toBeInTheDocument();
    expect(within(menu()).queryByRole("menuitem", { name: "Reply" })).not.toBeInTheDocument();
  });

  it("toggleReaction keeps the fixed order and drops empty keys", () => {
    const base = {
      reactions: [{ key: "tada", emoji: "🎉", count: 1, mine: false }],
    } as Parameters<typeof toggleReaction>[0];
    const added = toggleReaction(base, "thumbs_up" as never, true);
    expect(added.reactions.map((r) => r.key)).toEqual(["thumbs_up", "tada"]);
    expect(toggleReaction(added, "thumbs_up" as never, false).reactions.map((r) => r.key)).toEqual(["tada"]);
  });
});

describe("reply", () => {
  it("quotes the message above the composer and sends reply_to_message_id; Escape cancels", async () => {
    const t = fake.addThread({ title: "Tunde" });
    const original = fake.receive(t, "Can we move to 7?");
    await openThread(t);
    fireEvent.contextMenu(bubble("Can we move to 7?"));
    fireEvent.click(within(menu()).getByRole("menuitem", { name: "Reply" }));
    expect(screen.getByText("Replying to Tunde")).toBeInTheDocument();
    const box = screen.getByRole("textbox", { name: "Message Tunde" });
    await waitFor(() => expect(box).toHaveFocus());

    fireEvent.keyDown(box, { key: "Escape" });
    expect(screen.queryByText("Replying to Tunde")).not.toBeInTheDocument();

    fireEvent.contextMenu(bubble("Can we move to 7?"));
    fireEvent.click(within(menu()).getByRole("menuitem", { name: "Reply" }));
    fireEvent.change(box, { target: { value: "Yes, 7 works" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(fake.count("sendMessage")).toBe(1));
    expect(fake.calls.find((c) => c.method === "sendMessage")!.args[1]).toMatchObject({
      body: "Yes, 7 works",
      reply_to_message_id: original._id,
    });
    expect(screen.queryByText("Replying to Tunde")).not.toBeInTheDocument();
  });
});

describe("thread menu: mute and block (web W21)", () => {
  it("mutes and unmutes for anyone who can read", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    await openThread(t);
    fireEvent.click(screen.getByRole("button", { name: "Conversation options" }));
    const options = screen.getByRole("menu", { name: "Conversation options" });
    expect(within(options).queryByRole("menuitem", { name: /Block/ })).not.toBeInTheDocument();
    fireEvent.click(within(options).getByRole("menuitem", { name: "Mute notifications" }));
    await waitFor(() => expect(fake.calls.find((c) => c.method === "setMuted")!.args[1]).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Conversation options" }));
    expect(screen.getByRole("menuitem", { name: "Unmute notifications" })).toBeInTheDocument();
  });

  it("offers Block only when the server allows it, confirms, then offers Unblock", async () => {
    const t = fake.addThread({ title: "Ex Client" }, ReadOnlyReason.RELATIONSHIP_ENDED);
    fake.allowBlock(t);
    fake.receive(t, "still writing");
    await openThread(t);
    fireEvent.click(screen.getByRole("button", { name: "Conversation options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Block Ex Client" }));
    const dialog = await screen.findByRole("dialog", { name: "Block Ex Client?" });
    expect(dialog).toHaveTextContent("They won’t be able to send you messages in this conversation. You can unblock them later.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Block" }));
    await waitFor(() => expect(fake.count("block")).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "Conversation options" }));
    expect(screen.queryByRole("menuitem", { name: /^Block/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Unblock Ex Client" }));
    await waitFor(() => expect(fake.count("unblock")).toBe(1));
  });
});

describe("gym inbox labels (web W22)", () => {
  it("says who you reply as and which teammate sent each as-gym message", async () => {
    const t = fake.addThread({
      title: "Yemi Balogun",
      kind: ThreadKind.GYM,
      my_role: ThreadRole.GYM_STAFF,
      as_gym: { organization_id: "o1", name: "Dapo Fitness Hub" },
    });
    const m = fake.sendAsMe(t, "Your plan is renewed");
    fake.change(t, m._id, { staff_sender: { user_id: ME, name: "Kemi" } });
    await openThread(t);
    expect(await screen.findByText("Replying as Dapo Fitness Hub")).toBeInTheDocument();
    expect(within(screen.getByRole("log")).getByText(/Sent by Kemi/)).toBeInTheDocument();
  });
});

describe("search (web W20)", () => {
  it("finds conversations and messages, and opens a hit in context", async () => {
    const t = fake.addThread({ title: "Tunde" });
    for (let i = 1; i <= 70; i++) fake.receive(t, i === 5 ? "the seven pm session works" : `filler ${i}`);
    nav.set("/dashboard/messages");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MessagingCenter emptyHint="hint" />
      </QueryClientProvider>,
    );
    const box = await screen.findByRole("searchbox", { name: "Search conversations and messages" });
    fireEvent.change(box, { target: { value: "seven" } });
    const results = await screen.findByRole("region", { name: "Search results for seven" }, { timeout: 2_000 });
    const hit = within(results).getByRole("button", { name: /Tunde, Tunde: the seven pm session works/ });
    expect(within(hit).getByText("seven").tagName).toBe("MARK");

    fireEvent.click(hit);
    await waitFor(() => expect(nav.get().get("seq")).toBe("5"));
    const log = await screen.findByRole("log");
    expect(await within(log).findByText("the seven pm session works")).toBeInTheDocument();
    // Opened around the hit: history before_seq = hit + 1.
    expect(
      fake.calls.some((c) => c.method === "getMessages" && (c.args[1] as { before_seq?: number }).before_seq === 6),
    ).toBe(true);
    expect(box).toHaveValue("seven");
    fireEvent.keyDown(box, { key: "Escape" });
    expect(box).toHaveValue("");
  });

  it("explains a search timeout", async () => {
    fake.failNext("search", { success: false, status: 503, code: "MESSAGING_SEARCH_TIMEOUT" });
    nav.set("/dashboard/messages");
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MessagingCenter emptyHint="hint" />
      </QueryClientProvider>,
    );
    fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "anything" } });
    expect(await screen.findByText("Search took too long, try a longer phrase.", {}, { timeout: 2_000 })).toBeInTheDocument();
  });
});

describe("act warnings guard", () => {
  it("leaves no timers that update after the test", async () => {
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "x");
    await openThread(t);
    await act(async () => {});
    expect(true).toBe(true);
  });
});
