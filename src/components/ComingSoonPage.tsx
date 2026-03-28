"use client";

import Link from "next/link";

interface ComingSoonPageProps {
  title: string;
  description: string;
  backLink: string;
  backLabel: string;
  icon?: React.ReactNode;
}

export default function ComingSoonPage({
  title,
  description,
  backLink,
  backLabel,
  icon,
}: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-1 sm:px-2">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
        {icon && <div className="mb-6 flex justify-center">{icon}</div>}
        <h2 className="text-2xl font-black text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm text-foreground/60 sm:text-base">
          {description}
        </p>
        <Link
          href={backLink}
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600 sm:h-12 sm:text-base"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
