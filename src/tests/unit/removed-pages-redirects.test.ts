import { describe, it, expect } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";
import nextConfig from "../../../next.config";

const id = "6abe5a17882f018fcdb21c61";

/**
 * Where Next sends a request, using Next's own matcher over the redirects
 * next.config declares (first match wins, as in Next), or null when no
 * redirect applies and the page itself answers.
 */
async function redirectFor(path: string): Promise<string | null> {
  const rules = (await nextConfig.redirects?.()) ?? [];
  for (const rule of rules) {
    const params = getPathMatch(rule.source, { removeUnnamedParams: true, strict: true })(path);
    if (params) {
      const { newUrl, destQuery } = prepareDestination({
        appendParamsToQuery: false,
        destination: rule.destination,
        params,
        query: {},
      });
      const search = new URLSearchParams(destQuery as Record<string, string>).toString();
      return search ? `${newUrl}?${search}` : newUrl;
    }
  }
  return null;
}

describe("redirects for removed pages", () => {
  it.each([
    ["/dashboard/trainer/workouts/create", "/dashboard/trainer/programs?new=1"],
    ["/review/abc123", "/marketplace"],
    ["/booking/confirmed", "/dashboard/bookings"],
    [`/booking/${id}`, `/dashboard/bookings?booking=${id}`],
    ["/dashboard/member/help", "/help"],
    ["/unsubscribe/some-token", "/dashboard/settings/notifications"],
  ])("%s goes to %s", async (path, target) => {
    expect(await redirectFor(path)).toBe(target);
  });

  it.each([
    "/booking",
    "/booking/recurring",
    `/booking/${id}/receipt`,
    "/booking/not-an-id",
    "/dashboard/trainer/programs",
    "/dashboard/bookings",
    "/help",
    "/marketplace",
  ])("leaves %s to its own page", async (path) => {
    expect(await redirectFor(path)).toBeNull();
  });

  it("keeps the redirects temporary, so a browser doesn't cache them for good", async () => {
    const rules = (await nextConfig.redirects?.()) ?? [];
    const removed = rules.filter((r) => r.source !== "/home");
    expect(removed.length).toBeGreaterThan(0);
    for (const rule of removed) expect(rule.permanent).toBe(false);
  });
});
