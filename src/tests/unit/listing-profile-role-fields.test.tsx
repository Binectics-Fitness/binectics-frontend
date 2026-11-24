import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import { listingFieldsFor } from "@/lib/marketplace/listingFields";

/**
 * Demo finding 11 (Nov 2026): the gym listing editor showed trainer-only
 * fields, "Accepting clients · Shown as available", Certifications and the
 * "e.g. CSCS" placeholder. Each kind sees only the fields that mean
 * something for it.
 */
let mockUser: Record<string, unknown> = { id: "u1", role: "TRAINER", first_name: "Tobi", last_name: "B" };
let mockOrg: Record<string, unknown> | null = null;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isLoading: false, updateUser: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({ currentOrg: mockOrg, organizations: mockOrg ? [mockOrg] : [], isLoading: false });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/components/provider/GalleryManager", () => ({ GalleryManager: () => <p>gallery</p> }));
// The logo manager (#362) reads a query client; it is not what this test is about.
vi.mock("@/components/provider/ListingLogoManager", () => ({ ListingLogoManager: () => null }));
vi.mock("@/lib/queries/utility", () => ({ useCountries: () => ({ data: [] }) }));

const listing = {
  _id: "l1",
  headline: "Headline",
  bio: "Bio",
  is_published: true,
  photos: [],
  accepting_clients: true,
  certifications: [],
};
const mutation = () => ({ mutateAsync: vi.fn(), isPending: false });

vi.mock("@/lib/queries/marketplace", () => ({
  useOrgListing: (_orgId: unknown, enabled: unknown) => ({ data: enabled ? listing : undefined, isLoading: false }),
  useMyListing: (enabled: unknown) => ({ data: enabled ? listing : undefined, isLoading: false }),
  useUpdateMyListing: () => mutation(),
  usePublishMyListing: () => mutation(),
  useCreateMyListing: () => mutation(),
  useUpdateOrgListing: () => mutation(),
  usePublishOrgListing: () => mutation(),
  useCreateOrgListing: () => mutation(),
  useMySessionPrice: () => ({ data: null }),
}));

const org = (account_type: string, owner_id: string) => ({
  _id: "org1",
  name: "Org",
  owner_id,
  account_type,
  is_active: true,
  is_owner: true,
  my_permissions: [],
});

beforeEach(() => {
  mockOrg = null;
});

describe("listingFieldsFor", () => {
  it("gives a gym no certifications and member wording", () => {
    const gym = listingFieldsFor("gym");
    expect(gym.certifications).toBe(false);
    expect(gym.availabilityLabel).toBe("Taking new members");
    expect(gym.specialtiesCardTitle).not.toMatch(/credential/i);
  });

  it("keeps certifications for trainers and dietitians, each with their own example", () => {
    expect(listingFieldsFor("trainer").certifications).toBe(true);
    expect(listingFieldsFor("trainer").certificationsPlaceholder).toBe("e.g. CSCS");
    expect(listingFieldsFor("dietitian").certifications).toBe(true);
    expect(listingFieldsFor("dietitian").certificationsPlaceholder).toBe("e.g. Registered Dietitian");
  });
});

describe("the listing editor per role", () => {
  it("a gym owner sees no certifications and 'Taking new members'", () => {
    mockUser = { id: "boss", role: "GYM_OWNER", first_name: "Dapo", last_name: "A" };
    mockOrg = org("gym_owner", "boss");
    render(<ProviderListingProfile scope="gym" />);
    expect(screen.queryByText("Certifications")).toBeNull();
    expect(screen.queryByPlaceholderText("e.g. CSCS")).toBeNull();
    expect(screen.queryByText("Accepting clients")).toBeNull();
    expect(screen.queryByText("Specializations & credentials")).toBeNull();
    expect(screen.getByRole("switch", { name: "Taking new members" })).toBeInTheDocument();
    expect(screen.getByText("Open to new members")).toBeInTheDocument();
  });

  it("a trainer sees certifications and 'Accepting clients'", () => {
    mockUser = { id: "u1", role: "TRAINER", first_name: "Tobi", last_name: "B" };
    render(<ProviderListingProfile />);
    expect(screen.getByText("Certifications")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. CSCS")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Accepting clients" })).toBeInTheDocument();
  });

  it("a dietitian sees certifications with a dietitian's example", () => {
    mockUser = { id: "u2", role: "DIETITIAN", first_name: "Ada", last_name: "O" };
    render(<ProviderListingProfile />);
    expect(screen.getByText("Certifications")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Registered Dietitian")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. CSCS")).toBeNull();
  });
});
