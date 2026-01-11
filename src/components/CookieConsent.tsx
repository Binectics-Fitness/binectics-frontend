'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookie-consent');
    if (!consentGiven) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consentGiven);
        setPreferences(savedPreferences);
      } catch (e) {
        // If parsing fails, show banner again
        setShowBanner(true);
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      {!showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-neutral-300 bg-background p-4 shadow-lg">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-sm text-foreground mb-1">
                  <strong>We use cookies</strong>
                </p>
                <p className="text-sm text-foreground-secondary">
                  We use cookies to improve your experience and analyze site usage.{' '}
                  <Link href="/cookies" className="underline hover:text-accent-blue-500">
                    Learn more
                  </Link>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="whitespace-nowrap rounded-lg border-2 border-neutral-300 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100"
                >
                  Customize
                </button>
                <button
                  onClick={acceptNecessary}
                  className="whitespace-nowrap rounded-lg border-2 border-neutral-300 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100"
                >
                  Necessary Only
                </button>
                <button
                  onClick={acceptAll}
                  className="whitespace-nowrap rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg border-2 border-neutral-300 bg-background p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Cookie Preferences
              </h2>
              <p className="text-sm text-foreground-secondary">
                Choose which cookies you want to accept. You can change your preferences at any time.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="rounded-lg border-2 border-neutral-300 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                      Necessary Cookies
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      Essential for the website to function. Cannot be disabled.
                    </p>
                  </div>
                  <div className="flex h-6 w-11 items-center rounded-full bg-primary-500 px-1">
                    <div className="h-4 w-4 rounded-full bg-white translate-x-5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="rounded-lg border-2 border-neutral-300 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                      Analytics Cookies
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                      preferences.analytics ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                    aria-label="Toggle analytics cookies"
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        preferences.analytics ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="rounded-lg border-2 border-neutral-300 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                      Marketing Cookies
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      Used to deliver personalized advertisements and measure effectiveness.
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                      preferences.marketing ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                    aria-label="Toggle marketing cookies"
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        preferences.marketing ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowPreferences(false)}
                className="rounded-lg border-2 border-neutral-300 bg-background px-6 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={acceptNecessary}
                className="rounded-lg border-2 border-neutral-300 bg-background px-6 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100"
              >
                Necessary Only
              </button>
              <button
                onClick={savePreferences}
                className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
