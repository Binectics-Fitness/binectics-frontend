import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SaveListingButton } from "@/components/marketplace/SaveListingButton";
import { marketplaceService } from "@/lib/api/marketplace";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/marketplace/l1",
}));

let authState: { user: { id: string } | null; isLoading: boolean } = { user: null, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

const toastError = vi.fn();
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { error: (m: string) => toastError(m), success: vi.fn() }),
}));

function renderButton(props: Partial<Parameters<typeof SaveListingButton>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SaveListingButton listingId="l1" listingName="Iron Lab" {...props} />
    </QueryClientProvider>,
  );
}

describe("SaveListingButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockClear();
    toastError.mockClear();
    authState = { user: null, isLoading: false };
  });

  it("signed out: sends the person to log in and back to this page, without calling the API", async () => {
    const ids = vi.spyOn(marketplaceService, "getSavedListingIds");
    const save = vi.spyOn(marketplaceService, "saveListing");
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: "Save Iron Lab" }));

    expect(push).toHaveBeenCalledWith(`/login?redirect=${encodeURIComponent("/marketplace/l1")}`);
    expect(ids).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("signed in: shows the saved state from the ids list", async () => {
    authState = { user: { id: "u1" }, isLoading: false };
    vi.spyOn(marketplaceService, "getSavedListingIds").mockResolvedValue({ success: true, data: ["l1"] });
    renderButton();

    const btn = await screen.findByRole("button", { name: "Remove Iron Lab from saved" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("saves, flipping to saved at once", async () => {
    authState = { user: { id: "u1" }, isLoading: false };
    // Before the save, then the refetch after it.
    vi.spyOn(marketplaceService, "getSavedListingIds")
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValue({ success: true, data: ["l1"] });
    const save = vi
      .spyOn(marketplaceService, "saveListing")
      .mockResolvedValue({ success: true, data: { listing_id: "l1", saved: true } });
    renderButton({ variant: "button" });

    const btn = await screen.findByRole("button", { name: "Save Iron Lab" });
    expect(btn).toHaveTextContent("Save");
    await userEvent.click(btn);

    expect(save).toHaveBeenCalledWith("l1");
    expect(await screen.findByRole("button", { name: "Remove Iron Lab from saved" })).toHaveTextContent("Saved");
  });

  it("unsaves a saved listing", async () => {
    authState = { user: { id: "u1" }, isLoading: false };
    vi.spyOn(marketplaceService, "getSavedListingIds").mockResolvedValue({ success: true, data: ["l1"] });
    const unsave = vi
      .spyOn(marketplaceService, "unsaveListing")
      .mockResolvedValue({ success: true, data: { listing_id: "l1", saved: false } });
    renderButton();

    await userEvent.click(await screen.findByRole("button", { name: "Remove Iron Lab from saved" }));
    expect(unsave).toHaveBeenCalledWith("l1");
  });

  it("rolls back and says so when the API refuses", async () => {
    authState = { user: { id: "u1" }, isLoading: false };
    vi.spyOn(marketplaceService, "getSavedListingIds").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(marketplaceService, "saveListing").mockResolvedValue({
      success: false,
      message: "You can save up to 500 providers. Remove some to save more.",
    });
    renderButton();

    await userEvent.click(await screen.findByRole("button", { name: "Save Iron Lab" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("You can save up to 500 providers. Remove some to save more."),
    );
    expect(await screen.findByRole("button", { name: "Save Iron Lab" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not open the card it sits on", async () => {
    authState = { user: { id: "u1" }, isLoading: false };
    vi.spyOn(marketplaceService, "getSavedListingIds").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(marketplaceService, "saveListing").mockResolvedValue({ success: true, data: { listing_id: "l1", saved: true } });
    const client = new QueryClient();
    const onCardClick = vi.fn();
    render(
      <QueryClientProvider client={client}>
        <div onClick={onCardClick}>
          <SaveListingButton listingId="l1" listingName="Iron Lab" />
        </div>
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Save Iron Lab" }));
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
