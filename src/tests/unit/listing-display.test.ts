import { describe, it, expect } from "vitest";
import {
  addressLine,
  amenityLabel,
  galleryPhotos,
  listingDisplayName,
  listingHero,
  mapsUrl,
  providerSubtitle,
  providerTitle,
  publicLocations,
} from "@/lib/marketplace/listingDisplay";
import { cardAvatar, cardPhoto } from "@/components/marketplace/explore/ExploreCard";

// Ported rules from binectics-mobile src/utils/listingDisplay.ts (mobile #304).

describe("providerTitle: the business or the person, never the headline", () => {
  it("names a gym by its business, never its owner", () => {
    expect(
      providerTitle({ type: "gym_owner", organizationName: "Imole Forge Fitness", professionalName: "Folake Adewale", headline: "Strength, cardio and classes" }),
    ).toBe("Imole Forge Fitness");
    // No business name: the headline, not the owner.
    expect(providerTitle({ type: "gym_owner", professionalName: "Folake Adewale", headline: "Lekki gym" })).toBe("Lekki gym");
  });

  it("names a trainer or dietitian by their own name, before their workspace's", () => {
    expect(
      providerTitle({ type: "personal_trainer", organizationName: "Chinedu Eze Training", professionalName: "Chinedu Eze", headline: "Strength & conditioning coach · Surulere" }),
    ).toBe("Chinedu Eze");
    expect(providerTitle({ type: "dietitian", organizationName: "Nouriva", headline: "RD" })).toBe("Nouriva");
  });

  it("falls back to the headline, then Provider, ignoring blanks", () => {
    expect(providerTitle({ type: "dietitian", professionalName: "  ", headline: " Registered dietitian " })).toBe("Registered dietitian");
    expect(providerTitle({ type: "dietitian" })).toBe("Provider");
  });

  it("shows the headline under the title only when it differs", () => {
    expect(providerSubtitle("Chinedu Eze", "Strength & conditioning coach")).toBe("Strength & conditioning coach");
    expect(providerSubtitle("Lekki gym", "Lekki gym")).toBeUndefined();
    expect(providerSubtitle("Chinedu Eze", "  ")).toBeUndefined();
  });

  it("reads populated owners either way the API sends them", () => {
    expect(
      listingDisplayName({ account_type: "personal_trainer", headline: "Coach", organization_id: { name: "Eze Training" }, professional_id: { first_name: "Chinedu", last_name: "Eze" } }),
    ).toBe("Chinedu Eze");
    expect(
      listingDisplayName({ account_type: "gym_owner", headline: "Gym", organization: { name: "Imole Forge Fitness" }, professional: { first_name: "Folake", last_name: "Adewale" } }),
    ).toBe("Imole Forge Fitness");
  });
});

describe("the hero is a real photo, never the logo", () => {
  const logo = "https://cdn/logo.png";

  it("drops the profile image the API puts first, and blanks and repeats", () => {
    expect(galleryPhotos([logo, "a.jpg", "", "b.jpg", "a.jpg"], logo)).toEqual(["a.jpg", "b.jpg"]);
    expect(galleryPhotos(undefined, logo)).toEqual([]);
  });

  it("picks the first listing photo, else a facility photo, else nothing", () => {
    expect(listingHero({ photos: [logo, "a.jpg"], profile_image: logo })).toBe("a.jpg");
    expect(listingHero({ photos: [logo], profile_image: logo, facility_items: [{ image_url: logo }, { image_url: "rack.jpg" }] })).toBe("rack.jpg");
    expect(listingHero({ photos: [logo], profile_image: logo })).toBeUndefined();
  });

  it("gives an Explore card the same photo, with the logo as its avatar", () => {
    const l = { _id: "l", account_type: "gym_owner", headline: "", average_rating: 0, review_count: 0, photos: [logo, "a.jpg"], profile_image: logo };
    expect(cardPhoto(l)).toBe("a.jpg");
    expect(cardPhoto({ photos: undefined, profile_image: logo })).toBeUndefined();
    expect(cardAvatar(l)).toBe(logo);
  });
});

describe("amenities and addresses", () => {
  it("labels amenity codes, tidies unknown codes, keeps free text", () => {
    expect(amenityLabel("TOWEL_SERVICE")).toBe("Towel Service");
    expect(amenityLabel("ICE_BATH")).toBe("Ice bath");
    expect(amenityLabel("Olympic platforms")).toBe("Olympic platforms");
  });

  it("writes an address from the parts that exist, and a maps search for it", () => {
    const loc = { id: "1", name: "Yaba", street: "9 Fola Osibo Road", city: "Lagos", postal_code: "106104", country: "NG" };
    expect(addressLine(loc)).toBe("9 Fola Osibo Road, Lagos 106104");
    expect(addressLine({ city: "Lagos" })).toBe("Lagos");
    expect(mapsUrl(loc, "Imole Forge")).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Imole Forge, 9 Fola Osibo Road, Lagos, 106104, NG")}`,
    );
  });

  it("keeps named addresses, primary first; nothing from an older API", () => {
    expect(publicLocations(undefined)).toEqual([]);
    const out = publicLocations([
      { id: "a", name: "Ikeja", city: "Lagos", is_primary: false },
      { id: "b", name: "Lekki", street: "1 Admiralty Way", is_primary: true },
      { id: "c", name: "  " },
      null,
    ]);
    expect(out.map((l) => l.name)).toEqual(["Lekki", "Ikeja"]);
    expect(out[0]).toMatchObject({ street: "1 Admiralty Way", city: null, is_primary: true });
  });
});
