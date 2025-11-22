import Link from 'next/link';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: '256-Bit Encryption',
      description: 'All data transmitted between your device and our servers is protected with bank-level 256-bit SSL/TLS encryption. Your sensitive information is encrypted both in transit and at rest.',
      color: 'accent-blue',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'PCI-DSS Compliance',
      description: 'We are fully PCI-DSS compliant for payment processing. Your credit card information is never stored on our servers. All payments are processed through certified payment gateways.',
      color: 'accent-yellow',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Two-Factor Authentication',
      description: 'Enable 2FA for an extra layer of security. We support authenticator apps, SMS codes, and email verification to protect your account from unauthorized access.',
      color: 'accent-purple',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Regular Security Audits',
      description: 'Third-party security experts conduct regular penetration tests and vulnerability assessments. We proactively identify and fix security issues before they can be exploited.',
      color: 'primary',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'DDoS Protection',
      description: 'Our infrastructure is protected against Distributed Denial of Service attacks. We use advanced monitoring and mitigation techniques to ensure continuous service availability.',
      color: 'accent-blue',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: 'Access Controls',
      description: 'Strict role-based access controls ensure that only authorized personnel can access sensitive data. All access is logged and monitored for suspicious activity.',
      color: 'accent-yellow',
    },
  ];

  const certifications = [
    {
      name: 'SOC 2 Type II',
      description: 'Independently audited for security, availability, and confidentiality',
      image: '🔐',
    },
    {
      name: 'GDPR Compliant',
      description: 'Full compliance with European data protection regulations',
      image: '🇪🇺',
    },
    {
      name: 'ISO 27001',
      description: 'Information security management system certified',
      image: '✓',
    },
    {
      name: 'HIPAA Ready',
      description: 'Health information privacy and security standards',
      image: '🏥',
    },
  ];

  const bestPractices = [
    {
      title: 'Use a Strong Password',
      description: 'Create a unique password with at least 12 characters, including uppercase, lowercase, numbers, and symbols.',
    },
    {
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of protection by requiring a verification code in addition to your password.',
    },
    {
      title: 'Keep Your Email Secure',
      description: 'Your email is the key to your account. Use a strong password and enable 2FA on your email account too.',
    },
    {
      title: 'Don\'t Share Your QR Code',
      description: 'Your QR code is personal. Never share screenshots or allow others to use your membership.',
    },
    {
      title: 'Review Account Activity',
      description: 'Regularly check your account for unauthorized check-ins, bookings, or profile changes.',
    },
    {
      title: 'Log Out on Shared Devices',
      description: 'Always log out when using public or shared computers. Don\'t save your password in public browsers.',
    },
    {
      title: 'Watch for Phishing',
      description: 'We\'ll never ask for your password via email. Be cautious of suspicious emails claiming to be from Binectics.',
    },
    {
      title: 'Keep Software Updated',
      description: 'Regularly update your device operating system and the Binectics app to get the latest security patches.',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Security & Trust
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Your security and privacy are our top priorities. We employ industry-leading security
            measures to protect your data and ensure a safe fitness experience.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
              How We Protect You
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Enterprise-grade security infrastructure
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl bg-background p-8 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-${feature.color}-500 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Certifications & Compliance
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Independently verified security and privacy standards
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="rounded-2xl bg-neutral-100 p-8 text-center shadow-card"
              >
                <div className="text-5xl mb-4">{cert.image}</div>
                <h3 className="font-display text-lg font-black text-foreground mb-2">
                  {cert.name}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Security Best Practices
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Simple steps to keep your account secure
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {bestPractices.map((practice, index) => (
              <div
                key={index}
                className="rounded-2xl bg-background p-6 shadow-card"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <span className="text-lg font-black text-primary-600">{index + 1}</span>
                </div>
                <h3 className="mb-2 font-bold text-base text-foreground">
                  {practice.title}
                </h3>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-accent-blue-500 p-8 sm:p-12 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl mb-4">
                Report a Security Issue
              </h2>
              <p className="text-lg text-foreground-secondary mb-8">
                If you discover a security vulnerability or suspicious activity, please report it
                immediately to our security team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:security@binectics.com"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
                >
                  Email Security Team
                </a>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/20"
                >
                  Contact Support
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/80">
                We take all security reports seriously and investigate promptly. Responsible disclosure
                is appreciated and may be eligible for our bug bounty program.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-background p-8 sm:p-10 shadow-card">
            <h2 className="font-display text-2xl font-black text-foreground mb-6 sm:text-3xl">
              Data Protection & Privacy
            </h2>
            <div className="space-y-4 text-foreground-secondary leading-relaxed">
              <p>
                <strong className="text-foreground">Data Minimization:</strong> We only collect the
                information necessary to provide our services. You have full control over your data.
              </p>
              <p>
                <strong className="text-foreground">Encryption Everywhere:</strong> Your data is
                encrypted both in transit (256-bit SSL/TLS) and at rest (AES-256 encryption).
              </p>
              <p>
                <strong className="text-foreground">Privacy by Design:</strong> Privacy is built into
                every feature. We don't sell your data to third parties, and we limit data sharing to
                what's necessary for service delivery.
              </p>
              <p>
                <strong className="text-foreground">Your Rights:</strong> You can access, export, or
                delete your data at any time. We comply with GDPR, CCPA, and other privacy regulations.
              </p>
              <p>
                <strong className="text-foreground">Regular Backups:</strong> Your data is backed up
                daily to multiple geographic locations to prevent data loss.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/privacy"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
              >
                Read Our Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
