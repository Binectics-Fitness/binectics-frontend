"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

interface SessionModalProps {
  isOpen: boolean;
  sessionEnded: boolean;
  onContinue?: () => void;
  onLogout: () => void;
}

export default function SessionModal({
  isOpen,
  sessionEnded,
  onContinue,
  onLogout,
}: SessionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={sessionEnded ? undefined : onLogout}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Content */}
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            {sessionEnded ? "Session Expired" : "Session Ending Soon"}
          </h3>
          <p className="text-foreground-secondary mb-6">
            {sessionEnded
              ? "Your session has expired due to inactivity. Please log in again to continue."
              : "Your session is about to expire due to inactivity. Would you like to continue?"}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            {sessionEnded ? (
              <Button onClick={onLogout} className="flex-1">
                Log In Again
              </Button>
            ) : (
              <>
                <Button
                  onClick={onLogout}
                  variant="secondary"
                  className="flex-1"
                >
                  Log Out
                </Button>
                <Button onClick={onContinue} className="flex-1">
                  Continue Session
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
