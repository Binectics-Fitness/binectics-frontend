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
      <div className="min-h-screen bg-bg-2 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-signal">
            <svg className="h-10 w-10 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-ink mb-4">
            Preferences updated
          </h2>
          <p className="text-lg text-fg-2 mb-8">
            Your email preferences have been successfully updated. You won't receive the types of emails you've unsubscribed from.
          </p>
          <p className="text-sm text-fg-3 mb-8">
            Note: You'll still receive important account-related emails, such as security alerts and password resets.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-(--r-2) bg-signal px-8 text-base font-semibold text-bg transition-colors duration-200 hover:bg-signal/90"
            >
              Back to homepage
            </Link>
            <button
              onClick={() => setStatus('confirming')}
              className="inline-flex h-12 items-center justify-center rounded-(--r-2) border-2 border-border-2 px-8 text-base font-semibold text-fg transition-colors duration-200 hover:bg-bg-2"
            >
              Change preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-bg-2 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-danger-soft">
            <svg className="h-10 w-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-ink mb-4">
            Something went wrong
          </h2>
          <p className="text-lg text-fg-2 mb-8">
            We couldn't process your request. The link may be invalid or expired.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-(--r-2) bg-signal px-8 text-base font-semibold text-bg transition-colors duration-200 hover:bg-signal/90"
            >
              Contact support
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-(--r-2) border-2 border-border-2 px-8 text-base font-semibold text-fg transition-colors duration-200 hover:bg-bg-2"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-2 py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-(--r-3) bg-signal">
              <span className="text-xl font-bold text-bg">B</span>
            </div>
            <span className="text-xl font-bold text-ink">
              Binectics
            </span>
          </Link>
          <h1 className="text-3xl font-black text-ink mb-4 sm:text-4xl">
            Manage email preferences
          </h1>
          <p className="text-lg text-fg-2">
            We're sorry to see you go. Customize what emails you'd like to receive from us.
          </p>
        </div>

        {/* Preference Options */}
        <div className="rounded-(--r-3) bg-bg p-8 mb-8" style={{ boxShadow: "var(--shadow-2)" }}>
          <h2 className="font-bold text-xl text-ink mb-6">
            Choose what you want to receive
          </h2>
          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 rounded-(--r-2) border-2 border-border cursor-pointer hover:border-signal transition-colors">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-border-2 text-signal focus-visible:ring-signal"
              />
              <div>
                <h3 className="font-semibold text-ink mb-1">Marketing & promotions</h3>
                <p className="text-sm text-fg-2">Special offers, discounts, and new gym partnerships</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-(--r-2) border-2 border-border cursor-pointer hover:border-signal transition-colors">
              <input
                type="checkbox"
                checked={preferences.productUpdates}
                onChange={(e) => setPreferences({ ...preferences, productUpdates: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-border-2 text-signal focus-visible:ring-signal"
              />
              <div>
                <h3 className="font-semibold text-ink mb-1">Product updates</h3>
                <p className="text-sm text-fg-2">New features, improvements, and platform updates</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-(--r-2) border-2 border-border cursor-pointer hover:border-signal transition-colors">
              <input
                type="checkbox"
                checked={preferences.newsletter}
                onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-border-2 text-signal focus-visible:ring-signal"
              />
              <div>
                <h3 className="font-semibold text-ink mb-1">Newsletter</h3>
                <p className="text-sm text-fg-2">Fitness tips, success stories, and health insights</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-(--r-2) border-2 border-border cursor-pointer hover:border-signal transition-colors">
              <input
                type="checkbox"
                checked={preferences.partnerOffers}
                onChange={(e) => setPreferences({ ...preferences, partnerOffers: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-border-2 text-signal focus-visible:ring-signal"
              />
              <div>
                <h3 className="font-semibold text-ink mb-1">Partner offers</h3>
                <p className="text-sm text-fg-2">Exclusive deals from our gym and fitness partners</p>
              </div>
            </label>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpdatePreferences}
              className="flex-1 inline-flex h-12 items-center justify-center rounded-(--r-2) bg-signal px-8 text-base font-semibold text-bg transition-colors duration-200 hover:bg-signal/90"
            >
              Save preferences
            </button>
            <button
              onClick={handleUnsubscribeAll}
              className="flex-1 inline-flex h-12 items-center justify-center rounded-(--r-2) border-2 border-border-2 px-8 text-base font-semibold text-fg transition-colors duration-200 hover:bg-bg-2"
            >
              Unsubscribe from all
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="rounded-(--r-3) bg-signal-soft p-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 shrink-0 text-signal-ink mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-signal-ink mb-2">Important account emails</h3>
              <p className="text-sm text-signal-ink leading-relaxed">
                Even if you unsubscribe from all marketing emails, you'll still receive critical account notifications such as:
                security alerts, password resets, payment confirmations, and membership status updates.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-fg-2 mb-4">
            Changed your mind?{' '}
            <Link href="/" className="text-signal hover:underline">
              Return to Binectics
            </Link>
          </p>
          <p className="text-xs text-fg-3">
            If you have questions, please{' '}
            <Link href="/contact" className="text-signal hover:underline">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
