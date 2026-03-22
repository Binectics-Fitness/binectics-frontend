"use client";

import { useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";

export interface ConfirmationOptions {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
}

export function useConfirmationModal() {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const requestConfirmation = (nextOptions: ConfirmationOptions) => {
    setOptions(nextOptions);
  };

  const handleCancel = () => {
    if (isConfirming) return;
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (!options) return;

    setIsConfirming(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } catch (error) {
      console.error("Confirmation action failed:", error);
      await showAlert("This action could not be completed. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    requestConfirmation,
    confirmationModal: (
      <ConfirmationModal
        isOpen={options !== null}
        title={options?.title ?? ""}
        description={options?.description ?? ""}
        confirmLabel={options?.confirmLabel ?? "Confirm"}
        cancelLabel={options?.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isConfirming={isConfirming}
        confirmVariant={options?.confirmVariant ?? "danger"}
      />
    ),
  };
}
