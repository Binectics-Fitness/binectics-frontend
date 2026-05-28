"use client";

import Modal from "@/components/Modal";

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ActionModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ActionModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size={size} footer={footer}>
      {description && (
        <p className="mb-4 text-[13.5px] leading-relaxed text-fg-2">{description}</p>
      )}
      {children}
    </Modal>
  );
}
