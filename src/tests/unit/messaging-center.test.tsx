import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MessageSide, ReadOnlyReason, ThreadKind, ThreadRole } from "@/lib/api/messaging";
import { marketplaceService } from "@/lib/api/marketplace";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { clearMessagingStorage } from "@/components/messaging/messagingStorage";
import { syncIfOpen } from "@/components/messaging/openThread";
import { createMessagingFake, lostResponse, ME, networkError, serverError, type MessagingFake } from "./messaging-fake";

// ── Next navigation: the URL is a tiny external store so ?thread= changes re-render ──
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

const orgs = vi.hoisted(() => ({ list: [] as { _id: string; name: string; owner_id: string }[] }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => ({ organizations: orgs.list }) }));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@/components/Toast", () => ({ toast: Object.assign(vi.fn(), toasts) }));

// ── jsdom has no layout: give the transcript a measurable scroll box ──
let visibility: DocumentVisibilityState = "visible";
const scrollTops = new WeakMap<Element, number>();
const ROW_PX = 100;
const VIEW_PX = 300;

beforeEach(() => {
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("role") === "log" ? this.querySelectorAll("li").length * ROW_PX : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("role") === "log" ? VIEW_PX : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTop", {
    configurable: true,
    get(this: HTMLElement) {
      return scrollTops.get(this) ?? 0;
    },
    set(this: HTMLElement, v: number) {
      const max = Math.max(0, this.scrollHeight - this.clientHeight);
      scrollTops.set(this, Math.min(Math.max(0, v), max));
    },
  });
  clearMessagingStorage();
  sessionStorage.clear();
  orgs.list = [];
  toasts.success.mockClear();
  toasts.error.mockClear();
  nav.push.mockClear();
  nav.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

let fake: MessagingFake;

