import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GalleryManager, type GalleryTarget } from "@/components/provider/GalleryManager";

const svc = vi.hoisted(() => ({
  uploadSoloListingGalleryImages: vi.fn(),
  deleteSoloListingGalleryImage: vi.fn(),
  reorderSoloListingGalleryImages: vi.fn(),
  uploadOrgListingGalleryImages: vi.fn(),
  deleteOrgListingGalleryImage: vi.fn(),
  reorderOrgListingGalleryImages: vi.fn(),
}));
vi.mock("@/lib/api/marketplace", () => ({ marketplaceService: svc }));

const listing = { _id: "L1", photos: ["a.jpg", "b.jpg"] };

function renderGM(photos: string[], target: GalleryTarget, coverUrl?: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <GalleryManager photos={photos} target={target} coverUrl={coverUrl} />
    </QueryClientProvider>,
  );
}

describe("GalleryManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(svc).forEach((fn) =>
      fn.mockResolvedValue({ success: true, data: listing }),
    );
  });

  const solo: GalleryTarget = { kind: "solo", listingId: "L1" };
  const org: GalleryTarget = { kind: "org", orgId: "O1" };

  it("renders a thumbnail per photo and marks the first as the cover", () => {
    renderGM(["a.jpg", "b.jpg"], solo);
    expect(screen.getByLabelText("Remove photo 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove photo 2")).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("excludes the cover (profile) image from the gallery it manages", async () => {
    // Backend prepends profile_image to photos; the gallery endpoints operate
    // on photos WITHOUT it, so the manager must exclude it.
    renderGM(["cover.jpg", "a.jpg", "b.jpg"], solo, "cover.jpg");

    // Only the two real gallery photos are shown; no "Cover" badge (a separate
    // cover exists), and no third tile for the profile image.
    expect(screen.getByLabelText("Remove photo 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove photo 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove photo 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Cover")).not.toBeInTheDocument();

    // Reorder sends gallery-only (no cover.jpg), matching the backend contract.
    fireEvent.click(screen.getByLabelText("Move photo 1 later"));
    await waitFor(() =>
      expect(svc.reorderSoloListingGalleryImages).toHaveBeenCalledWith("L1", [
        "b.jpg",
        "a.jpg",
      ]),
    );
  });

  it("removes a photo via the solo endpoint", async () => {
    renderGM(["a.jpg", "b.jpg"], solo);
    fireEvent.click(screen.getByLabelText("Remove photo 1"));
    await waitFor(() =>
      expect(svc.deleteSoloListingGalleryImage).toHaveBeenCalledWith("L1", "a.jpg"),
    );
  });

  it("reorders when moving a photo later", async () => {
    renderGM(["a.jpg", "b.jpg"], solo);
    fireEvent.click(screen.getByLabelText("Move photo 1 later"));
    await waitFor(() =>
      expect(svc.reorderSoloListingGalleryImages).toHaveBeenCalledWith("L1", [
        "b.jpg",
        "a.jpg",
      ]),
    );
  });

  it("uploads selected files via the solo endpoint", async () => {
    const { container } = renderGM([], solo);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "gym.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(svc.uploadSoloListingGalleryImages).toHaveBeenCalledWith("L1", [file]),
    );
  });

  it("uses the org endpoints for an org target", async () => {
    renderGM(["a.jpg"], org);
    fireEvent.click(screen.getByLabelText("Remove photo 1"));
    await waitFor(() =>
      expect(svc.deleteOrgListingGalleryImage).toHaveBeenCalledWith("O1", "a.jpg"),
    );
  });
});
