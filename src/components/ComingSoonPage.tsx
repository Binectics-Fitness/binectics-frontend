'use client';

import Link from 'next/link';

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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        {icon && <div className="mb-6 flex justify-center">{icon}</div>}
        <h2 className="text-3xl font-black text-foreground mb-3">{title}</h2>
        <p className="text-foreground/60 mb-8">{description}</p>
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
