'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading settings...</p>
        </div>
      </div>
    );
  }

  const settingsTabs = [
    { name: 'Profile', href: '/dashboard/settings/profile', icon: '👤' },
    { name: 'Account', href: '/dashboard/settings/account', icon: '⚙️' },
    { name: 'Notifications', href: '/dashboard/settings/notifications', icon: '🔔' },
    { name: 'Privacy', href: '/dashboard/settings/privacy', icon: '🔒' },
    { name: 'Billing', href: '/dashboard/settings/billing', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={
                  user.role === 'GYM_OWNER'
                    ? '/dashboard/gym-owner'
                    : user.role === 'TRAINER'
                    ? '/dashboard/trainer'
                    : user.role === 'DIETICIAN'
                    ? '/dashboard/dietician'
                    : user.role === 'ADMIN'
                    ? '/admin'
                    : '/dashboard'
                }
                className="text-sm text-foreground/60 hover:text-foreground flex items-center gap-2 mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-black text-foreground">Settings</h1>
              <p className="mt-1 text-foreground/60">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-foreground shadow-md'
                        : 'text-foreground/60 hover:bg-gray-100 hover:text-foreground'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
