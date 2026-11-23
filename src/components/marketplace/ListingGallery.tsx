"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/** One picture in the gallery or the full-screen viewer. */
export interface GalleryPhoto {
  src: string;
  /** Read out and shown under the photo in the viewer ("Cardio deck"). */
  caption?: string;
}

export const GALLERY_COPY = {
  showAll: (n: number) => `Show all ${n}`,
  close: "Close photos",
  previous: "Previous photo",
  next: "Next photo",
} as const;

/**
 * The full-screen photo viewer: one photo at a time, arrows and the arrow
 * keys to move, Escape or the close button to leave. Focus moves into the
 * dialog and back to what opened it.
 */
export function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
  title,
}: {
  photos: readonly GalleryPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  title: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = photos.length;
  const go = useCallback((d: number) => onIndex((index + d + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && count > 1) go(1);
      else if (e.key === "ArrowLeft" && count > 1) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, count]);

  const photo = photos[index];
  if (!photo) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--ink)", color: "var(--bg)" }}
    >
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 shrink-0">
        <span className="font-mono text-[12.5px]" style={{ fontVariantNumeric: "tabular-nums" }} aria-live="polite">
          {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={GALLERY_COPY.close}
          className="inline-flex items-center justify-center w-11 h-11 rounded-full text-bg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="relative flex-1 min-h-0 mx-4 sm:mx-16">
        <Image src={photo.src} alt={photo.caption || `${title} photo ${index + 1}`} fill className="object-contain" sizes="100vw" priority />
      </div>
      <div className="h-16 shrink-0 flex items-center justify-center gap-4 px-4">
        {count > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label={GALLERY_COPY.previous} className="inline-flex items-center justify-center w-11 h-11 rounded-full border text-bg" style={{ borderColor: "oklch(1 0 0 / 0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
          </button>
        )}
        <span className="text-[13.5px] min-w-0 truncate text-center flex-1 max-w-[60ch]">{photo.caption ?? ""}</span>
        {count > 1 && (
          <button type="button" onClick={() => go(1)} aria-label={GALLERY_COPY.next} className="inline-flex items-center justify-center w-11 h-11 rounded-full border text-bg" style={{ borderColor: "oklch(1 0 0 / 0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The profile's photo mosaic (prototype provider.html "GALLERY"): the hero
 * large on the left, up to four more beside it, "Show all N" on the last
 * tile. Every tile opens the full-screen viewer at that photo. On a phone
 * only the hero shows, with "Show all N" on it. The photos never include
 * the logo (see galleryPhotos); with none at all the page shows a plain
 * panel with the logo instead (rendered by the profile, not here).
 */
export function ListingGallery({
  photos,
  title,
  placeholder,
}: {
  photos: readonly GalleryPhoto[];
  title: string;
  /** The striped role pattern for a tile with no photo. */
  placeholder: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const count = photos.length;
  if (count === 0) return null;
  const single = count === 1;
  const tiles = single ? 1 : 5;

  return (
    <>
      <section aria-label="Photos" className="mx-auto max-w-360 px-5 sm:px-10 pt-6">
        <div
          className={`relative grid gap-2 ${
            single ? "grid-cols-1 h-[240px] sm:h-[408px]" : "grid-cols-1 h-[240px] sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-[200px_200px] sm:h-[408px]"
          }`}
        >
          {Array.from({ length: tiles }).map((_, i) => {
            const photo = photos[i];
            const cls = `rounded-(--r-3) overflow-hidden relative border border-border ${i > 0 ? "hidden sm:block" : ""} ${i === 0 && !single ? "sm:row-span-2" : ""}`;
            if (!photo) return <div key={i} className={cls} style={{ background: placeholder }} aria-hidden="true" />;
            return (
              <button
                key={i}
                type="button"
                className={`${cls} p-0 cursor-zoom-in`}
                onClick={() => setOpen(i)}
                aria-label={`Open photo ${i + 1} of ${count}`}
              >
                <Image src={photo.src} alt={photo.caption || `${title} photo ${i + 1}`} fill className="object-cover" sizes={i === 0 ? "(max-width: 640px) 100vw, 50vw" : "25vw"} priority={i === 0} />
              </button>
            );
          })}
          {/* Bottom right of the mosaic: the last tile on desktop, the hero on a phone. */}
          {count > 1 && (
            <button
              type="button"
              onClick={() => setOpen(0)}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-bg border border-border px-3 py-1.5 rounded-full text-[12.5px] font-medium"
              style={{ color: "var(--ink)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              {GALLERY_COPY.showAll(count)}
            </button>
          )}
        </div>
      </section>
      {open !== null && (
        <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} title={title} />
      )}
    </>
  );
}
