import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SlugEditor from "@/components/marketplace/SlugEditor";

// Simple stub for the API call used by Save — we only test the UI here.
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    updateMyListingSlug: vi.fn(async () => ({ success: true, data: {} })),
  },
}));

describe("<SlugEditor />", () => {
  it("renders the saved slug and live preview link when one is set", () => {
    render(
      <SlugEditor
        listingId="abc"
        accountType="personal_trainer"
        currentSlug="jane-doe-fit"
      />,
    );
    expect(
      screen.getByDisplayValue("jane-doe-fit"),
    ).toBeInTheDocument();
    // Live URL pill renders only when a slug is already saved
    expect(screen.getByText(/Live:/i)).toBeInTheDocument();
  });

  it("seeds an empty slug from the fallback base", () => {
    render(
      <SlugEditor
        listingId="abc"
        accountType="dietitian"
        fallbackBase="Dr. Sam's Nutrition Clinic!"
      />,
    );
    expect(
      screen.getByDisplayValue("dr-sams-nutrition-clinic"),
    ).toBeInTheDocument();
  });

  it("normalises typed input to slug-safe characters and preserves intermediate hyphens", async () => {
    const user = userEvent.setup();
    render(
      <SlugEditor
        listingId="abc"
        accountType="gym_owner"
        currentSlug="old-slug"
      />,
    );
    const input = screen.getByDisplayValue("old-slug") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "My Cool Gym");
    // spaces become hyphens, illegal chars stripped, all lowercase
    expect(input.value).toBe("my-cool-gym");
    // The preview should show the trimmed value
    expect(screen.getByText(/my-cool-gym$/)).toBeInTheDocument();
  });

  it("disables Save until something has changed", () => {
    render(
      <SlugEditor
        listingId="abc"
        accountType="personal_trainer"
        currentSlug="jane-fit"
      />,
    );
    expect(screen.getByRole("button", { name: /save url/i })).toBeDisabled();
  });

  it("shows a validation error for too-short input", async () => {
    const user = userEvent.setup();
    render(
      <SlugEditor
        listingId="abc"
        accountType="personal_trainer"
        currentSlug="jane-fit"
      />,
    );
    const input = screen.getByDisplayValue("jane-fit") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "ab");
    expect(
      screen.getByText(/at least 3 characters/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save url/i })).toBeDisabled();
  });
});
