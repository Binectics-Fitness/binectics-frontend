import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPatch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

import FacilityItemFormModal from "@/components/FacilityItemFormModal";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  FacilityCategory,
  FacilityCondition,
  FacilityStatus,
  type FacilityItem,
} from "@/lib/types";

const item: FacilityItem = {
  _id: "item-1",
  name: "Free weights",
  category: FacilityCategory.EQUIPMENT,
  status: FacilityStatus.AVAILABLE,
  condition: FacilityCondition.GOOD,
  description: "",
  image_url: "https://img.example/weights.jpg",
  is_featured: false,
};

function preview(): HTMLImageElement | null {
  return document.querySelector('img[src="https://img.example/weights.jpg"]');
}

describe("marketplaceService.removeFacilityItemImage", () => {
  beforeEach(() => mockPatch.mockReset());

  it("sends remove_image on its own to the facility item", async () => {
    mockPatch.mockResolvedValue({ success: true, data: { ...item, image_url: undefined } });
    await marketplaceService.removeFacilityItemImage("listing 1", "item-1");
    expect(mockPatch).toHaveBeenCalledWith(
      "/marketplace/my-listings/listing%201/facility-items/item-1",
      { remove_image: true },
    );
  });
});

describe("FacilityItemFormModal: Remove photo", () => {
  it("asks first, then removes the photo and clears the preview", async () => {
    const onRemoveImage = vi.fn().mockResolvedValue({});
    render(
      <FacilityItemFormModal open onClose={vi.fn()} onSubmit={vi.fn()} initial={item} onRemoveImage={onRemoveImage} />,
    );
    await screen.findByDisplayValue("Free weights");
    expect(preview()).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    // Nothing goes until it is confirmed.
    expect(onRemoveImage).not.toHaveBeenCalled();
    const confirm = screen.getByRole("group", { name: "Remove this photo?" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Remove photo" }));

    await waitFor(() => expect(onRemoveImage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(preview()).toBeNull());
    expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull();
    // With no photo, the icon and gradient pickers come back.
    expect(screen.getByText("Icon")).toBeTruthy();
  });

  it("Cancel keeps the photo and sends nothing", async () => {
    const onRemoveImage = vi.fn().mockResolvedValue({});
    render(
      <FacilityItemFormModal open onClose={vi.fn()} onSubmit={vi.fn()} initial={item} onRemoveImage={onRemoveImage} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Remove photo" }));
    const confirm = screen.getByRole("group", { name: "Remove this photo?" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Cancel" }));
    expect(onRemoveImage).not.toHaveBeenCalled();
    expect(preview()).not.toBeNull();
  });

  it("keeps the photo and says why when the removal is refused", async () => {
    const onRemoveImage = vi.fn().mockResolvedValue({ error: "Listing not found" });
    render(
      <FacilityItemFormModal open onClose={vi.fn()} onSubmit={vi.fn()} initial={item} onRemoveImage={onRemoveImage} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Remove photo" }));
    const confirm = screen.getByRole("group", { name: "Remove this photo?" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Remove photo" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Listing not found");
    expect(preview()).not.toBeNull();
  });

  it("isn't offered for a new item or while a new image is picked", async () => {
    const onRemoveImage = vi.fn();
    const { unmount } = render(
      <FacilityItemFormModal open onClose={vi.fn()} onSubmit={vi.fn()} initial={null} onRemoveImage={onRemoveImage} />,
    );
    await screen.findByPlaceholderText("e.g. Free Weights");
    expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull();
    unmount();

    render(
      <FacilityItemFormModal open onClose={vi.fn()} onSubmit={vi.fn()} initial={item} onRemoveImage={onRemoveImage} />,
    );
    await screen.findByDisplayValue("Free weights");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "new.png", { type: "image/png" })] } });
    expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Keep the current image" })).toBeTruthy();
  });
});
