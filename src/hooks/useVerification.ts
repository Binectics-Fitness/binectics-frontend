"use client";

import { useState, useCallback } from "react";
import { authService } from "@/lib/api/auth";

export function useVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const response = await authService.verifyOtp({ email, otp });
      setIsVerifying(false);
      if (response.success) {
        return { success: true, data: response.data };
      }
      setError(response.message || "Verification failed");
      return { success: false };
    } catch {
      setIsVerifying(false);
      setError("An unexpected error occurred");
      return { success: false };
    }
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    setIsResending(true);
    setError(null);
    try {
      const response = await authService.resendOtp({ email });
      setIsResending(false);
      if (response.success) {
        return true;
      }
      setError(response.message || "Failed to resend OTP");
      return false;
    } catch {
      setIsResending(false);
      setError("An unexpected error occurred");
      return false;
    }
  }, []);

  return { verifyOtp, resendOtp, isVerifying, isResending, error, setError };
}
