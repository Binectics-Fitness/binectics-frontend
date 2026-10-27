import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseEmailParam } from "@/lib/login-email-param";

let query = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
const login = vi.fn();
const register = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, login, logout: vi.fn(), register, isLoading: false }),
}));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => null }));

import AuthPage from "@/app/login/page";

describe("parseEmailParam", () => {
  it("trims and accepts a normal address", () => {
    expect(parseEmailParam("  a@b.co ")).toBe("a@b.co");
  });
  it("rejects absent, malformed, markup and over-long values", () => {
    expect(parseEmailParam(null)).toBe("");
    expect(parseEmailParam("nope")).toBe("");
    expect(parseEmailParam("<img src=x onerror=1>@b.co")).toBe("");
    expect(parseEmailParam("a b@c.co")).toBe("");
    expect(parseEmailParam("a".repeat(300) + "@b.co")).toBe("");
  });
});

describe("login page ?email= prefill", () => {
  it("pre-fills the sign-in email without submitting", () => {
    query = "email=" + encodeURIComponent("ngozi+gym@example.com");
    render(<AuthPage />);
    expect(screen.getAllByDisplayValue("ngozi+gym@example.com").length).toBeGreaterThan(0);
    expect(login).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
  it("pre-fills the sign-up email with mode=signup, alongside role", () => {
    query = "mode=signup&role=gym&email=" + encodeURIComponent("new@example.com");
    render(<AuthPage />);
    expect(screen.getAllByDisplayValue("new@example.com").length).toBeGreaterThan(0);
    expect(register).not.toHaveBeenCalled();
  });
  it("ignores a malformed value", () => {
    query = "email=" + encodeURIComponent("<script>alert(1)</script>");
    render(<AuthPage />);
    expect(screen.queryByDisplayValue(/script/)).toBeNull();
  });
});
