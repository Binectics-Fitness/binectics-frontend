"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Modal — r-3 radius, 1px border, shadow-2.
 * 360ms open transition (--motion-slow).
 * Overlay is subtle ink wash, no blur.
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
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

  const sizeMap = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay — subtle ink wash, no blur */}
      <div
        ref={overlayRef}
        className="absolute inset-0 transition-opacity"
        style={{
          background: "oklch(0.14 0.008 80 / 0.3)",
          opacity: isAnimating ? 1 : 0,
          transitionDuration: "var(--motion-base)",
        }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeMap[size]} rounded-(--r-3) border border-border bg-bg p-6`}
        style={{
          boxShadow: "var(--shadow-2)",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating
            ? "scale(1) translateY(0)"
            : "scale(0.98) translateY(6px)",
          transitionProperty: "opacity, transform",
          transitionDuration: "var(--motion-base)",
          transitionTimingFunction: "var(--ease-out)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-[17px] font-medium text-ink"
            style={{ letterSpacing: "-0.015em" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-(--r-2) text-fg-3 hover:bg-bg-2 hover:text-ink"
            aria-label="Close"
          >
            <svg
              className="h-4 w-4"
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
        </div>
        {children}
      </div>
    </div>
  );
}
