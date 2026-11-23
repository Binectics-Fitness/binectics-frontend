import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CredentialsTab } from "@/app/dashboard/dietitian/profile/CredentialsTab";

/**
 * The licence country on the dietitian Credentials tab lists every country
 * the API knows (GET /utility/countries), not a fixed six-country list.
 */

const h = vi.hoisted(() => ({
  countries: [
    { name: "France", code: "FR", dialCode: "+33", cities: [] },
    { name: "Nigeria", code: "NG", dialCode: "+234", cities: [] },
    { name: "Rwanda", code: "RW", dialCode: "+250", cities: [] },
  ],
}));

vi.mock("@/lib/queries/utility", () => ({
  useCountries: () => ({ data: h.countries, isLoading: false }),
}));
vi.mock("@/lib/api/credentials", () => ({
  credentialsService: {
    getMine: vi.fn().mockResolvedValue({
      success: true,
      data: {
        user_id: "u1",
        pronouns: null,
        specializations: [],
        populations: [],
        licenses: [
          {
            _id: "l1",
            name: "Registered Dietitian",
            issuing_body: "Ordre",
            number: null,
            country_code: "RW",
            expires_at: "2030-01-01",
            is_current: true,
            has_document: false,
            document_url: null,
          },
        ],
        document_url_expires_in_seconds: 900,
        updated_at: null,
      },
    }),
    updateMine: vi.fn(),
  },
}));
vi.mock("@/app/onboarding/_components", () => ({ UploadZone: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("CredentialsTab licence country", () => {
  it("offers the API's countries and keeps a saved one outside the old list", async () => {
    render(<CredentialsTab />);
    const select = (await screen.findByLabelText("Country")) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.textContent);
    expect(options).toEqual(["Choose…", "France", "Nigeria", "Rwanda"]);
    expect(select.value).toBe("RW");
    expect(options).not.toContain("South Africa");
  });
});
