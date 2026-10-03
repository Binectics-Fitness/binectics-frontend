"use client";

import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedListingIds, useToggleSavedListing } from "@/lib/queries/savedListings";
import { toast } from "@/components/Toast";

function HeartIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
    </svg>
  );
}

/**
 * Save / unsave a marketplace listing ("saved providers").
 *
 * Signed in: toggles at once and rolls back if the API refuses. Signed out:
 * sends the person to log in and brings them back to this page.
 *
 * `icon` is the round heart over a card's photo; `button` is the ghost
 * "Save" button on the listing page.
 */
export function SaveListingButton({
  listingId,
  listingName,
  variant = "icon",
  className = "",
}: {
  listingId: string;
  /** For the accessible label, e.g. "Save Iron Lab". */
  listingName?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: savedIds } = useSavedListingIds(!!user);
  const toggle = useToggleSavedListing();

  const saved = !!user && !!savedIds?.includes(listingId);
  const label = `${saved ? "Remove" : "Save"}${listingName ? ` ${listingName}` : ""}${saved ? " from saved" : ""}`;

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Cards are links; the heart must not open the listing.
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      const back = `${pathname || "/marketplace"}${typeof window !== "undefined" ? window.location.search : ""}`;
      router.push(`/login?redirect=${encodeURIComponent(back)}`);
      return;
    }
    toggle.mutate(
      { listingId, save: !saved },
      {
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Couldn't update saved providers");
        },
      },
    );
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={label}
        className={`btn-ghost-v2 sm ${className}`}
        style={saved ? { color: "var(--ink)" } : undefined}
      >
        <HeartIcon filled={saved} size={14} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved" : "Save"}
      className={`w-10 h-10 sm:w-7 sm:h-7 rounded-full flex items-center justify-center backdrop-blur-sm ${className}`}
      style={{
        background: "oklch(0.985 0.005 85 / 0.85)",
        color: saved ? "var(--ink)" : "var(--fg-2)",
        border: "none",
        cursor: "pointer",
      }}
    >
      <HeartIcon filled={saved} size={14} />
    </button>
  );
}
