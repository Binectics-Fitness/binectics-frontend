'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribePage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [preferences, setPreferences] = useState({
    marketing: true,
    productUpdates: true,
    newsletter: true,
    partnerOffers: true,
  });

  const handleUnsubscribeAll = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('success');
  };

  const handleUpdatePreferences = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Preferences Updated
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Your email preferences have been successfully updated. You won't receive the types of emails you've unsubscribed from.
          </p>
          <p className="text-sm text-foreground-tertiary mb-8">
            Note: You'll still receive important account-related emails, such as security alerts and password resets.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Back to Homepage
            </Link>
            <button
              onClick={() => setStatus('confirming')}
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
            >
              Change Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Something Went Wrong
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            We couldn't process your request. The link may be invalid or expired.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Contact Support
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Binectics
            </span>
          </Link>
          <h1 className="font-display text-3xl font-black text-foreground mb-4 sm:text-4xl">
            Manage Email Preferences
          </h1>
          <p className="text-lg text-foreground-secondary">
            We're sorry to see you go. Customize what emails you'd like to receive from us.
          </p>
        </div>

        {/* Preference Options */}
        <div className="rounded-2xl bg-background p-8 shadow-card mb-8">
          <h2 className="font-bold text-xl text-foreground mb-6">
            Choose what you want to receive
          </h2>
          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 rounded-lg border-2 border-neutral-200 cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Marketing & Promotions</h3>
                <p className="text-sm text-foreground-secondary">Special offers, discounts, and new gym partnerships</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-lg border-2 border-neutral-200 cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="checkbox"
                checked={preferences.productUpdates}
                onChange={(e) => setPreferences({ ...preferences, productUpdates: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Product Updates</h3>
                <p className="text-sm text-foreground-secondary">New features, improvements, and platform updates</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-lg border-2 border-neutral-200 cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="checkbox"
                checked={preferences.newsletter}
                onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Newsletter</h3>
                <p className="text-sm text-foreground-secondary">Fitness tips, success stories, and health insights</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-lg border-2 border-neutral-200 cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="checkbox"
                checked={preferences.partnerOffers}
                onChange={(e) => setPreferences({ ...preferences, partnerOffers: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Partner Offers</h3>
                <p className="text-sm text-foreground-secondary">Exclusive deals from our gym and fitness partners</p>
              </div>
            </label>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpdatePreferences}
              className="flex-1 inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Save Preferences
            </button>
            <button
              onClick={handleUnsubscribeAll}
              className="flex-1 inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
            >
              Unsubscribe from All
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="rounded-2xl bg-accent-blue-100 p-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-accent-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-accent-blue-900 mb-2">Important Account Emails</h3>
              <p className="text-sm text-accent-blue-800 leading-relaxed">
                Even if you unsubscribe from all marketing emails, you'll still receive critical account notifications such as:
                security alerts, password resets, payment confirmations, and membership status updates.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-foreground-secondary mb-4">
            Changed your mind?{' '}
            <Link href="/" className="text-accent-blue-500 hover:underline">
              Return to Binectics
            </Link>
          </p>
          <p className="text-xs text-foreground-tertiary">
            If you have questions, please{' '}
            <Link href="/contact" className="text-accent-blue-500 hover:underline">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
