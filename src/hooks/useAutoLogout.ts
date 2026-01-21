import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to automatically log out users after a period of inactivity
 * @param timeoutMinutes - Number of minutes of inactivity before logout (default: 60)
 */
export function useAutoLogout(timeoutMinutes: number = 60) {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TIMEOUT_MS = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
  const WARNING_MS = TIMEOUT_MS - (5 * 60 * 1000); // Warn 5 minutes before logout

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  // Handle logout with reason
  const handleAutoLogout = useCallback(() => {
    clearTimers();

    // Store logout reason in sessionStorage
    sessionStorage.setItem('logoutReason', 'inactivity');
    sessionStorage.setItem('logoutTime', new Date().toISOString());

    // Perform logout
    logout();
  }, [logout, clearTimers]);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    clearTimers();

    // Only set timers if user is logged in
    if (!user) return;

    // Set timeout for auto-logout
    timeoutRef.current = setTimeout(() => {
      handleAutoLogout();
    }, TIMEOUT_MS);

  }, [user, TIMEOUT_MS, handleAutoLogout, clearTimers]);

  // Track user activity
  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle the reset to avoid too many timer resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledReset = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledReset);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimers();
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
    };
  }, [user, resetTimer, clearTimers]);

  return { resetTimer };
}
