'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Input from '@/components/Input';

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // TODO: API call to reset password with token
    console.log('Password reset:', { token, password: formData.password });
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
                  Set new password
                </h1>
                <p className="mt-2 text-base text-foreground-secondary">
                  Your new password must be different from previously used passwords
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
                  <div className="space-y-5">
                    <Input
                      label="New Password"
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      helperText="Minimum 8 characters"
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={errors.confirmPassword}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-primary-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
                >
                  Reset Password
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                Password reset successful
              </h2>
              <p className="mt-3 text-base text-foreground-secondary">
                Your password has been successfully reset.
              </p>
              <p className="mt-2 text-base text-foreground-secondary">
                You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
              >
                Continue to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
