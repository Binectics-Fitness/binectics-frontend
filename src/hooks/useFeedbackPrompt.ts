import { useState, useEffect } from "react";
import { feedbackService, type FeedbackPromptContext } from "@/lib/api/feedback";

export function useFeedbackPrompt(context: FeedbackPromptContext) {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const res = await feedbackService.getPromptStatus();
        if (isMounted && res.success && res.data?.shouldPrompt) {
          setShouldPrompt(true);
        }
      } catch {
        // Non-blocking - fail silently
      }
    };

    void check();
    return () => { isMounted = false; };
  }, []);

  // Auto-open modal if prompt is needed
  useEffect(() => {
    if (shouldPrompt) {
      const timer = setTimeout(() => setIsModalOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldPrompt]);

  function openFeedback() {
    setIsModalOpen(true);
  }

  function closeFeedback() {
    setIsModalOpen(false);
    setShouldPrompt(false);
  }

  return {
    shouldPrompt,
    isModalOpen,
    context,
    openFeedback,
    closeFeedback,
  };
}
