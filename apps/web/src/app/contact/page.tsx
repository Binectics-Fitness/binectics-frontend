'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/Input';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'press', label: 'Press & Media' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
  ];

  const contactMethods = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      description: 'Our team responds within 24 hours',
      contact: 'support@binectics.com',
      href: 'mailto:support@binectics.com',
      color: 'accent-blue',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: 'Live Chat',
      description: 'Available Mon-Fri, 9am-6pm EST',
      contact: 'Start a conversation',
      href: '#',
      color: 'accent-yellow',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      description: 'Monday to Friday, 8am-8pm EST',
      contact: '+1 (555) 123-4567',
      href: 'tel:+15551234567',
      color: 'accent-purple',
    },
  ];

  const offices = [
    {
      city: 'San Francisco',
      address: '100 Market Street, Suite 300',
      country: 'United States',
      image: '🇺🇸',
    },
    {
      city: 'London',
      address: '20 Liverpool Street, Floor 5',
      country: 'United Kingdom',
      image: '🇬🇧',
    },
    {
      city: 'Tokyo',
      address: '1-1-1 Shibuya, Shibuya-ku',
      country: 'Japan',
      image: '🇯🇵',
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Simulate form submission
      console.log('Form submitted:', formData);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Message Sent!
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Thank you for contacting us. We'll get back to you within 24 hours at {formData.email}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Back to Home
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: '',
                  email: '',
                  subject: '',
                  category: 'general',
                  message: '',
                });
              }}
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
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
                className={`rounded-2xl bg-background p-8 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center`}
              >
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-${method.color}-500 text-white`}>
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
              Fill out the form below and we'll get back to you as soon as possible
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl bg-neutral-100 p-8 sm:p-12 shadow-xl">
            <div className="space-y-6">
              <Input
                label="Full Name"
                type="text"
                name="name"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="john@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <div className="w-full">
                <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-12 rounded-lg border-2 border-neutral-300 bg-background px-4 text-base transition-colors duration-200 focus:outline-none focus:border-accent-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Subject"
                type="text"
                name="subject"
                placeholder="How can we help you?"
                required
                value={formData.subject}
                onChange={handleChange}
                error={errors.subject}
              />

              <div className="w-full">
                <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                  Message
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-2 ${
                    errors.message ? 'border-red-500' : 'border-neutral-300 focus:border-accent-blue-500'
                  } bg-background px-4 py-3 text-base transition-colors duration-200 focus:outline-none resize-none`}
                />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-lg bg-primary-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600"
              >
                Send Message
              </button>
            </div>
          </form>
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
            {offices.map((office, index) => (
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

      {/* Footer */}
    </div>
  );
}
