import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";

/**
 * Owner ruling, Oct 20 2026: a gym's staff with marketplace:manage_listing
 * manage the gym's listing. /dashboard/profile-edit must load and save the
 * GYM's listing for them (the org routes), never a solo listing of their own.
 */
let mockUser: Record<string, unknown> = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
let mockOrg: Record<string, unknown> | null = null;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isLoading: false, updateUser: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({ currentOrg: mockOrg, organizations: mockOrg ? [mockOrg] : [], isLoading: false });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/components/provider/GalleryManager", () => ({
  GalleryManager: ({ target }: { target: { kind: string; orgId?: string } }) => (
    <p>gallery {target.kind} {target.orgId ?? ""}</p>
  ),
}));
vi.mock("@/lib/queries/utility", () => ({ useCountries: () => ({ data: [] }) }));

const gymListing = {
  _id: "l-gym",
  headline: "Iron Temple Lekki",
  bio: "Strength gym",
  is_published: false,
  photos: [],
};
const soloListing = { ...gymListing, _id: "l-solo", headline: "Tobi's own coaching" };
const calls = { org: [] as [unknown, unknown][], solo: [] as unknown[] };
const mutation = () => ({ mutateAsync: vi.fn(), isPending: false });

vi.mock("@/lib/queries/marketplace", () => ({
  useOrgListing: (orgId: unknown, enabled: unknown) => {
    calls.org.push([orgId, enabled]);
    return { data: enabled ? gymListing : undefined, isLoading: false };
  },
  useMyListing: (enabled: unknown) => {
    calls.solo.push(enabled);
    return { data: enabled ? soloListing : undefined, isLoading: false };
  },
  useUpdateMyListing: () => mutation(),
  usePublishMyListing: () => mutation(),
  useCreateMyListing: () => mutation(),
  useUpdateOrgListing: () => mutation(),
  usePublishOrgListing: () => mutation(),
  useCreateOrgListing: () => mutation(),
}));

const staffOrg = (permissions: string[]) => ({
  _id: "gym",
  name: "Iron Temple",
  owner_id: "boss",
  account_type: "gym_owner",
  is_active: true,
  is_owner: false,
  my_role_code: "manager",
  my_permissions: permissions,
});

beforeEach(() => {
  calls.org.length = 0;
  calls.solo.length = 0;
  mockUser = { id: "u1", role: "USER", first_name: "Tobi", last_name: "B" };
});

describe("the listing editor for a gym's staff", () => {
  it("loads the gym's listing through the org routes for a role with manage_listing", () => {
    mockOrg = staffOrg(["marketplace:manage_listing"]);
    render(<ProviderListingProfile scope="gym" />);
    expect(calls.org.at(-1)).toEqual(["gym", true]);
    expect(calls.solo.at(-1)).toBe(false);
    expect(screen.getByDisplayValue("Iron Temple Lekki")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Tobi's own coaching")).toBeNull();
    expect(screen.getByText(/gallery org gym/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    // Review C-1: links only to pages the role opens. Plans needs
    // manage_listing; Locations needs view_members; Settings needs
    // manage_organization too.
    expect(screen.getByRole("link", { name: "Plans & pricing →" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Locations →" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Settings →" })).toBeNull();
  });

  it("asks for nothing, and offers no create, when the role lacks manage_listing", () => {
    mockOrg = staffOrg(["team:view_members"]);
    render(<ProviderListingProfile scope="gym" />);
    expect(calls.org.at(-1)).toEqual(["gym", false]);
    expect(calls.solo.at(-1)).toBe(false);
    expect(screen.queryByRole("button", { name: /Create/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
  });

  it("still opens a trainer's own solo listing in their own workspace", () => {
    mockUser = { id: "u1", role: "TRAINER", first_name: "Tobi", last_name: "B" };
    mockOrg = { ...staffOrg([]), account_type: "personal_trainer", owner_id: "u1", is_owner: true };
    render(<ProviderListingProfile />);
    expect(calls.solo.at(-1)).toBe(true);
    expect(screen.getByDisplayValue("Tobi's own coaching")).toBeInTheDocument();
  });

  it("a gym's staff trainer (consultant) keeps their own listing editor outside the gym's page", () => {
    // Review MF-1: /dashboard/trainer/profile and the dietitian profile render
    // the editor without scope="gym", while the current org is the gym.
    mockUser = { id: "u1", role: "TRAINER", first_name: "Tobi", last_name: "B" };
    mockOrg = {
      ...staffOrg(["progress:view", "marketplace:manage_listing"]),
      my_role_code: "consultant",
    };
    render(<ProviderListingProfile />);
    expect(calls.solo.at(-1)).toBe(true);
    expect(calls.org.at(-1)?.[1]).toBe(false);
    expect(screen.getByDisplayValue("Tobi's own coaching")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Iron Temple Lekki")).toBeNull();
  });

  it("the gym owner edits the gym's listing as before", () => {
    mockUser = { id: "boss", role: "GYM_OWNER", first_name: "Dapo", last_name: "A" };
    mockOrg = { ...staffOrg([]), is_owner: true };
    render(<ProviderListingProfile scope="gym" />);
    expect(calls.org.at(-1)).toEqual(["gym", true]);
    expect(screen.getByDisplayValue("Iron Temple Lekki")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings →" })).toBeInTheDocument();
  });
});
