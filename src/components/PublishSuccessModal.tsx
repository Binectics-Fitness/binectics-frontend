"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { showAlert } from "@/lib/ui/dialogs";

interface PublishSuccessModalProps {
  formId: string;
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PublishSuccessModal({
  formId,
  formTitle,
  isOpen,
  onClose,
}: PublishSuccessModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const submitUrl = `${window.location.origin}/forms/${formId}/submit`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(submitUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await showAlert("Failed to copy link");
    }
  };

  const handleViewForm = () => {
    window.open(submitUrl, "_blank");
  };

  const handleViewResponses = () => {
    router.push(`/forms/${formId}/responses`);
  };

  const handleBackToForms = () => {
    router.push(`/forms?highlight=${formId}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-bg rounded-(--r-3) max-w-2xl w-full p-8 animate-fade-in"
          style={{ boxShadow: "var(--shadow-2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-signal-soft rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-signal-ink"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl font-black text-ink text-center mb-2">
            Form Published Successfully!
          </h2>
          <p className="text-fg-2 text-center mb-6">
            {formTitle}
          </p>

          {/* Shareable Link */}
          <div className="bg-bg-2 rounded-(--r-2) p-4 mb-6">
            <label className="block text-sm font-semibold text-fg mb-2">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={submitUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-border-2 rounded-(--r-2) bg-bg text-fg-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button onClick={handleCopyLink} variant="ghost">
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-fg-3 mt-2">
              Share this link with others to collect responses
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Button onClick={handleViewForm} variant="ghost">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview Form
            </Button>
            <Button onClick={handleViewResponses} variant="ghost">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Responses
            </Button>
            <Button onClick={handleBackToForms}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              My Forms
            </Button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full text-sm text-fg-2 hover:text-fg transition-colors"
          >
            Continue Editing
          </button>
        </div>
      </div>
    </>
  );
}
