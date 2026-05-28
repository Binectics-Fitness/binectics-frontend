"use client";

import { useEffect, useState } from "react";

interface LightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
  caption?: string;
}

export function Lightbox({ src, alt, open, onClose, caption }: LightboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 220);
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

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          background: "oklch(0.14 0.008 80 / 0.7)",
          opacity: isAnimating ? 1 : 0,
          transitionDuration: "var(--motion-base)",
        }}
      />
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "scale(1)" : "scale(0.95)",
          transitionProperty: "opacity, transform",
          transitionDuration: "var(--motion-base)",
          transitionTimingFunction: "var(--ease-out)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-(--r-2) text-white/80 hover:text-white"
          aria-label="Close lightbox"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] max-w-full rounded-(--r-3) object-contain"
        />
        {caption && (
          <p className="mt-3 text-center text-[13.5px] font-medium text-white/80">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
