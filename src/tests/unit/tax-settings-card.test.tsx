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

  it("asks whether prices include tax with nothing pre-selected, and will not save a rate until one is chosen", async () => {
    render(<TaxSettingsCard />);
    expect(screen.getByText("Do your prices already include tax?")).toBeInTheDocument();
    expect(screen.getByLabelText("Yes, prices include tax")).not.toBeChecked();
    expect(screen.getByLabelText("No, tax is added on top")).not.toBeChecked();
    await userEvent.type(screen.getByLabelText("Tax rate %"), "7.5");
    expect(screen.getByText("Choose one to save your tax settings.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save tax settings" })).toBeDisabled();
    await userEvent.click(screen.getByLabelText("Yes, prices include tax"));
    expect(screen.getByRole("button", { name: "Save tax settings" })).toBeEnabled();
  });

  it("saves the same three fields the gym Settings page does, as a percent", async () => {
    render(<TaxSettingsCard />);
    await userEvent.type(screen.getByLabelText("Tax name"), "VAT");
    await userEvent.type(screen.getByLabelText("Tax rate %"), "7.5");
    await userEvent.click(screen.getByLabelText("No, tax is added on top"));
    await userEvent.click(screen.getByRole("button", { name: "Save tax settings" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: 7.5, tax_inclusive: false, tax_label: "VAT" } }),
    );
  });

  it("accepts a rate of 0", async () => {
    render(<TaxSettingsCard />);
    await userEvent.type(screen.getByLabelText("Tax rate %"), "0");
    await userEvent.click(screen.getByLabelText("Yes, prices include tax"));
    await userEvent.click(screen.getByRole("button", { name: "Save tax settings" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: 0, tax_inclusive: true, tax_label: "" } }));
  });

  it("clears a saved name by sending an empty one", async () => {
    mockOrgDetails = { tax_rate: 7.5, tax_inclusive: true, tax_label: "GST" };
    render(<TaxSettingsCard />);
    await userEvent.clear(screen.getByLabelText("Tax name"));
    await userEvent.click(screen.getByRole("button", { name: "Save tax settings" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: 7.5, tax_inclusive: true, tax_label: "" } }));
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
    expect(screen.getByLabelText("No, tax is added on top")).toBeChecked();
    expect(screen.getByLabelText("Yes, prices include tax")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Save tax settings" })).toBeDisabled();
  });

  it("offers No tax rate only when a rate is saved", async () => {
    render(<TaxSettingsCard />);
    expect(screen.queryByRole("button", { name: "No tax rate" })).not.toBeInTheDocument();
  });

  it("clears a saved rate by sending null and nothing else", async () => {
    mockOrgDetails = { tax_rate: 7.5, tax_inclusive: true, tax_label: "VAT" };
    render(<TaxSettingsCard />);
    await userEvent.click(screen.getByRole("button", { name: "No tax rate" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: null } }));
  });

  it("shows a saved rate of 0 as 0 and lets it be cleared", () => {
    mockOrgDetails = { tax_rate: 0, tax_inclusive: true, tax_label: "VAT" };
    render(<TaxSettingsCard />);
    expect(screen.getByLabelText("Tax rate %")).toHaveValue(0);
    expect(screen.getByRole("button", { name: "No tax rate" })).toBeInTheDocument();
  });

  it("changes a saved rate", async () => {
    mockOrgDetails = { tax_rate: 7.5, tax_inclusive: true, tax_label: "VAT" };
    render(<TaxSettingsCard />);
    const rate = screen.getByLabelText("Tax rate %");
    await userEvent.clear(rate);
    await userEvent.type(rate, "10");
    await userEvent.click(screen.getByRole("button", { name: "Save tax settings" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: { tax_rate: 10, tax_inclusive: true, tax_label: "VAT" } }));
  });
});
