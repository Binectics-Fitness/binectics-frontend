'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Simulate email verification API call
    const verifyEmail = async () => {
      try {
        // In production, this would be an API call to verify the token
        // await fetch(`/api/verify-email/${token}`, { method: 'POST' });

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate different outcomes based on token format for demo
        if (token === 'expired') {
          setStatus('expired');
        } else if (token === 'invalid') {
          setStatus('error');
          setErrorMessage('Invalid verification link');
        } else {
          setStatus('success');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 animate-pulse">
            <svg className="h-10 w-10 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-black text-foreground mb-4">
            Verifying your email...
          </h2>
          <p className="text-foreground-secondary">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

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
            Email Verified!
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Your email has been successfully verified. You can now access all features of your Binectics account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Sign In to Your Account
            </Link>
          </div>
          <div className="mt-8 rounded-2xl bg-background p-6 shadow-card text-left">
            <h3 className="font-bold text-foreground mb-3">What's Next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-foreground-secondary">Complete your profile with fitness goals and preferences</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-foreground-secondary">Browse gyms near you and start your fitness journey</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-foreground-secondary">Download the mobile app for easy QR check-ins</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-accent-yellow-100">
            <svg className="h-10 w-10 text-accent-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Link Expired
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            This verification link has expired. Verification links are valid for 24 hours.
          </p>
          <div className="flex flex-col gap-4 justify-center">
            <button
              onClick={() => {
                // In production, this would trigger a resend API call
                alert('A new verification email has been sent to your inbox.');
              }}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Resend Verification Email
            </button>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-black text-foreground mb-4">
          Verification Failed
        </h2>
        <p className="text-lg text-foreground-secondary mb-8">
          {errorMessage || 'We couldn\'t verify your email address. The link may be invalid or already used.'}
        </p>
        <div className="flex flex-col gap-4 justify-center">
          <button
            onClick={() => {
              // In production, this would trigger a resend API call
              alert('A new verification email has been sent to your inbox.');
            }}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
          >
            Send New Verification Link
          </button>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
