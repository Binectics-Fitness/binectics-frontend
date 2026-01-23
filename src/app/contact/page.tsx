import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing & Payments" },
    { value: "partnership", label: "Partnership Opportunities" },
    { value: "press", label: "Press & Media" },
    { value: "feedback", label: "Feedback & Suggestions" },
  ];

  const contactMethods = [
    {
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Email",
      description: "Our team responds within 24 hours",
      contact: "support@binectics.com",
      href: "mailto:support@binectics.com",
      color: "accent-blue",
    },
    {
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
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      ),
      title: "Live Chat",
      description: "Available Mon-Fri, 9am-6pm EST",
      contact: "Start a conversation",
      href: "#",
      color: "accent-yellow",
    },
    {
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
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      title: "Phone",
      description: "Monday to Friday, 8am-8pm EST",
      contact: "+1 (555) 123-4567",
      href: "tel:+15551234567",
      color: "accent-purple",
    },
  ];

  const offices = [
    {
      city: "San Francisco",
      address: "100 Market Street, Suite 300",
      country: "United States",
      image: "🇺🇸",
    },
    {
      city: "London",
      address: "20 Liverpool Street, Floor 5",
      country: "United Kingdom",
      image: "🇬🇧",
    },
    {
      city: "Tokyo",
      address: "1-1-1 Shibuya, Shibuya-ku",
      country: "Japan",
      image: "🇯🇵",
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Get in Touch
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Have a question or need help? We're here to assist you.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="rounded-2xl bg-background p-8 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center"
              >
                <div
                  className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-${method.color}-500 text-white`}
                >
                  {method.icon}
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-foreground">
                  {method.title}
                </h3>
                <p className="text-sm text-foreground-secondary mb-3">
                  {method.description}
                </p>
                <p className={`font-semibold text-${method.color}-500`}>
                  {method.contact}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Send us a Message
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Fill out the form below and we'll get back to you as soon as
              possible
            </p>
          </div>

          <div className="rounded-3xl bg-neutral-100 p-8 sm:p-12 shadow-xl">
            <ContactForm categories={categories} />
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Our Offices
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Visit us at one of our global locations
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                city: "San Francisco",
                address: "100 Market Street, Suite 300",
                country: "United States",
                image: "🇺🇸",
              },
              {
                city: "London",
                address: "20 Liverpool Street, Floor 5",
                country: "United Kingdom",
                image: "🇬🇧",
              },
              {
                city: "Tokyo",
                address: "1-1-1 Shibuya, Shibuya-ku",
                country: "Japan",
                image: "🇯🇵",
              },
            ].map((office, index) => (
              <div
                key={index}
                className="rounded-2xl bg-background p-8 shadow-card text-center"
              >
                <div className="text-5xl mb-4">{office.image}</div>
                <h3 className="font-display text-xl font-black text-foreground mb-2">
                  {office.city}
                </h3>
                <p className="text-sm text-foreground-secondary mb-1">
                  {office.address}
                </p>
                <p className="text-sm text-foreground-tertiary">
                  {office.country}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
