"use client";

import { useState } from "react";

interface PhotoGalleryProps {
  photos: string[];
  profileImage?: string;
  alt?: string;
  fallbackEmoji?: string;
  accentBg?: string;
}

export default function PhotoGallery({
  photos,
  profileImage,
  alt = "Photo",
  fallbackEmoji = "📸",
  accentBg = "bg-gray-200",
}: PhotoGalleryProps) {
  const allPhotos = [
    ...(profileImage ? [profileImage] : []),
    ...photos.filter((p) => p !== profileImage),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (allPhotos.length === 0) {
    return (
      <div className="space-y-4">
        <div
          className={`flex h-72 items-center justify-center sm:h-96 ${accentBg}`}
        >
          <span className="text-6xl sm:text-8xl">{fallbackEmoji}</span>
        </div>
      </div>
    );
  }

  const mainPhoto = allPhotos[selectedIndex] ?? allPhotos[0];
  const thumbnails = allPhotos.slice(0, 4);

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full h-72 sm:h-96 overflow-hidden bg-gray-100 cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainPhoto}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </button>

        {/* Thumbnails */}
        {allPhotos.length > 1 && (
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {thumbnails.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`h-20 sm:h-24 overflow-hidden ${
                  i === selectedIndex
                    ? "ring-2 ring-primary-500"
                    : "opacity-70 hover:opacity-100"
                } transition-all`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${alt} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            aria-label="Close lightbox"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Previous button */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(
                  (prev) => (prev - 1 + allPhotos.length) % allPhotos.length,
                );
              }}
              className="absolute left-4 text-white/80 hover:text-white z-10"
              aria-label="Previous photo"
            >
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allPhotos[selectedIndex]}
            alt={`${alt} ${selectedIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(
                  (prev) => (prev + 1) % allPhotos.length,
                );
              }}
              className="absolute right-4 text-white/80 hover:text-white z-10"
              aria-label="Next photo"
            >
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Counter */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 text-white/80 text-sm">
              {selectedIndex + 1} / {allPhotos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