function setup(query = "") {
  fake = createMessagingFake();
  fake.install();
  nav.set(`/dashboard/messages${query ? `?${query}` : ""}`);
  return fake;
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <MessagingCenter emptyHint="Messages with your gym, trainer or dietitian appear here." />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

const log = () => screen.getByRole("log");
const composer = () => screen.getByRole("textbox", { name: /^Message / });
const scrollTo = (top: number) => {
  const el = log();
  el.scrollTop = top;
  fireEvent.scroll(el);
};

describe("MessagingCenter: opening and reading", () => {
  it("opens the conversation in ?thread= with day separators, a time on every message and the author in the accessible text", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde Bakare" });
    fake.receive(t, "Morning, ready for 7?");
    fake.sendAsMe(t, "Yes, see you there");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();

    expect(await screen.findByRole("heading", { name: "Tunde Bakare" })).toBeInTheDocument();
    const list = within(log()).getAllByRole("listitem");
    expect(list[0]).toHaveTextContent(/Today|Yesterday|\w{3}/);
    expect(within(log()).getByText(/^Tunde Bakare, .*\d:\d{2}.*:\s*$/)).toBeInTheDocument();
    expect(within(log()).getByText(/^You, .*\d:\d{2}.*:\s*$/)).toBeInTheDocument();
    expect(log().querySelectorAll("time")).toHaveLength(2);
  });

  it("shows an unavailable state for a thread it can't read, and stops asking (web B8)", async () => {
    setup(`thread=${"d".repeat(24)}`);
    mount();
    expect(await screen.findByText("This conversation isn't available")).toBeInTheDocument();
    const before = fake.count("getMessages");
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(fake.count("getMessages")).toBe(before);
  });

  it("never calls the API for a malformed thread id", async () => {
    setup("thread=../../etc");
    mount();
    expect(await screen.findByText("This conversation isn't available")).toBeInTheDocument();
    expect(fake.count("getMessages")).toBe(0);
    expect(fake.count("getThread")).toBe(0);
  });

  it("follows ?thread= when it changes on the page (notification View, Back)", async () => {
    setup();
    const a = fake.addThread({ title: "Alpha" });
    const b = fake.addThread({ title: "Beta" });
    fake.receive(a, "from alpha");
    fake.receive(b, "from beta");
    nav.set(`/dashboard/messages?thread=${a}`);
    mount();
    expect(await within(await screen.findByRole("log")).findByText("from alpha")).toBeInTheDocument();
    act(() => nav.set(`/dashboard/messages?thread=${b}`));
    expect(await within(await screen.findByRole("log")).findByText("from beta")).toBeInTheDocument();
    expect(within(log()).queryByText("from alpha")).not.toBeInTheDocument();
  });

  it("never paints a slow response for thread A into thread B (web B11)", async () => {
    setup();
    const a = fake.addThread({ title: "Alpha" });
    const b = fake.addThread({ title: "Beta" });
    fake.receive(a, "alpha only");
    fake.receive(b, "beta only");
    let releaseA!: () => void;
    const original = fake.api.getMessages;
    vi.spyOn((await import("@/lib/api/messaging")).messagingService, "getMessages").mockImplementation(
      async (id, cursor, limit) => {
        if (id === a) await new Promise<void>((r) => (releaseA = r));
        return original(id, cursor, limit);
      },
    );
    nav.set(`/dashboard/messages?thread=${a}`);
    mount();
    await waitFor(() => expect(releaseA).toBeDefined());
    act(() => nav.set(`/dashboard/messages?thread=${b}`));
    expect(await within(await screen.findByRole("log")).findByText("beta only")).toBeInTheDocument();
    await act(async () => releaseA());
    expect(within(log()).queryByText("alpha only")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument();
  });

  it("marks the list row as current and gives it one clean name with the unread count", async () => {
    setup();
    const t = fake.addThread({ title: "Halima" });
    fake.receive(t, "one");
    fake.receive(t, "two");
    mount();
    const row = await screen.findByRole("button", { name: /^Halima, 2 unread, two/ });
    fireEvent.click(row);
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith(`/dashboard/messages?thread=${t}`, { scroll: false }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Halima/ })).toHaveAttribute("aria-current", "true"));
  });

  it("keeps the open row on --bg with --fg-2 secondary text (AA contrast), and labels only gym threads as an inbox", async () => {
    setup();
    const gym = fake.addThread({
      title: "Yemi Balogun",
      kind: ThreadKind.GYM,
      my_role: ThreadRole.GYM_OWNER,
      as_gym: { organization_id: "o1", name: "Dapo Fitness Hub" },
    });
    const ann = fake.addThread({
      title: "Dapo Fitness Hub · announcements",
      kind: ThreadKind.BROADCAST,
      my_role: ThreadRole.GYM_OWNER,
      as_gym: { organization_id: "o1", name: "Dapo Fitness Hub" },
    });
    fake.receive(gym, "pool on Sunday?");
    fake.sendAsMe(ann, "Closed Monday");
    nav.set(`/dashboard/messages?thread=${gym}`);
    mount();
    const row = await screen.findByRole("button", { name: /^Yemi Balogun, Dapo Fitness Hub inbox/ });
    await waitFor(() => expect(row).toHaveAttribute("aria-current", "true"));
    expect(row.getAttribute("style") ?? "").not.toContain("--bg-2");
    const annRow = screen.getByRole("button", { name: /^Dapo Fitness Hub · announcements/ });
    expect(within(annRow).getByText("You: Closed Monday").getAttribute("style")).toContain("var(--fg-2)");
    expect(annRow.getAttribute("aria-label")).not.toContain("inbox");
    expect(within(annRow).queryByText(/inbox/i)).not.toBeInTheDocument();
  });

  it("tells an error apart from an empty inbox, with a retry", async () => {
    setup();
    fake.failNext("listThreads", serverError());
    mount();
    expect(await screen.findByText("Couldn’t load your conversations.")).toBeInTheDocument();
    fake.addThread({ title: "Later" });
    fake.receive([...fake.threads.keys()][0], "hello");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: /^Later/ })).toBeInTheDocument();
  });

  it("shows the role's empty state, without promising a start button that isn't there", async () => {
    setup();
    mount();
    expect(await screen.findByText("No conversations yet")).toBeInTheDocument();
    expect(screen.getAllByText("Messages with your gym, trainer or dietitian appear here.").length).toBeGreaterThan(0);
    expect(screen.queryByText(/start a new one/)).not.toBeInTheDocument();
  });
});

