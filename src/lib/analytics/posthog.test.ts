import { describe, expect, it } from "vitest";
import type { CaptureResult } from "posthog-js";
import { beforeSend, posthogConfig, sanitizeUrl } from "./posthog";

describe("sanitizeUrl", () => {
  it("drops the query string and the fragment", () => {
    expect(sanitizeUrl("https://binectics.netlify.app/login?mode=signup&email=a%40b.co#x")).toBe(
      "https://binectics.netlify.app/login",
    );
  });

  it("replaces ids and tokens in the path", () => {
    expect(sanitizeUrl("https://x.app/dashboard/clients/665f00000000000000000001/notes")).toBe(
      "https://x.app/dashboard/clients/:id/notes",
    );
    expect(sanitizeUrl("/reset-password/Zx8_kQ2-abcdefghijklmnop")).toBe("/reset-password/:id");
    expect(sanitizeUrl("/bookings/3f2b8c1e-1d2a-4c5b-9e8f-0a1b2c3d4e5f")).toBe("/bookings/:id");
    expect(sanitizeUrl("/trainers")).toBe("/trainers");
  });

  it("returns undefined for anything that is not a URL string", () => {
    expect(sanitizeUrl(undefined)).toBeUndefined();
    expect(sanitizeUrl(42)).toBeUndefined();
  });
});

describe("beforeSend", () => {
  it("cleans every URL property and drops titles and referrers", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: "https://x.app/dashboard/clients/665f00000000000000000001?tab=health",
        $pathname: "/dashboard/clients/665f00000000000000000001",
        $title: "Tunde Okafor | Binectics",
        $referrer: "https://x.app/invite/abcdefghijklmnopqrstuvwxyz",
        $browser: "Chrome",
      },
      $set_once: { $initial_current_url: "https://x.app/?email=a@b.co", $initial_referrer: "https://mail.example/?t=1" },
    } as unknown as CaptureResult;
    const out = beforeSend(event)!;
    expect(out.properties).toEqual({
      $current_url: "https://x.app/dashboard/clients/:id",
      $pathname: "/dashboard/clients/:id",
      $browser: "Chrome",
    });
    expect(out.$set_once).toEqual({ $initial_current_url: "https://x.app/" });
  });
});

describe("posthogConfig", () => {
  it("turns every automatic capture off and respects Do Not Track", () => {
    const c = posthogConfig();
    expect(c).toMatchObject({
      api_host: "https://eu.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      respect_dnt: true,
      person_profiles: "identified_only",
    });
  });
});
