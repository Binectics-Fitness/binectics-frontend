"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUploadZone } from "@/components/ds/FileUploadZone";
import { marketplaceService } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/queries/keys";

/**
 * Which listing the gallery belongs to. Org (gym) listings are keyed by the
 * organization; solo (trainer/dietitian) listings by the listing id. The two
 * hit different endpoints but behave identically here.
 */
export type GalleryTarget =
  | { kind: "org"; orgId: string }
  | { kind: "solo"; listingId: string };

const GALLERY_LIMIT = 50;

/**
 * Upload, remove, and reorder a marketplace listing's gallery photos. Each
 * mutation returns the updated listing; we invalidate the listing query so the
 * parent editor re-reads `photos` and everything stays in sync.
 */
export function GalleryManager({
  photos,
  coverUrl,
  target,
}: {
  photos: string[];
  /**
   * The listing's profile/cover image, if any. The backend prepends it to
   * `photos` but the gallery mutation endpoints operate on the gallery WITHOUT
   * it, so we exclude it here — otherwise reorder sends a wrong-length array
   * (400) and removing it 404s.
   */
  coverUrl?: string;
  target: GalleryTarget;
}) {
  // The gallery is everything except the separate cover/profile image.
  const gallery = coverUrl ? photos.filter((p) => p !== coverUrl) : photos;
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped after each successful upload to remount FileUploadZone, clearing the
  // files it would otherwise keep listed below the dropzone.
  const [uploadNonce, setUploadNonce] = useState(0);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey:
        target.kind === "org"
          ? queryKeys.marketplace.orgListing(target.orgId)
          : queryKeys.marketplace.myListing(),
    });

  const run = async (
    fn: () => Promise<{ success: boolean; message?: string }>,
  ) => {
    setPending(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.success) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return false;
      }
      await invalidate();
      return true;
    } catch {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setPending(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    const room = GALLERY_LIMIT - gallery.length;
    if (room <= 0) {
      setError(`You already have the maximum of ${GALLERY_LIMIT} photos.`);
      return;
    }
    const batch = files.slice(0, room);
    const ok = await run(() =>
      target.kind === "org"
        ? marketplaceService.uploadOrgListingGalleryImages(target.orgId, batch)
        : marketplaceService.uploadSoloListingGalleryImages(target.listingId, batch),
    );
    if (ok) setUploadNonce((n) => n + 1);
    if (ok && files.length > room) {
      setError(`Only ${room} more photo${room === 1 ? "" : "s"} could be added (limit is ${GALLERY_LIMIT}).`);
    }
  };

  const handleRemove = (url: string) =>
    void run(() =>
      target.kind === "org"
        ? marketplaceService.deleteOrgListingGalleryImage(target.orgId, url)
        : marketplaceService.deleteSoloListingGalleryImage(target.listingId, url),
    );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void run(() =>
      target.kind === "org"
        ? marketplaceService.reorderOrgListingGalleryImages(target.orgId, next)
        : marketplaceService.reorderSoloListingGalleryImages(target.listingId, next),
    );
  };

  const ctrlClass =
    "flex h-6 w-6 items-center justify-center rounded-(--r-1) text-[12px] disabled:opacity-30";
  const ctrlStyle = { background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--border)" };

  return (
    <div className="flex flex-col gap-3">
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {gallery.map((url, i) => (
            <div
              key={url}
              className="relative aspect-[4/3] overflow-hidden rounded-(--r-2)"
              style={{ border: "1px solid var(--border)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gallery photo ${i + 1}`} className="h-full w-full object-cover" />

              {i === 0 && !coverUrl && (
                <span
                  className="absolute left-1.5 top-1.5 rounded-(--r-1) px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide"
                  style={{ background: "var(--bg)", color: "var(--fg-2)", border: "1px solid var(--border)" }}
                >
                  Cover
                </span>
              )}

              <div
                className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5"
                style={{ background: "linear-gradient(to top, rgba(3,20,30,0.55), transparent)" }}
              >
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={pending || i === 0}
                    aria-label={`Move photo ${i + 1} earlier`}
                    className={ctrlClass}
                    style={ctrlStyle}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={pending || i === gallery.length - 1}
                    aria-label={`Move photo ${i + 1} later`}
                    className={ctrlClass}
                    style={ctrlStyle}
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  disabled={pending}
                  aria-label={`Remove photo ${i + 1}`}
                  className="rounded-(--r-1) px-2 py-0.5 text-[11.5px] font-medium disabled:opacity-40"
                  style={{ background: "var(--bg)", color: "var(--danger)", border: "1px solid var(--border)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {gallery.length < GALLERY_LIMIT && (
        <FileUploadZone
          key={uploadNonce}
          accept="image/*"
          multiple
          maxSizeMB={10}
          onFiles={(files) => void handleUpload(files)}
        >
          <p className="text-[13.5px] font-medium text-fg-2">
            {pending ? "Uploading…" : "Drop photos here or click to upload"}
          </p>
          <p className="mt-1 text-[12px] text-fg-4">
            JPG or PNG, up to 10 MB each · {gallery.length}/{GALLERY_LIMIT} added
          </p>
        </FileUploadZone>
      )}

      {error && (
        <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      {gallery.length > 0 && (
        <p className="text-[11.5px]" style={{ color: "var(--fg-4)" }}>
          {coverUrl
            ? "Reorder with the arrows."
            : "The first photo is your listing cover. Reorder with the arrows."}
        </p>
      )}
    </div>
  );
}
