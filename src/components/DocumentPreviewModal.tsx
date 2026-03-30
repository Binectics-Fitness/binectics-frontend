"use client";

import { useEffect, useRef, useState } from "react";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  viewUrl: string;
  fileName: string;
  downloadUrl?: string;
  mimeType?: string;
}

const PREVIEWABLE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

function isPreviewable(mimeType?: string): boolean {
  if (!mimeType) return true; // assume PDF if unknown
  return PREVIEWABLE_TYPES.has(mimeType);
}

export default function DocumentPreviewModal({
  open,
  onClose,
  viewUrl,
  fileName,
  downloadUrl,
  mimeType,
}: DocumentPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIframeLoading(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!shouldRender) return null;

  const canPreview = isPreviewable(mimeType);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: isAnimating ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full transition-opacity duration-200"
        style={{ opacity: isAnimating ? 1 : 0 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between bg-white/95 backdrop-blur border-b border-neutral-200 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue-100">
              <svg
                className="h-5 w-5 text-accent-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground truncate">
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-foreground hover:bg-neutral-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary hover:bg-neutral-100 hover:text-foreground"
              aria-label="Close preview"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 relative">
          {canPreview ? (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue-200 border-t-accent-blue-500" />
                    <p className="text-sm text-foreground-secondary">
                      Loading document…
                    </p>
                  </div>
                </div>
              )}
              <iframe
                src={viewUrl}
                className="h-full w-full border-0"
                title={`Preview: ${fileName}`}
                onLoad={() => setIframeLoading(false)}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-50">
              <div className="text-center px-6 max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-200">
                  <svg
                    className="h-8 w-8 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Preview not available
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  This file type cannot be previewed in the browser. Please
                  download it to view.
                </p>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent-blue-500 px-6 text-sm font-semibold text-white hover:bg-accent-blue-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download File
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
