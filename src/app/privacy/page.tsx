import Link from 'next/link';

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: [
        {
          subtitle: '1.1 Information You Provide',
          text: 'We collect information you provide directly to us, including when you create an account, update your profile, make purchases, or contact us for support. This includes your name, email address, phone number, payment information, fitness goals, and any other information you choose to provide.',
        },
        {
          subtitle: '1.2 Information We Collect Automatically',
          text: 'When you use our services, we automatically collect certain information about your device and usage, including your IP address, device type, browser type, operating system, gym check-in data, workout logs, and interaction with our platform.',
        },
        {
          subtitle: '1.3 Information from Third Parties',
          text: 'We may receive information from third parties such as gym partners, payment processors, and social media platforms if you connect your accounts. This includes verification data from certification bodies for professionals.',
        },
      ],
    },
    {
      title: '2. How We Use Your Information',
      content: [
        {
          subtitle: '2.1 Provide and Improve Services',
          text: 'We use your information to operate, maintain, and improve our platform, including processing payments, facilitating gym check-ins, connecting you with trainers and dieticians, and personalizing your experience.',
        },
        {
          subtitle: '2.2 Communications',
          text: 'We may send you transactional emails, service updates, promotional communications, and marketing materials. You can opt out of marketing communications at any time through your account settings or by clicking unsubscribe in any email.',
        },
        {
          subtitle: '2.3 Security and Fraud Prevention',
          text: 'We use your information to verify identities, prevent fraud, protect against security threats, and ensure the safety and integrity of our platform and community.',
        },
        {
          subtitle: '2.4 Analytics and Research',
          text: 'We analyze usage patterns and user behavior to understand how our services are used, identify trends, and conduct research to improve our offerings.',
        },
      ],
    },
    {
      title: '3. Information Sharing and Disclosure',
      content: [
        {
          subtitle: '3.1 Service Providers',
          text: 'We share your information with third-party service providers who perform services on our behalf, including payment processing, data analysis, email delivery, hosting services, and customer support.',
        },
        {
          subtitle: '3.2 Business Partners',
          text: 'We share limited information with gyms, trainers, and dieticians when you check in, book sessions, or make purchases. This is necessary to facilitate the services you request.',
        },
        {
          subtitle: '3.3 Legal Requirements',
          text: 'We may disclose your information if required by law, court order, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.',
        },
        {
          subtitle: '3.4 Business Transfers',
          text: 'If Binectics is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control.',
        },
      ],
    },
    {
      title: '4. Data Security',
      content: [
        {
          subtitle: '4.1 Security Measures',
          text: 'We implement industry-standard security measures to protect your information, including 256-bit encryption, secure socket layer (SSL) technology, and PCI-DSS compliance for payment processing. We regularly monitor our systems for vulnerabilities and attacks.',
        },
        {
          subtitle: '4.2 Data Retention',
          text: 'We retain your information for as long as your account is active or as needed to provide services. If you close your account, we will retain certain information for 90 days, after which we will delete your personal data unless we are legally required to retain it.',
        },
      ],
    },
    {
      title: '5. Your Rights and Choices',
      content: [
        {
          subtitle: '5.1 Access and Update',
          text: 'You can access and update your account information at any time through your account settings. You have the right to request a copy of the personal information we hold about you.',
        },
        {
          subtitle: '5.2 Deletion',
          text: 'You can request deletion of your account and personal information at any time. Please note that some information may be retained for legal or operational purposes.',
        },
        {
          subtitle: '5.3 Marketing Preferences',
          text: 'You can opt out of marketing communications by adjusting your account settings, clicking unsubscribe in emails, or contacting us directly.',
        },
        {
          subtitle: '5.4 Cookie Controls',
          text: 'Most web browsers allow you to control cookies through settings. Please note that disabling cookies may impact your experience on our platform.',
        },
      ],
    },
    {
      title: '6. International Data Transfers',
      content: [
        {
          subtitle: '',
          text: 'Binectics operates globally and may transfer your information to countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws, including Standard Contractual Clauses approved by the European Commission.',
        },
      ],
    },
    {
      title: '7. Children\'s Privacy',
      content: [
        {
          subtitle: '',
          text: 'Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately and we will delete such information.',
        },
      ],
    },
    {
      title: '8. Changes to This Privacy Policy',
      content: [
        {
          subtitle: '',
          text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our website and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.',
        },
      ],
    },
    {
      title: '9. Contact Us',
      content: [
        {
          subtitle: '',
          text: 'If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nEmail: privacy@binectics.com\nAddress: 100 Market Street, Suite 300, San Francisco, CA 94105\nPhone: +1 (555) 123-4567',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
            Last Updated: November 22, 2024
          </p>
          <p className="mt-4 text-base text-foreground-secondary leading-relaxed">
            At Binectics, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our platform. Please read this
            policy carefully to understand our practices regarding your personal data.
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="rounded-2xl bg-background p-8 sm:p-10 shadow-card">
                <h2 className="font-display text-2xl font-black text-foreground mb-6 sm:text-3xl">
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      {item.subtitle && (
                        <h3 className="font-bold text-lg text-foreground mb-3">
                          {item.subtitle}
                        </h3>
                      )}
                      <p className="text-foreground-secondary leading-relaxed whitespace-pre-line">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-12 rounded-2xl bg-primary-500 p-8 shadow-xl">
            <h3 className="font-display text-2xl font-black text-foreground mb-4">
              Related Documents
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/terms"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Cookie Policy
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
    </div>
  );
}
