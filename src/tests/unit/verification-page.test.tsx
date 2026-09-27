import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerificationPage from "@/app/verification/page";

const router = { replace: vi.fn(), push: vi.fn() };
const refreshUser = vi.fn();
const verifyOtp = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("email=new%40example.com"),
}));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ refreshUser }) }));
vi.mock("@/hooks/useVerification", () => ({
  useVerification: () => ({ verifyOtp, resendOtp: vi.fn(), isVerifying: false, isResending: false }),
}));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));

// Verifying signs the new account in on the API, so the page must load
// that session into the app and route on it; pushing /login left the
// middleware to guess a dashboard from cookies that did not exist yet.
describe("verification page after a correct code", () => {
  beforeEach(() => {
    router.replace.mockReset();
    router.push.mockReset();
    refreshUser.mockReset();
    verifyOtp.mockReset().mockResolvedValue({ success: true });
  });
  afterEach(() => vi.useRealTimers());

  const submit = async () => {
    render(<VerificationPage />);
    await userEvent.type(screen.getByLabelText(/Verification code/i), "000000");
    await userEvent.click(screen.getByRole("button", { name: /Verify email/i }));
  };

  it("sends a brand-new account to onboarding", async () => {
    refreshUser.mockResolvedValue({ role: "USER", is_onboarding_complete: false });
    await submit();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/onboarding"));
    expect(verifyOtp).toHaveBeenCalledWith("new@example.com", "000000");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /Proceed to login/i })).toBeNull();
  });

  it("sends an already-onboarded account to its dashboard", async () => {
    refreshUser.mockResolvedValue({ role: "TRAINER", is_onboarding_complete: true });
    await submit();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard/trainer"));
  });

  it("falls back to the login page when the session cannot be loaded", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    refreshUser.mockResolvedValue(null);
    await submit();
    await waitFor(() => expect(screen.getByText(/Redirecting to login/)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Proceed to login/i })).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(router.push).toHaveBeenCalledWith("/login");
    expect(router.replace).not.toHaveBeenCalled();
  });
});
