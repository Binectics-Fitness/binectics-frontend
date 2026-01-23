import Link from "next/link";

export const metadata = {
  title: "Help Center - Binectics",
  description:
    "Get help with Binectics. Browse our help articles, FAQs, and support resources.",
};

export default function HelpPage() {
  const helpCategories = [
    {
      name: "Getting Started",
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      articles: [
        { title: "How to create an account", href: "/help/create-account" },
        {
          title: "Choosing the right membership plan",
          href: "/help/choose-plan",
        },
        { title: "Setting up your profile", href: "/help/setup-profile" },
        { title: "Downloading the mobile app", href: "/help/mobile-app" },
      ],
    },
    {
      name: "Membership & Billing",
      icon: (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      articles: [
        {
          title: "Managing your subscription",
          href: "/help/manage-subscription",
        },
        { title: "Payment methods and billing", href: "/help/payment-methods" },
        { title: "Canceling your membership", href: "/help/cancel-membership" },
        { title: "Refund policy", href: "/help/refund-policy" },
      ],
    },
    {
      name: "Using Gyms & Check-in",
      icon: (
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      articles: [
        { title: "Finding gyms near you", href: "/help/find-gyms" },
        { title: "QR code check-in guide", href: "/qr-help" },
        { title: "Gym access and rules", href: "/help/gym-rules" },
        { title: "Reporting facility issues", href: "/help/report-issues" },
      ],
    },
    {
      name: "Booking Services",
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      articles: [
        { title: "Booking a personal trainer", href: "/help/book-trainer" },
        { title: "Scheduling with a dietician", href: "/help/book-dietician" },
        {
          title: "Canceling and rescheduling sessions",
          href: "/help/reschedule",
        },
        { title: "Session pricing and credits", href: "/help/session-pricing" },
      ],
    },
    {
      name: "Account & Security",
      icon: (
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      articles: [
        { title: "Resetting your password", href: "/help/reset-password" },
        { title: "Updating account information", href: "/help/update-account" },
        { title: "Two-factor authentication", href: "/help/2fa" },
        { title: "Privacy and data security", href: "/security" },
      ],
    },
    {
      name: "Mobile App",
      icon: (
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
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      articles: [
        { title: "Installing the Binectics app", href: "/help/install-app" },
        { title: "App features and navigation", href: "/help/app-features" },
        {
          title: "Troubleshooting app issues",
          href: "/help/app-troubleshooting",
        },
        { title: "Enabling notifications", href: "/help/notifications" },
      ],
    },
  ];

  const popularArticles = [
    {
      title: "How to check in at a gym using QR code",
      href: "/qr-help",
      views: "12.5K",
    },
    {
      title: "What is included in my membership?",
      href: "/help/membership-included",
      views: "10.2K",
    },
    {
      title: "How to book a personal trainer session",
      href: "/help/book-trainer",
      views: "8.7K",
    },
    {
      title: "Canceling or pausing my subscription",
      href: "/help/cancel-membership",
      views: "7.3K",
    },
    {
      title: "Finding gyms when traveling abroad",
      href: "/help/travel-gyms",
      views: "6.1K",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-foreground-secondary mb-8">
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full rounded-lg border-2 border-neutral-300 bg-background px-5 py-4 pl-12 text-foreground placeholder-foreground-secondary focus:border-primary-500 focus:outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="bg-background py-12 border-b border-neutral-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-black text-foreground mb-6">
            🔥 Popular Articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularArticles.map((article, index) => (
              <Link
                key={index}
                href={article.href}
                prefetch={false}
                className="flex items-start justify-between rounded-lg border-2 border-neutral-300 bg-background p-4 transition-all hover:border-primary-500 hover:shadow-md"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {article.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {article.views} views
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-foreground-secondary flex-shrink-0 ml-2"
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((category, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500 text-white">
                    {category.icon}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {category.name}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link
                        href={article.href}
                        prefetch={false}
                        className="flex items-center gap-2 text-foreground-secondary hover:text-accent-blue-500 transition-colors group"
                      >
                        <svg
                          className="h-4 w-4 text-foreground-secondary group-hover:text-accent-blue-500 flex-shrink-0"
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
                        <span className="text-sm">{article.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Still need help?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Can&apos;t find what you&apos;re looking for? Our support team is
            here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              prefetch={false}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email Support
            </Link>
            <Link
              href="/status"
              prefetch={false}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              System Status
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
