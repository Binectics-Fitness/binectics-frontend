import { describe, expect, it } from "vitest";
import { listingHref } from "@/lib/utils/listingHref";

const base = {
  _id: "507f1f77bcf86cd799439011",
} as const;

describe("listingHref", () => {
  it("returns per-type slug URL for gym listings", () => {
    expect(
      listingHref({ ...base, account_type: "gym_owner", slug: "fit-zone-gym" }),
    ).toBe("/gyms/fit-zone-gym");
  });

  it("returns per-type slug URL for trainer listings", () => {
    expect(
      listingHref({
        ...base,
        account_type: "personal_trainer",
        slug: "jake-martinez",
      }),
    ).toBe("/trainers/jake-martinez");
  });

  it("returns per-type slug URL for dietitian listings", () => {
    expect(
      listingHref({
        ...base,
        account_type: "dietitian",
        slug: "priya-patel",
      }),
    ).toBe("/dietitians/priya-patel");
  });

  it("falls back to id-based marketplace URL when slug is missing", () => {
    expect(listingHref({ ...base, account_type: "gym_owner" })).toBe(
      `/marketplace/${base._id}`,
    );
  });
});
