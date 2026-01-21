'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { InactivityNotification } from '@/components/InactivityNotification';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (!result.success) {
        setApiError(result.error || 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check if logged in user is admin
      // Note: The redirect will be handled by the useEffect above
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Inactivity Notification */}
      <InactivityNotification />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 text-foreground mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">Admin Login</h1>
          <p className="text-foreground/60">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-card p-8">
          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{apiError}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Admin Email
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@binectics.com"
                required
                className={`w-full h-12 border-2 ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                } px-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-red-500 transition-colors`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={`w-full h-12 border-2 ${
                  errors.password ? 'border-red-500' : 'border-gray-200'
                } px-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-red-500 transition-colors`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full h-12 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading || authLoading ? 'Signing in...' : 'Sign In as Admin'}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
            <p className="text-xs text-foreground/60 mb-2">
              <strong>Admin Access Only</strong>
            </p>
            <p className="text-xs text-foreground/60">
              This login is for administrators only. For regular user access, please use the{' '}
              <Link href="/login" className="text-red-500 hover:text-red-600 font-semibold">
                user login page
              </Link>.
            </p>
          </div>

          {/* Demo Account Info */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200">
            <p className="text-xs text-foreground/70">
              <strong>Demo Account:</strong>
            </p>
            <p className="text-xs text-foreground/60 mt-1 font-mono">
              admin@binectics.com / Admin@123456
            </p>
            <p className="text-xs text-foreground/60 mt-2">
              Create demo accounts at{' '}
              <Link href="/admin/create-super-admin" className="text-accent-blue-500 hover:underline">
                /admin/create-super-admin
              </Link>
            </p>
          </div>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-foreground/60 hover:text-foreground">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