describe("MessagingCenter: read-only states (web W11)", () => {
  it.each([
    [ReadOnlyReason.RELATIONSHIP_ENDED, "This conversation has ended. You can still read it, but not send new messages."],
    [ReadOnlyReason.BLOCKED, "You can't send messages in this conversation."],
    [ReadOnlyReason.UNAVAILABLE, "This conversation is no longer available for new messages."],
  ])("%s replaces the composer with an explanation", async (reason, copy) => {
    setup();
    const t = fake.addThread({ title: "Former coach" }, reason);
    fake.receive(t, "old message");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    expect(await screen.findByText(copy)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("explains announcements to a member instead of a dead composer", async () => {
    setup();
    const t = fake.addThread(
      { title: "Dapo Fitness Hub · announcements", kind: ThreadKind.BROADCAST, my_role: ThreadRole.AUDIENCE },
      ReadOnlyReason.ANNOUNCEMENTS_ONLY,
    );
    fake.receive(t, "Closed on Monday");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    expect(await screen.findByText("Only Dapo Fitness Hub can post announcements.")).toBeInTheDocument();
  });
});

describe("past member↔gym-owner conversations (owner ruling, Oct 10)", () => {
  const GYM = "f".repeat(24);
  const gymProviders = () =>
    vi.spyOn(marketplaceService, "getMyProviders").mockResolvedValue({
      success: true,
      data: { professionals: [], gyms: [{ organization_id: GYM, name: "Dapo Fitness Hub" }] },
    });

  it("the member reads it, can't write, and Message <Gym> opens the gym's inbox, which starts empty", async () => {
    setup();
    gymProviders();
    const old = fake.addThread({ title: "Dapo Ade", moved_to_organization_id: GYM }, ReadOnlyReason.MOVED_TO_GYM_INBOX);
    fake.receive(old, "Old chat with the owner");
    nav.set(`/dashboard/messages?thread=${old}`);
    mount();
    expect(await within(await screen.findByRole("log")).findByText("Old chat with the owner")).toBeInTheDocument();
    expect(
      await screen.findByText("This conversation has moved to Dapo Fitness Hub's inbox. You can still read it here."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Message Dapo Fitness Hub" }));
    await waitFor(() => expect(fake.calls.find((c) => c.method === "startThread")?.args[0]).toEqual({ organization_id: GYM }));
    const gymThread = [...fake.threads.values()].find((t) => t.summary.kind === ThreadKind.GYM)!.summary._id;
    await waitFor(() => expect(nav.get().get("thread")).toBe(gymThread));
    expect(await screen.findByText("No messages yet. Write the first one below.")).toBeInTheDocument();
    fireEvent.change(composer(), { target: { value: "Hi gym" } });
    fireEvent.keyDown(composer(), { key: "Enter" });
    await waitFor(() => expect(fake.threads.get(gymThread)!.messages.map((m) => m.body)).toEqual(["Hi gym"]));
  });

  it("shows a neutral notice with no action when no single gym can be named", async () => {
    setup();
    const old = fake.addThread({ title: "Dapo Ade", moved_to_organization_id: null }, ReadOnlyReason.MOVED_TO_GYM_INBOX);
    fake.receive(old, "older");
    nav.set(`/dashboard/messages?thread=${old}`);
    mount();
    expect(
      await screen.findByText("This conversation has moved to the gym's inbox. You can still read it here."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Message / })).not.toBeInTheDocument();
  });

  it("the owner sees it read-only with the gym named and no action", async () => {
    setup();
    orgs.list = [{ _id: GYM, name: "Dapo Fitness Hub", owner_id: ME }];
    const providers = vi.spyOn(marketplaceService, "getMyProviders");
    const old = fake.addThread({ title: "Yemi Balogun", moved_to_organization_id: GYM }, ReadOnlyReason.MOVED_TO_GYM_INBOX);
    fake.receive(old, "a question from before");
    nav.set(`/dashboard/messages?thread=${old}`);
    mount();
    expect(
      await screen.findByText("This conversation has moved to Dapo Fitness Hub's inbox. You can still read it here."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Message / })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(providers).not.toHaveBeenCalled();
  });

  it("a send refused with MESSAGING_MOVED_TO_GYM_INBOX turns the thread read-only", async () => {
    setup();
    gymProviders();
    const t = fake.addThread({ title: "Dapo Ade", moved_to_organization_id: GYM });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");
    fake.setReadOnly(t, ReadOnlyReason.MOVED_TO_GYM_INBOX);
    fireEvent.change(composer(), { target: { value: "late" } });
    fireEvent.keyDown(composer(), { key: "Enter" });
    expect(await screen.findByRole("button", { name: "Message Dapo Fitness Hub" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});

describe("MessagingCenter: sending (CONTRACT §6.2)", () => {
  it("shows the message at once as sending, then sent; text typed during the send is kept (web B3/B4)", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    let release!: () => void;
    const original = fake.api.sendMessage;
    const messaging = (await import("@/lib/api/messaging")).messagingService;
    vi.spyOn(messaging, "sendMessage").mockImplementation(async (id, payload) => {
      await new Promise<void>((r) => (release = r));
      return original(id, payload);
    });
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");

    fireEvent.change(composer(), { target: { value: "first" } });
    fireEvent.keyDown(composer(), { key: "Enter" });
    expect(composer()).toHaveValue("");
    expect(await screen.findByText("Sending…")).toBeInTheDocument();
    fireEvent.change(composer(), { target: { value: "typed while sending" } });

    await act(async () => release());
    await waitFor(() => expect(screen.queryByText("Sending…")).not.toBeInTheDocument());
    expect(within(log()).getByText("first")).toBeInTheDocument();
    expect(composer()).toHaveValue("typed while sending");
  });

  it("Enter sends, Shift+Enter is a new line, and nothing sends mid-IME composition", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");

    fireEvent.change(composer(), { target: { value: "line1" } });
    fireEvent.keyDown(composer(), { key: "Enter", shiftKey: true });
    fireEvent.keyDown(composer(), { key: "Enter", isComposing: true });
    fireEvent.keyDown(composer(), { key: "Enter", keyCode: 229 });
    expect(fake.count("sendMessage")).toBe(0);
    fireEvent.keyDown(composer(), { key: "Enter" });
    await waitFor(() => expect(fake.count("sendMessage")).toBe(1));
    // A repeat Enter on the now-empty box sends nothing.
    fireEvent.keyDown(composer(), { key: "Enter" });
    expect(fake.count("sendMessage")).toBe(1);
  });

  it("retries a network failure automatically with the same id, and the server keeps one message", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    // First attempt reaches the server but the answer is lost; the next one fails outright.
    fake.failNext("sendMessage", lostResponse(), networkError());
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");

    fireEvent.change(composer(), { target: { value: "only once" } });
    fireEvent.keyDown(composer(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(1_000 + 4_000 + 100));
    await waitFor(() => expect(screen.queryByText("Sending…")).not.toBeInTheDocument());

    const sends = fake.calls.filter((c) => c.method === "sendMessage");
    const ids = new Set(sends.map((c) => (c.args[1] as { client_message_id: string }).client_message_id));
    // Two or three attempts: a poll that already shows the stored message
    // (matched by client id) retires the pending copy and its next retry.
    expect(sends.length).toBeGreaterThanOrEqual(2);
    expect(sends.length).toBeLessThanOrEqual(3);
    expect(ids.size).toBe(1);
    expect(fake.threads.get(t)!.messages.filter((m) => m.body === "only once")).toHaveLength(1);
    expect(within(log()).getAllByText("only once")).toHaveLength(1);
  });

  it("after the automatic retries it fails with Retry and Discard; Retry reuses the id", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    fake.failNext("sendMessage", serverError(), serverError(), serverError(), serverError());
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");

    fireEvent.change(composer(), { target: { value: "stubborn" } });
    fireEvent.keyDown(composer(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(1_000 + 4_000 + 15_000 + 100));
    expect(await screen.findByText("Not sent")).toBeInTheDocument();
    expect(fake.count("sendMessage")).toBe(4);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByText("Not sent")).not.toBeInTheDocument());
    const ids = new Set(
      fake.calls.filter((c) => c.method === "sendMessage").map((c) => (c.args[1] as { client_message_id: string }).client_message_id),
    );
    expect(ids.size).toBe(1);
    expect(within(log()).getByText("stubborn")).toBeInTheDocument();
  });

  it("a read-only refusal fails without Retry and switches the thread to its notice", async () => {
    setup();
    const t = fake.addThread({ title: "Former client" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");
    fake.setReadOnly(t, ReadOnlyReason.RELATIONSHIP_ENDED);

    fireEvent.change(composer(), { target: { value: "too late" } });
    fireEvent.keyDown(composer(), { key: "Enter" });
    expect(
      await screen.findByText(
        "Not sent: This conversation has ended. You can still read it, but not send new messages.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByText("too late")).not.toBeInTheDocument();
  });

  it("restores unsent messages after a reload as failed, never sending them on its own", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    sessionStorage.setItem(
      `bx_msg:outbox:${ME}:${t}`,
      JSON.stringify([
        { client_message_id: "abcdefgh1234", body: "left behind", reply_to: null, created_at: new Date().toISOString(), status: "sending", failure: null },
      ]),
    );
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    expect(await screen.findByText("left behind")).toBeInTheDocument();
    expect(screen.getByText("Not sent")).toBeInTheDocument();
    expect(fake.count("sendMessage")).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(fake.count("sendMessage")).toBe(1));
    expect((fake.calls.find((c) => c.method === "sendMessage")!.args[1] as { client_message_id: string }).client_message_id).toBe(
      "abcdefgh1234",
    );
  });

  it("keeps one draft per conversation (web B5)", async () => {
    setup();
    const a = fake.addThread({ title: "Alpha" });
    const b = fake.addThread({ title: "Beta" });
    fake.receive(a, "a");
    fake.receive(b, "b");
    nav.set(`/dashboard/messages?thread=${a}`);
    mount();
    await within(await screen.findByRole("log")).findByText("a");
    fireEvent.change(composer(), { target: { value: "for alpha only" } });

    act(() => nav.set(`/dashboard/messages?thread=${b}`));
    await within(await screen.findByRole("log")).findByText("b");
    expect(composer()).toHaveValue("");
    act(() => nav.set(`/dashboard/messages?thread=${a}`));
    await within(await screen.findByRole("log")).findByText("a");
    expect(composer()).toHaveValue("for alpha only");
  });

  it("counts characters near the limit and refuses more than 4000", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");
    fireEvent.change(composer(), { target: { value: "x".repeat(4001) } });
    expect(screen.getByText("1 characters over the 4000 limit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});

describe("MessagingCenter: sync, scroll and read marks (CONTRACT §6.3, §6.4, §7)", () => {
  it("merges new messages from the poll and doesn't yank a reader who scrolled up (web B1)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    for (let i = 1; i <= 8; i++) fake.receive(t, `old ${i}`);
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("old 8");
    expect(log().scrollTop).toBe(log().scrollHeight - VIEW_PX);

    scrollTo(200);
    fake.receive(t, "fresh one");
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    expect(await within(log()).findByText("fresh one")).toBeInTheDocument();
    expect(log().scrollTop).toBe(200);
    const pill = screen.getByRole("button", { name: "New messages. Jump to the latest" });

    fireEvent.click(pill);
    await waitFor(() => expect(log().scrollTop).toBe(log().scrollHeight - VIEW_PX));
    expect(screen.queryByRole("button", { name: /New messages/ })).not.toBeInTheDocument();
  });

  it("sticks to the bottom for a reader who is already there", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    for (let i = 1; i <= 5; i++) fake.receive(t, `m ${i}`);
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("m 5");
    fake.receive(t, "m 6");
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    await within(log()).findByText("m 6");
    expect(log().scrollTop).toBe(log().scrollHeight - VIEW_PX);
    expect(screen.queryByRole("button", { name: /New messages/ })).not.toBeInTheDocument();
  });

  it("de-duplicates the settle-window repeats and applies edits from elsewhere in place", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    const first = fake.receive(t, "original");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("original");
    fake.receive(t, "second");
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    expect(within(log()).getAllByText("second")).toHaveLength(1);
    fake.change(t, first._id, { body: "edited elsewhere", edited_at: new Date().toISOString() });
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    expect(await within(log()).findByText("edited elsewhere")).toBeInTheDocument();
    expect(within(log()).getByText(/Edited/)).toBeInTheDocument();
  });

  it("loads older history with the reading position anchored", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    for (let i = 1; i <= 60; i++) fake.receive(t, `n${i}`);
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("n60");
    expect(within(log()).queryByText("n10")).not.toBeInTheDocument();
    const rowsBefore = log().querySelectorAll("li").length;

    scrollTo(100);
    await within(log()).findByText("n10");
    const added = log().querySelectorAll("li").length - rowsBefore;
    expect(added).toBeGreaterThan(0);
    // Same message under the reader's eyes: offset grew by exactly the prepended height.
    expect(log().scrollTop).toBe(100 + added * ROW_PX);
    expect(fake.calls.some((c) => c.method === "getMessages" && (c.args[1] as { before_seq?: number }).before_seq === 11)).toBe(true);
  });

  it("pauses while the tab is hidden and catches up the moment it's visible", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");

    visibility = "hidden";
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const polls = fake.count("getMessages");
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(fake.count("getMessages")).toBe(polls);

    fake.receive(t, "while away");
    visibility = "visible";
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await within(log()).findByText("while away")).toBeInTheDocument();
  });

  it("stops polling a thread that disappears and says so", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");
    fake.remove(t);
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    expect(await screen.findByText("This conversation isn't available")).toBeInTheDocument();
    const polls = fake.count("getMessages");
    const lookups = fake.count("getThread");
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fake.count("getMessages")).toBe(polls);
    expect(fake.count("getThread")).toBe(lookups);
  });

  it("marks read only when visible and at the bottom, never because history loaded", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    const t = fake.addThread({ title: "Tunde" });
    for (let i = 1; i <= 6; i++) fake.receive(t, `r${i}`);
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("r6");
    await act(() => vi.advanceTimersByTimeAsync(1_200));
    expect(fake.calls.filter((c) => c.method === "markRead").map((c) => c.args[1])).toEqual([6]);

    scrollTo(0);
    fake.receive(t, "r7");
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    await within(log()).findByText("r7");
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    expect(fake.count("markRead")).toBe(1);

    visibility = "hidden";
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    scrollTo(10_000);
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    expect(fake.count("markRead")).toBe(1);

    visibility = "visible";
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await act(() => vi.advanceTimersByTimeAsync(1_500));
    expect(fake.calls.filter((c) => c.method === "markRead").map((c) => c.args[1])).toEqual([6, 7]);
  });

  it("shows Read under my latest message the other person has read (direct only)", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "q");
    fake.sendAsMe(t, "first answer");
    fake.sendAsMe(t, "second answer");
    fake.setTheirRead(t, 2);
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("second answer");
    expect(within(log()).getAllByText(/· Read/)).toHaveLength(1);
    const read = within(log()).getByText(/· Read/).closest("li")!;
    expect(read).toHaveTextContent("first answer");
  });

  it("a push for the open, visible thread syncs it instead of raising a toast (web W17)", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await within(await screen.findByRole("log")).findByText("hi");
    fake.receive(t, "pushed");
    let handled = false;
    act(() => {
      handled = syncIfOpen(t);
    });
    expect(handled).toBe(true);
    expect(await within(log()).findByText("pushed")).toBeInTheDocument();
    expect(syncIfOpen("e".repeat(24))).toBe(false);
  });
});

