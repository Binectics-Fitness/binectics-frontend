"use client";

/**
 * LogDetailDrawer — the full record behind a log row (workout, weight,
 * meal). The rows truncate to one line; this shows every stored field,
 * including notes and a provider's feedback. Fields with no value are left
 * out rather than shown as "-".
 */
import type { ReactNode } from "react";
import { Drawer } from "@/components/ds";
import { Eyebrow } from "@/components/ds/Eyebrow";

export interface LogDetailField {
  label: string;
  value: ReactNode;
}

interface LogDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: readonly LogDetailField[];
}

export function LogDetailDrawer({ open, onClose, title, fields }: LogDetailDrawerProps) {
  const shown = fields.filter((f) => f.value != null && f.value !== "" && f.value !== false);
  return (
    <Drawer open={open} onClose={onClose} title={title} width={420}>
      <dl className="flex flex-col gap-4 px-6 py-5">
        {shown.map((f) => (
          <div key={f.label}>
            <Eyebrow as="dt" className="mb-1">
              {f.label}
            </Eyebrow>
            <dd className="text-[14px] whitespace-pre-wrap break-words" style={{ color: "var(--ink)" }}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </Drawer>
  );
}
