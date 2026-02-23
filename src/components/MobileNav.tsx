"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileNav() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const menuContent = (
    <>
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-full max-w-sm transform bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                Binectics
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-foreground-secondary hover:bg-neutral-100 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="h-6 w-6"
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
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-1">
              <Link
                href="#features"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-3 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-3 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-3 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-3 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </div>

            <div className="mt-8 space-y-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center rounded-lg bg-foreground px-4 py-3 text-base font-semibold text-background shadow-button transition-colors hover:bg-foreground-secondary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M6.75 9.003c.41 0 .75-.34.75-.75V4.5H19v16H7.5v-3.75c0-.41-.34-.75-.75-.75s-.75.34-.75.75v4.5c0 .41.34.75.75.75h13c.41 0 .75-.34.75-.75V3.75c0-.41-.34-.75-.75-.75h-13c-.41 0-.75.34-.75.75v4.503c0 .41.34.75.75.75Z"
                        clipRule="evenodd"
                      ></path>
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="m16.52 11.823-3.81-3.71a.754.754 0 0 0-1.06.01c-.29.3-.28.77.01 1.06l2.59 2.53H3.75c-.41 0-.75.34-.75.75s.34.75.75.75h10.37l-2.37 2.43c-.29.3-.28.77.01 1.06.3.29.77.28 1.06-.01l3.71-3.81c.29-.3.28-.77-.01-1.06Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex md:hidden items-center justify-center rounded-lg p-2 text-foreground-secondary hover:bg-neutral-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
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
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Portal the menu to document.body to escape header's stacking context */}
      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}
