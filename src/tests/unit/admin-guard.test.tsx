import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import AdminClientShell from "@/components/AdminClientShell";
import { middleware } from "@/middleware";
import { REMOVED_PAGE_REDIRECTS } from "@/lib/routing/removedPages";

const nav = vi.hoisted(() => ({
  pathname: "/admin/users",
  push: vi.fn(),
  replace: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  user: null as null | Record<string, unknown>,
  isLoading: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user, isLoading: auth.isLoading, logout: vi.fn() }),
}));

const assign = vi.fn();

beforeEach(() => {
  nav.push.mockReset();
  nav.replace.mockReset();
  assign.mockReset();
  vi.stubGlobal("location", { ...window.location, assign });
  auth.user = null;
  auth.isLoading = false;
});
afterEach(() => vi.unstubAllGlobals());

function renderAt(pathname: string) {
  nav.pathname = pathname;
  return render(
    <AdminClientShell>
      <p>admin content</p>
    </AdminClientShell>,
  );
}

describe("AdminClientShell", () => {
  it("opens the admin sign-in page while signed out", () => {
    renderAt("/admin");
    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it("sends a signed-out visitor of any other admin page to sign in", () => {
    renderAt("/admin/users");
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("keeps a signed-in member out and sends them to their dashboard", () => {
    auth.user = { id: "u-1", role: "USER", is_admin: false };
    renderAt("/admin/users");
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(nav.replace).toHaveBeenCalledWith("/dashboard/member");
  });

  it("lets a flagged admin in whatever their role", () => {
    auth.user = { id: "u-2", role: "GYM_OWNER", is_admin: true };
    renderAt("/admin/users");
    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("sends an admin with a temporary password to change it first", () => {
    auth.user = { id: "u-3", role: "ADMIN", is_admin: true, must_change_password: true };
    renderAt("/admin/users");
    expect(nav.push).toHaveBeenCalledWith("/admin/change-password");
  });
});

describe("middleware on /admin", () => {
  const run = (path: string, cookie?: string) =>
    middleware(
      new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie } } : undefined),
    );

  it("serves the admin sign-in page while signed out", async () => {
    const res = await run("/admin");
    expect(res.headers.get("location")).toBeNull();
  });

  it("sends a signed-out visitor of an admin page to sign in", async () => {
    const res = await run("/admin/users");
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/login");
  });
});

describe("removed pages", () => {
  it("sends the old gym-owner marketing page to the overview", () => {
    expect(REMOVED_PAGE_REDIRECTS).toContainEqual({
      source: "/dashboard/gym-owner/marketing",
      destination: "/dashboard/gym-owner",
      permanent: false,
    });
  });
});
