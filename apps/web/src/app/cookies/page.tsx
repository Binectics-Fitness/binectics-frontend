import Link from 'next/link';
import Footer from '@/components/Footer';
import CookieSettings from '@/components/CookieSettings';

export default function CookiesPage() {
  const cookieTypes = [
    {
      name: 'Strictly Necessary Cookies',
      description: 'These cookies are essential for our website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of these cookies.',
      examples: [
        'Authentication cookies to keep you logged in',
        'Security cookies to prevent fraud',
        'Load balancing cookies to ensure optimal performance',
      ],
      duration: 'Session or up to 1 year',
      canDisable: false,
    },
    {
      name: 'Performance Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our services.',
      examples: [
        'Google Analytics for traffic analysis',
        'Error logging and debugging',
        'Page load time tracking',
        'Feature usage statistics',
      ],
      duration: 'Up to 2 years',
      canDisable: true,
    },
    {
      name: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and choices. They may be set by us or by third-party providers.',
      examples: [
        'Language preference',
        'Location settings',
        'Video player preferences',
        'Chat widget settings',
      ],
      duration: 'Up to 1 year',
      canDisable: true,
    },
    {
      name: 'Targeting/Advertising Cookies',
      description: 'These cookies are used to deliver advertisements more relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.',
      examples: [
        'Social media advertising pixels',
        'Retargeting cookies',
        'Conversion tracking',
        'Interest-based advertising',
      ],
      duration: 'Up to 2 years',
      canDisable: true,
    },
  ];

  const thirdPartyServices = [
    {
      name: 'Google Analytics',
      purpose: 'Website analytics and performance monitoring',
      cookies: '_ga, _gid, _gat',
      privacyPolicy: 'https://policies.google.com/privacy',
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing and fraud prevention',
      cookies: '__stripe_sid, __stripe_mid',
      privacyPolicy: 'https://stripe.com/privacy',
    },
    {
      name: 'Facebook Pixel',
      purpose: 'Advertising and conversion tracking',
      cookies: '_fbp, fr',
      privacyPolicy: 'https://www.facebook.com/privacy',
    },
    {
      name: 'Intercom',
      purpose: 'Customer support and live chat',
      cookies: 'intercom-*',
      privacyPolicy: 'https://www.intercom.com/legal/privacy',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-300 bg-background/95 backdrop-blur">
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
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-500 px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Cookie Policy
          </h1>
          <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
            Last Updated: November 22, 2024
          </p>
          <p className="mt-4 text-base text-foreground-secondary leading-relaxed">
            This Cookie Policy explains how Binectics uses cookies and similar technologies to recognize
            you when you visit our website. It explains what these technologies are and why we use them,
            as well as your rights to control our use of them.
          </p>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-background p-8 sm:p-10 shadow-card">
            <h2 className="font-display text-2xl font-black text-foreground mb-6 sm:text-3xl">
              What Are Cookies?
            </h2>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              Cookies are small text files that are placed on your device when you visit a website. They
              are widely used to make websites work more efficiently, provide a better user experience,
              and provide information to website owners.
            </p>
            <p className="text-foreground-secondary leading-relaxed">
              Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device
              after you close your browser until they expire or you delete them. Session cookies are
              deleted automatically when you close your browser.
            </p>
          </div>
        </div>
      </section>

      {/* Types of Cookies */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Types of Cookies We Use
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              We use different types of cookies for different purposes
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {cookieTypes.map((type, index) => (
              <div
                key={index}
                className="rounded-2xl bg-neutral-100 p-8 shadow-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-xl font-black text-foreground">
                    {type.name}
                  </h3>
                  {type.canDisable ? (
                    <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                      Optional
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-400 px-3 py-1 text-xs font-semibold text-white">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                  {type.description}
                </p>
                <div className="mb-4">
                  <h4 className="font-bold text-sm text-foreground mb-2">Examples:</h4>
                  <ul className="space-y-2">
                    {type.examples.map((example, exampleIndex) => (
                      <li key={exampleIndex} className="flex items-start gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-foreground-secondary">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 text-foreground-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-foreground-tertiary">Duration: {type.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Third Party Cookies */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Third-Party Cookies
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              We use cookies from trusted third-party services
            </p>
          </div>
          <div className="space-y-6">
            {thirdPartyServices.map((service, index) => (
              <div
                key={index}
                className="rounded-2xl bg-background p-6 sm:p-8 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                  <h3 className="font-bold text-lg text-foreground">
                    {service.name}
                  </h3>
                  <a
                    href={service.privacyPolicy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent-blue-500 hover:underline"
                  >
                    Privacy Policy
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <p className="text-sm text-foreground-secondary mb-2">
                  <span className="font-semibold">Purpose:</span> {service.purpose}
                </p>
                <p className="text-sm text-foreground-tertiary">
                  <span className="font-semibold">Cookies:</span> {service.cookies}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Controls */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-neutral-100 p-8 sm:p-10 shadow-card">
            <h2 className="font-display text-2xl font-black text-foreground mb-6 sm:text-3xl">
              How to Control Cookies
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3">
                  Browser Settings
                </h3>
                <p className="text-foreground-secondary leading-relaxed mb-3">
                  Most web browsers allow you to control cookies through their settings. You can set
                  your browser to refuse cookies or delete certain cookies. Please note that if you
                  block or delete cookies, some parts of our website may not function properly.
                </p>
                <p className="text-foreground-secondary leading-relaxed">
                  To learn more about cookie controls, check your browser's help menu or visit:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent-blue-500 hover:underline">
                      Chrome Cookie Settings
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-accent-blue-500 hover:underline">
                      Firefox Cookie Settings
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent-blue-500 hover:underline">
                      Safari Cookie Settings
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-foreground mb-3">
                  Cookie Preferences
                </h3>
                <p className="text-foreground-secondary leading-relaxed mb-4">
                  You can manage your cookie preferences at any time by clicking the button below.
                  This will allow you to accept or reject optional cookies.
                </p>
                <button className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600">
                  Manage Cookie Preferences
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-foreground mb-3">
                  Opt-Out Links
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  You can opt out of interest-based advertising through these industry opt-out pages:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <a href="http://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="text-accent-blue-500 hover:underline">
                      Digital Advertising Alliance
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <a href="http://www.networkadvertising.org/choices" target="_blank" rel="noopener noreferrer" className="text-accent-blue-500 hover:underline">
                      Network Advertising Initiative
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Settings */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl mb-4">
              Manage Your Cookie Preferences
            </h2>
            <p className="text-lg text-foreground-secondary">
              Control which cookies you want to allow
            </p>
          </div>
          <CookieSettings />
        </div>
      </section>

      {/* Updates to Policy */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-background p-8 shadow-card">
            <h2 className="font-display text-2xl font-black text-foreground mb-4">
              Updates to This Policy
            </h2>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons. We encourage you to review this
              policy periodically to stay informed about how we use cookies.
            </p>
            <p className="text-foreground-secondary leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:privacy@binectics.com" className="text-accent-blue-500 hover:underline">
                privacy@binectics.com
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-8 rounded-2xl bg-primary-500 p-8 shadow-xl">
            <h3 className="font-display text-2xl font-black text-foreground mb-4">
              Related Documents
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/privacy"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Terms of Service
              </Link>
              <Link
                href="/security"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
