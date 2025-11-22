'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) return;

    // TODO: API call to send reset email
    console.log('Password reset requested for:', email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="border-b border-neutral-300 bg-background">
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
            <Link
              href="/login"
              className="text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
            >
              Back to <span className="font-semibold text-foreground">Sign in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center py-12 sm:py-16">
        <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-8">
          {!submitted ? (
            <>
              {/* Page Header */}
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-accent-blue-100">
                  <svg className="h-7 w-7 text-accent-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
                  Forgot password?
                </h1>
                <p className="mt-2 text-base text-foreground-secondary">
                  No worries, we'll send you reset instructions
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    error={error}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-primary-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
                >
                  Send Reset Link
                </button>

                {/* Back to Login */}
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to sign in
                </Link>
              </form>
            </>
          ) : (
            /* Success Message */
            <div className="text-center">
              <div className="mb-6 inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100">
                <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                Check your email
              </h2>
              <p className="mt-3 text-base text-foreground-secondary">
                We sent a password reset link to
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {email}
              </p>
              <p className="mt-6 text-sm text-foreground-secondary">
                Didn't receive the email?{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="font-semibold text-accent-blue-500 hover:text-accent-blue-600"
                >
                  Click to resend
                </button>
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
