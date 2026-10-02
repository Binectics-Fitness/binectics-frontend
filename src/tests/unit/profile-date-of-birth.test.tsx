import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileSettingsPage from "@/app/dashboard/settings/profile/page";
import { UserRole, type User } from "@/lib/types";

/**
 * Settings > Profile edits date_of_birth as a plain 'YYYY-MM-DD' day:
 * prefilled from the saved value, sent only when it changed, null when a
 * saved value is emptied, and the API's 400 message shown on the field.
 */

const h = vi.hoisted(() => ({
  user: null as User | null,
  updateUser: vi.fn(),
  updateProfile: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: h.user, updateUser: h.updateUser }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: null, refreshOrganizations: vi.fn() }),
}));
vi.mock("@/lib/api/auth", () => ({
  authService: { updateProfile: h.updateProfile },
}));
vi.mock("@/lib/api/teams", () => ({ teamsService: {} }));
vi.mock("@/lib/queries/utility", () => ({
  useCountries: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({ data: [], providerHint: "" }),
}));
vi.mock("@/components/SearchableSelect", () => ({ default: () => null }));
vi.mock("@/components/TagInput", () => ({ default: () => null }));
vi.mock("@/components/ConfirmationModal", () => ({ default: () => null }));
vi.mock("@/components/Toast", () => ({
  toast: { error: h.toastError, success: h.toastSuccess },
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    email: "ada@example.com",
    first_name: "Ada",
    last_name: "Obi",
    role: UserRole.USER,
    is_email_verified: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    fitness_goals: [],
    preferred_activities: [],
    ...overrides,
  } as User;
}

const dobInput = () => screen.getByLabelText("Date of birth") as HTMLInputElement;
const save = () => userEvent.click(screen.getByRole("button", { name: "Save Profile" }));
const sentPayload = () => h.updateProfile.mock.calls[0][0] as Record<string, unknown>;

describe("Profile settings: date of birth", () => {
  beforeEach(() => {
    h.updateUser.mockReset();
    h.updateProfile.mockReset();
    h.toastError.mockReset();
    h.toastSuccess.mockReset();
    h.updateProfile.mockImplementation(async (payload: Record<string, unknown>) => ({
      success: true,
      data: { ...h.user, ...payload },
    }));
  });

  it("prefills the saved day as-is, with today as the max", () => {
    h.user = makeUser({ date_of_birth: "1990-01-01" });
    render(<ProfileSettingsPage />);
    expect(dobInput()).toHaveValue("1990-01-01");
    expect(dobInput()).toHaveAttribute("type", "date");
    expect(dobInput()).toHaveAttribute("min", "1900-01-01");
    expect(dobInput().getAttribute("max")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("does not send date_of_birth when it was left untouched", async () => {
    h.user = makeUser({ date_of_birth: "1990-05-15" });
    render(<ProfileSettingsPage />);
    await save();
    await waitFor(() => expect(h.updateProfile).toHaveBeenCalledTimes(1));
    expect(sentPayload()).not.toHaveProperty("date_of_birth");
  });

  it("sends a new day as YYYY-MM-DD and stores the returned user", async () => {
    h.user = makeUser({ date_of_birth: null });
    render(<ProfileSettingsPage />);
    expect(dobInput()).toHaveValue("");
    await userEvent.type(dobInput(), "1988-12-31");
    await save();
    await waitFor(() => expect(h.updateProfile).toHaveBeenCalledTimes(1));
    expect(sentPayload().date_of_birth).toBe("1988-12-31");
    expect(h.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ date_of_birth: "1988-12-31" }),
    );
  });

  it("sends null when a saved value is cleared", async () => {
    h.user = makeUser({ date_of_birth: "1990-05-15" });
    render(<ProfileSettingsPage />);
    await userEvent.clear(dobInput());
    await save();
    await waitFor(() => expect(h.updateProfile).toHaveBeenCalledTimes(1));
    expect(sentPayload()).toHaveProperty("date_of_birth", null);
  });

  it("shows the API's validation message on a 400", async () => {
    const message = "date_of_birth must be a date like 1990-05-15";
    h.user = makeUser({ date_of_birth: null });
    h.updateProfile.mockResolvedValue({ success: false, message });
    render(<ProfileSettingsPage />);
    await userEvent.type(dobInput(), "1990-05-15");
    await save();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(dobInput()).toHaveAttribute("aria-invalid", "true");
    expect(h.toastError).toHaveBeenCalledWith(message);
    expect(h.updateUser).not.toHaveBeenCalled();
  });
});
