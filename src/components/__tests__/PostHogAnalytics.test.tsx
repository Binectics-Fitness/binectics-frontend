import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { track } from "@/lib/analytics/track";

let pathname = "/";
let user: { id: string; role: string } | null = null;
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user }) }));

const ph = {
  __loaded: false,
  init: vi.fn(function (this: typeof ph) {
    ph.__loaded = true;
  }),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
  has_opted_out_capturing: vi.fn(() => false),
};
const imported = vi.fn();
vi.mock("posthog-js", () => {
  imported();
  return { default: ph };
});

import { PostHogAnalytics } from "@/components/PostHogAnalytics";

function giveConsent(analytics: boolean) {
  localStorage.setItem("binectics-cookies", JSON.stringify({ required: true, analytics, version: "3.0", ts: Date.now() }));
  document.dispatchEvent(new CustomEvent("cookies:change"));
}

describe("PostHogAnalytics", () => {
  beforeEach(() => {
    localStorage.clear();
    pathname = "/";
    user = null;
    ph.__loaded = false;
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("without a key does nothing, even with consent", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    giveConsent(true);
    render(<PostHogAnalytics />);
    await new Promise((r) => setTimeout(r, 20));
    expect(ph.init).not.toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it("loads and sends nothing before consent", async () => {
    render(<PostHogAnalytics />);
    await new Promise((r) => setTimeout(r, 20));
    expect(ph.init).not.toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it("with consent: inits, sends a clean page view, identifies by id and role only", async () => {
    user = { id: "665f00000000000000000001", role: "TRAINER" };
    pathname = "/dashboard/clients/665f00000000000000000001";
    window.history.pushState({}, "", "/dashboard/clients/665f00000000000000000001?tab=notes");
    giveConsent(true);
    render(<PostHogAnalytics />);
    await waitFor(() => expect(ph.init).toHaveBeenCalledTimes(1));
    expect(ph.init.mock.calls[0][1]).toMatchObject({ autocapture: false, disable_session_recording: true });
    await waitFor(() =>
      expect(ph.capture).toHaveBeenCalledWith("$pageview", { $current_url: "http://localhost:3000/dashboard/clients/:id" }),
    );
    expect(ph.identify).toHaveBeenCalledWith("665f00000000000000000001", { role: "trainer" });
  });

  it("forwards only allowlisted track() events", async () => {
    giveConsent(true);
    render(<PostHogAnalytics />);
    await waitFor(() => expect(ph.init).toHaveBeenCalled());
    ph.capture.mockClear();
    track("sign_up_complete", { role: "trainer", email: "a@b.co" } as never);
    expect(ph.capture).toHaveBeenCalledWith("sign_up_complete", { role: "trainer" });
  });

  it("withdrawing consent opts out and resets", async () => {
    giveConsent(true);
    render(<PostHogAnalytics />);
    await waitFor(() => expect(ph.init).toHaveBeenCalled());
    act(() => giveConsent(false));
    await waitFor(() => expect(ph.opt_out_capturing).toHaveBeenCalled());
    expect(ph.reset).toHaveBeenCalled();
  });

  it("respects Do Not Track", async () => {
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    giveConsent(true);
    render(<PostHogAnalytics />);
    await new Promise((r) => setTimeout(r, 20));
    expect(ph.init).not.toHaveBeenCalled();
    Object.defineProperty(navigator, "doNotTrack", { value: null, configurable: true });
  });
});
