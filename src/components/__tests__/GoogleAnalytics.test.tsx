import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, act } from "@testing-library/react";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/script", () => ({
  default: ({ id, src }: { id?: string; src?: string }) => <script data-testid="ga-script" data-id={id} data-src={src} />,
}));

import { GoogleAnalytics, isMeasuredPath } from "@/components/GoogleAnalytics";

function giveConsent(analytics: boolean) {
  localStorage.setItem("binectics-cookies", JSON.stringify({ required: true, analytics, version: "3.0", ts: Date.now() }));
  document.dispatchEvent(new CustomEvent("cookies:change"));
}

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    localStorage.clear();
    pathname = "/";
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-TEST123");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("loads nothing before consent", () => {
    const { queryAllByTestId } = render(<GoogleAnalytics />);
    expect(queryAllByTestId("ga-script")).toHaveLength(0);
  });

  it("loads GA once analytics is accepted, and stops it when withdrawn", () => {
    const { queryAllByTestId } = render(<GoogleAnalytics />);
    act(() => giveConsent(true));
    expect(queryAllByTestId("ga-script").length).toBeGreaterThan(0);
    expect((window as unknown as Record<string, boolean>)["ga-disable-G-TEST123"]).toBe(false);
    act(() => giveConsent(false));
    expect((window as unknown as Record<string, boolean>)["ga-disable-G-TEST123"]).toBe(true);
  });

  it("never loads on signed-in app pages", () => {
    pathname = "/dashboard/member";
    giveConsent(true);
    const { queryAllByTestId } = render(<GoogleAnalytics />);
    expect(queryAllByTestId("ga-script")).toHaveLength(0);
  });

  it("measures the public site and the sign-up flow only", () => {
    expect(isMeasuredPath("/")).toBe(true);
    expect(isMeasuredPath("/pricing")).toBe(true);
    expect(isMeasuredPath("/login")).toBe(true);
    expect(isMeasuredPath("/dashboard/member/fasting")).toBe(false);
    expect(isMeasuredPath("/checkout")).toBe(false);
  });
});
