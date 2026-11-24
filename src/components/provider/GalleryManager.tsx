"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUploadZone } from "@/components/ds/FileUploadZone";
import { marketplaceService } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/queries/keys";
import { uploadInBatches, type FileProgress } from "@/lib/uploads/batchUploadQueue";

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
 * The API's gallery upload takes up to 10 files a request
 * (FilesInterceptor('files', 10)) and 5 requests a minute (@Throttle). The
 * queue sends batches within both, so a big drop is paced instead of refused.
 */
export const GALLERY_UPLOAD_PACING = { batchSize: 10, limit: 5, windowMs: 60_000 } as const;

interface QueuedFile {
  id: number;
  file: File;
  progress: FileProgress;
}

function statusLabel(p: FileProgress, now: number): string {
  switch (p.status) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading…";
    case "waiting": {
      const secs = p.resumeAt ? Math.max(1, Math.ceil((p.resumeAt - now) / 1000)) : null;
      return secs ? `Upload limit reached · resumes in ${secs}s` : "Upload limit reached · waiting";
    }
    case "done":
      return "Added";
    case "failed":
      return p.message ?? "Failed";
  }
}

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
  // Bumped on each drop to remount FileUploadZone, clearing the files it would
  // otherwise list below the dropzone (the upload rows below replace them).
  const [uploadNonce, setUploadNonce] = useState(0);
  // One row per file in the current upload, with its own status, so a file
  // the API refused is never silently lost: it shows as failed, with Retry.
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const nextId = useRef(0);
  // Ticks once a second while a batch waits, for the "resumes in Ns" label.
  const [now, setNow] = useState(() => Date.now());
  const waiting = queue.some((q) => q.progress.status === "waiting");
  useEffect(() => {
    if (!waiting) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [waiting]);

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
        setError(res.message ?? "Couldn't update the gallery. Try again.");
        return false;
      }
      await invalidate();
      return true;
    } catch {
      setError("Couldn't update the gallery. Try again.");
      return false;
    } finally {
      setPending(false);
    }
  };

  const uploadFiles = async (items: QueuedFile[]) => {
    setUploading(true);
    setError(null);
    const ids = items.map((q) => q.id);
    const result = await uploadInBatches(
      items.map((q) => q.file),
      (batch) =>
        target.kind === "org"
          ? marketplaceService.uploadOrgListingGalleryImages(target.orgId, batch)
          : marketplaceService.uploadSoloListingGalleryImages(target.listingId, batch),
      {
        key: target.kind === "org" ? `org:${target.orgId}` : `solo:${target.listingId}`,
        ...GALLERY_UPLOAD_PACING,
        onProgress: (index, progress) => {
          setNow(Date.now());
          setQueue((prev) => prev.map((q) => (q.id === ids[index] ? { ...q, progress } : q)));
        },
        // Show each batch's photos as soon as they land.
        onBatchDone: () => void invalidate(),
      },
    );
    setUploading(false);
    // Rows that made it drop off; failed ones stay with a Retry.
    if (result.failed.length === 0) setQueue([]);
    else setQueue((prev) => prev.filter((q) => q.progress.status !== "done"));
  };

  const handleUpload = async (files: File[]) => {
    // The drop zone keeps its own file list; ours replaces it.
    setUploadNonce((n) => n + 1);
    if (files.length === 0) return;
    if (uploading) {
      setError("Wait for these photos to finish, then add more.");
      return;
    }
    const room = GALLERY_LIMIT - gallery.length;
    if (room <= 0) {
      setError(`You already have the maximum of ${GALLERY_LIMIT} photos.`);
      return;
    }
    const items: QueuedFile[] = files.slice(0, room).map((file) => ({
      id: nextId.current++,
      file,
      progress: { status: "queued" },
    }));
    setQueue(items);
    await uploadFiles(items);
    if (files.length > room) {
      setError(`Only ${room} more photo${room === 1 ? "" : "s"} could be added (limit is ${GALLERY_LIMIT}).`);
    }
  };

  const retryFailed = () => {
    const failed = queue
      .filter((q) => q.progress.status === "failed")
      .map((q) => ({ ...q, progress: { status: "queued" } as FileProgress }));
    if (failed.length === 0 || uploading) return;
    setQueue(failed);
    void uploadFiles(failed);
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
                    disabled={pending || uploading || i === 0}
                    aria-label={`Move photo ${i + 1} earlier`}
                    className={ctrlClass}
                    style={ctrlStyle}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={pending || uploading || i === gallery.length - 1}
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
                  disabled={pending || uploading}
                  aria-label={`Remove photo ${i + 1}`}
                  className="rounded-(--r-1) px-2 py-0.5 text-[11.5px] font-medium disabled:opacity-40"
                  style={{ background: "var(--bg)", color: "var(--danger-ink)", border: "1px solid var(--border)" }}
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
            {uploading ? "Uploading…" : "Drop photos or click to upload"}
          </p>
          <p className="mt-1 text-[12px] text-fg-4">
            JPG or PNG, up to 10 MB each · {gallery.length}/{GALLERY_LIMIT} added
          </p>
        </FileUploadZone>
      )}

      {queue.length > 0 && (
        <ul className="flex flex-col gap-1.5" aria-label="Photo uploads">
          {queue.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between gap-3 rounded-(--r-2) px-3 py-2"
              style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
            >
              <span className="min-w-0 truncate text-[13px]" style={{ color: "var(--ink)" }}>
                {q.file.name}
              </span>
              <span
                className="shrink-0 text-[12px]"
                style={{ color: q.progress.status === "failed" ? "var(--danger-ink)" : "var(--fg-3)" }}
              >
                {statusLabel(q.progress, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!uploading && queue.some((q) => q.progress.status === "failed") && (
        <div>
          <button type="button" className="btn-ghost-v2 sm" onClick={retryFailed}>
            Retry failed uploads
          </button>
        </div>
      )}

      {error && (
        <p className="text-[12.5px]" style={{ color: "var(--danger-ink)" }}>
          {error}
        </p>
      )}
      {gallery.length > 0 && (
        <p className="text-[11.5px]" style={{ color: "var(--fg-4)" }}>
          {coverUrl
            ? "Reorder with the arrows."
            : "The first photo is your cover."}
        </p>
      )}
    </div>
  );
}
