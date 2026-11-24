import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { listingShareUrl, shareListing } from "@/components/marketplace/ShareListingButton";
import { ListingMessageButton, NOT_CONNECTED_MESSAGE, resolveMessageGate } from "@/components/marketplace/ListingMessageButton";
import { acceptingLabel } from "@/app/marketplace/[listingId]/ListingProfile";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
let authUser: { id: string; role: string } | null = null;
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: authUser, isLoading: false }) }));
let providers: unknown = { professionals: [], gyms: [] };
vi.mock("@/components/messaging/MyCoachesCard", () => ({
  useMyProviders: () => ({ data: providers, isLoading: false, isError: false }),
}));
const startThread = vi.fn();
vi.mock("@/lib/api/messaging", () => ({ messagingService: { startThread: (p: unknown) => startThread(p) } }));
const toastError = vi.fn();
vi.mock("@/components/Toast", () => ({ toast: Object.assign(vi.fn(), { error: (m: string) => toastError(m), success: vi.fn() }) }));

beforeEach(() => {
  push.mockReset();
  startThread.mockReset();
  toastError.mockReset();
  authUser = null;
  providers = { professionals: [], gyms: [] };
});

describe("Share a listing", () => {
  const url = listingShareUrl("l 1");
  it("links to the public listing page only", () => {
    expect(listingShareUrl("l 1", "https://binectics.netlify.app/")).toBe("https://binectics.netlify.app/marketplace/l%201");
  });

  it("uses the Web Share API where the browser has it", async () => {
    const share = vi.fn(async () => undefined);
    await expect(shareListing("l 1", "Ada Obi", { share } as unknown as Navigator)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Ada Obi", text: "Ada Obi on Binectics", url });
  });

  it("says nothing when the member closes the sheet", async () => {
    const share = vi.fn(async () => {
      throw Object.assign(new Error("x"), { name: "AbortError" });
    });
    const writeText = vi.fn();
    await expect(shareListing("l 1", "Ada", { share, clipboard: { writeText } } as unknown as Navigator)).resolves.toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link without the Web Share API, and reports a failed copy", async () => {
    const writeText = vi.fn(async () => undefined);
    await expect(shareListing("l 1", "Ada", { clipboard: { writeText } } as unknown as Navigator)).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(url);
    const broken = vi.fn(async () => {
      throw new Error("denied");
    });
    await expect(shareListing("l 1", "Ada", { clipboard: { writeText: broken } } as unknown as Navigator)).resolves.toBe("failed");
    await expect(shareListing("l 1", "Ada", {} as Navigator)).resolves.toBe("failed");
  });
});

describe("Message gating (relationship-gated DMs)", () => {
  const base = {
    signedIn: true,
    authLoading: false,
    isMember: true,
    accountType: "personal_trainer",
    professionalId: "p1",
    organizationId: null,
    providers: { professionals: [], gyms: [] },
    providersLoading: false,
    providersError: false,
  };
  it("opens the thread only for a connected member", () => {
    const connected = { professionals: [{ professional_id: "p1" }], gyms: [] } as never;
    expect(resolveMessageGate({ ...base, providers: connected })).toEqual({ kind: "open", payload: { recipient_user_id: "p1" } });
    expect(resolveMessageGate(base)).toEqual({ kind: "blocked", reason: "Connect first to message" });
  });
  it("gates a gym on an active membership", () => {
    const gym = { ...base, accountType: "gym_owner", professionalId: null, organizationId: "o1" };
    expect(resolveMessageGate(gym)).toEqual({ kind: "blocked", reason: "Members can message this gym" });
    expect(resolveMessageGate({ ...gym, providers: { professionals: [], gyms: [{ organization_id: "o1" }] } as never })).toEqual({
      kind: "open",
      payload: { organization_id: "o1" },
    });
  });
  it("sends signed-out visitors to sign in, hides it from providers and offers it when unsure", () => {
    expect(resolveMessageGate({ ...base, signedIn: false, isMember: false }).kind).toBe("signin");
    expect(resolveMessageGate({ ...base, isMember: false }).kind).toBe("hidden");
    expect(resolveMessageGate({ ...base, professionalId: null }).kind).toBe("hidden");
    expect(resolveMessageGate({ ...base, providersError: true, providers: null }).kind).toBe("open");
  });

  it("renders a disabled Message with its reason, never a dead button", () => {
    authUser = { id: "u1", role: "USER" };
    render(<ListingMessageButton listingId="l1" accountType="personal_trainer" professionalId="p1" organizationId={null} providerName="Ada" />);
    const btn = screen.getByRole("button", { name: "Message Ada" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText("Connect first to message").id).toBe(btn.getAttribute("aria-describedby"));
  });

  it("opens the conversation for a connected member, and explains a refusal", async () => {
    authUser = { id: "u1", role: "USER" };
    providers = { professionals: [{ professional_id: "p1" }], gyms: [] };
    startThread.mockResolvedValueOnce({ success: true, data: { thread_id: "t9" } });
    render(<ListingMessageButton listingId="l1" accountType="personal_trainer" professionalId="p1" organizationId={null} providerName="Ada" />);
    fireEvent.click(screen.getByRole("button", { name: "Message Ada" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/messages?thread=t9"));
    expect(startThread).toHaveBeenCalledWith({ recipient_user_id: "p1" });

    startThread.mockResolvedValueOnce({ success: false, status: 403, message: "Forbidden" });
    fireEvent.click(screen.getByRole("button", { name: "Message Ada" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(NOT_CONNECTED_MESSAGE));
  });

  it("sends a signed-out visitor through login back to the listing", () => {
    render(<ListingMessageButton listingId="l1" accountType="gym_owner" professionalId={null} organizationId="o1" providerName="Gym" variant="icon" />);
    fireEvent.click(screen.getByRole("button", { name: "Message Gym" }));
    expect(push).toHaveBeenCalledWith("/login?redirect=%2Fmarketplace%2Fl1");
  });
});

describe("Accepting clients on the listing", () => {
  it("treats a missing field as accepting; only false is not taking", () => {
    expect(acceptingLabel(undefined)).toBe("Accepting clients");
    expect(acceptingLabel(null)).toBe("Accepting clients");
    expect(acceptingLabel(true)).toBe("Accepting clients");
    expect(acceptingLabel(false)).toBe("Not taking new clients");
  });
});
