import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { clearMessagingStorage, loadDraft, saveDraft } from "@/components/messaging/messagingStorage";
import { DraftFromLink } from "@/app/dashboard/messages/DraftFromLink";
import { createMessagingFake, ME, type MessagingFake } from "./messaging-fake";

// The URL is a tiny external store so ?thread= / ?draft= changes re-render.
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
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => ({ organizations: [] }) }));
vi.mock("@/components/Toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));

const DRAFT = "I'm planning a 16-hour fast, 8:00 PM today to 12:00 PM tomorrow. Is that OK with my meal plan?";
let fake: MessagingFake;

beforeEach(() => {
  clearMessagingStorage();
  sessionStorage.clear();
  nav.push.mockClear();
  nav.replace.mockClear();
  fake = createMessagingFake();
  fake.install();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DraftFromLink>
        <MessagingCenter />
      </DraftFromLink>
    </QueryClientProvider>,
  );
}
const composer = () => screen.getByRole("textbox", { name: /^Message / });

describe("messages page: ?draft= pre-fills the composer and never sends", () => {
  it("opens the thread with the draft in the composer, says nothing is sent, and takes the draft out of the address", async () => {
    const t = fake.addThread({ title: "Ngozi Okafor" });
    nav.set(`/dashboard/messages?thread=${t}&draft=${encodeURIComponent(DRAFT)}`);
    mount();

    expect(await screen.findByRole("heading", { name: "Ngozi Okafor" })).toBeInTheDocument();
    await waitFor(() => expect(composer()).toHaveValue(DRAFT));
    expect(screen.getByTestId("draft-note")).toHaveTextContent("Draft. Nothing is sent until you tap Send.");
    expect(nav.replace).toHaveBeenCalledWith(`/dashboard/messages?thread=${t}`, { scroll: false });
    // Give any stray send every chance to happen: none does.
    await new Promise((r) => setTimeout(r, 50));
    expect(fake.count("sendMessage")).toBe(0);
  });

  it("keeps text the member had already typed in that conversation", async () => {
    const t = fake.addThread({ title: "Ngozi Okafor" });
    saveDraft(ME, t, "About Thursday");
    nav.set(`/dashboard/messages?thread=${t}&draft=${encodeURIComponent(DRAFT)}`);
    mount();
    await screen.findByRole("heading", { name: "Ngozi Okafor" });
    await waitFor(() => expect(composer()).toHaveValue("About Thursday"));
    expect(screen.queryByTestId("draft-note")).not.toBeInTheDocument();
    expect(fake.count("sendMessage")).toBe(0);
  });

  it("replaces an older fasting draft left unsent", async () => {
    const t = fake.addThread({ title: "Ngozi Okafor" });
    saveDraft(ME, t, "I'm planning a 12-hour fast, 9:00 PM today to 9:00 AM tomorrow.");
    nav.set(`/dashboard/messages?thread=${t}&draft=${encodeURIComponent(DRAFT)}`);
    mount();
    await screen.findByRole("heading", { name: "Ngozi Okafor" });
    await waitFor(() => expect(composer()).toHaveValue(DRAFT));
    expect(loadDraft(ME, t)).toBe(DRAFT);
  });

  it("ignores a draft without a usable thread and drops it from the address", async () => {
    nav.set(`/dashboard/messages?thread=nope&draft=${encodeURIComponent(DRAFT)}`);
    mount();
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/dashboard/messages", { scroll: false }));
    expect(screen.queryByTestId("draft-note")).not.toBeInTheDocument();
    expect(fake.count("sendMessage")).toBe(0);
  });
});
