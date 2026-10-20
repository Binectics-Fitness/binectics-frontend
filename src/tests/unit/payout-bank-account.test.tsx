import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { AddBankAccountModal } from "@/components/ds/modals/AddBankAccountModal";
import GymPayoutsPage from "@/app/dashboard/gym-owner/payouts/page";
import type { PayoutAccountStatus, ResolvedPayoutAccount } from "@/lib/api/payoutAccount";

/**
 * Owner ruling, Oct 20 2026: "Add bank account" saved nothing. It now
 * checks the account with Paystack (resolve) before Save is offered, saves
 * without ever sending a name, and the page shows only the masked number.
 */
const svc = {
  getStatus: vi.fn(),
  listBanks: vi.fn(),
  resolve: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
};
vi.mock("@/lib/api/payoutAccount", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/payoutAccount")>()),
  payoutAccountService: new Proxy({}, { get: (_t, k: string) => (svc as Record<string, unknown>)[k] }),
}));
vi.mock("@/components/Toast", () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast };
});
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({ currentOrg: { _id: "gym1", name: "Iron Temple", owner_id: "u1", is_owner: true }, isLoading: false });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/hooks/useGymViewer", () => ({
  useGymViewer: () => ({ isOwner: true, staff: false, permissions: new Set(), orgId: "gym1", orgName: "Iron Temple", roleCode: null }),
}));
vi.mock("@/lib/queries/teams", () => ({ useOrganizationDetails: () => ({ data: undefined }) }));
vi.mock("@/lib/format/useOrgFormat", () => ({ useOrgFormat: () => ({ fmtMoney: (n: number) => String(n) }) }));

const FULL_NUMBER = "0123456789";
const resolved: ResolvedPayoutAccount = {
  bank_code: "044",
  bank_name: "Access Bank",
  account_name: "IRON TEMPLE LTD",
  account_last4: "6789",
  account_number_masked: "******6789",
  currency: "NGN",
};
const savedStatus: PayoutAccountStatus = {
  account: { ...resolved, verified: true, verified_at: "2026-10-20T08:00:00Z", updated_at: null },
  payouts_enabled: false,
  payouts_blocked_reason: "kyc_required",
};

beforeEach(() => {
  Object.values(svc).forEach((f) => f.mockReset());
  svc.listBanks.mockResolvedValue({
    success: true,
    data: { currency: "NGN", banks: [{ code: "044", name: "Access Bank" }, { code: "058", name: "GTBank" }] },
  });
});

async function chooseBank(name: string) {
  await userEvent.click(await screen.findByRole("button", { name: "Choose your bank" }));
  fireEvent.mouseDown(screen.getByText(name));
}

function renderModal(props: Partial<React.ComponentProps<typeof AddBankAccountModal>> = {}) {
  const onClose = vi.fn();
  renderWithProviders(<AddBankAccountModal open onClose={onClose} organizationId="gym1" {...props} />);
  return { onClose };
}

const saveButton = () => screen.getByRole("button", { name: "Save account" });

