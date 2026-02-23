"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import MobileNav from "./MobileNav";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-300 bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Binectics
            </span>
          </Link>
          <nav className="hidden gap-8 md:flex">
            <Link
              href="/#features"
              className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
            >
              How it Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
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
                  onClick={logout}
                  className="hidden md:inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-colors duration-200 hover:bg-foreground-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
                >
                  <svg
                    className="h-6 w-6"
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
                  className="hidden md:inline-flex h-10 items-center justify-center rounded-lg bg-primary-500 px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
                >
                  Join Free
                </Link>
              </>
            )}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
