'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function InactivityNotification() {
  const [show, setShow] = useState(false);
  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  const [logoutTime, setLogoutTime] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user was logged out due to inactivity
    const reason = sessionStorage.getItem('logoutReason');
    const time = sessionStorage.getItem('logoutTime');

    if (reason === 'inactivity') {
      setLogoutReason(reason);
      setLogoutTime(time);
      setShow(true);

      // Clear the logout reason after displaying
      sessionStorage.removeItem('logoutReason');
      sessionStorage.removeItem('logoutTime');
    }
  }, []);

  const handleClose = () => {
    setShow(false);
  };

  if (!show || !logoutReason) {
    return null;
  }

  const formatLogoutTime = (timeString: string | null) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
      <div className="rounded-lg bg-accent-yellow-500 border-2 border-accent-yellow-600 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1">
              Session Expired
            </h3>
            <p className="text-sm text-foreground/90">
              You were automatically logged out at {formatLogoutTime(logoutTime)} due to 1 hour of inactivity. Please sign in again to continue.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-foreground hover:text-foreground/80 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
