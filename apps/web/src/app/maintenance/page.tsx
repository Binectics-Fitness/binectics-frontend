import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-100">
          <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-black text-foreground mb-4 sm:text-4xl lg:text-5xl">
          We'll be right back
        </h1>
        <p className="text-lg text-foreground-secondary mb-8 leading-relaxed">
          Binectics is currently undergoing scheduled maintenance to improve your experience.
          We'll be back online shortly.
        </p>

        <div className="rounded-2xl bg-background p-8 mb-8 shadow-card">
          <h2 className="font-bold text-lg text-foreground mb-4">Estimated Downtime</h2>
          <div className="flex items-center justify-center gap-2 text-foreground-secondary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Approximately 2 hours</span>
          </div>
          <p className="mt-4 text-sm text-foreground-tertiary">
            Maintenance window: 2:00 AM - 4:00 AM EST
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-foreground">What's being updated?</h3>
          <ul className="space-y-3 text-left max-w-md mx-auto">
            <li className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-foreground-secondary">Performance improvements and speed optimizations</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-foreground-secondary">Security updates and bug fixes</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-foreground-secondary">New features and enhancements</span>
            </li>
          </ul>
        </div>

        <div className="mt-12">
          <p className="text-sm text-foreground-secondary mb-4">Stay updated:</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://twitter.com/binectics"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-background transition-colors hover:bg-neutral-100"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="https://facebook.com/binectics"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-background transition-colors hover:bg-neutral-100"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-accent-blue-500 hover:underline"
          >
            Refresh this page to check if we're back
          </Link>
        </div>
      </div>
    </div>
  );
}
