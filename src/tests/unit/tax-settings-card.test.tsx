import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaxSettingsCard, parseTaxRate } from "@/components/provider/TaxSettingsCard";

const mutateAsync = vi.fn();
let mockOrgDetails: Record<string, unknown> | null = { tax_rate: undefined, tax_inclusive: undefined, tax_label: undefined };

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "o1" }, refreshOrganizations: vi.fn() }),
}));
vi.mock("@/lib/queries/teams", () => ({
  useOrganizationDetails: () => ({ data: mockOrgDetails }),
  useUpdateOrganization: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue({ success: true });
  mockOrgDetails = { tax_rate: undefined, tax_inclusive: undefined, tax_label: undefined };
});

describe("parseTaxRate", () => {
  it("treats empty as unset, 0 as a real rate, and rejects out-of-range or non-numbers", () => {
    expect(parseTaxRate("")).toBeNull();
    expect(parseTaxRate("0")).toBe(0);
    expect(parseTaxRate("7.5")).toBe(7.5);
    expect(parseTaxRate("100")).toBe(100);
    expect(parseTaxRate("-1")).toBeNaN();
    expect(parseTaxRate("101")).toBeNaN();
    expect(parseTaxRate("abc")).toBeNaN();
  });
});

describe("TaxSettingsCard", () => {
  it("cannot save while no rate is entered, so no default rate is ever assumed", () => {
    render(<TaxSettingsCard />);
    expect(screen.getByRole("button", { name: "Save tax settings" })).toBeDisabled();
  });

  it("saves the same three fields the gym Settings page does, as a percent", async () => {
    render(<TaxSettingsCard />);
    await userEvent.type(screen.getByLabelText("Tax name"), "VAT");
    await userEvent.type(screen.getByLabelText("Tax rate %"), "7.5");
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: "Save tax settings" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: 7.5, tax_inclusive: false, tax_label: "VAT" } }),
    );
  });

  it("accepts a rate of 0", async () => {
    render(<TaxSettingsCard />);
    await userEvent.type(screen.getByLabelText("Tax rate %"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Save tax settings" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: 0, tax_inclusive: true, tax_label: undefined } }));
  });

  it("refuses a rate over 100 with a message and does not call the API", async () => {
    render(<TaxSettingsCard />);
    await userEvent.type(screen.getByLabelText("Tax rate %"), "150");
    expect(screen.getByText("Enter a rate from 0 to 100.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save tax settings" })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("starts from the saved values", () => {
    mockOrgDetails = { tax_rate: 15, tax_inclusive: false, tax_label: "GST" };
    render(<TaxSettingsCard />);
    expect(screen.getByLabelText("Tax name")).toHaveValue("GST");
    expect(screen.getByLabelText("Tax rate %")).toHaveValue(15);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: "Save tax settings" })).toBeDisabled();
  });
});