describe("MessagingCenter: layout (web B6/B7/B10/B12)", () => {
  it("shows one pane at a time under md: the list hides while a thread is open", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "x".repeat(300));
    mount();
    const row = await screen.findByRole("button", { name: /^Tunde/ });
    const listPane = row.closest("ul")!.parentElement!.parentElement!;
    expect(listPane.classList.contains("flex")).toBe(true);
    expect(listPane.classList.contains("hidden")).toBe(false);

    act(() => nav.set(`/dashboard/messages?thread=${t}`));
    await screen.findByRole("log");
    expect(listPane.classList.contains("hidden")).toBe(true);
    expect(listPane.classList.contains("md:flex")).toBe(true);
    // Long unbroken tokens wrap inside the bubble instead of overflowing.
    const bubble = within(log()).getByText(/x{300}/);
    expect(bubble.className).toContain("[overflow-wrap:anywhere]");
    // The transcript fills the pane: no fixed max height.
    expect(log().getAttribute("style") ?? "").not.toContain("max-height");
  });

  it("Back returns to the list", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "hi");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    await screen.findByRole("log");
    fireEvent.click(screen.getByRole("button", { name: "Back to conversations" }));
    expect(nav.replace).toHaveBeenCalledWith("/dashboard/messages", { scroll: false });
    expect(await screen.findByText("No conversation selected")).toBeInTheDocument();
  });
});

describe("messages from me vs them", () => {
  it("renders my messages on ink and theirs on bg-2", async () => {
    setup();
    const t = fake.addThread({ title: "Tunde" });
    fake.receive(t, "theirs");
    fake.sendAsMe(t, "mine");
    nav.set(`/dashboard/messages?thread=${t}`);
    mount();
    const mine = await within(await screen.findByRole("log")).findByText("mine");
    expect(mine.getAttribute("style")).toContain("var(--ink)");
    expect(within(log()).getByText("theirs").getAttribute("style")).toContain("var(--bg-2)");
    expect(MessageSide.MINE).toBe("mine");
  });
});
