import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ListingLogoManager } from "@/components/provider/ListingLogoManager";
import { AmenitiesPicker, toggleAmenity } from "@/components/provider/AmenitiesPicker";

const svc = vi.hoisted(() => ({
  uploadOrgListingProfileImage: vi.fn(),
  deleteOrgListingProfileImage: vi.fn(),
}));
vi.mock("@/lib/api/marketplace", () => ({ marketplaceService: svc }));

function renderLogo(logoUrl?: string) {
  const qc = new QueryClient();
  const spy = vi.spyOn(qc, "invalidateQueries");
  render(
    <QueryClientProvider client={qc}>
      <ListingLogoManager orgId="O1" logoUrl={logoUrl} name="Imole Forge" />
    </QueryClientProvider>,
  );
  return spy;
}

describe("ListingLogoManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.uploadOrgListingProfileImage.mockResolvedValue({ success: true, data: {} });
    svc.deleteOrgListingProfileImage.mockResolvedValue({ success: true, data: {} });
  });

  it("uploads a logo to the org listing and refreshes it", async () => {
    const invalidate = renderLogo();
    expect(screen.getByRole("button", { name: "Upload logo" })).toBeInTheDocument();
    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Logo file"), { target: { files: [file] } });
    await waitFor(() => expect(svc.uploadOrgListingProfileImage).toHaveBeenCalledWith("O1", file));
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
  });

  it("refuses an SVG before sending it (the API takes JPG, PNG, WebP, GIF)", async () => {
    renderLogo();
    const file = new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" });
    fireEvent.change(screen.getByLabelText("Logo file"), { target: { files: [file] } });
    expect(await screen.findByText("Use a JPG, PNG, WebP or GIF image.")).toBeInTheDocument();
    expect(svc.uploadOrgListingProfileImage).not.toHaveBeenCalled();
  });

  it("shows the API's reason when the upload fails", async () => {
    svc.uploadOrgListingProfileImage.mockResolvedValue({ success: false, message: "Too many requests" });
    renderLogo();
    fireEvent.change(screen.getByLabelText("Logo file"), {
      target: { files: [new File(["x"], "l.png", { type: "image/png" })] },
    });
    expect(await screen.findByText("Too many requests")).toBeInTheDocument();
  });

  it("shows the current logo, and removes it after confirming", async () => {
    renderLogo("https://img/logo.png");
    expect(screen.getByAltText("Imole Forge logo")).toHaveAttribute("src", "https://img/logo.png");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Remove" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => expect(svc.deleteOrgListingProfileImage).toHaveBeenCalledWith("O1"));
  });
});

describe("AmenitiesPicker", () => {
  it("toggles amenities in catalogue order and keeps unknown values", () => {
    expect(toggleAmenity(["SHOWERS"], "WIFI")).toEqual(["WIFI", "SHOWERS"]);
    expect(toggleAmenity(["WIFI", "SHOWERS"], "WIFI")).toEqual(["SHOWERS"]);
    expect(toggleAmenity(["ROOFTOP"], "WIFI")).toEqual(["WIFI", "ROOFTOP"]);
    // Off then on again is no change.
    expect(toggleAmenity(toggleAmenity(["WIFI", "PARKING"], "WIFI"), "WIFI")).toEqual(["WIFI", "PARKING"]);
  });

  it("marks chosen amenities pressed and reports a toggle", () => {
    const onChange = vi.fn();
    render(<AmenitiesPicker values={["SAUNA"]} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Sauna" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "WiFi" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "WiFi" }));
    expect(onChange).toHaveBeenCalledWith(["WIFI", "SAUNA"]);
  });
});