describe("AddBankAccountModal", () => {
  it("loads banks from the API, and shows Paystack's account name before Save is enabled", async () => {
    let finish: (v: unknown) => void = () => {};
    svc.resolve.mockReturnValue(new Promise((r) => (finish = r)));
    renderModal();
    await chooseBank("Access Bank");
    expect(svc.listBanks).toHaveBeenCalledWith("gym1");
    expect(saveButton()).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Account number"), FULL_NUMBER);
    await waitFor(() => expect(svc.resolve).toHaveBeenCalledTimes(1));
    expect(svc.resolve).toHaveBeenCalledWith("gym1", { bank_code: "044", account_number: FULL_NUMBER, currency: "NGN" });
    // Still checking: nothing to save yet.
    expect(saveButton()).toBeDisabled();

    finish({ success: true, data: resolved });
    const found = await screen.findByRole("status", { name: "Account found" });
    expect(within(found).getByText("IRON TEMPLE LTD")).toBeInTheDocument();
    expect(within(found).getByText("******6789")).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  it("disables Save again when the number changes after a resolve, and never asks twice about one pair", async () => {
    svc.resolve.mockResolvedValue({ success: true, data: resolved });
    renderModal();
    await chooseBank("Access Bank");
    const input = screen.getByLabelText("Account number");
    await userEvent.type(input, FULL_NUMBER);
    await screen.findByRole("status", { name: "Account found" });
    expect(saveButton()).toBeEnabled();

    await userEvent.type(input, "{backspace}");
    expect(saveButton()).toBeDisabled();
    expect(screen.queryByText("IRON TEMPLE LTD")).toBeNull();

    // Back to the same pair: the earlier answer is reused, not asked again.
    await userEvent.type(input, "9");
    await screen.findByRole("status", { name: "Account found" });
    fireEvent.blur(input);
    expect(svc.resolve).toHaveBeenCalledTimes(1);
  });

  it("shows Paystack's message when there is no such account, and keeps Save off", async () => {
    svc.resolve.mockResolvedValue({
      success: false,
      status: 422,
      code: "PAYOUT_ACCOUNT_NOT_RESOLVED",
      message: "Could not resolve account name. Check parameters or try again.",
    });
    renderModal();
    await chooseBank("GTBank");
    await userEvent.type(screen.getByLabelText("Account number"), FULL_NUMBER);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Could not resolve account name/);
    expect(saveButton()).toBeDisabled();
  });

  it("offers a retry when Paystack can't be reached", async () => {
    svc.resolve
      .mockResolvedValueOnce({ success: false, status: 502, code: "PAYOUT_BANK_LOOKUP_UNAVAILABLE", message: "x" })
      .mockResolvedValueOnce({ success: true, data: resolved });
    renderModal();
    await chooseBank("Access Bank");
    await userEvent.type(screen.getByLabelText("Account number"), FULL_NUMBER);
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't reach Paystack/);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("status", { name: "Account found" });
    expect(svc.resolve).toHaveBeenCalledTimes(2);
  });

  it("explains a workspace with no currency, from the API's message", async () => {
    svc.listBanks.mockResolvedValue({ success: false, status: 400, message: "Set your workspace currency in Settings first." });
    renderModal();
    expect((await screen.findByRole("alert")).textContent).toMatch(/Set your workspace currency in Settings/);
  });

  it("saves with the bank code and number only, never an account name, then forgets the number", async () => {
    svc.resolve.mockResolvedValue({ success: true, data: resolved });
    svc.save.mockResolvedValue({ success: true, data: savedStatus });
    const { onClose } = renderModal();
    await chooseBank("Access Bank");
    const input = screen.getByLabelText("Account number");
    await userEvent.type(input, FULL_NUMBER);
    await screen.findByRole("status", { name: "Account found" });
    await userEvent.click(saveButton());

    await waitFor(() => expect(svc.save).toHaveBeenCalledTimes(1));
    const [orgId, body] = svc.save.mock.calls[0];
    expect(orgId).toBe("gym1");
    expect(body).toEqual({ bank_code: "044", account_number: FULL_NUMBER, currency: "NGN" });
    expect(body).not.toHaveProperty("account_name");
    expect(onClose).toHaveBeenCalled();
    // The form is reset: the full number is no longer held anywhere on screen.
    await waitFor(() => expect(input).toHaveValue(""));
  });
});

describe("AddBankAccountModal: the number never outlives the form (review SF-1, C-1, C-2)", () => {
  it("drops a resolve answer that arrives after the form was closed", async () => {
    let finish: (v: unknown) => void = () => {};
    svc.resolve.mockReturnValueOnce(new Promise((r) => (finish = r)));
    const { onClose } = renderModal();
    await chooseBank("Access Bank");
    const input = screen.getByLabelText("Account number");
    await userEvent.type(input, FULL_NUMBER);
    await waitFor(() => expect(svc.resolve).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(input).toHaveValue("");

    // The late answer is ignored: nothing shown, nothing remembered.
    finish({ success: true, data: resolved });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("status", { name: "Account found" })).toBeNull();
    expect(screen.queryByText(/Checking with your bank/)).toBeNull();

    // Had it been remembered, the same pair would not be asked again.
    svc.resolve.mockResolvedValueOnce({ success: true, data: resolved });
    await chooseBank("Access Bank");
    await userEvent.type(input, FULL_NUMBER);
    await screen.findByRole("status", { name: "Account found" });
    expect(svc.resolve).toHaveBeenCalledTimes(2);
  });

  it("keeps password managers and autofill away from the number", async () => {
    renderModal();
    const input = await screen.findByLabelText("Account number");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("data-1p-ignore");
    expect(input).toHaveAttribute("data-lpignore", "true");
    expect(input).toHaveAttribute("data-form-type", "other");
    expect(input.getAttribute("name")).not.toMatch(/account|bank|card/i);
  });

  it("stays 'checking' until every overlapping lookup has answered", async () => {
    const finishers: ((v: unknown) => void)[] = [];
    svc.resolve.mockImplementation(() => new Promise((r) => finishers.push(r)));
    renderModal();
    await chooseBank("Access Bank");
    const input = screen.getByLabelText("Account number");
    await userEvent.type(input, FULL_NUMBER);
    await waitFor(() => expect(svc.resolve).toHaveBeenCalledTimes(1));
    // A second pair while the first is still out.
    await userEvent.clear(input);
    await userEvent.type(input, "1111111111");
    await waitFor(() => expect(svc.resolve).toHaveBeenCalledTimes(2));
    finishers[0]({ success: true, data: resolved });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText(/Checking with your bank/)).toBeInTheDocument();
    finishers[1]({ success: true, data: { ...resolved, bank_code: "058", bank_name: "GTBank" } });
    await screen.findByRole("status", { name: "Account found" });
    expect(screen.queryByText(/Checking with your bank/)).toBeNull();
  });
});

describe("the payouts page's bank account", () => {
  it("shows the saved account with only its masked number, the verified mark, and the KYC line", async () => {
    svc.getStatus.mockResolvedValue({ success: true, data: savedStatus });
    renderWithProviders(<GymPayoutsPage />);
    const card = await screen.findByTestId("payout-account");
    expect(within(card).getByText("IRON TEMPLE LTD")).toBeInTheDocument();
    expect(within(card).getByText("******6789")).toBeInTheDocument();
    expect(within(card).getByText("Verified with your bank")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(FULL_NUMBER);
    expect(screen.getByText(/Nothing is paid out to this account before then/)).toBeInTheDocument();
    expect(svc.getStatus).toHaveBeenCalledWith("gym1");
  });

  it("removes the account with DELETE, only after confirming", async () => {
    svc.getStatus.mockResolvedValue({ success: true, data: savedStatus });
    svc.remove.mockResolvedValue({ success: true, data: { removed: true } });
    renderWithProviders(<GymPayoutsPage />);
    await screen.findByTestId("payout-account");
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("Remove this bank account?")).toBeInTheDocument();
    expect(svc.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Remove account" }));
    await waitFor(() => expect(svc.remove).toHaveBeenCalledWith("gym1"));
  });

  it("offers to add one when there is none", async () => {
    svc.getStatus.mockResolvedValue({
      success: true,
      data: { account: null, payouts_enabled: false, payouts_blocked_reason: "kyc_required" },
    });
    renderWithProviders(<GymPayoutsPage />);
    expect(await screen.findByText(/No bank account yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add bank account" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });
});
