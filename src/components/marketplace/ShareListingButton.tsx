"use client";

import { toast } from "@/components/Toast";
import { SITE_URL } from "@/lib/site-url";

/** The public page for a listing. The link carries only the listing id. */
export function listingShareUrl(listingId: string, origin: string = SITE_URL): string {
  return `${origin.replace(/\/$/, "")}/marketplace/${encodeURIComponent(listingId)}`;
}

type ShareNav = Pick<Navigator, "share" | "clipboard"> | undefined;

/**
 * The share sheet where the browser has one (Web Share API), else the link
 * copied to the clipboard. "shared" | "copied" | "cancelled" | "failed".
 */
export async function shareListing(
  listingId: string,
  name: string,
  nav: ShareNav = typeof navigator !== "undefined" ? navigator : undefined,
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const url = listingShareUrl(listingId);
  if (nav && typeof nav.share === "function") {
    try {
      await nav.share({ title: name, text: `${name} on Binectics`, url });
      return "shared";
    } catch (err) {
      // The member closed the sheet: nothing to say.
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      // Any other refusal falls through to copying.
    }
  }
  try {
    if (!nav?.clipboard?.writeText) return "failed";
    await nav.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Share on a provider's profile (mobile ShareListingButton, #170). */
export function ShareListingButton({ listingId, listingName }: { listingId: string; listingName: string }) {
  const onClick = async () => {
    const result = await shareListing(listingId, listingName);
    if (result === "copied") toast.success("Link copied");
    else if (result === "failed") toast.error(`Couldn't share. The link is ${listingShareUrl(listingId)}`);
  };
  return (
    <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={() => void onClick()} aria-label={`Share ${listingName}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8" />
        <path d="m17 8-5-5-5 5M12 3v12" />
      </svg>
      Share
    </button>
  );
}
