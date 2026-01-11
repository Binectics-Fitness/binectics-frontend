import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="font-display text-9xl font-black text-primary-500">404</h1>
        </div>
        <h2 className="font-display text-3xl font-black text-foreground mb-4 sm:text-4xl">
          Page Not Found
        </h2>
        <p className="text-lg text-foreground-secondary mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
          >
            Go to Homepage
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
          >
            Contact Support
          </Link>
        </div>
        <div className="mt-12">
          <p className="text-sm text-foreground-tertiary mb-4">Popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/how-it-works" className="text-accent-blue-500 hover:underline">
              How It Works
            </Link>
            <Link href="/pricing" className="text-accent-blue-500 hover:underline">
              Pricing
            </Link>
            <Link href="/faq" className="text-accent-blue-500 hover:underline">
              FAQ
            </Link>
            <Link href="/register" className="text-accent-blue-500 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
