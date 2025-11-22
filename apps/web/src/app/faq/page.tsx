'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import Accordion from '@/components/Accordion';

export default function FAQPage() {
  const categories = [
    {
      name: 'General',
      faqs: [
        {
          question: 'What is Binectics?',
          answer: 'Binectics is a global fitness ecosystem that connects verified gyms, certified personal trainers, and expert dieticians in one platform. With a single subscription, you get access to 500+ gyms across 50+ countries, plus the ability to book trainers and dieticians wherever you are.',
        },
        {
          question: 'How does Binectics work?',
          answer: 'Simply sign up, choose your plan, and get verified. You\'ll receive a unique QR code that works at any partner gym worldwide. You can also browse and book personal trainers and dieticians through our app, track your progress, and manage everything from one dashboard.',
        },
        {
          question: 'Which countries are you available in?',
          answer: 'We\'re currently available in 50+ countries across North America, Europe, Asia, Australia, and South America. Our network is constantly expanding. Check our countries page for the full list of supported locations.',
        },
        {
          question: 'Is there a free trial?',
          answer: 'Yes! All new members get a 14-day free trial with full access to our platform. No credit card required to start. You can cancel anytime during the trial without being charged.',
        },
      ],
    },
    {
      name: 'For Members',
      faqs: [
        {
          question: 'How do I check in at a gym?',
          answer: 'Simply open the Binectics app, navigate to your QR code, and scan it at the gym entrance. The system automatically verifies your membership and logs your visit. Most gyms have dedicated QR scanners at reception.',
        },
        {
          question: 'Can I visit any gym multiple times?',
          answer: 'Yes! With our Pro and Elite plans, you get unlimited access to all partner gyms. The Starter plan includes 5 gym visits per month. There are no restrictions on which gyms you can visit or how often.',
        },
        {
          question: 'How do I book a personal trainer?',
          answer: 'Browse trainers in the app, filter by specialty, location, or ratings, then select a trainer and choose from their available time slots. You can book one-time sessions or ongoing packages depending on the trainer\'s offerings.',
        },
        {
          question: 'What if I need to cancel a trainer session?',
          answer: 'You can cancel sessions up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a fee at the trainer\'s discretion. Check the trainer\'s cancellation policy before booking.',
        },
        {
          question: 'Can I pause my membership?',
          answer: 'Yes, you can pause your membership for up to 3 months per year. Your billing will be suspended during this time, and you won\'t have access to gyms or trainers. You can resume anytime from your account settings.',
        },
      ],
    },
    {
      name: 'For Gym Owners',
      faqs: [
        {
          question: 'How much does it cost to list my gym?',
          answer: 'We offer plans starting at $99/month for single locations and $199/month for up to 5 locations. Annual plans save 20%. We also charge a small transaction fee (3-5%) on membership revenue generated through our platform.',
        },
        {
          question: 'How does the QR check-in system work?',
          answer: 'We provide you with a QR scanner (hardware or tablet-based) that integrates with our system. When members scan their code, the system verifies their membership in real-time and logs the visit. You get instant notifications and can view attendance analytics in your dashboard.',
        },
        {
          question: 'What happens if a member causes issues at my gym?',
          answer: 'You have full control to deny access to any member. Our platform includes a reporting system where you can flag problematic behavior. Serious violations result in membership suspension or termination. You\'re protected by our terms of service.',
        },
        {
          question: 'Can I set capacity limits?',
          answer: 'Yes! You can set maximum capacity for your gym and for specific classes. When capacity is reached, the system automatically prevents new check-ins until space becomes available. This helps you manage crowding and maintain a quality experience.',
        },
      ],
    },
    {
      name: 'For Trainers & Dieticians',
      faqs: [
        {
          question: 'How do I get verified as a professional?',
          answer: 'Upload your certifications, credentials, and valid ID during registration. Our team reviews all submissions within 3-5 business days. We verify certifications with issuing organizations and conduct background checks to ensure member safety.',
        },
        {
          question: 'How much commission does Binectics charge?',
          answer: 'We charge a 10% commission on all bookings made through our platform. This covers payment processing, platform maintenance, client acquisition, and customer support. You set your own rates and keep 90% of all earnings.',
        },
        {
          question: 'Can I offer my own packages and pricing?',
          answer: 'Absolutely! You have full control over your pricing structure. Offer one-time sessions, multi-session packages, monthly subscriptions, or any combination. You can also run promotions and discounts at your discretion.',
        },
        {
          question: 'How do I get paid?',
          answer: 'Payments are processed automatically after each session or consultation. Funds are transferred to your bank account on a weekly basis via direct deposit. You can view all earnings, transactions, and tax documents in your professional dashboard.',
        },
        {
          question: 'What if a client doesn\'t show up?',
          answer: 'You can set your own no-show policy. We recommend charging a fee for no-shows or late cancellations. The client is automatically charged according to your policy, and you receive full payment even if they don\'t attend.',
        },
      ],
    },
    {
      name: 'Billing & Payments',
      faqs: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and digital wallets (Apple Pay, Google Pay). For annual plans, we also accept bank transfers and PayPal.',
        },
        {
          question: 'When am I charged?',
          answer: 'Monthly subscriptions are charged on the same day each month. Annual subscriptions are charged once per year. After your free trial ends, your first payment will be processed automatically unless you cancel.',
        },
        {
          question: 'Can I get a refund?',
          answer: 'We offer a 30-day money-back guarantee on all annual plans. If you\'re not satisfied, contact us within 30 days of purchase for a full refund. Monthly plans can be canceled anytime, and you won\'t be charged for the following month.',
        },
        {
          question: 'Do you offer student or corporate discounts?',
          answer: 'Yes! Students get 15% off with a valid student ID. We also offer corporate packages for teams of 10 or more. Contact our sales team for custom corporate pricing and features.',
        },
      ],
    },
    {
      name: 'Technical & Security',
      faqs: [
        {
          question: 'Is my payment information secure?',
          answer: 'Yes. We use bank-level 256-bit encryption and are PCI-DSS compliant. We never store your full credit card details on our servers. All payment processing is handled by industry-leading payment processors.',
        },
        {
          question: 'What happens to my data if I cancel?',
          answer: 'Your account data is retained for 90 days after cancellation in case you want to reactivate. After 90 days, all personal information is permanently deleted from our systems. You can request immediate deletion by contacting support.',
        },
        {
          question: 'Is there a mobile app?',
          answer: 'Yes! We have native apps for iOS and Android with all platform features. Download from the App Store or Google Play. Your account syncs across all devices in real-time.',
        },
        {
          question: 'What if I lose my phone?',
          answer: 'You can log in from any device using your email and password. If you\'re concerned about security, you can remotely log out of all devices from our web app. We also support two-factor authentication for added security.',
        },
      ],
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Everything you need to know about Binectics. Can't find what you're looking for?{' '}
            <Link href="/contact" className="text-accent-blue-500 hover:underline">
              Contact our support team
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16 last:mb-0">
              <h2 className="mb-8 font-display text-2xl font-black text-foreground sm:text-3xl">
                {category.name}
              </h2>
              <Accordion
                items={category.faqs.map(faq => ({
                  title: faq.question,
                  content: faq.answer
                }))}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary-500 p-8 sm:p-12 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Still have questions?
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Our support team is here to help you 24/7
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
              >
                Contact Support
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/20"
              >
                Get Started Free
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
